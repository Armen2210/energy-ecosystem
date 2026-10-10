import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

// External Playwright runner, following the existing browser scripts. Run
// against the isolated nginx serving dist, never against production/Vite.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const origin = process.env.SEO_TEST_ORIGIN || 'http://127.0.0.1:8088';
assert.match(origin, /^http:\/\/127\.0\.0\.1:\d+$/);
const out = process.env.SEO_OUTPUT || '/tmp/ee-technical-seo';
await mkdir(out, { recursive: true });
const sitemap = await readFile('public/sitemap.xml', 'utf8');
const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
const missing = ['/missing', '/solutions/missing', '/services/missing', '/cases/missing',
  '/404', '/about-us', '/raskhodomery', '/About', '/SOLUTIONS/bmk'];
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || undefined,
  headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const results = { pages: [], missing: [], checks: [], errors: [], consoleErrors: [], blockedExternal: [], screenshots: [] };
const pass = (name) => { results.checks.push(name); console.log('PASS', name); };
page.on('pageerror', (error) => results.errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') results.consoleErrors.push({ text: message.text(), ...message.location() });
});
// No accidental account/crawler/analytics/public API traffic during testing.
await context.route('**/*', async (route) => {
  if (new URL(route.request().url()).origin !== origin) {
    results.blockedExternal.push(route.request().url());
    await route.abort();
  } else {
    assert.notEqual(route.request().method(), 'POST');
    await route.continue();
  }
});

async function metadata() {
  return page.evaluate(() => {
    const meta = (selector) => document.head.querySelector(selector)?.getAttribute('content') ?? null;
    return {
      title: document.title, description: meta('meta[name="description"]'),
      canonical: document.querySelector('link[rel="canonical"]')?.href ?? null,
      robots: meta('meta[name="robots"]'), ogTitle: meta('meta[property="og:title"]'),
      ogDescription: meta('meta[property="og:description"]'), ogUrl: meta('meta[property="og:url"]'),
      twitterTitle: meta('meta[name="twitter:title"]'), twitterDescription: meta('meta[name="twitter:description"]'),
      image: meta('meta[property="og:image"]'),
      headings: [...document.querySelectorAll('main h1, main h2, main h3')].map((h) => ({
        tag: h.tagName, text: h.textContent.trim(), visible: !!(h.offsetWidth || h.offsetHeight),
      })),
      links: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')),
      schemas: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent)),
    };
  });
}

