// Meaningful regression test for action scoping, using genuine browser input.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { installInteractionTiming, measureInteraction } from './interaction-timing.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined,
  args: ['--no-sandbox', '--disable-dev-shm-usage'] });
try {
  const page = await browser.newPage();
  await page.goto('about:blank');
  await page.evaluate(installInteractionTiming);
  await page.evaluate(() => {
    document.body.innerHTML = '<button id="earlier">Earlier</button><button id="measured">Measured</button>';
    const block = () => { const end = performance.now() + 75; while (performance.now() < end) { /* controlled task */ } };
    document.querySelector('#earlier').onclick = block;
    document.querySelector('#measured').onclick = () => {
      block(); window.done = true; document.querySelector('#measured').textContent = 'Done';
      // A task after the rAF confirmation must be excluded even if delivered later.
      setTimeout(block, 150);
    };
  });
  await page.locator('#earlier').click();
  await page.waitForTimeout(350);
  const result = await measureInteraction(page, { name: 'measured', selector: '#measured', predicate: 'window.done === true' });
  assert.ok(result.eventEntries.length > 0, 'genuine slow interaction emits Event Timing');
  assert.ok(result.interactionIds.length === 1, 'only measured interaction ID');
  assert.ok(result.longTasks.length >= 1, 'measured blocking task included');
  assert.ok(result.excludedLongTaskCount >= 1, 'post-confirmation task excluded');
  for (const e of result.eventEntries) assert.ok(e.startTime >= result.window.startTime - 0.01 && e.startTime <= result.window.endTime);
  for (const e of result.longTasks) assert.ok(e.overlapMs > 0 && e.startTime < result.window.endTime && e.startTime + e.duration > result.window.startTime);
  assert.ok(result.domStateConfirmationMs >= 70);
  assert.ok(result.domMutationConfirmationMs >= 70 && result.domMutationConfirmationMs <= result.domStateConfirmationMs);
  assert.ok(result.rafSamplingDelayMs >= 0);
  console.log(JSON.stringify({ passed: true, result }, null, 2));
} finally { await browser.close(); }
