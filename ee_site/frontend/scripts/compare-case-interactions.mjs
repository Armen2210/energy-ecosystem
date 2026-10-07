// Focused paired comparison of immutable local builds; no live API requests.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { installInteractionTiming, measureInteraction } from './interaction-timing.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const [before, after, output] = process.argv.slice(2);
if (!before || !after || !output) throw new Error('Usage: node scripts/compare-case-interactions.mjs BEFORE_DIST AFTER_DIST OUTPUT');
const runs = Number(process.env.QUALITY_RUNS || 7);
assert.ok(Number.isInteger(runs) && runs >= 5);
const scenarios = (process.env.QUALITY_SCENARIOS || 'natural,predecoded,tiny-gallery').split(',');
const modes = (process.env.QUALITY_MODES || 'mobile,desktop').split(',');
assert.ok(scenarios.every(s => ['natural', 'predecoded', 'tiny-gallery', 'startup-flow'].includes(s)));
assert.ok(modes.every(m => ['mobile', 'desktop'].includes(m)));
await fs.mkdir(output, { recursive: true });
const servers = [before, after].map((dir, i) => spawn(process.env.PYTHON || 'python',
  [path.join(import.meta.dirname, 'serve-quality.py'), path.resolve(dir), '--port', String(4186 + i)], { stdio: 'ignore' }));
