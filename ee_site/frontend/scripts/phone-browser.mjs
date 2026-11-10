// Intercept all traffic: this test never submits a real lead or contacts vendors.
import assert from 'node:assert/strict';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const dist = path.resolve(process.env.ANALYTICS_DIST || 'dist');
const origin = 'https://www.energoeffekt-rostov.ru';
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined,
  args: ['--no-sandbox', '--disable-dev-shm-usage'] });
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const phones = [], errors = [];
    await context.route('**/*', async route => {
      const request = route.request(), url = new URL(request.url());
      if (url.origin !== origin) return route.abort();
      if (url.pathname === '/api/leads/' && request.method() === 'POST') {
        const body = request.postDataBuffer().toString();
        const match = /name="phone"\r\n\r\n([^\r]+)/.exec(body);
        phones.push(match?.[1]);
        return route.fulfill({ status: 201, contentType: 'application/json', body: '{"id":42}' });
      }
      if (url.pathname === '/api/leads/questionnaire-capabilities/') return route.fulfill({
        contentType: 'application/json', body: '{"version":1,"enabled":false,"products":[]}' });
      const file = path.resolve(dist, '.' + (url.pathname === '/' ? '/index.html' : url.pathname === '/documents' ? '/documents.html' : url.pathname));
      if (!file.startsWith(dist + path.sep)) return route.abort();
      try { return await route.fulfill({ path: file }); }
      catch { return route.fulfill({ status: 404, body: '' }); }
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin);
    await page.getByRole('button', { name: 'Принять', exact: true }).click();
    const form = page.locator('.lead-form');
    for (const input of ['(918) 310-68-88', '89183106888', '+7 (918) 310-68-88']) {
      await form.locator('[name=name]').fill('Synthetic phone check');
      await form.locator('[name=phone]').fill(input);
      await form.locator('[name=phone]').blur();
      assert.equal(await form.locator('[name=phone]').inputValue(), '+79183106888');
      await form.locator('[name=consent]').check();
      await form.locator('button[type=submit]').click();
      await page.waitForFunction(() => !document.querySelector('[name=phone]').value);
      assert.equal(phones.at(-1), '+79183106888');
    }
    await form.locator('[name=name]').fill('Synthetic autofill check');
    await form.locator('[name=consent]').check();
    // Autofill without input/change/blur: the submit handler must read the DOM.
    await form.evaluate(element => {
      const field = element.querySelector('[name=phone]');
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(field, '(918) 310-68-88');
      element.requestSubmit();
    });
    await page.waitForFunction(() => !document.querySelector('[name=phone]').value);
    assert.deepEqual(phones, Array(4).fill('+79183106888'));
    assert.deepEqual(errors, []);
    console.log(`PASS ${width}px: 10 digits, 8 prefix, +7 prefix and eventless autofill`);
    await page.goto(origin + '/documents');
    await page.screenshot({ path: `/tmp/ee-phone-documents-${width}.png`, fullPage: true });
    await context.close();
  }
} finally { await browser.close(); }
