import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';

// Comparable cold local contexts; no external traffic. This is NOT a real tag.js benchmark.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const baseline = path.resolve(process.env.ANALYTICS_BASELINE_DIST || '');
const candidate = path.resolve(process.env.ANALYTICS_DIST || 'dist');
assert.ok(process.env.ANALYTICS_BASELINE_DIST, 'Set the independently built baseline dist');
const output = process.env.ANALYTICS_LOAD_OUTPUT || '/tmp/ee-analytics-load.json';
const origin = 'https://www.energoeffekt-rostov.ru';
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, headless: true, args:['--no-sandbox','--disable-dev-shm-usage'] });
const results = { environment:'Chromium, intercepted local cold production assets, 390x844, no throttling, same browser; five runs per condition', realLibraryCost:'UNVERIFIED; mock/blocking not equivalent to real library execution', runs:[] };
try {
 for (let repetition=0; repetition<5; repetition++) for (const condition of ['baseline-denied','candidate-denied','candidate-blocked','candidate-mock']) {
   const root = condition.startsWith('baseline') ? baseline : candidate;
   const ctx = await browser.newContext({ viewport:{width:390,height:844},serviceWorkers:'block' });
   let bytes=0,jsBytes=0,jsGzipBytes=0,external=0,requests=0;
   await ctx.addInitScript(condition => {
     localStorage.setItem('ee_cookie_consent','accepted');
     localStorage.setItem('ee_analytics_consent_v1', JSON.stringify({version:1,choice:condition.includes('denied')?'denied':'allowed',at:Date.now()}));
     window.__lastLCP=0;
     new PerformanceObserver(list=>{ for(const entry of list.getEntries()) window.__lastLCP=entry.startTime; }).observe({type:'largest-contentful-paint',buffered:true});
   },condition);
   await ctx.route('**/*',async route=>{
     const url=new URL(route.request().url()); requests++;
     if(url.origin!==origin){external++; if(condition==='candidate-mock'&&url.pathname==='/metrika/tag.js') await route.fulfill({contentType:'application/javascript',body:'window.ym=function(){};'}); else await route.abort(); return;}
     const file=path.resolve(root,url.pathname.slice(1)||'index.html'); assert.ok(file.startsWith(root+path.sep));
     let resolved=file; try { if(!(await fs.stat(file)).isFile())resolved=path.join(root,'index.html'); }catch{resolved=path.join(root,'index.html');}
     const body=await fs.readFile(resolved);bytes+=body.length;
     if(resolved.endsWith('.js')){jsBytes+=body.length;jsGzipBytes+=gzipSync(body).length;}
     await route.fulfill({path:resolved,headers:{'cache-control':'no-store'}});
   });
   const page=await ctx.newPage(); await page.goto(origin+'/'); await page.waitForTimeout(1800);
   const timing=await page.evaluate(()=>{const n=performance.getEntriesByType('navigation')[0];return{domContentLoaded:n.domContentLoadedEventEnd,load:n.loadEventEnd,lcp:window.__lastLCP,fcp:performance.getEntriesByName('first-contentful-paint')[0]?.startTime||0};});
   results.runs.push({condition,repetition,requests,external,bytes,jsBytes,jsGzipBytes,...timing});
   await ctx.close();
 }
 const median = values=>values.sort((a,b)=>a-b)[Math.floor(values.length/2)];
 results.medians={};
 for(const condition of [...new Set(results.runs.map(r=>r.condition))]){
   const group=results.runs.filter(r=>r.condition===condition);
   results.medians[condition]=Object.fromEntries(['requests','external','bytes','jsBytes','jsGzipBytes','domContentLoaded','load','lcp','fcp'].map(key=>[key,median(group.map(r=>r[key]))]));
 }
 await fs.writeFile(output,JSON.stringify(results,null,2)); console.log(JSON.stringify(results.medians,null,2));
}finally{await browser.close();}