const bases = { before: 'http://127.0.0.1:4186', after: 'http://127.0.0.1:4187' };
const records = [], errors = [], gallerySources = {};
let browser;
const openSelector = '[data-case-slug="bmk-sports-complex"]';
const openPredicate = `!!document.querySelector('.case-modal__close')`;
const closePredicate = `!document.querySelector('.case-modal__close')`;
const tinyImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=', 'base64');
async function newPage(width) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.addInitScript(installInteractionTiming);
  // Routing disables browser HTTP cache in all variants. Local assets only.
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    return url.hostname === '127.0.0.1' && !url.pathname.startsWith('/api/') ? route.continue() : route.abort();
  });
  page.on('pageerror', e => errors.push(e.message));
  return { context, page };
}
try {
  for (const base of Object.values(bases)) {
    let ready = false;
    for (let attempt = 0; attempt < 80; attempt++) {
      try { ready = (await fetch(base)).ok; } catch { /* server startup */ }
      if (ready) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.ok(ready, `Server did not start: ${base}`);
  }
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined,
    args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  // Discover every URL of the same case, independently in both saved builds.
  for (const phase of ['before', 'after']) {
    const { context, page } = await newPage(1440);
    await page.goto(bases[phase] + '/cases');
    await page.locator('.cookie-banner button').click();
    await page.locator(openSelector).first().click();
    const count = await page.locator('.case-modal__gallery-meta span').textContent();
    const total = Number(count.split('/')[1].trim());
    const sources = [];
    for (let i = 0; i < total; i++) {
      sources.push(await page.locator('.case-modal__gallery-image').evaluate(img => img.src));
      await page.locator('.case-modal__gallery-button--next').click();
      await page.waitForFunction(index => document.querySelector('.case-modal__gallery-meta span').textContent.startsWith(`${index} /`), (i + 1) % total + 1);
    }
    gallerySources[phase] = sources;
    await context.close();
  }
  for (const [mode, width] of [['mobile', 390], ['desktop', 1440]].filter(([m]) => modes.includes(m))) {
    for (const scenario of scenarios) {
      for (let run = 1; run <= runs; run++) {
        // Alternate before/after order, using a fresh context for every variant.
        for (const phase of run % 2 ? ['before', 'after'] : ['after', 'before']) {
          const { context, page } = await newPage(width);
          if (scenario === 'tiny-gallery') {
            const paths = new Set(gallerySources[phase].map(url => new URL(url).pathname));
            await page.route('**/*', route => paths.has(new URL(route.request().url()).pathname)
              ? route.fulfill({ status: 200, contentType: 'image/png', body: tinyImage }) : route.fallback());
          }
          // Same home → anchor → case flow as the earlier general runner.
          await page.goto(bases[phase] + '/');
          await page.locator('.cookie-banner button').click();
          await page.evaluate(() => document.fonts.ready);
          await page.waitForTimeout(800);
          if (scenario === 'startup-flow') {
            await measureInteraction(page, { name: 'header-anchor', selector: '.nav a[href="/#products"]', predicate: `location.hash === '#products'` });
          } else await page.locator('.nav a[href="/#products"]:visible').first().click();
          await page.locator(`${openSelector}:visible`).first().scrollIntoViewIfNeeded();
          if (scenario !== 'startup-flow') {
            await page.waitForLoadState('networkidle');
            // Isolate modal work from scroll-triggered background image downloads.
            await page.evaluate(async () => {
              await document.fonts.ready;
              await Promise.all([...document.images].filter(img => img.complete && img.naturalWidth).map(img => img.decode().catch(() => {})));
            });
          }
          if (scenario === 'predecoded') {
            await page.evaluate(async sources => {
              window.qualityPredecodedImages = await Promise.all(sources.map(async src => {
                const img = new Image(); img.src = src; await img.decode(); return img;
              }));
            }, gallerySources[phase]);
          }
          if (scenario !== 'startup-flow') await page.waitForTimeout(500);
          let client, traceOffset;
          if (process.env.QUALITY_TRACE === '1') {
            client = await context.newCDPSession(page);
            await client.send('Performance.enable');
            const metrics = await client.send('Performance.getMetrics');
            traceOffset = metrics.metrics.find(m => m.name === 'NavigationStart').value * 1000;
            await client.send('Tracing.start', { categories: 'devtools.timeline,v8,disabled-by-default-devtools.timeline', transferMode: 'ReturnAsStream' });
          }
          const opened = await measureInteraction(page, { name: 'case-open', selector: openSelector, predicate: openPredicate });
          await page.waitForFunction(() => window.qualityMeasurement.photo?.decodeResolvedAt !== null || window.qualityMeasurement.photo?.error);
          const photo = await page.evaluate(() => {
            const m = window.qualityMeasurement;
            return { ...m.photo, clickToDecodeResolvedMs: m.photo.decodeResolvedAt === null ? null : m.photo.decodeResolvedAt - m.clickAt,
              resources: performance.getEntriesByType('resource').filter(e => e.initiatorType === 'img' && e.startTime >= m.inputStart)
                .map(e => ({ name: e.name, startTime: e.startTime, responseEnd: e.responseEnd, duration: e.duration, transferSize: e.transferSize, decodedBodySize: e.decodedBodySize })) };
          });
          assert.equal(photo.error, null);
          records.push({ phase, mode, scenario, run, ...opened, photo });
          // Gallery decoded and modal's 240ms entry animation complete before close.
          if (scenario === 'startup-flow') {
            await measureInteraction(page, { name: 'gallery-next', selector: '.case-modal__gallery-button--next',
              predicate: `document.querySelector('.case-modal__gallery-meta span').textContent.startsWith('2 /')` });
          } else await page.waitForTimeout(400);
          const closed = await measureInteraction(page, { name: 'case-close', selector: '.case-modal__close', predicate: closePredicate });
          records.push({ phase, mode, scenario, run, ...closed });
          if (client) {
            const complete = new Promise(resolve => client.once('Tracing.tracingComplete', resolve));
            await client.send('Tracing.end');
            const { stream } = await complete;
            let trace = '', chunk;
            do { chunk = await client.send('IO.read', { handle: stream }); trace += chunk.data; } while (!chunk.eof);
            await client.send('IO.close', { handle: stream });
            await fs.writeFile(path.join(output, `${mode}-${scenario}-${run}-${phase}-trace.json`), trace);
            for (const action of [opened, closed]) {
              const start = (traceOffset + action.window.startTime) * 1000;
              const end = (traceOffset + action.window.endTime) * 1000;
              const entries = JSON.parse(trace).traceEvents.filter(e => e.ph === 'X' && e.ts < end && e.ts + (e.dur || 0) > start);
              const stored = records.findLast(r => r.phase === phase && r.mode === mode && r.scenario === scenario && r.run === run && r.name === action.name);
              stored.traceWindow = { start, end, events: entries.map(e => ({ name: e.name, category: e.cat, timestamp: e.ts, durationUs: e.dur, thread: e.tid, args: e.args })) };
            }
          }
          await context.close();
          console.log(`${mode} ${scenario} ${run} ${phase}: open ${opened.domStateConfirmationMs.toFixed(1)} close ${closed.domStateConfirmationMs.toFixed(1)} ms`);
        }
      }
    }
  }
  assert.deepEqual(errors, []);
} finally {
  await fs.writeFile(path.join(output, 'interactions.json'), JSON.stringify({
    methodology: { runs, selectedModes: modes, selectedScenarios: scenarios, traced: process.env.QUALITY_TRACE === '1', viewport: '390x900 and 1440x900, DPR1', throttling: 'none; local HTTP/1.0',
      metric: 'click capture to first rAF detecting expected DOM state; before paint, not INP',
      domMutationMetric: 'click capture to body MutationObserver seeing expected state; null if no qualifying mutation; also not paint completion; added in separate followup-dom-observer series',
      eventWindow: 'pointerdown timestamp through DOM-confirmation rAF; interactionId > 0, startTime in window',
      taskWindow: 'long tasks overlapping pointerdown → DOM confirmation; overlapMs retained',
      observerDelivery: '350ms wait excluded from measured window; sub-16ms Event Timing entries absent',
      photos: 'decode() begins after DOM confirmation; its resolution is separate, not paint completion',
      conditions: 'fresh context per phase/run/scenario; alternating phase order; background images/font/scroll settled except startup-flow; routing disables HTTP cache',
      scenarios: { natural: 'gallery first use', predecoded: 'all case photos decoded and retained before click',
        'tiny-gallery': 'gallery URLs (including shared card cover) replaced with 1x1 PNG; diagnostic condition with different intrinsic image dimensions',
        'startup-flow': 'general-runner sequence: home + fonts + 800ms → measured anchor → open → next photo → close; no networkidle/background decode wait' } },
    browserVersion: browser ? browser.version() : null, gallerySources, errors, records }, null, 2));
  await browser?.close();
  servers.forEach(server => server.kill());
}
