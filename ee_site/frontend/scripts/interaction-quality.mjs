import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { installInteractionTiming, measureInteraction } from './interaction-timing.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const out = process.env.QUALITY_OUTPUT || 'quality-results';
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--no-sandbox','--disable-dev-shm-usage'] });
const records = [];
const base = process.env.QUALITY_URL || 'http://127.0.0.1:4175';
if (new URL(base).hostname !== '127.0.0.1') throw new Error('Local 127.0.0.1 builds only');
try {
  for (const [mode,width] of [['mobile',390],['desktop',1440]]) for (let run=1;run<=3;run++) {
    const context = await browser.newContext({ viewport:{width,height:900},deviceScaleFactor:1 });
    const page = await context.newPage();
    await page.addInitScript(installInteractionTiming);
    await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
    await page.route('**/api/leads/',route=>route.fulfill({status:201,contentType:'application/json',body:'{"id":1}'}));
    await page.goto(base+'/');
    await page.locator('.cookie-banner button').click();
    await page.evaluate(()=>document.fonts.ready);
    await page.waitForTimeout(800);
    async function measure(name, selector, predicate) {
      records.push({mode,run,...await measureInteraction(page,{name,selector,predicate})});
    }
    await measure('header-anchor','.nav a[href="/#products"]',`location.hash==='#products'`);
    await measure('case-open','[data-case-slug]',`!!document.querySelector('.case-modal__close')`);
    await measure('gallery-next','.case-modal__gallery-button--next',`document.querySelector('.case-modal__gallery-meta span').textContent.startsWith('2 /')`);
    await measure('case-close','.case-modal__close',`!document.querySelector('.case-modal__close')`);
    await page.goto(base+'/solutions/btp');
    await measure('entity-switch','.entity-switcher__item:nth-of-type(3)',`location.pathname==='/solutions/vns'`);
    await measure('topic-open','.topic-select__button',`!!document.querySelector('.topic-select__menu')`);
    await page.keyboard.press('Escape');
    await page.locator('input[type=file]').setInputFiles({name:'document.txt',mimeType:'text/plain',buffer:Buffer.from('test')});
    await measure('documents-open','.file-select__toggle',`!!document.querySelector('.file-select__menu')`);
    await context.close();
  }
} finally {
  await fs.writeFile(path.join(out,'interactions.json'),JSON.stringify(records,null,2));
  await browser.close();
}
