import assert from 'node:assert/strict';
import { stat, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

// Every request is intercepted; no production API, SMTP or actual counter.
// Playwright is external, as in the existing browser runners.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const dist = path.resolve(process.env.DRAFT_DIST || 'dist');
const output = process.env.DRAFT_OUTPUT || '/tmp/ee-lead-draft';
const origin = 'https://www.energoeffekt-rostov.ru';
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined,
  headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const report = { checks: [], errors: [] };
const pass = label => { report.checks.push(label); console.log('PASS', label); };
const fields = { name: 'draft_private_person', company_name: 'draft_private_company',
  phone: '+70000000000', email: 'draft_private@example.invalid', description: 'draft_private_task' };
const files = [
  { name: 'draft-private-first.txt', mimeType: 'text/plain', buffer: Buffer.from('draft_private_document_1') },
  { name: 'draft-private-second.txt', mimeType: 'text/plain', buffer: Buffer.from('draft_private_document_2') },
];
const form = page => page.locator('.lead-form');
async function navigate(page, pathname) {
  const link = page.locator(`a[href="${pathname}"]`).filter({ visible: true }).first();
  if (await link.count()) await link.click();
  else if (pathname.startsWith('/solutions/') && await page.locator('.entity-switcher__item').count()) {
    const index = ['bmk', 'btp', 'vns', 'pns', 'automation-cabinets'].indexOf(pathname.split('/').at(-1));
    await page.locator('.entity-switcher__item').nth(index).click();
  } else throw new Error(`No visible SPA navigation to ${pathname}`);
  await page.waitForURL(origin + pathname);
  await page.waitForFunction(expected => document.querySelector('link[rel="canonical"]')?.href === expected, origin + pathname);
}
async function checkFields(page) {
  for (const [name, value] of Object.entries(fields)) assert.equal(await form(page).locator(`[name="${name}"]`).inputValue(), value);
  assert.equal(await form(page).locator('[name=consent]').isChecked(), true);
}
async function checkFiles(page, expected = files) {
  const toggle = form(page).locator('.file-select__toggle');
  if (await toggle.getAttribute('aria-expanded') !== 'true') await toggle.click();
  assert.deepEqual(await form(page).locator('.file-select__name').allTextContents(), expected.map(file => file.name));
  await page.keyboard.press('Escape');
}
async function fill(page) {
  for (const [name, value] of Object.entries(fields)) await form(page).locator(`[name="${name}"]`).fill(value);
  await form(page).locator('[name=consent]').check();
  await form(page).locator('[type=file]').setInputFiles(files);
}
async function empty(page) {
  for (const name of Object.keys(fields)) assert.equal(await form(page).locator(`[name="${name}"]`).inputValue(), '');
  assert.equal(await form(page).locator('[name=consent]').isChecked(), false);
  assert.equal(await form(page).locator('.file-select__value').innerText(), 'Прикрепить файл');
}
async function bounded(promise, message) {
  let timer;
  try {
    return await Promise.race([promise, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), 10000);
    })]);
  } finally { clearTimeout(timer); }
}
async function clear(page, accept) {
  const answered = new Promise((resolve, reject) => {
    page.once('dialog', async dialog => {
      try {
        assert.equal(dialog.message(), 'Очистить форму? Введённые данные и прикреплённые файлы будут удалены');
        await (accept ? dialog.accept() : dialog.dismiss());
        resolve();
      } catch (error) { reject(error); }
    });
  });
  await form(page).getByRole('button', { name: 'Очистить форму', exact: true }).focus();
  await page.keyboard.press('Enter');
  await bounded(answered, 'Clear confirmation dialog did not complete');
}
try {
  for (const width of [1440, 360]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
    const goals = [], requests = [];
    let confirmedId = 122;
    let mode = 201, releaseRequest, announceDelayed, allowResourceErrors = false;
    await context.exposeBinding('__draftAnalytics', (_, data) => goals.push(data));
    await context.addInitScript(() => {
      if (window !== window.top || !crypto.subtle) return;
      window.__storageWrites = [];
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function(key, value) {
        window.__storageWrites.push([key, value]);
        return set.call(this, key, value);
      };
      const digest = crypto.subtle.digest.bind(crypto.subtle);
      crypto.subtle.digest = async (...args) => {
        if (window.__delayDigest) {
          window.__delayDigest = false;
          window.__digestWaiting = true;
          await new Promise(resolve => { window.__releaseDigest = resolve; });
        }
        return digest(...args);
      };
    });
    context.on('page', page => {
      page.on('pageerror', error => report.errors.push(error.message));
      page.on('console', message => {
        if (message.type() === 'error' && !(allowResourceErrors && /^Failed to load resource:/.test(message.text()))) report.errors.push(message.text());
      });
    });
    await context.route('**/*', async route => {
      const request = route.request(), url = new URL(request.url());
      if (url.hostname === 'mc.yandex.ru' && url.pathname === '/metrika/tag.js') {
        return route.fulfill({ contentType: 'application/javascript', body: 'window.ym=(id,method,...args)=>window.__draftAnalytics({method,args});' });
      }
      assert.equal(url.origin, origin, 'Unexpected external request');
      if (url.pathname === '/api/leads/') {
        assert.equal(request.method(), 'POST');
        const body = request.postDataBuffer().toString();
        requests.push({ id: body.match(/name="submission_id"\r\n\r\n([^\r]+)/)?.[1], body });
        const currentMode = mode;
        if (currentMode === 'delayed') await new Promise(resolve => { releaseRequest = resolve; announceDelayed(); });
        if (currentMode === 'network') return route.abort();
        if (currentMode === 'indeterminate') return route.fulfill({ status: 201, contentType: 'application/json', body: '{}' });
        const status = currentMode === 'delayed' ? 201 : currentMode;
        if (status === 200 || status === 201) confirmedId += 1;
        return route.fulfill({ status, contentType: 'application/json', headers: { 'retry-after': '1' },
          body: JSON.stringify(status === 200 ? { id: confirmedId, duplicate: true } : status === 201 ? { id: confirmedId } : { detail: 'Synthetic rejection' }) });
      }
      assert.equal(request.method(), 'GET');
      let target = path.resolve(dist, decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html');
      assert.ok(target.startsWith(dist + path.sep));
      try { if (!(await stat(target)).isFile()) target = path.join(dist, 'index.html'); }
      catch { target = path.join(dist, 'index.html'); }
      return route.fulfill({ path: target });
    });
    const page = await context.newPage();
    await page.goto(origin + '/solutions/bmk');
    await page.getByRole('button', { name: 'Разрешить аналитику', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('iframe')?.contentWindow?.ym);
    const topic = () => form(page).locator('[name=description_topic]').inputValue();
    const initial = await topic();
    await navigate(page, '/solutions/btp');
    const next = await topic();
    assert.notEqual(next, initial);
    await navigate(page, '/solutions/bmk');
    await fill(page);
    await checkFiles(page);
    await navigate(page, '/about'); await page.goBack();
    await checkFields(page); await checkFiles(page);
    await page.goForward(); await page.goBack();
    await navigate(page, '/solutions/btp');
    await checkFields(page); assert.equal(await topic(), initial);
    await form(page).locator('.topic-select__button').click();
    await form(page).getByRole('button', { name: next, exact: true }).click();
    await navigate(page, '/solutions/bmk'); assert.equal(await topic(), next);
    await checkFiles(page);
    await form(page).locator('.file-select__toggle').click();
    await form(page).getByRole('button', { name: `Удалить файл ${files[0].name}`, exact: true }).click();
    await form(page).locator('[type=file]').setInputFiles(files[0]);
    await navigate(page, '/about'); await page.goBack();
    await checkFiles(page, [files[1], files[0]]);
    pass(`${width}: fields/consent/files, SPA/Back/Forward, auto vs explicit direction, file order/remove/re-add`);

    const policyOpened = context.waitForEvent('page');
    await form(page).getByRole('link', { name: 'Политика обработки персональных данных (новая вкладка)', exact: true }).click();
    const policy = await policyOpened; await policy.waitForLoadState();
    await policy.locator('.privacy-page__return-note').waitFor();
    await policy.close(); await checkFields(page);
    await page.getByRole('button', { name: 'Настройки cookies', exact: true }).click();
    await page.getByRole('button', { name: 'Без аналитики', exact: true }).click();
    await checkFields(page); await checkFiles(page, [files[1], files[0]]);
    await page.getByRole('button', { name: 'Настройки cookies', exact: true }).click();
    await page.getByRole('button', { name: 'Разрешить аналитику', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('iframe')?.contentWindow?.ym);
    await navigate(page, '/');
    await page.locator('a[data-case-slug]').filter({ visible: true }).first().click();
    await page.getByRole('button', { name: 'Закрыть кейс', exact: true }).click();
    await checkFields(page);
    assert.equal(goals.filter(item => item.method === 'reachGoal' && item.args[0] === 'lead_form_start').length, 1);
    assert.doesNotMatch(JSON.stringify(goals), /draft_private|draft-private|70000000000/);
    pass(`${width}: policy tab/cookies/modal retain draft; no navigation start or PII events`);
    await clear(page, false); await checkFields(page);
    await clear(page, true); await empty(page); assert.equal(await topic(), '');
    assert.equal(await form(page).locator('.lead-form__status').count(), 0);
    assert.equal(await page.getByRole('button', { name: 'Без аналитики', exact: true }).count(), 0);
    pass(`${width}: keyboard clear cancel/confirm, consent/files/status reset, analytics choice retained`);

    await fill(page);
    let retainedId;
    for (const error of ['network', 'indeterminate', 400, 413, 429, 500, 409]) {
      mode = error; allowResourceErrors = true;
      await form(page).getByRole('button', { name: 'Отправить заявку', exact: true }).click();
      await form(page).locator('.lead-form__status--error').waitFor();
      assert.ok(requests.at(-1).id);
      if (!retainedId) retainedId = requests.at(-1).id;
      assert.equal(requests.at(-1).id, retainedId, 'Same draft retry must reuse UUID');
      await navigate(page, '/solutions/btp'); await checkFields(page); await checkFiles(page);
      await navigate(page, '/'); await checkFields(page);
    }
    allowResourceErrors = false;
    assert.ok(requests[0].body.indexOf(files[0].name) < requests[0].body.indexOf(files[1].name));
    mode = 200;
    await form(page).getByRole('button', { name: 'Отправить заявку', exact: true }).click();
    await form(page).locator('.lead-form__status--success').waitFor();
    assert.notEqual(requests.at(-1).id, retainedId, '409 starts a new logical submission');
    await empty(page);
    pass(`${width}: network/indeterminate/400/409/413/429/500 retain draft, stable route retry, duplicate 200 clears`);

    await fill(page); mode = 'network'; allowResourceErrors = true;
    await form(page).getByRole('button', { name: 'Отправить заявку', exact: true }).click();
    await form(page).locator('.lead-form__status--error').waitFor();
    const clearedId = requests.at(-1).id;
    await form(page).locator('[name=company_name]').fill('draft_private_revision');
    await form(page).getByRole('button', { name: 'Отправить заявку', exact: true }).click();
    await form(page).locator('.lead-form__status--error').waitFor();
    const revisionId = requests.at(-1).id;
    assert.notEqual(revisionId, clearedId);
    await form(page).locator('[name=company_name]').fill(fields.company_name);
    await form(page).locator('[type=file]').setInputFiles({ name: 'empty.txt', mimeType: 'text/plain', buffer: Buffer.alloc(0) });
    await form(page).locator('.lead-form__file-error').waitFor();
    await clear(page, false); await checkFields(page);
    await clear(page, true); await empty(page);
    assert.equal(await form(page).locator('.lead-form__file-error').count(), 0);
    const retryStorage = await page.evaluate(() => JSON.stringify({ ...sessionStorage }));
    assert.ok(!retryStorage.includes(clearedId) && !retryStorage.includes(revisionId), 'Clear retires every retry UUID owned by the draft');
    assert.equal(await form(page).locator('.lead-form__status').count(), 0);
    allowResourceErrors = false;
    await fill(page); mode = 'delayed';
    const delayedRequest = new Promise(resolve => { announceDelayed = resolve; });
    await page.evaluate(() => { window.__delayDigest = true; });
    const count = requests.length;
    await form(page).getByRole('button', { name: 'Отправить заявку', exact: true }).click();
    await page.waitForFunction(() => window.__digestWaiting);
    await navigate(page, '/about'); await page.goBack();
    assert.equal(await form(page).locator('fieldset').evaluate(element => element.disabled), true);
    assert.equal(await form(page).getByRole('button', { name: 'Очистить форму', exact: true }).isDisabled(), true);
    await form(page).evaluate(element => element.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    assert.equal(requests.length, count);
    await page.evaluate(() => window.__releaseDigest());
    await bounded(delayedRequest, 'Delayed POST did not reach mock');
    assert.ok(releaseRequest, 'Delayed POST reached mock');
    assert.notEqual(requests.at(-1).id, clearedId, 'Manual clear discards previous retry identity');
    assert.equal(requests.length, count + 1);
    await navigate(page, '/about'); await page.goBack();
    assert.equal(await form(page).locator('[name=name]').isDisabled(), true);
    await form(page).evaluate(element => element.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    assert.equal(requests.length, count + 1);
    await navigate(page, '/about'); releaseRequest(); releaseRequest = null;
    await page.waitForTimeout(250);
    await page.goBack(); await empty(page);
    await form(page).locator('.lead-form__status--success').waitFor();
    await form(page).locator('[name=name]').fill('new_private_draft');
    await page.waitForTimeout(100);
    assert.equal(await form(page).locator('[name=name]').inputValue(), 'new_private_draft');
    assert.equal(await form(page).locator('.lead-form__status').count(), 0, 'New draft must not show previous success');
    assert.equal(requests.length, count + 1);
    assert.equal(goals.filter(item => item.method === 'reachGoal' && item.args[0] === 'lead_success').length, 2);
    pass(`${width}: delayed SHA/POST, shared lock, one POST, success while unmounted, successor retained, no duplicate success`);

    const other = await context.newPage(); await other.goto(origin + '/'); await empty(other); await other.close();
    const storage = await page.evaluate(async () => ({ local: { ...localStorage }, session: { ...sessionStorage },
      writes: window.__storageWrites, cookies: document.cookie, databases: await indexedDB.databases() }));
    assert.doesNotMatch(JSON.stringify(storage), /draft_private|draft-private|new_private_draft|70000000000/);
    assert.deepEqual(storage.databases, []);
    await page.reload(); await empty(page);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await form(page).getByRole('button', { name: 'Очистить форму', exact: true }).focus();
    assert.equal(await form(page).getByRole('button', { name: 'Очистить форму', exact: true }).evaluate(element => element === document.activeElement), true);
    await mkdir(output, { recursive: true });
    await form(page).screenshot({ path: path.join(output, `${width}-form.png`) });
    pass(`${width}: independent tab/reload, no PII in storage/writes/IndexedDB/cookies, responsive keyboard action`);
    // Virtual browser time exercises real React messages without sleeping 5s.
    await page.clock.install();
    await page.clock.pauseAt(new Date());
    await page.evaluate(() => {
      window.__messageCallbacks = [];
      const timeout = window.setTimeout.bind(window);
      window.setTimeout = (callback, delay, ...args) => {
        if (delay === 5000 || delay === 5600) window.__messageCallbacks.push(callback);
        return timeout(callback, delay, ...args);
      };
    });
    const message = () => form(page).locator('.lead-form__status');
    const hiding = () => form(page).locator('.lead-form__status--hiding');
    async function success() {
      mode = 201;
      await fill(page);
      await form(page).getByRole('button', { name: 'Отправить заявку', exact: true }).click();
      await form(page).locator('.lead-form__status--success').waitFor();
    }
    await success();
    await page.clock.runFor(4900); assert.equal(await hiding().count(), 0);
    await page.clock.runFor(100); assert.equal(await hiding().count(), 1);
    await page.clock.runFor(600); assert.equal(await message().count(), 0);
    await empty(page);
    pass(`${width}: visible success hides at 5s/removes at 5.6s; timers affect only message`);

    mode = 'delayed';
    const unseenRequest = new Promise(resolve => { announceDelayed = resolve; });
    await fill(page);
    await form(page).getByRole('button', { name: 'Отправить заявку', exact: true }).click();
    await bounded(unseenRequest, 'Unseen success POST did not reach mock');
    await navigate(page, '/about'); releaseRequest(); releaseRequest = null;
    // Wait for the actual fetch callback, then age an unpresented result.
    await page.waitForTimeout(200);
    await page.clock.runFor(8000);
    await page.goBack();
    await form(page).locator('.lead-form__status--success').waitFor();
    await page.clock.runFor(2000);
    await page.evaluate(() => { window.__staleMessageCallbacks = window.__messageCallbacks.slice(-2); });
    await navigate(page, '/about');
    await page.clock.runFor(8000);
    await page.goBack();
    await form(page).locator('.lead-form__status--success').waitFor();
    await navigate(page, '/about'); await page.goBack();
    await form(page).locator('.lead-form__status--success').waitFor();
    await page.evaluate(() => window.__staleMessageCallbacks.forEach(callback => callback()));
    assert.equal(await message().count(), 1); assert.equal(await hiding().count(), 0);
    await page.clock.runFor(4900); assert.equal(await hiding().count(), 0);
    await page.clock.runFor(100); assert.equal(await hiding().count(), 1);
    await page.clock.runFor(600); assert.equal(await message().count(), 0);
    pass(`${width}: unseen success retained >5.6s; remount restarts one countdown, no stale/duplicate timers`);

    await success(); await page.clock.runFor(1000);
    await fill(page); assert.equal(await message().count(), 0);
    mode = 500; allowResourceErrors = true;
    await form(page).getByRole('button', { name: 'Отправить заявку', exact: true }).click();
    await form(page).locator('.lead-form__status--error').waitFor();
    await page.clock.runFor(6000);
    await form(page).locator('.lead-form__status--error').waitFor();
    await checkFields(page); await checkFiles(page);
    await clear(page, true); allowResourceErrors = false;
    await success(); await page.clock.runFor(1000);
    await form(page).getByRole('button', { name: 'Очистить форму', exact: true }).click();
    await page.clock.runFor(6000); assert.equal(await message().count(), 0); await empty(page);
    pass(`${width}: new draft/manual clear remove success immediately; stale timers cannot erase new error/fields/files`);

    await success(); await page.clock.runFor(1000);
    await success();
    await page.clock.runFor(4600); assert.equal(await hiding().count(), 0); assert.equal(await message().count(), 1);
    await page.clock.runFor(400); assert.equal(await hiding().count(), 1);
    await page.clock.runFor(600); assert.equal(await message().count(), 0);
    await success(); await page.clock.runFor(1000);
    mode = 'delayed';
    const followingRequest = new Promise(resolve => { announceDelayed = resolve; });
    await fill(page);
    await form(page).getByRole('button', { name: 'Отправить заявку', exact: true }).click();
    await bounded(followingRequest, 'Following POST did not reach mock');
    await page.clock.runFor(6000);
    assert.equal(await form(page).locator('[name=name]').isDisabled(), true);
    assert.equal(await form(page).locator('[name=name]').inputValue(), fields.name);
    releaseRequest(); releaseRequest = null;
    await form(page).locator('.lead-form__status--success').waitFor();
    await empty(page);
    pass(`${width}: stale timers cannot hide next success or unlock/clear a following submission`);
    await context.close();
  }
  assert.deepEqual(report.errors, []);
} finally {
  await mkdir(output, { recursive: true });
  await writeFile(path.join(output, 'results.json'), JSON.stringify(report, null, 2));
  await browser.close();
}
