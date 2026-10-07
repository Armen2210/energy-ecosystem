import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Tool dependencies are installed separately, without changing application dependencies.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const base = process.env.QUALITY_URL || 'http://127.0.0.1:4175';
const out = process.env.QUALITY_OUTPUT || 'quality-results';
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined,
  headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const results = { checks: [], errors: [], console: [], failedRequests: [], navigationCancellations: [], widths: [360, 390, 640, 768, 960, 1440] };
const fileA = { name: 'Очень-длинное-наименование-проектной-документации-блочного-теплового-пункта.pdf', mimeType: 'application/pdf', buffer: Buffer.from('document A') };
const fileB = { name: 'specification.txt', mimeType: 'text/plain', buffer: Buffer.from('document B') };
function watch(page, expectedApiErrors = false) {
  page.on('pageerror', error => results.errors.push(error.message));
  page.on('console', message => {
    if (message.type() !== 'error') return;
    const record = { message: message.text(), location: message.location() };
    results.console.push(record);
    if (!expectedApiErrors || !record.location.url.includes('/api/leads/')) results.errors.push(record);
  });
  page.on('requestfailed', request => {
    const record = { url: request.url(), reason: request.failure() };
    results.failedRequests.push(record);
    if (new URL(request.url()).pathname === '/favicon.svg' && request.failure()?.errorText === 'net::ERR_ABORTED') {
      results.navigationCancellations.push(record);
      return;
    }
    if (!expectedApiErrors || !record.url.includes('/api/leads/')) results.errors.push(record);
  });
  page.on('response', response => {
    if (response.status() >= 400 && (!expectedApiErrors || !response.url().includes('/api/leads/'))) {
      results.errors.push({ url: response.url(), status: response.status() });
    }
  });
}
const check = (label) => { results.checks.push(label); console.log('PASS', label); };
async function settle(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(850);
}
try {
  for (const width of results.widths) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    watch(page);
    await page.route('**/api/leads/', route => route.fulfill({ status: 201, contentType: 'application/json', body: '{"id":99}' }));
    for (const [name, route] of [['home','/'], ['btp','/solutions/btp'], ['cases','/cases'], ['contacts','/contacts']]) {
      await page.goto(base + route);
      await page.waitForLoadState('networkidle');
      await settle(page);
      if (name === 'home') {
        await page.locator('.cookie-banner button').click();
        await page.reload();
        assert.equal(await page.locator('.cookie-banner').count(), 0);
        check(`cookie acceptance survives reload at ${width}`);
      }
      assert.ok(await page.locator('main').textContent());
      await page.screenshot({ path: path.join(out, `${width}-${name}.png`), fullPage: true });
      if (name === 'contacts') {
        assert.equal(new URL(page.url()).hash, '#contacts');
        await page.locator('[name=name]').fill('Quality browser check');
        await page.locator('[name=phone]').fill('+79000000000');
        await page.locator('input[type=file]').setInputFiles([fileA, fileB]);
        await page.locator('.file-select__toggle').click();
        await page.locator('.lead-form').screenshot({ path: path.join(out, `${width}-documents.png`) });
        assert.equal(await page.locator('.file-select__name').count(), 2);
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${width} ${route}: horizontal overflow`);
      check(`direct ${route}, no horizontal overflow at ${width}`);
    }
    await page.goto(base + '/cases');
    await page.waitForLoadState('networkidle');
    const card = page.locator('[data-case-slug]').first();
    await card.scrollIntoViewIfNeeded();
    const scrollBefore = await page.evaluate(() => scrollY);
    await card.click();
    await page.locator('.case-modal__close').waitFor();
    assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden');
    await page.locator('.case-modal__gallery-button--next').click();
    assert.match(await page.locator('.case-modal__gallery-meta span').textContent(), /^2 \/ /);
    await page.keyboard.press('ArrowLeft');
    assert.match(await page.locator('.case-modal__gallery-meta span').textContent(), /^1 \/ /);
    if (width <= 640) {
      const bounds = await page.locator('.case-modal__gallery').boundingBox();
      const session = await context.newCDPSession(page);
      await session.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
      const visibleTop = Math.max(bounds.y, 0);
      const y = visibleTop + (Math.min(bounds.y + bounds.height, 900) - visibleTop) / 2;
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: bounds.x + bounds.width * 0.8, y }] });
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: bounds.x + bounds.width * 0.2, y }] });
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await session.send('Emulation.setTouchEmulationEnabled', { enabled: false });
      await session.detach();
      await page.waitForFunction(() => document.querySelector('.case-modal__gallery-meta span').textContent.startsWith('2 /'));
    }
    await page.locator('.case-modal__close').focus();
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.evaluate(() => !!document.activeElement.closest('.case-modal')), true);
    await page.keyboard.press('Escape');
    await page.locator('.case-modal__close').waitFor({ state: 'detached' });
    await page.waitForFunction(() => document.body.style.overflow !== 'hidden');
    assert.equal(await page.evaluate(() => document.body.style.overflow), '');
    if (width > 720) assert.ok(Math.abs(await page.evaluate(() => scrollY) - scrollBefore) < 3);
    else {
      const rect = await card.boundingBox();
      assert.ok(rect.y < 900 && rect.y + rect.height > 0, 'mobile return card visible');
    }
    await card.click();
    assert.match(await page.locator('.case-modal__gallery-meta span').textContent(), /^1 \/ /);
    if (width === 1440) {
      await page.locator('.case-modal__backdrop').click({ position: { x: 3, y: 3 } });
      await page.locator('.case-modal__close').waitFor({ state: 'detached' });
    } else {
      await page.locator('.case-modal__close').click();
    }
    check(`modal gallery, focus, Escape, scroll restore and reopen at ${width}`);
    await page.goto(base + '/solutions/btp');
    await page.waitForLoadState('networkidle');
    await page.locator('[name=name]').fill('Retained on switch');
    await page.locator('textarea[name=description]').fill('Retained description');
    await page.locator('input[type=file]').setInputFiles(fileA);
    await page.locator('.entity-switcher__item').filter({ hasText: /^ВНС$/ }).click();
    await page.waitForURL('**/solutions/vns');
    assert.equal(await page.locator('[name=name]').inputValue(), 'Retained on switch');
    assert.equal(await page.locator('textarea[name=description]').inputValue(), 'Retained description');
    assert.match(await page.locator('.file-select__toggle').textContent(), /1 файл/);
    assert.match(await page.locator('[name=description_topic]').inputValue(), /насос/);
    await page.goBack();
    await page.waitForURL('**/solutions/btp');
    await page.goForward();
    await page.waitForURL('**/solutions/vns');
    check(`switcher and Back/Forward preserve form and file at ${width}`);
    await context.close();
  }
  // Error/retry/idempotency and timer checks use the production React form, not helpers.
  const context = await browser.newContext({ viewport: { width: 390, height: 900 } });
  const page = await context.newPage();
  watch(page, true);
  const posts = [];
  let status = 'network';
  await page.route('**/api/leads/', async route => {
    assert.equal(new URL(route.request().url()).hostname, '127.0.0.1');
    const data = route.request().postData();
    posts.push({ status, id: data.match(/name="submission_id"\r\n\r\n([^\r]+)/)?.[1], body: data });
    if (status === 'network') return route.abort('failed');
    await new Promise(resolve => setTimeout(resolve, 150));
    return route.fulfill({ status, headers: { 'Retry-After': '2' }, contentType: status === 413 ? 'text/html' : 'application/json',
      body: status === 201 ? '{"id":100}' : status === 413 ? '<html>too large</html>' : '{"detail":"Retry later"}' });
  });
  await page.goto(base + '/contacts');
  await page.waitForLoadState('networkidle');
  await page.locator('.cookie-banner button').click();
  await page.locator('[name=name]').fill('Retry test');
  await page.locator('[name=phone]').fill('+79000000000');
  await page.locator('textarea[name=description]').fill('Keep after error');
  await page.locator('[name=consent]').check();
  await page.locator('input[type=file]').setInputFiles([fileA, fileB]);
  await page.locator('.file-select__toggle').click();
  await page.locator('.file-select__remove').first().click();
  await page.locator('input[type=file]').setInputFiles(fileA);
  await page.locator('.file-select__toggle').click();
  await page.keyboard.press('Escape');
  for (const next of ['network', 429, 413]) {
    status = next;
    await page.locator('button[type=submit]').click();
    await page.locator('.lead-form__status--error').waitFor();
    await page.waitForFunction(() => !document.querySelector('button[type=submit]').disabled);
    assert.equal(await page.locator('[name=name]').inputValue(), 'Retry test');
    assert.equal(await page.locator('textarea[name=description]').inputValue(), 'Keep after error');
    assert.match(await page.locator('.file-select__toggle').textContent(), /2 файла/);
    check(`form preserves fields/documents after ${next}`);
  }
  assert.ok(posts[0].id);
  assert.ok(posts.every(post => post.id === posts[0].id), 'unchanged retries reuse submission_id');
  status = 201;
  const count = posts.length;
  await page.locator('button[type=submit]').evaluate(button => { button.click(); button.click(); });
  await page.locator('.lead-form__status--success').waitFor();
  assert.equal(posts.length, count + 1, 'double click causes one POST');
  assert.equal(await page.locator('[name=name]').inputValue(), '');
  assert.match(await page.locator('.file-select__toggle').textContent(), /Прикрепить/);
  await page.waitForTimeout(5100);
  assert.equal(await page.locator('.lead-form__status--hiding').count(), 1);
  await page.waitForTimeout(650);
  assert.equal(await page.locator('.lead-form__status').count(), 0);
  check('success resets form; hide at 5s and clear at 5.6s; duplicate POST prevented');
  await context.close();
  // State and cancellation regressions beyond the shared before/after checklist.
  const extraContext = await browser.newContext({ viewport: { width: 390, height: 900 } });
  const extra = await extraContext.newPage();
  watch(extra);
  await extra.goto(base + '/cases/bmk-sports-complex');
  await extra.waitForLoadState('networkidle');
  await extra.locator('.case-modal__gallery-button--next').click();
  await extra.evaluate(() => {
    history.pushState(null, '', '/cases/btp-food-production');
    dispatchEvent(new PopStateEvent('popstate'));
  });
  await extra.waitForFunction(() => document.querySelector('.case-modal__gallery-meta span')?.textContent.startsWith('1 /'));
  check('direct case change resets gallery without remounting parent page');
  await extra.goto(base + '/solutions/btp');
  await extra.waitForLoadState('networkidle');
  await extra.locator('.cookie-banner button').click();
  await extra.locator('.entity-switcher__item').filter({ hasText: /^ВНС$/ }).scrollIntoViewIfNeeded();
  await extra.evaluate(() => {
    [...document.querySelectorAll('.entity-switcher__item')].find(e => e.textContent.trim() === 'ВНС').click();
    history.pushState(null, '', '/about');
    dispatchEvent(new PopStateEvent('popstate'));
  });
  await extra.waitForTimeout(350);
  assert.equal(new URL(extra.url()).pathname, '/about');
  check('unmount cancels delayed entity navigation');
  await extra.evaluate(() => {
    document.querySelector('.logo').click();
    history.pushState(null, '', '/privacy');
    dispatchEvent(new PopStateEvent('popstate'));
  });
  await extra.waitForTimeout(350);
  assert.equal(new URL(extra.url()).pathname, '/privacy');
  assert.equal(await extra.locator('.logo--leaving').count(), 0);
  check('route change cancels logo timer and leaving state');
  await extra.goto(base + '/');
  await extra.waitForLoadState('networkidle');
  await extra.locator('.product-card').first().click();
  await extra.waitForTimeout(450);
  await extra.evaluate(() => {
    history.pushState(null, '', '/about');
    dispatchEvent(new PopStateEvent('popstate'));
  });
  await extra.waitForTimeout(2400);
  assert.equal(new URL(extra.url()).pathname, '/about');
  assert.equal(await extra.evaluate(() => scrollY), 0);
  check('leaving route cancels in-flight scroll animation');
  await extra.goto(base + '/solutions/btp');
  await extra.waitForLoadState('networkidle');
  await extra.locator('.topic-select__button').focus();
  await extra.keyboard.press('Enter');
  await extra.locator('.topic-select__menu').waitFor();
  await extra.keyboard.press('Escape');
  assert.equal(await extra.locator('.topic-select__menu').count(), 0);
  assert.equal(await extra.evaluate(() => document.activeElement.classList.contains('topic-select__button')), true);
  check('topic keyboard Enter/Escape returns focus');
  const geometry = await extra.evaluate(() => {
    const item = document.querySelector('.entity-switcher__item--active');
    const indicator = document.querySelector('.entity-switcher__indicator');
    return [item.getBoundingClientRect().width, indicator.getBoundingClientRect().width];
  });
  assert.ok(Math.abs(geometry[0] - geometry[1]) < 2);
  await extra.setViewportSize({ width: 1440, height: 900 });
  await extra.waitForTimeout(350);
  assert.ok(await extra.evaluate(() => Math.abs(document.querySelector('.entity-switcher__item--active').getBoundingClientRect().height - document.querySelector('.entity-switcher__indicator').getBoundingClientRect().height) < 2));
  check('indicator follows mobile/desktop resize');
  await extraContext.close();
  const storageContext = await browser.newContext();
  await storageContext.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new DOMException('Unavailable', 'SecurityError'); };
    Storage.prototype.setItem = () => { throw new DOMException('Unavailable', 'SecurityError'); };
  });
  const storagePage = await storageContext.newPage();
  watch(storagePage);
  await storagePage.goto(base + '/');
  await storagePage.waitForLoadState('networkidle');
  await storagePage.locator('.cookie-banner button').click();
  assert.equal(await storagePage.locator('.cookie-banner').count(), 0);
  check('cookie acceptance works when storage is unavailable for this visit');
  const icon = await storagePage.request.get(base + '/favicon.svg');
  assert.equal(icon.status(), 200, 'cancelled navigation favicon remains available');
  await storageContext.close();
  assert.equal(results.errors.length, 0, 'unexpected browser errors');
} catch (error) {
  results.failure = error.stack;
  throw error;
} finally {
  await fs.writeFile(path.join(out, 'browser-results.json'), JSON.stringify(results, null, 2));
  await browser.close();
}
