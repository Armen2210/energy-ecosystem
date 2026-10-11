import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const dist = path.resolve('dist');
const output = process.env.ABOUT_OUTPUT || '/tmp/ee-about';
await mkdir(output, { recursive: true });
const origin = 'http://127.0.0.1:4175';
const manifest = JSON.parse(await readFile(path.join(dist, 'prerender-manifest.json'), 'utf8'));
const report = { checks: [], errors: [], external: [], screenshots: [], geometry: [], network: [] };
const pass = label => { report.checks.push(label); console.log('PASS', label); };
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json' };
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
// Serve only the current build through Playwright interception; never send a real lead or external event.
async function context(options = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', serviceWorkers: 'block', ...options });
  await ctx.route('**/*', async route => {
    const req = route.request(), url = new URL(req.url());
    if (url.origin !== origin) { report.external.push(req.url()); return route.abort(); }
    if (url.pathname.startsWith('/api/')) return route.fulfill({ status: 201, contentType: 'application/json', body: '{"id":999}' });
    assert.equal(req.method(), 'GET');
    const row = manifest.pages.find(item => item.route === url.pathname);
    const file = path.join(dist, row?.file || decodeURIComponent(url.pathname).slice(1));
    assert.ok(file.startsWith(dist + path.sep));
    try { return route.fulfill({ status: 200, contentType: types[path.extname(file)] || 'application/octet-stream', body: await readFile(file) }); }
    catch { return route.fulfill({ status: 404, body: 'Not found' }); }
  });
  ctx.on('page', page => {
    page.on('pageerror', err => report.errors.push(err.message));
    page.on('console', msg => { if (msg.type() === 'error' && !msg.text().startsWith('Failed to load resource:')) report.errors.push(msg.text()); });
  });
  return ctx;
}
const openers = page => page.locator('.about-photo__open');
const close = page => page.getByRole('button', { name: 'Закрыть фотографию', exact: true });
async function ready(page) {
  await page.waitForFunction(() => document.querySelector('.nav__link[aria-current=page]')?.textContent === 'О нас');
  await page.evaluate(() => document.fonts.ready);
}
try {
  for (const width of [360, 390, 768, 960, 1024, 1440]) {
    const ctx = await context({ viewport: { width, height: 900 } }); const page = await ctx.newPage();
    const requests = []; page.on('request', req => { if (/-(small|page|large)-.*\.webp/.test(req.url())) requests.push(req.url()); });
    await page.goto(origin + '/about'); await ready(page);
    assert.equal(await page.title(), 'О нас — команда и производство | Энергоэффект');
    assert.equal(await page.locator('main h1').count(), 1);
    assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'), 'https://www.energoeffekt-rostov.ru/about');
    await page.getByRole('button', { name: 'Без аналитики', exact: true }).click();
    for (let i = 0; i < 7; i++) {
      await openers(page).nth(i).scrollIntoViewIfNeeded();
      await openers(page).nth(i).locator('img').evaluate(img => img.decode());
    }
    const geometry = await page.evaluate(() => {
      const box = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom }; };
      return { width: innerWidth, scrollWidth: document.documentElement.scrollWidth, logo: box('.logo'), nav: box('.nav'), phone: box('.header__phone'),
        images: [...document.querySelectorAll('.about-photo img')].map(img => ({ alt: img.alt, currentSrc: img.currentSrc, displayWidth: img.width, displayHeight: img.height, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight })) };
    });
    assert.ok(geometry.scrollWidth <= width + 1);
    if (width > 960) { assert.ok(geometry.logo.right <= geometry.nav.left); assert.ok(geometry.nav.right <= geometry.phone.left); }
    else { assert.ok(geometry.logo.bottom <= geometry.nav.top); assert.ok(geometry.nav.bottom <= geometry.phone.top); }
    assert.equal(requests.filter(url => url.includes('-large-')).length, 0);
    for (const img of geometry.images) assert.ok(img.alt && img.naturalWidth > 0);
    report.geometry.push(geometry);
    const before = [...requests];
    await openers(page).first().click(); await page.locator('.about-viewer__image').evaluate(img => img.decode());
    assert.equal(await page.getByRole('button', { name: 'Следующая фотография' }).count(), 0);
    assert.equal(requests.filter(url => url.includes('-large-')).length, 1);
    report.network.push({ width, before, afterOpeningDirector: [...requests] });
    await close(page).click();
    if ([360, 1440].includes(width)) {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      const filename = `about-${width}.png`;
      await page.screenshot({ path: path.join(output, filename), fullPage: true }); report.screenshots.push(filename);
    }
    await ctx.close(); pass(`${width}px: geometry, header, seven images, responsive sources, metadata and demand-only large image`);
  }
  const ctx = await context(); const page = await ctx.newPage(); await page.goto(origin + '/about'); await ready(page);
  await page.getByRole('button', { name: 'Без аналитики', exact: true }).click();
  for (let i = 0; i < 7; i++) {
    const button = openers(page).nth(i); await button.focus();
    const y = await page.evaluate(() => scrollY); await button.press('Enter');
    await page.locator('.about-viewer__image').evaluate(img => img.decode());
    assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden');
    assert.equal(await page.locator('dialog:modal').count(), 1);
    const expectedButtons = [3, 4, 5].includes(i) ? 3 : 1;
    for (let j = 0; j < expectedButtons + 2; j++) {
      await page.keyboard.press('Tab'); assert.equal(await page.evaluate(() => !!document.activeElement.closest('dialog')), true);
    }
    await page.keyboard.press('Shift+Tab'); assert.equal(await page.evaluate(() => !!document.activeElement.closest('dialog')), true);
    await page.keyboard.press('Escape'); assert.equal(await page.locator('dialog').count(), 0);
    assert.equal(await button.evaluate(node => node === document.activeElement), true);
    assert.equal(await page.evaluate(() => document.body.style.overflow), '');
    assert.ok(Math.abs(await page.evaluate(() => scrollY) - y) <= 1);
  }
  pass('All seven viewers: keyboard opening, native focus trap, Escape, focus and scroll restoration');
  await openers(page).nth(3).click();
  assert.match(await page.locator('#about-viewer-caption').innerText(), /Сварочные/);
  await page.keyboard.press('ArrowRight'); assert.equal(await page.locator('#about-viewer-caption').innerText(), 'Производственный цех');
  await page.getByRole('button', { name: 'Следующая фотография' }).click(); assert.match(await page.locator('#about-viewer-caption').innerText(), /заказчиком/);
  await page.keyboard.press('ArrowLeft');
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 600, y: 300 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 450, y: 302 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
  assert.match(await page.locator('#about-viewer-caption').innerText(), /заказчиком/);
  await page.locator('.about-viewer__image').click(); assert.equal(await page.locator('dialog').count(), 1);
  await page.mouse.click(3, 100); assert.equal(await page.locator('dialog').count(), 0);
  pass('Production series: arrows, buttons, browser touch swipe, image click stays open, backdrop closes');
  await page.setViewportSize({ width: 960, height: 320 });
  await openers(page).nth(3).click();
  assert.ok(await close(page).isVisible()); assert.ok(await page.getByRole('button', { name: 'Следующая фотография' }).isVisible());
  await page.locator('.about-viewer__image').evaluate(img => img.decode());
  const bounds = await page.locator('.about-viewer__image').boundingBox(); assert.ok(bounds.height > 0 && bounds.y >= 0 && bounds.y + bounds.height <= 320);
  await page.screenshot({ path: path.join(output, 'viewer-low-screen.png') });
  await close(page).click(); pass('320px-high screen and prefers-reduced-motion: controls and full frame fit');
  await page.setViewportSize({ width: 1440, height: 900 });
  // Intentional failure and slow response are isolated; do not hide unrelated browser exceptions.
  const errorCtx = await context(); const errorPage = await errorCtx.newPage();
  await errorCtx.route('**/*dsc05801-large*', route => route.abort());
  await errorPage.goto(origin + '/about'); await ready(errorPage);
  await errorPage.getByRole('button', { name: 'Без аналитики', exact: true }).click();
  await openers(errorPage).first().click(); await errorPage.getByRole('alert').waitFor();
  await errorCtx.unroute('**/*dsc05801-large*');
  await errorPage.getByRole('button', { name: 'Попробовать ещё раз' }).click(); await errorPage.locator('.about-viewer__image').evaluate(img => img.decode());
  await close(errorPage).click(); await errorCtx.close(); pass('Image failure, explanatory state and retry');
  let release; const gate = new Promise(resolve => { release = resolve; });
  const slowCtx = await context(); const slowPage = await slowCtx.newPage();
  await slowCtx.route('**/*dsc05801-large*', async route => { await gate; await route.fallback(); });
  await slowPage.goto(origin + '/about'); await ready(slowPage);
  await slowPage.getByRole('button', { name: 'Без аналитики', exact: true }).click();
  await openers(slowPage).first().click(); assert.equal(await slowPage.getByRole('status').innerText(), 'Загружаем фотографию…');
  release(); await slowPage.locator('.about-viewer__image').evaluate(img => img.decode()); await close(slowPage).click();
  await slowCtx.close(); pass('Slow image has accessible loading state');
  // Simulate SPA navigation while the native modal is open, then assert effect cleanup.
  await openers(page).first().click();
  await page.evaluate(() => document.querySelector('.about-page__contact a').click());
  await page.waitForURL(origin + '/#contacts'); await page.locator('dialog').waitFor({ state: 'detached' });
  assert.equal(await page.evaluate(() => document.body.style.overflow), ''); await page.keyboard.press('ArrowRight');
  pass('SPA unmount clears dialog and background lock');
  const form = page.locator('.lead-form');
  await form.locator('[name=name]').fill('Synthetic about visitor');
  await form.locator('[name=description]').fill('Synthetic local task');
  await form.locator('input[type=file]').setInputFiles([
    { name: 'first.txt', mimeType: 'text/plain', buffer: Buffer.from('one') },
    { name: 'second.txt', mimeType: 'text/plain', buffer: Buffer.from('two') },
  ]);
  await page.locator('.nav a[href="/about"]').click(); await ready(page);
  await page.goBack(); await page.waitForURL(origin + '/#contacts');
  assert.equal(await form.locator('[name=name]').inputValue(), 'Synthetic about visitor');
  await page.goForward(); await ready(page);
  await page.locator('.about-page__contact a').click(); await page.waitForURL(origin + '/#contacts');
  await form.waitFor();
  await page.waitForFunction(() => document.querySelector('link[rel=canonical]')?.href === 'https://www.energoeffekt-rostov.ru/');
  const contactPosition = await page.locator('#contacts').boundingBox();
  const headerHeight = await page.locator('.header').evaluate(node => node.offsetHeight);
  assert.ok(Math.abs(contactPosition.y - (headerHeight - 12)) <= 2);
  assert.equal(await form.locator('[name=description]').inputValue(), 'Synthetic local task');
  await page.getByRole('button', { name: 'Настройки cookies', exact: true }).click();
  await page.getByRole('button', { name: 'Без аналитики', exact: true }).click();
  assert.equal(await form.locator('[name=name]').inputValue(), 'Synthetic about visitor');
  await form.locator('.file-select__toggle').click();
  assert.deepEqual(await form.locator('.file-select__name').allTextContents(), ['first.txt', 'second.txt']); await page.keyboard.press('Escape');
  pass('Header, Back/Forward, CTA positioning, draft with two files and cookie settings');
  await page.locator('.footer__nav a[href="/about"]').click(); await ready(page); await page.reload(); await ready(page);
  assert.equal(await page.locator('.footer__nav a[href="/about"]').count(), 1);
  pass('Footer navigation, direct /about, reload and active route');
  for (const [link, id] of [['/#products', 'products'], ['/#services', 'services'], ['/#cases', 'cases']]) {
    await page.locator(`.nav a[href="${link}"]`).click(); await page.waitForURL(origin + link);
    await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    await page.waitForFunction(href => document.querySelector('.nav__link[aria-current=page]')?.getAttribute('href') === href, link);
  }
  await page.locator('a[href="/solutions/bmk"]').first().click(); await page.waitForURL(origin + '/solutions/bmk');
  assert.ok(await page.locator('main h1').isVisible());
  await page.locator('.nav a[href="/#services"]').click(); await page.waitForURL(origin + '/#services');
  await page.locator('a[href="/services/design"]').first().click(); await page.waitForURL(origin + '/services/design');
  assert.ok(await page.locator('main h1').isVisible());
  await page.locator('.nav a[href="/#cases"]').click(); await page.waitForURL(origin + '/#cases');
  await page.locator('a[data-case-slug]').first().click(); await page.locator('.case-modal').waitFor();
  await page.keyboard.press('Escape'); await page.locator('.case-modal').waitFor({ state: 'detached' });
  pass('Existing home hash navigation, product, service and case modal');
  await ctx.close();
  for (const width of [360, 1440]) {
    const nojs = await context({ javaScriptEnabled: false, viewport: { width, height: 900 } }); const p = await nojs.newPage();
    await p.goto(origin + '/about');
    assert.equal(await p.locator('main h1').innerText(), 'О нас');
    assert.equal(await p.locator('.about-page__departments li').count(), 7);
    assert.equal(await p.locator('.about-photo').count(), 7);
    assert.match(await p.locator('main').innerText(), /паспорт изделия с отметкой об испытаниях/);
    assert.equal(await p.locator('dialog').count(), 0);
    assert.equal(await p.locator('script[type="application/ld+json"]').filter({ hasText: 'Person' }).count(), 0);
    await nojs.close();
  }
  pass('Prerender without JavaScript: all facts, departments, photos, CTA, no Person schema');
  assert.deepEqual(report.errors, []); assert.deepEqual(report.external, []);
  pass('No hydration/runtime errors, external requests or analytics events');
} finally {
  await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2)); await browser.close();
}
