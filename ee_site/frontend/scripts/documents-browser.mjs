import { dismissCookies } from "./cookie-browser-helpers.mjs";
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { documents, populatedDocumentCategories } from '../src/data/documents.js';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const origin = process.env.SEO_TEST_ORIGIN || 'http://127.0.0.1:8088';
assert.match(origin, /^http:\/\/127\.0\.0\.1:\d+$/);
const output = process.env.DOCUMENTS_OUTPUT || '/tmp/ee-documents-browser';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined,
  headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const results = { checks: [], downloads: [], opened: [], widths: [], errors: [], blocked: [] };
const pass = name => { results.checks.push(name); console.log('PASS', name); };
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
await context.route('**/*', async route => {
  const request = route.request();
  const url = new URL(request.url());
  // Only Chromium's bundled PDF viewer may load its internal extension assets.
  if (url.protocol === 'chrome-extension:' && url.hostname === 'mhjfbmdgcfjbbpaeojofohoefgiehjai' && request.method() === 'GET') return route.continue();
  if (url.origin !== origin || !['GET', 'HEAD'].includes(request.method())) {
    results.blocked.push({ url: request.url(), method: request.method() });
    return route.abort();
  }
  return route.continue();
});
const page = await context.newPage();
page.on('pageerror', error => results.errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') results.errors.push(message.text()); });
const files = () => page.locator('main .documents-page__file');
const categories = populatedDocumentCategories();
const orderedDocuments = categories.flatMap(category => category.documents);
const variants = orderedDocuments.flatMap(document => document.files.map(file => ({ document, file })));
const questionnaires = variants.filter(({ document }) => document.categoryId === 'questionnaires');
const previews = variants.filter(({ file }) => file.behavior === 'open');
async function settle() { await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(150); }
async function noOverflow() {
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  assert.ok(await page.locator('main').evaluate(main => [...main.querySelectorAll('*')]
    .every(element => element.getBoundingClientRect().right <= innerWidth + 1 && element.scrollWidth <= element.clientWidth + 1)));
}

async function footerFocused() {
  await page.waitForFunction(() => document.activeElement?.id === 'footer-documents');
  assert.ok(await page.locator('#footer-documents').evaluate(link => {
    const box = link.getBoundingClientRect();
    return box.top >= 0 && box.bottom <= innerHeight;
  }));
}
try {
  await page.goto(origin + '/documents');
  await settle();
  // Public files work before any cookie/analytics decision.
  for (const [index, { document, file }] of questionnaires.entries()) {
    const action = `Скачать ${file.format === 'xlsx' ? 'Excel' : 'PDF'}`;
    const link = page.getByRole('link', { name: `${action} — ${document.title}`, exact: true });
    const downloadEvent = page.waitForEvent('download');
    await link.click(); const download = await downloadEvent;
    assert.equal(await download.failure(), null);
    assert.equal(download.suggestedFilename(), path.basename(file.url));
    const bytes = await readFile(await download.path());
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    assert.equal(bytes.length, file.sizeBytes); assert.equal(sha256, file.sha256);
    assert.equal(new URL(page.url()).pathname, '/documents');
    assert.equal(context.pages().length, 1, 'questionnaire must not open another tab');
    results.downloads.push({ format: file.format, name: download.suggestedFilename(), sizeBytes: bytes.length, sha256 });
    if (index === 0) { pass('download works before any cookie decision or form'); await dismissCookies(page); }
  }
  assert.equal(results.downloads.filter(file => file.format === 'pdf').length, 4);
  assert.equal(results.downloads.filter(file => file.format === 'xlsx').length, 4);
  pass('all four PDF and four XLSX download with exact names and bytes, accessible names and no new tabs');
  assert.equal(previews.length, 6);
  for (const [index, { document, file }] of previews.entries()) {
    const link = page.getByRole('link', { name: `Открыть PDF — ${document.title}, в новой вкладке`, exact: true });
    const popupEvent = page.waitForEvent('popup');
    const responseEvent = context.waitForEvent('response', response => response.url() === origin + file.url && response.request().isNavigationRequest());
    if (index === 0) { await link.focus(); await page.keyboard.press('Enter'); }
    else await link.click();
    const popup = await popupEvent; const response = await responseEvent;
    await popup.waitForURL('**' + file.url); await popup.waitForLoadState('domcontentloaded');
    assert.equal(response.status(), 200);
    assert.equal(response.headers()['content-type'], 'application/pdf');
    assert.equal(Number(response.headers()['content-length']), file.sizeBytes);
    assert.equal(response.headers()['content-disposition'], undefined);
    assert.equal(new URL(popup.url()).pathname, file.url);
    assert.equal(new URL(page.url()).pathname, '/documents');
    results.opened.push({ url: file.url, name: path.basename(file.url), status: response.status(), sizeBytes: file.sizeBytes });
    await popup.close(); assert.equal(context.pages().length, 1);
  }
  pass('all six certificates/SOUT PDFs open in new tabs with correct URLs, MIME and sizes; keyboard Enter works');
  for (const width of [360, 390, 640, 641, 768, 960, 961, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(origin + '/documents'); await settle();
    assert.equal(await page.locator('main h1').textContent(), 'Документы');
    assert.equal(await page.locator('main h1').count(), 1);
    assert.deepEqual(await page.locator('main h2').allTextContents(), categories.map(category => category.title));
    assert.deepEqual(await page.locator('main h3').allTextContents(), orderedDocuments.map(item => item.title));
    assert.equal(await files().count(), 14);
    assert.deepEqual(await page.locator('.documents-page__document-description').allTextContents(), [
      'Сводная ведомость результатов и перечень рекомендуемых мероприятий',
      'Сводная ведомость результатов и перечень рекомендуемых мероприятий',
    ]);
    const appearances = await page.locator('.documents-page__category').evaluateAll(elements => elements.map(category => ({
      site: getComputedStyle(document.querySelector('.site')).backgroundColor,
      background: getComputedStyle(category).backgroundColor,
      border: getComputedStyle(category).borderTopWidth,
      radius: getComputedStyle(category).borderRadius, shadow: getComputedStyle(category).boxShadow,
    })));
    for (const appearance of appearances) {
    assert.equal(appearance.site, width <= 960 ? 'rgb(252, 247, 243)' : 'rgb(230, 235, 239)');
    assert.equal(appearance.background, width <= 960 ? 'rgba(0, 0, 0, 0)' : 'rgb(255, 255, 255)');
    if (width <= 960) { assert.equal(appearance.border, '0px'); assert.equal(appearance.shadow, 'none'); assert.equal(appearance.radius, '0px'); }
    }
    const boxes = await files().evaluateAll(elements => elements.map(a => ({ x: a.getBoundingClientRect().x, y: a.getBoundingClientRect().y,
      height: a.getBoundingClientRect().height, label: a.getAttribute('aria-label'), href: a.getAttribute('href'),
      download: a.hasAttribute('download'), target: a.target, rel: a.rel, text: a.textContent,
      description: a.getAttribute('aria-describedby')?.split(' ').map(id => document.getElementById(id)?.textContent).join(' ') })));
    boxes.forEach((box, i) => {
      assert.ok(box.height >= 44);
      const { document, file } = variants[i];
      assert.ok(box.label.includes(document.title));
      assert.ok(box.text.includes(file.format.toUpperCase()));
      if (file.behavior === 'download') {
        assert.ok(box.label.startsWith(file.format === 'pdf' ? 'Скачать PDF' : 'Скачать Excel'));
        assert.equal(box.download, true); assert.equal(box.target, ''); assert.equal(box.rel, '');
        assert.ok(!box.label.includes('вкладке') && !box.text.includes('вкладке'));
        assert.ok(box.text.includes(file.purpose)); assert.ok(box.description.includes(file.purpose));
      } else {
        assert.ok(box.label.startsWith('Открыть PDF') && box.label.includes('в новой вкладке'));
        assert.ok(box.text.includes('в новой вкладке'));
        assert.equal(box.download, false); assert.equal(box.target, '_blank');
        assert.ok(box.rel.includes('noopener') && box.rel.includes('noreferrer'));
      }
    });
    for (let i = 0; i < 8; i += 2) {
      if (width <= 640) { assert.ok(boxes[i + 1].y >= boxes[i].y + boxes[i].height); assert.equal(boxes[i].x, boxes[i + 1].x); }
      else { assert.equal(boxes[i].y, boxes[i + 1].y); assert.ok(boxes[i + 1].x > boxes[i].x); }
      if (width > 960) { assert.equal(boxes[i].x, boxes[0].x); assert.equal(boxes[i + 1].x, boxes[1].x); }
    }
    await noOverflow();
    await files().first().focus();
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.getAttribute('href')), documents[0].files[1].url);
    for (let i = 2; i < variants.length; i++) { await page.keyboard.press('Tab'); assert.equal(await page.evaluate(() => document.activeElement.getAttribute('href')), variants[i].file.url); }
    assert.notEqual(await files().last().evaluate(link => getComputedStyle(link).outlineStyle), 'none');
    if ([390, 1440].includes(width)) { await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo({ top: 0, behavior: 'instant' }); }); await page.screenshot({ path: path.join(output, `documents-${width}.png`), fullPage: true }); }
    results.widths.push({ width, appearances });pass(`${width}px: three categories, ten documents, fourteen accessible links, focus, no overflow`);
  }
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; }); await settle();
  await noOverflow();pass('390px: enlarged text reflows without clipping');
  await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.reload(); await settle(); assert.equal(await files().count(), 14);pass('direct /documents and reload hydrate without losing content or SEO');
  assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'), 'https://www.energoeffekt-rostov.ru/documents');

  // Explicit direct return and ordinary browser Back/Forward both restore the footer.
  await page.locator('.page-navigation__back').click(); await footerFocused();
  await page.locator('.footer').screenshot({ path: path.join(output, 'footer-documents.png') });
  await page.locator('#footer-documents').click(); await page.waitForURL('**/documents');
  await page.goBack(); await footerFocused(); await page.goForward(); await page.waitForURL('**/documents');
  pass('explicit footer return and Back/Forward preserve route, position and focus');
  await page.goto(origin + '/'); await dismissCookies(page);
  await page.locator('#footer-documents').click(); await page.waitForURL('**/documents');
  await page.reload(); await settle(); await page.goBack(); await footerFocused();pass('footer-origin Back survives a documents reload');

  await page.goto(origin + '/documents'); await settle();
  await page.evaluate(() => {
    window.__documentsFrames = []; window.__documentsTracking = true;
    const tick = () => { if (!window.__documentsTracking) return; window.__documentsFrames.push({ path: location.pathname, y: scrollY, home: Boolean(document.querySelector('.hero')) }); requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
  await page.locator('.page-navigation__back').click(); await footerFocused(); await page.waitForTimeout(250);
  // React Router can update the URL before committing Home. Inspect actual Home
  // frames, rather than the outgoing documents DOM under the new address.
  const frames = await page.evaluate(() => { window.__documentsTracking = false; return window.__documentsFrames.filter(frame => frame.path === '/' && frame.home); });
  assert.ok(frames.length > 0 && frames.every(frame => frame.y > 1000), JSON.stringify(frames));pass('SPA footer return has no intermediate Hero scroll frames');
  assert.ok(Math.max(...frames.map(frame => frame.y)) - Math.min(...frames.map(frame => frame.y)) <= 1, 'footer return jumps after positioning');

  const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 1000 } });
  await noJs.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  const staticPage = await noJs.newPage();const response = await staticPage.goto(origin + '/documents');
  assert.equal(response.status(), 200);assert.equal(await staticPage.locator('main .documents-page__file').count(), 14);
  assert.equal(await staticPage.locator('.page-navigation__back').getAttribute('href'), '/#footer-documents');
  await staticPage.locator('.page-navigation__back').click();
  // With JavaScript disabled, page-side rAF polling does not run. Poll the
  // native hash position from the driver while the browser finishes scrolling.
  let nativeReturnVisible = false;
  for (let attempt = 0; attempt < 50 && !nativeReturnVisible; attempt++) {
    nativeReturnVisible = await staticPage.locator('#footer-documents').evaluate(link => {
      const box = link.getBoundingClientRect(); return box.top >= 0 && box.bottom <= innerHeight;
    });
    if (!nativeReturnVisible) await staticPage.waitForTimeout(100);
  }
  assert.ok(nativeReturnVisible);
  await noJs.close();pass('ready HTML and footer return work without JavaScript');
  assert.deepEqual(results.errors, []);assert.deepEqual(results.blocked, []);
} finally {
  await writeFile(path.join(output, 'checks.json'), JSON.stringify(results, null, 2));
  await browser.close();
}
