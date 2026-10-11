import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import process from 'node:process';
import { tmpdir } from 'node:os';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const origin = process.env.SEO_TEST_ORIGIN;
assert.match(origin, /^http:\/\/127\.0\.0\.1:\d+$/);
const manifest = JSON.parse(await readFile('dist/prerender-manifest.json', 'utf8'));
const out = process.env.PRERENDER_OUTPUT || path.join(tmpdir(), 'ee-prerender');
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined,
  headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const report = { checks: [], errors: [], forbidden: [], geometry: [] };
const pass = (name) => { report.checks.push(name); console.log('PASS', name); };
async function protect(context) {
  context.on('page', (page) => {
    page.on('pageerror', (error) => report.errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') report.errors.push(message.text()); });
  });
  await context.route('**/*', (route) => {
    const request = route.request();
    if (new URL(request.url()).origin !== origin || request.method() !== 'GET') {
      report.forbidden.push({ url: request.url(), method: request.method() });
      return route.abort();
    }
    return route.continue();
  });
}
try {
  for (const width of [360, 1440]) {
    const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width, height: 900 } });
    await protect(nojs);
    const page = await nojs.newPage();
    for (const row of manifest.pages.filter((item) => item.route !== '/404')) {
      assert.equal((await page.goto(origin + row.route)).status(), 200);
      assert.ok(await page.locator('main h1').isVisible(), row.route);
      assert.equal(await page.title(), row.title);
      assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'), 'https://www.energoeffekt-rostov.ru' + row.route);
      if (await page.locator('.lead-form').count()) {
        assert.ok(await page.locator('.lead-form input[name=name]').isDisabled());
        assert.ok(await page.locator('.lead-form noscript p').isVisible());
        await page.locator('.lead-form input[name=name]').press('Enter');
        assert.equal(new URL(page.url()).search, '');
      }
      if (await page.locator('.faq__answer').count()) assert.ok(await page.locator('.faq__answer').first().isVisible());
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    }
    await page.goto(origin + '/');
    await page.locator('a[href="/solutions"]').first().click();
    assert.equal(new URL(page.url()).pathname, '/solutions');
    await nojs.close();
    pass(`${width}px: all 19 pages readable without JS, links work, form disabled and no GET submission`);

    const delayed = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    await protect(delayed);
    let release;
    const gate = new Promise((resolve) => { release = resolve; });
    await delayed.route('**/assets/*.js', async (route) => { await gate; await route.fallback(); });
    const live = await delayed.newPage();
    await live.goto(origin + '/', { waitUntil: 'commit' });
    await live.locator('main h1').waitFor();
    await live.evaluate(() => document.fonts.ready);
    assert.ok(await live.locator('.lead-form input[name=name]').isDisabled());
    assert.ok(await live.locator('.file-select input[type=file]').isDisabled());
    assert.ok(await live.locator('.lead-form button[type=submit]').isDisabled());
    assert.equal(await live.locator('.cookie-banner').count(), 0);
    const before = await live.locator('main h1').boundingBox();
    const mainText = await live.locator('main h1').textContent();
    await live.screenshot({ path: path.join(out, `${width}-before-js.png`) });
    release();
    await live.waitForFunction(() => !document.querySelector('.lead-form fieldset').disabled);
    assert.equal(await live.locator('main h1').textContent(), mainText);
    const after = await live.locator('main h1').boundingBox();
    for (const key of ['x', 'y', 'width', 'height']) assert.ok(Math.abs(before[key] - after[key]) < 1, `${width}: H1 shifted ${key}`);
    report.geometry.push({ width, before, after });
    await live.screenshot({ path: path.join(out, `${width}-after-js.png`) });
    await live.locator('.lead-form input[name=name]').fill('synthetic_ready_input');
    await live.locator('a[href="/solutions"]').first().click();
    await live.locator('a[href="/solutions/bmk"]').first().click();
    assert.equal(await live.locator('.lead-form input[name=name]').inputValue(), 'synthetic_ready_input');
    await live.goBack();
    await live.goBack();
    assert.equal(await live.locator('.lead-form input[name=name]').inputValue(), 'synthetic_ready_input');
    assert.equal(new URL(live.url()).search, '');
    await delayed.close();
    pass(`${width}px: delayed JS disables fields/files/submit, hydration preserves H1 geometry and SPA draft`);
  }
  assert.deepEqual(report.errors, [], 'console/hydration errors');
  assert.deepEqual(report.forbidden, [], 'external request or submission');
} finally {
  await writeFile(path.join(out, 'results.json'), JSON.stringify(report, null, 2));
  await browser.close();
}
