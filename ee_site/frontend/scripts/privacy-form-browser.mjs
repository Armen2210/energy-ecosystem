import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

// External Playwright, existing project convention. Only loopback GETs; no leads.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const origin = process.env.PRIVACY_TEST_ORIGIN || 'http://127.0.0.1:8088';
assert.match(origin, /^http:\/\/127\.0\.0\.1:\d+$/);
const out = process.env.PRIVACY_OUTPUT || '/tmp/ee-privacy-form';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined,
  headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const results = { checks: [], errors: [], forbiddenRequests: [] };
const message = 'Ваша заявка осталась в предыдущей вкладке. После ознакомления закройте эту вкладку, чтобы продолжить заполнение.';
const files = [
  { name: 'brief.txt', mimeType: 'text/plain', buffer: Buffer.from('Synthetic brief') },
  { name: 'specification.pdf', mimeType: 'application/pdf', buffer: Buffer.from('Synthetic specification') },
];
const fields = { name: 'Тест вкладки', company_name: 'Тестовая компания', phone: '+79000000000', email: 'test@example.invalid', description: 'Синтетическая задача без отправки' };
const pass = name => { results.checks.push(name); console.log('PASS', name); };
try {
  for (const width of [360, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    context.on('page', page => {
      page.on('pageerror', error => results.errors.push(error.message));
      page.on('console', item => { if (item.type() === 'error') results.errors.push(item.text()); });
    });
    await context.route('**/*', route => {
      const request = route.request();
      const url = new URL(request.url());
      if (request.method() !== 'GET' || url.origin !== origin || /^\/(api|admin)(\/|$)/.test(url.pathname)) {
        results.forbiddenRequests.push({ url: request.url(), method: request.method() });
        return route.abort();
      }
      return route.continue();
    });
    const page = await context.newPage();
    await page.goto(origin + '/');
    await page.getByRole('button', { name: 'Без аналитики', exact: true }).click();
    const form = page.locator('.lead-form');
    for (const [name, value] of Object.entries(fields)) await form.locator(`[name="${name}"]`).fill(value);
    await form.locator('input[type=file]').setInputFiles(files);
    const consent = form.locator('[name=consent]');
    const link = form.getByRole('link', { name: 'Политика обработки персональных данных (новая вкладка)', exact: true });
    assert.equal(await link.getAttribute('href'), '/privacy?from=lead-form');
    assert.equal(await link.getAttribute('target'), '_blank');
    assert.equal(await link.getAttribute('rel'), 'noopener noreferrer');
    for (const checked of [false, true]) {
      await consent.setChecked(checked);
      await consent.focus();
      await page.keyboard.press('Tab');
      assert.ok(await link.evaluate(element => document.activeElement === element));
      const opened = context.waitForEvent('page');
      await page.keyboard.press('Enter');
      const policy = await opened;
      await policy.waitForLoadState();
      await policy.locator('.privacy-page__return-note').waitFor();
      assert.equal(new URL(policy.url()).pathname + new URL(policy.url()).search, '/privacy?from=lead-form');
      assert.equal(await policy.locator('.privacy-page__return-note').innerText(), message);
      assert.equal(await policy.locator('.page-navigation__back').count(), 0);
      assert.equal(await policy.evaluate(() => window.opener), null);
      assert.equal(await policy.evaluate(() => document.referrer), '');
      assert.equal(await policy.locator('link[rel=canonical]').getAttribute('href'), 'https://www.energoeffekt-rostov.ru/privacy');
      assert.ok(await policy.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await policy.reload();
      await policy.locator('.privacy-page__return-note').waitFor();
      await policy.screenshot({ path: path.join(out, `${width}-privacy.png`), fullPage: true });
      await policy.close();
      assert.equal(context.pages().length, 1);
      for (const [name, value] of Object.entries(fields)) assert.equal(await form.locator(`[name="${name}"]`).inputValue(), value);
      assert.equal(await consent.isChecked(), checked);
      assert.equal(new URL(page.url()).pathname, '/');
    }
    await form.locator('.file-select__toggle').click();
    assert.deepEqual(await form.locator('.file-select__name').allTextContents(), files.map(file => file.name));
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await form.screenshot({ path: path.join(out, `${width}-form.png`) });
    pass(`${width}: keyboard opens isolated tab; close retains fields, both consent states and two files`);
    await page.goto(origin + '/privacy');
    await page.locator('.page-navigation__back').waitFor();
    assert.equal(await page.locator('.privacy-page__return-note').count(), 0);
    assert.equal(await page.locator('.page-navigation__back').getAttribute('href'), '/');
    await page.locator('.page-navigation__back').click();
    const footer = page.locator('footer a[href="/privacy"]');
    assert.equal(await footer.getAttribute('target'), null);
    await footer.click();
    await page.locator('.page-navigation__back').waitFor();
    assert.equal(new URL(page.url()).search, '');
    assert.equal(await page.locator('.privacy-page__return-note').count(), 0);
    pass(`${width}: direct and footer entry preserve ordinary home navigation`);
    await context.close();
  }
  assert.deepEqual(results.errors, []);
  assert.deepEqual(results.forbiddenRequests, []);
} finally {
  await writeFile(path.join(out, 'results.json'), JSON.stringify(results, null, 2));
  await browser.close();
}
