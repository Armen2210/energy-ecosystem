import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const toolsDir = process.env.QUALITY_TOOLS_DIR;
const lighthouse = (await import(toolsDir ? pathToFileURL(path.join(toolsDir,'lighthouse/core/index.js')).href : 'lighthouse')).default;
const launcher = await import(toolsDir ? pathToFileURL(path.join(toolsDir,'chrome-launcher/dist/index.js')).href : 'chrome-launcher');
const out = process.env.QUALITY_OUTPUT || 'quality-results';
await fs.mkdir(out, { recursive: true });
const chrome = await launcher.launch({ chromePath: process.env.CHROME_PATH || undefined,
  chromeFlags: ['--headless','--no-sandbox','--disable-dev-shm-usage'] });
try {
  for (const mode of ['mobile','desktop']) for (const [name,route] of [['home','/'],['btp','/solutions/btp'],['cases','/cases'],['contacts','/contacts']]) for (let run=1;run<=3;run++) {
    const config = mode === 'desktop' ? {extends:'lighthouse:default',settings:{formFactor:'desktop',screenEmulation:{mobile:false,width:1440,height:900,deviceScaleFactor:1,disabled:false},throttling:{rttMs:40,throughputKbps:10240,cpuSlowdownMultiplier:1,requestLatencyMs:0,downloadThroughputKbps:0,uploadThroughputKbps:0}}} : undefined;
    const result = await lighthouse((process.env.QUALITY_URL || 'http://127.0.0.1:4175')+route,
      {port:chrome.port,onlyCategories:['performance'],output:'json',logLevel:'error'},config);
    await fs.writeFile(path.join(out,`${mode}-${name}-${run}.json`),result.report);
    console.log(mode,name,run,Object.fromEntries(['largest-contentful-paint','cumulative-layout-shift','first-contentful-paint','total-blocking-time','total-byte-weight'].map(k=>[k,result.lhr.audits[k]?.numericValue])));
  }
} finally { await chrome.kill(); }