try {
  for (const url of paths) {
    const response = await page.goto(origin + url);
    assert.equal(response.status(), 200, url);
    const source = await response.text();
    await page.waitForFunction(() => document.querySelector('link[rel="canonical"]'));
    const data = await metadata();
    assert.equal(data.canonical, 'https://www.energoeffekt-rostov.ru' + url);
    assert.equal(data.robots, 'index, follow', url);
    assert.equal(data.ogUrl, data.canonical);
    assert.equal(data.ogTitle, data.title);
    assert.equal(data.twitterTitle, data.title);
    assert.equal(data.ogDescription, data.description);
    assert.equal(data.twitterDescription, data.description);
    const h1 = data.headings.filter((h) => h.tag === 'H1');
    assert.equal(h1.length, 1, url);
    assert.ok(h1[0].text && h1[0].visible, url);
    assert.ok(data.headings.every((h) => h.text), 'empty heading on ' + url);
    for (const href of data.links.filter((h) => h.startsWith('/'))) {
      const linked = new URL(href, origin);
      assert.ok(paths.includes(linked.pathname) || linked.pathname === '/contacts', url + ' -> ' + href);
      if (linked.hash && linked.pathname === url) {
        assert.ok(await page.locator('[id="' + linked.hash.slice(1) + '"]').count(), href);
      }
    }
    const organization = data.schemas.find((s) => s['@type'] === 'Organization');
    assert.equal(organization?.['@id'], 'https://www.energoeffekt-rostov.ru/#organization', url);
    assert.equal(organization?.url, 'https://www.energoeffekt-rostov.ru/');
    const faq = data.schemas.find((s) => s['@type'] === 'FAQPage');
    if (url.startsWith('/solutions/') || url.startsWith('/services/')) {
      assert.ok(faq, url);
      assert.equal(faq.url, data.canonical);
      assert.equal(faq['@id'], data.canonical + '#faq');
      const questions = await page.locator('.faq__question').allTextContents();
      const answers = await page.locator('.faq__answer').allTextContents();
      assert.deepEqual(faq.mainEntity.map((q) => q.name), questions);
      assert.deepEqual(faq.mainEntity.map((q) => q.acceptedAnswer.text), answers);
      await page.locator('.faq__summary').first().click();
      await page.locator('.faq__summary').first().getAttribute('aria-expanded').then((v) => assert.equal(v, 'true'));
    }
    const reloaded = await page.reload();
    assert.equal(reloaded.status(), 200, url);
    await page.waitForFunction(() => document.querySelector('link[rel="canonical"]'));
    assert.equal((await metadata()).canonical, data.canonical);
    results.pages.push({ path: url, status: response.status(), reloadStatus: reloaded.status(),
      sourceHasRootContent: !source.includes('<div id="root"></div>'),
      sourceHasCanonical: /rel="canonical"/.test(source), ...data });
  }
  assert.equal(new Set(results.pages.map((p) => p.title)).size, paths.length);
  assert.equal(new Set(results.pages.map((p) => p.description)).size, paths.length);
  pass('all sitemap pages: direct/reload HTTP 200, unique DOM metadata, visible H1, hrefs and matching FAQ');

  for (const url of missing) {
    const response = await page.goto(origin + url);
    assert.equal(response.status(), 404, url);
    assert.match(await response.text(), /Страница не найдена/);
    await page.waitForFunction(() => document.querySelector('meta[name="robots"]')?.content === 'noindex, follow');
    const data = await metadata();
    assert.equal(new URL(page.url()).pathname, url);
    assert.equal(data.canonical, null);
    assert.equal(data.ogUrl, null);
    assert.equal(data.title, 'Страница не найдена — Энергоэффект');
    assert.equal(await page.locator('main h1').count(), 1);
    assert.equal((await page.reload()).status(), 404);
    results.missing.push({ path: url, status: response.status(), ...data });
  }
  pass('missing pages: real nginx 404, no redirect, noindex, no canonical, direct/reload');

  await page.goto(origin + '/missing');
  await page.getByRole('link', { name: 'Смотреть продукцию', exact: true }).click();
  await page.waitForURL(origin + '/#products');
  await page.waitForFunction(() => document.querySelector('meta[name="robots"]')?.content === 'index, follow');
  assert.equal((await metadata()).canonical, 'https://www.energoeffekt-rostov.ru/');
  await page.locator('a[href="/solutions"]').first().click();
  await page.waitForURL(origin + '/solutions');
  await page.goBack();
  await page.waitForURL(origin + '/#products');
  await page.goForward();
  await page.waitForURL(origin + '/solutions');
  assert.equal((await metadata()).canonical, 'https://www.energoeffekt-rostov.ru/solutions');
  pass('client navigation and Back/Forward restore robots and canonical after a 404');

  await page.goto(origin + '/cases');
  const card = page.locator('a[data-case-slug]').first();
  const caseUrl = await card.getAttribute('href');
  await card.click();
  await page.locator('[role="dialog"]').waitFor();
  await page.waitForFunction((url) => document.querySelector('link[rel="canonical"]')?.href.endsWith(url), caseUrl);
  assert.equal((await metadata()).ogUrl, 'https://www.energoeffekt-rostov.ru' + caseUrl);
  await page.keyboard.press('Escape');
  await page.locator('[role="dialog"]').waitFor({ state: 'detached' });
  await page.waitForFunction(() => document.querySelector('link[rel="canonical"]')?.href.endsWith('/cases'));
  pass('case modal metadata and close/backdrop background restoration');

  // Invalid case + forged background history must still be a missing page,
  // not the catalogue behind a modal or a redirect.
  await page.evaluate(() => {
    history.pushState({ usr: { backgroundLocation: { pathname: '/cases' } }, key: 'seo-test' }, '', '/cases/missing');
    dispatchEvent(new PopStateEvent('popstate'));
  });
  await page.waitForFunction(() => document.title === 'Страница не найдена — Энергоэффект');
  assert.equal(new URL(page.url()).pathname, '/cases/missing');
  assert.equal(await page.locator('[role="dialog"]').count(), 0);
  pass('invalid case background cannot mask a missing resource');

  await page.goto(origin + '/contacts?utm_source=local');
  assert.equal(new URL(page.url()).pathname + new URL(page.url()).search + new URL(page.url()).hash,
    '/?utm_source=local#contacts');
  assert.equal((await metadata()).canonical, 'https://www.energoeffekt-rostov.ru/');
  pass('nginx contact alias retains query and contact anchor');

  for (const width of [360, 390, 768, 961, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const url of ['/', '/about', '/solutions', '/services', '/cases', paths.find((p) => p.startsWith('/cases/')), '/privacy', '/missing']) {
      await page.goto(origin + url);
      await page.locator('main h1').waitFor();
      await page.waitForTimeout(120);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      assert.equal(overflow, false, width + 'px ' + url);
      const file = path.join(out, width + '-' + (url.replaceAll('/', '_') || 'home') + '.png');
      await page.screenshot({ path: file, fullPage: false });
      results.screenshots.push(file);
    }
  }
  assert.deepEqual(results.errors, []);
  assert.ok(results.consoleErrors.every((error) => {
    const url = new URL(error.url || origin);
    return missing.includes(url.pathname) && /404/.test(error.text);
  }), 'unexpected console error');
  assert.deepEqual(results.blockedExternal, []);
  pass('responsive widths 360/390/768/961/1440: no horizontal overflow, no JS errors or external traffic');
} finally {
  await writeFile(path.join(out, 'results.json'), JSON.stringify(results, null, 2));
  await browser.close();
}
