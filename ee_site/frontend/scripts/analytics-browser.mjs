// Production-only host gates are exercised with intercepted URLs. No real leads or analytics.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const dist=path.resolve(process.env.ANALYTICS_DIST||'dist');
const origin='https://www.energoeffekt-rostov.ru';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
try {
 for(const width of [390,1440]) {
  const context=await browser.newContext({viewport:{width,height:900}});
  const calls=[];let vendorLoads=0;const submissions=[];
  await context.exposeBinding('__recordAnalytics',(_,call)=>calls.push(call));
  await context.route('**/*',async route=>{
   const request=route.request(),url=new URL(request.url());
   if(url.hostname==='mc.yandex.ru') return route.fulfill({contentType:'text/javascript',body:'window.ym=(...args)=>window.__recordAnalytics(args);'});
   if(url.hostname==='mod.calltouch.ru') {
    vendorLoads++;
    return route.fulfill({contentType:'text/javascript',body:'window.ct=function(){return {sessionId:12345}};window.ct.loaded=true;'});
   }
   if(url.origin!==origin) return route.abort();
   if(url.pathname==='/api/leads/' && request.method()==='POST') {
    submissions.push(request.postDataBuffer().toString());
    return route.fulfill({status:201,contentType:'application/json',body:'{"id":1}'});
   }
   if(url.pathname==='/api/leads/questionnaire-capabilities/') return route.fulfill({contentType:'application/json',body:'{"version":1,"enabled":false,"products":[]}'});
   const pathname=url.pathname==='/'?'/index.html':url.pathname==='/privacy'?'/privacy.html':url.pathname;
   const file=path.resolve(dist,'.'+pathname);
   if(!file.startsWith(dist+path.sep)) return route.abort();
   try {return await route.fulfill({path:file,body:await fs.readFile(file)});}catch{return route.fulfill({status:404,body:''});}
  });
  const page=await context.newPage();
  try {
   await page.goto(origin+'/?utm_source=yandex');
   await page.waitForFunction(()=>window.ct?.loaded===true);
   await page.waitForFunction(()=>typeof window.ym==='function');
   await page.waitForTimeout(100);
   assert.equal(vendorLoads,1);
   assert.equal(calls.filter(c=>c[1]==='init').length,1);
   assert.equal(calls.find(c=>c[1]==='init')[2].webvisor,true);
   assert.equal(await page.locator('.lead-form.ym-hide-content.ym-disable-keys').count(),1);
   await page.getByRole('button',{name:'Принять',exact:true}).click();
   assert.equal(vendorLoads,1);
   assert.equal(calls.filter(c=>c[1]==='init').length,1);
   const form=page.locator('.lead-form');
   await form.locator('[name=name]').fill('Synthetic Browser');
   await form.locator('[name=phone]').fill('+79990000001');
   await form.locator('[name=consent]').check();
   await form.locator('button[type=submit]').click();
   await page.waitForTimeout(150);
   assert.equal(submissions.length,1);
   assert.ok(submissions[0].includes('name="calltouch_tracking"'));
   assert.ok(submissions[0].includes('"session_id":"12345"'));
   assert.equal(calls.filter(c=>c[1]==='reachGoal'&&c[2]==='lead_success').length,1);
   assert.ok(!JSON.stringify(calls).includes('Synthetic Browser'));
   assert.ok(!JSON.stringify(calls).includes('79990000001'));
   await page.getByRole('link',{name:'Настройки cookies',exact:true}).click();
   await page.getByRole('button',{name:'Без аналитики',exact:true}).click();
   await page.waitForLoadState('load');
   assert.equal(vendorLoads,1);
   await page.reload();
   assert.equal(vendorLoads,1);
   assert.equal(calls.filter(c=>c[1]==='init').length,1);
   await page.getByRole('link',{name:'Главная',exact:true}).first().click().catch(()=>page.goto(origin));
   const deniedForm=page.locator('.lead-form');
   await deniedForm.locator('[name=name]').fill('Denied Browser');
   await deniedForm.locator('[name=phone]').fill('+79990000002');
   await deniedForm.locator('[name=consent]').check();
   await deniedForm.locator('button[type=submit]').click();
   await page.waitForTimeout(150);
   assert.equal(submissions.length,2);
   assert.ok(!submissions[1].includes('name="calltouch_tracking"'));
   assert.equal(calls.filter(c=>c[1]==='reachGoal'&&c[2]==='lead_success').length,1);
   console.log(`PASS ${width}px: autostart, Webvisor, protected forms, one confirmed goal, session export, denial and reload`);
  } finally {await context.close();}
 }
} finally {await browser.close();}
