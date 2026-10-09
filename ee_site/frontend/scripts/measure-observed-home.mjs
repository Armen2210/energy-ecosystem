// Applied CDP throttling, reported separately from Lighthouse's simulated model.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const [before,after] = process.argv.slice(2);
if (!before || !after) throw new Error('Pass BEFORE_DIST and AFTER_DIST directories');
const out=process.env.QUALITY_OUTPUT || 'quality-results';
await fs.mkdir(out,{recursive:true});
const records=[];
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH || undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
try {
  for (const [phase,dir,port] of [['before',before,4176],['after',after,4177]]) {
    const server=spawn(process.env.QUALITY_PYTHON || 'python',[path.join(import.meta.dirname,'serve-quality.py'),dir,'--port',String(port)],{stdio:'ignore'});
    try {
      let ready=false;
      for (let attempt=0;attempt<30;attempt++) {
        try {if((await fetch(`http://127.0.0.1:${port}/`)).ok){ready=true;break;}} catch { /* Local server startup. */ }
        await new Promise(resolve=>setTimeout(resolve,100));
      }
      assert.ok(ready,'server ready');
      for(const mode of ['mobile','desktop']) for(let run=1;run<=3;run++) {
        const mobile=mode==='mobile';
        const context=await browser.newContext({viewport:{width:mobile?412:1440,height:mobile?823:900},deviceScaleFactor:mobile?1.75:1,isMobile:mobile,hasTouch:mobile});
        const page=await context.newPage();
        await page.addInitScript(()=>{
          window.observedQuality={lcp:[],shifts:[],tasks:[]};
          new PerformanceObserver(list=>window.observedQuality.lcp.push(...list.getEntries().map(e=>({time:e.startTime,url:e.url,size:e.size})))).observe({type:'largest-contentful-paint',buffered:true});
          new PerformanceObserver(list=>window.observedQuality.shifts.push(...list.getEntries().filter(e=>!e.hadRecentInput).map(e=>({value:e.value,time:e.startTime})))).observe({type:'layout-shift',buffered:true});
          new PerformanceObserver(list=>window.observedQuality.tasks.push(...list.getEntries().map(e=>({time:e.startTime,duration:e.duration})))).observe({type:'longtask',buffered:true});
        });
        const client=await context.newCDPSession(page);
        await client.send('Network.enable');
        await client.send('Network.setCacheDisabled',{cacheDisabled:true});
        await client.send('Emulation.setCPUThrottlingRate',{rate:mobile?4:1});
        await client.send('Network.emulateNetworkConditions',{offline:false,latency:mobile?150:40,downloadThroughput:(mobile?1638.4:10240)*1024/8,uploadThroughput:(mobile?675:10240)*1024/8,connectionType:mobile?'cellular4g':'ethernet'});
        await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
        await page.waitForTimeout(15000);
        const result=await page.evaluate(()=>({...window.observedQuality,fcp:performance.getEntriesByName('first-contentful-paint')[0]?.startTime,elapsed:performance.now(),fontsLoaded:document.fonts.status==='loaded',heroLoaded:!!document.querySelector('.hero__visual img')?.naturalWidth}));
        assert.ok(result.fontsLoaded && result.heroLoaded && result.lcp.length,'hero/fonts loaded; LCP observed');
        assert.ok(result.lcp.at(-1).time < result.elapsed-1500,'LCP stable at end of observation window');
        records.push({phase,mode,run,...result});
        console.log(phase,mode,run,'LCP',result.lcp.at(-1).time,'FCP',result.fcp);
        await context.close();
      }
    } finally {server.kill();}
  }
} finally {
  await fs.writeFile(path.join(out,'observed-home.json'),JSON.stringify(records,null,2));
  await browser.close();
}
