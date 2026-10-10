import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import process from 'node:process';
import { randomUUID } from 'node:crypto';
import { safeParams } from '../src/analytics/policy.js';

// No network fallback: all public-looking URLs below are intercepted before TLS.
// Playwright is an external test tool, not an application dependency.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const dist = path.resolve(process.env.ANALYTICS_DIST || 'dist');
const out = path.resolve(process.env.ANALYTICS_OUTPUT || '/tmp/ee-analytics-browser');
const api = process.env.ANALYTICS_TEST_API || 'http://127.0.0.1:8011';
assert.match(api, /^http:\/\/127\.0\.0\.1:\d+$/);
const origin = 'https://www.energoeffekt-rostov.ru';
const mock = `
window.__mockCalls=[];
window.ym=function(id, method, ...args) {
 const data={id,method,args}; window.__mockCalls.push(data);
 window.__recordAnalytics(data);
 if(method!=='destruct') fetch('https://mc.yandex.ru/watch/'+id+'?mock='+encodeURIComponent(JSON.stringify(data))).catch(()=>{});
 if(method==='destruct') window.__mockStopped=true;
};`;
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const results = { environment: 'local production build; public URLs intercepted; isolated loopback Django API', checks: [], network: [], calls: [], api: [], errors: [] };
const contexts = [];
function pass(label) { results.checks.push(label); console.log('PASS', label); }
async function scenario({ width = 1440, seed = {}, failStorage = false, tagDelay = 0, blockTag = false, realTag = false, url = '/', hostname = 'www.energoeffekt-rostov.ru', fixedUUID = null, referrer = null } = {}) {
 const ctx = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block' }); contexts.push(ctx);
 const calls = [], network = [], responses = []; let mode = 'real'; let lost = false;
 await ctx.exposeBinding('__recordAnalytics', (_, data) => { calls.push(data); results.calls.push(data); });
 await ctx.addInitScript(({ seed, failStorage, fixedUUID }) => {
   if (window === window.top) {
     if (fixedUUID) crypto.randomUUID = () => fixedUUID;
     for (const [key,value] of Object.entries(seed)) localStorage.setItem(key,value);
     if (failStorage) Object.defineProperty(window, 'localStorage', { get() { throw Error('Storage disabled'); } });
   }
 }, { seed, failStorage, fixedUUID });
 await ctx.route('**/*', async route => {
   const request = route.request(), u = new URL(request.url());
   if (u.hostname === 'mc.yandex.ru' && u.pathname === '/metrika/tag.js') {
     network.push({ type: 'script', url: request.url() }); results.network.push({ type: 'script', url: request.url() });
     if (blockTag) { await route.abort(); return; }
     if (tagDelay) await new Promise(resolve => setTimeout(resolve, tagDelay));
     await route.fulfill({ contentType: 'application/javascript', body: realTag ? await fs.readFile(process.env.METRICA_TAG_FILE, 'utf8') : mock }); return;
   }
   if (u.hostname === hostname) {
     if (u.pathname === '/api/leads/' && request.method() === 'POST') {
       const body = request.postDataBuffer();
       const record = { mode, submission: body.toString().match(/name="submission_id"\r\n\r\n([^\r]+)/)?.[1], hasCampaign: body.includes(Buffer.from('name="campaign_attribution"')), hasDirection: body.includes(Buffer.from('name="direction_slug"')) };
       results.api.push(record);
       if (mode === 'network') { await route.abort(); return; }
       if (mode === 'html') { await route.fulfill({ status: 201, contentType: 'text/html', body: '<html>wrong response</html>' }); return; }
       if (mode !== 'real' && mode !== 'lose-first') { await route.fulfill({ status: Number(mode), contentType: 'application/json', body: JSON.stringify({ detail: 'Synthetic error' }) }); return; }
       const response = await ctx.request.fetch(api + '/api/leads/', { method: 'POST', headers: { 'content-type': request.headers()['content-type'] }, data: body });
       record.status = response.status(); record.response = await response.json(); responses.push(record);
       if (mode === 'lose-first' && !lost) { lost = true; await route.abort(); return; }
       await route.fulfill({ status: response.status(), contentType: 'application/json', body: JSON.stringify(record.response) }); return;
     }
     if (request.method() !== 'GET' && request.method() !== 'HEAD') { await route.abort(); return; }
     const relative = decodeURIComponent(u.pathname).replace(/^\/+/, '');
     const target = path.resolve(dist, relative || 'index.html');
     assert.ok(target.startsWith(dist + path.sep));
     let file = target;
     try { if (!(await fs.stat(file)).isFile()) file = path.join(dist, 'index.html'); } catch { file = path.join(dist, 'index.html'); }
     await route.fulfill({ path: file, headers: { 'cache-control': 'no-store' } }); return;
   }
   // Capture the real library payload without ever delivering it to Yandex.
   const item = { type: 'blocked-external', method: request.method(), url: request.url(), body: request.postData(), referer: request.headers().referer || '' };
   network.push(item); results.network.push(item);
   await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
 });
 const page = await ctx.newPage(); page.on('pageerror', e => results.errors.push(e.message));
 await page.goto(`https://${hostname}${url}`, referrer ? { referer:referrer } : {}); await page.waitForSelector('footer');
 return { ctx, page, calls, network, responses, mode(value) { mode = value; }, async settle() { await page.waitForTimeout(850); }, goals: () => calls.filter(c => c.method === 'reachGoal'), hits: () => calls.filter(c => c.method === 'hit') };
}
const accept = async s => { await s.page.getByRole('button', { name: 'Разрешить аналитику', exact: true }).click(); await s.page.waitForFunction(() => { const f=document.querySelector('iframe'); return f?.contentWindow?.__mockCalls?.some(c=>c.method==='hit'); }); };
const settings = async s => { await s.page.getByRole('button', { name: 'Настройки cookies', exact: true }).click(); await s.page.waitForFunction(() => document.activeElement?.textContent === 'Разрешить аналитику'); };
const deny = async s => { await s.page.getByRole('button', { name: 'Без аналитики', exact: true }).click(); await s.settle(); };
const form = s => s.page.locator('.lead-form');
const fill = async (s, name='Synthetic person') => {
 await form(s).locator('[name=name]').fill(name); await form(s).locator('[name=phone]').fill('+70000000000'); await form(s).locator('[name=consent]').check();
};
const send = async s => { await form(s).getByRole('button', { name: 'Отправить заявку', exact: true }).click(); await s.page.waitForFunction(() => document.querySelector('.lead-form__status')); await s.settle(); };
try {
 if (process.env.ANALYTICS_EXPECT_DISABLED === 'true') {
  const off=await scenario({url:'/?utm_source=yandex',seed:{ee_analytics_consent_v1:JSON.stringify({version:1,choice:'allowed',at:Date.now()})}}); await off.settle();
  assert.equal(await off.page.locator('iframe').count(),0); assert.equal(off.network.length,0); assert.equal(await off.page.evaluate(()=>localStorage.getItem('ee_campaign_v1')),null); pass('default build flag off: no library, requests or attribution even with saved permission on allowed hostname');
 } else if (process.env.ANALYTICS_REAL_ONLY !== 'true') {
 const basic = await scenario({ url: '/?utm_source=yandex&utm_medium=cpc&utm_campaign=btp_rostov&email=private_marker#private_fragment', seed: { ee_cookie_consent: 'accepted' } });
 await basic.settle(); assert.equal(basic.network.length, 0); assert.equal(await basic.page.locator('iframe').count(), 0);
 assert.equal(await basic.page.evaluate(() => localStorage.getItem('ee_campaign_v1')), null);
 pass('legacy accepted is not analytics consent; zero script, requests or campaign storage before choice');
 await fill(basic); await form(basic).locator('[type=file]').setInputFiles({ name:'secret-document.txt', mimeType:'text/plain', buffer:Buffer.from('private document contents') });
 await deny(basic); assert.equal(basic.network.length, 0); assert.equal(await form(basic).locator('[name=name]').inputValue(), 'Synthetic person');
 pass('denial keeps fields and selected documents, navigation and form available');
 await settings(basic); await basic.page.keyboard.press('Enter'); await basic.page.waitForFunction(() => document.querySelector('iframe')?.contentWindow?.__mockCalls?.some(c=>c.method==='hit'));
 assert.equal(basic.calls.filter(c=>c.method==='init').length,1); assert.equal(basic.hits().length,1);
 assert.match(basic.hits()[0].args[0], /utm_campaign=btp_rostov/); assert.doesNotMatch(basic.hits()[0].args[0], /private_marker|private_fragment|email=/);
 pass('keyboard settings/allow: one init, one filtered initial view with valid campaign');
 await basic.page.locator('a[href="#products"]').first().click(); await basic.settle(); assert.equal(basic.hits().length,1);
 await basic.page.locator('a[href="/solutions/btp"]').first().click(); await basic.settle();
 assert.equal(basic.hits().length,2); assert.equal(basic.hits()[1].args[0],origin+'/solutions/btp'); assert.match(basic.hits()[1].args[1].title,/теплов|БТП/i);
 await basic.page.goBack(); await basic.settle(); await basic.page.goForward(); await basic.settle(); assert.equal(basic.hits().length,4);
 pass('anchors ignored; SPA transition/title and Back/Forward once each; later hit has no entry UTM');
 await settings(basic); await deny(basic); const count=basic.network.length; await basic.page.reload(); await basic.settle();
 assert.equal(await basic.page.locator('iframe').count(),0); assert.equal(basic.network.length,count);
 pass('revoke calls destruct, removes context; reload remains denied, no further requests');

 const mobile = await scenario({ width:360 });
 assert.equal(await mobile.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true);
 for (const label of ['Разрешить аналитику','Без аналитики']) { const box=await mobile.page.getByRole('button',{name:label,exact:true}).boundingBox(); assert.ok(box.x>=0 && box.x+box.width<=360); }
 await mobile.page.screenshot({ path:path.join(out,'banner-360.png'),fullPage:false }); await accept(mobile);
 pass('360px banner fits viewport; accessible named actions and keyboard settings');

 const contacts = await scenario({ url:'/contacts?utm_source=yandex#unknown' }); await accept(contacts);
 assert.equal(contacts.hits().length,1); assert.equal(new URL(contacts.page.url()).pathname,'/'); assert.equal(new URL(contacts.page.url()).hash,'#contacts');
 assert.match(contacts.hits()[0].args[0],/\/?utm_source=yandex/);
 pass('/contacts normalized once with valid campaign retained, no fragment exported');

 const cases = await scenario({ url:'/cases' }); await accept(cases);
 await cases.page.locator('a[data-case-slug="btp-food-production"]').click(); await cases.settle();
 assert.equal(cases.hits().length,1); assert.equal(cases.goals().filter(c=>c.args[0]==='case_open').length,1);
 await cases.page.keyboard.press('Escape'); await cases.settle(); assert.equal(cases.hits().length,1);
 await cases.page.goto(origin+'/cases/btp-food-production'); await cases.page.waitForFunction(()=>document.querySelector('iframe')?.contentWindow?.__mockCalls?.some(c=>c.method==='hit'));
 assert.equal(cases.hits().length,2); assert.equal(cases.goals().filter(c=>c.args[0]==='case_open').length,1);
 pass('case modal one case_open without page hit; close no hit; direct case ordinary view');

 const retry = await scenario({ url:'/solutions/btp?utm_source=yandex&utm_campaign=btp_rostov' }); await accept(retry); await fill(retry);
 await form(retry).locator('[type=file]').setInputFiles({ name:'plan.txt',mimeType:'text/plain',buffer:Buffer.from('synthetic plan') });
 await retry.settle();
 assert.equal(retry.goals().filter(c=>c.args[0]==='lead_form_start').length,1);
 assert.equal(retry.goals().filter(c=>c.args[0]==='document_selected').length,1);
 retry.mode('lose-first'); await send(retry); assert.equal(retry.goals().filter(c=>c.args[0]==='lead_success').length,0);
 assert.equal(await form(retry).locator('[name=name]').inputValue(),'Synthetic person');
 const first=retry.responses[0]; assert.equal(first.status,201); assert.ok(first.hasCampaign && first.hasDirection);
 await send(retry); const duplicate=retry.responses[1]; assert.equal(duplicate.status,200); assert.equal(first.submission,duplicate.submission);
 assert.equal(retry.goals().filter(c=>c.args[0]==='lead_success').length,1);
 assert.equal(await form(retry).locator('[name=name]').inputValue(),'');
 pass('real isolated API: lost 201 then confirmed duplicate 200, stable id, retained file, first success goal');
 await fill(retry,'Synthetic second person'); retry.mode('real'); await send(retry);
 assert.equal(retry.goals().filter(c=>c.args[0]==='lead_success').length,2);
 pass('new submission is a separate conversion');

 const dedup = await scenario({url:'/solutions/btp', fixedUUID:randomUUID()}); await accept(dedup); await fill(dedup); await send(dedup);
 await fill(dedup); await send(dedup); assert.deepEqual(dedup.responses.map(r=>r.status),[201,200]); assert.equal(dedup.goals().filter(c=>c.args[0]==='lead_success').length,1);
 pass('real API 201 then identical submission confirmed 200: one lead_success, internal id not exported');

 const recover = await scenario({url:'/solutions/btp?utm_source=yandex'}); await accept(recover); await fill(recover); recover.mode('lose-first'); await send(recover);
 const recoveredFirst = recover.responses[0]; await recover.page.goto(origin+'/solutions/btp?utm_source=contractor');
 await recover.page.waitForFunction(()=>document.querySelector('iframe')?.contentWindow?.__mockCalls?.some(c=>c.method==='hit'));
 await fill(recover); await send(recover); assert.equal(recover.responses[1].status,200); assert.equal(recover.responses[1].submission,recoveredFirst.submission);
 assert.equal(recover.goals().filter(c=>c.args[0]==='lead_success').length,1);
 pass('lost response + reload/new campaign: restored technical UUID, stable snapshot, duplicate 200 and first confirmation goal');
 const revokeRetry = await scenario({url:'/solutions/btp?utm_source=yandex'}); await accept(revokeRetry); await fill(revokeRetry); revokeRetry.mode('lose-first'); await send(revokeRetry);
 const saved = revokeRetry.responses[0]; await settings(revokeRetry); await deny(revokeRetry); await revokeRetry.page.reload(); await fill(revokeRetry); await send(revokeRetry);
 assert.equal(revokeRetry.responses[1].status,200); assert.equal(revokeRetry.responses[1].submission,saved.submission); assert.equal(revokeRetry.responses[1].hasCampaign,false);
 assert.equal(revokeRetry.goals().filter(c=>c.args[0]==='lead_success').length,0);
 pass('revoke + reload + retry: same UUID, removed optional metadata, duplicate record, no goal');

 const errors = await scenario({url:'/services/design'}); await accept(errors); await fill(errors);
 for (const mode of ['400','409','413','429','500','html','network']) {
   errors.mode(mode); await send(errors); assert.equal(errors.goals().filter(c=>c.args[0]==='lead_success').length,0); assert.equal(await form(errors).locator('[name=name]').inputValue(),'Synthetic person');
 }
 pass('400/409/413/429/500, HTML and network failure: no conversion, form retained, no automatic retry');
 await settings(errors); await deny(errors); errors.mode('real'); await send(errors);
 const last=results.api.at(-1); assert.equal(last.hasCampaign,false); assert.equal(last.hasDirection,true);
 await settings(errors); await accept(errors); assert.equal(errors.goals().filter(c=>c.args[0]==='lead_success').length,0);
 pass('denied submission still has operational direction, no campaign; later allow does not replay success');

 const race=await scenario({tagDelay:700}); await race.page.getByRole('button',{name:'Разрешить аналитику',exact:true}).click();
 await race.page.waitForTimeout(100); await settings(race); await deny(race); await race.page.waitForTimeout(850);
 assert.equal(race.calls.filter(c=>c.method==='init').length,0); assert.equal(await race.page.locator('iframe').count(),0);
 await settings(race); await accept(race); assert.equal(race.calls.filter(c=>c.method==='init').length,1); assert.equal(race.hits().length,1);
 pass('revoke during delayed load, late callback cannot restart; reallow fresh context/no backlog');

 const blocked = await scenario({ blockTag:true }); await blocked.page.getByRole('button',{name:'Разрешить аналитику',exact:true}).click(); await blocked.settle(); await fill(blocked); await send(blocked);
 assert.equal(blocked.responses.at(-1).status,201); assert.equal(blocked.goals().length,0);
 pass('blocked script does not break real API submission or falsely acknowledge analytic delivery');
 const broken = await scenario(); await accept(broken); await broken.page.frames().find(f=>f.url().includes('analytics-frame')).evaluate(()=>{ window.ym=()=>{ throw Error('Adapter exception'); }; });
 await fill(broken); await send(broken); assert.equal(broken.responses.at(-1).status,201);
 pass('library exception cannot delay or break successful submission');
 const noStorage=await scenario({failStorage:true}); await accept(noStorage); await fill(noStorage); await settings(noStorage); await deny(noStorage);
 assert.equal(await form(noStorage).locator('[name=name]').inputValue(),'Synthetic person'); await noStorage.page.reload(); await noStorage.settle(); assert.equal(await noStorage.page.locator('iframe').count(),0);
 pass('unavailable storage: explicit session allow works, revoke preserves form, reload safely off');

 const tabs=await scenario(); await accept(tabs); const second=await tabs.ctx.newPage(); await second.goto(origin+'/solutions/btp');
 await second.waitForFunction(()=>document.querySelector('iframe')?.contentWindow?.__mockCalls?.some(c=>c.method==='hit'));
 await fill(tabs); await settings(tabs); await deny(tabs); await second.waitForFunction(()=>!document.querySelector('iframe'));
 assert.equal(await form(tabs).locator('[name=name]').inputValue(),'Synthetic person');
 await settings(tabs); await accept(tabs); await second.waitForFunction(()=>document.querySelector('iframe')?.contentWindow?.__mockCalls?.some(c=>c.method==='hit'));
 pass('cross-tab revoke destroys both counters; current form remains filled');

 const unknown=await scenario({url:'/private_person?email=private_marker#private_fragment'}); await accept(unknown);
 assert.equal(unknown.hits()[0].args[0],origin+'/404'); pass('unknown route is /404, no unknown slug/query/fragment exported');
 const noHost=await scenario({hostname:'staging.example.invalid'}); await noHost.page.getByRole('button',{name:'Разрешить аналитику',exact:true}).click(); await noHost.settle(); assert.equal(noHost.network.length,0); pass('production build on staging hostname never loads real counter');
 assert.doesNotMatch(JSON.stringify(results.calls),/Synthetic person|private_marker|private_fragment|secret-document|private document|\+70000000000|submission_id|lead_id/);
 pass('all adapter/mock network payloads exclude synthetic personal values, documents and ids');
 }
 if (process.env.METRICA_TAG_FILE) {
   const real=await scenario({realTag:true,referrer:'https://example.invalid/private_marker?email=private_marker',url:'/?utm_source=yandex&utm_campaign=btp_rostov&email=private_marker#private_fragment'});
   await real.settle(); assert.equal(real.network.length,0);
   await real.page.evaluate(()=>document.addEventListener('click',event=>{const href=event.target.closest('a')?.getAttribute('href')||'';if(href.startsWith('tel:')||href.startsWith('mailto:'))event.preventDefault();},true));
   await real.page.getByRole('button',{name:'Разрешить аналитику',exact:true}).click(); await real.page.waitForTimeout(2000);
   await real.page.locator('a[href="/solutions/btp"]').first().click(); await real.page.waitForTimeout(1500);
   await real.page.locator('a[href^="tel:"]').first().click();
   await real.page.locator('footer a[href^="mailto:"]').click();
   await fill(real,'private_marker'); await form(real).locator('[type=file]').setInputFiles({name:'secret-document.txt',mimeType:'text/plain',buffer:Buffer.from('private document contents')}); await form(real).locator('[type=file]').setInputFiles({name:'invalid-empty.txt',mimeType:'text/plain',buffer:Buffer.alloc(0)}); await real.settle();
   assert.ok(await form(real).locator('.lead-form__file-error').isVisible()); await send(real);
   await real.page.locator('.footer__ecosystem a[href="/"]').click(); await real.settle();
   await real.page.locator('a[data-analytics-cta="hero"]').click();
   await real.page.locator('a[data-case-slug="btp-food-production"]').first().click(); await real.settle();
   await real.page.locator('[data-analytics-cta="case"]').first().click(); await real.page.waitForTimeout(1500);
   await settings(real); await deny(real); assert.equal(await real.page.evaluate(()=>document.cookie.split(';').some(part=>part.trim().startsWith('_ym_'))),false); const before=real.network.length; await real.page.waitForTimeout(2000); assert.equal(real.network.length,before);
   assert.doesNotMatch(JSON.stringify(real.network),/private_marker|private_fragment|email=|secret-document|private document|\+70000000000|submission_id|lead_id/);
   for(const request of results.api) if(request.submission) assert.equal(JSON.stringify(real.network).includes(request.submission),false);
   const payloads=real.network.filter(item=>item.type==='blocked-external');
   assert.ok(payloads.some(item=>new URL(item.url).searchParams.get('nohit')==='1'),'actual deferred initialization captured');
   assert.ok(payloads.some(item=>new URL(item.url).searchParams.get('page-url')===origin+'/?utm_source=yandex&utm_campaign=btp_rostov'),'actual first hit preserves validated advertising');
   assert.ok(payloads.some(item=>new URL(item.url).searchParams.get('page-url')===origin+'/solutions/btp'),'actual SPA hit is clean');
   for(const goal of ['lead_success','contact_phone_click','contact_email_click','lead_form_start','document_selected','calculation_cta_click','case_open']) assert.ok(payloads.some(item=>decodeURIComponent(item.url+(item.body||'')).includes('/'+goal)),'actual payload for '+goal);
   assert.equal(payloads.filter(item=>new URL(item.url).searchParams.get('page-url')==='goal://www.energoeffekt-rostov.ru/document_selected').length,1,'invalid document must not emit successful selection');
   for(const item of payloads) {
     const query=new URL(item.url).searchParams;
     const decoded=[...query.values(),item.body||''].join(' ');
     assert.doesNotMatch(decoded,/private_marker|private_fragment|secret-document|private document|70000000000|submission_id|lead_id/);
     if(query.has('site-info')) { const params=JSON.parse(query.get('site-info')); assert.deepEqual(params,safeParams(params)); }
     // Current disabled-Webvisor library carries these payloads in query.
     // Fail rather than claiming a future opaque body was inspected.
     assert.ok(item.body===null||item.body==='','unexpected opaque library body requires review');
     const pageUrl=query.get('page-url'),ref=query.get('page-ref');
     if(pageUrl) assert.ok(pageUrl.startsWith(origin+'/')||pageUrl.startsWith('goal://www.energoeffekt-rostov.ru/'),pageUrl);
     if(ref) assert.ok(ref.startsWith(origin+'/')||ref==='https://yandex.ru/'||ref==='https://www.google.com/',ref);
     assert.equal(item.referer,'');
   }
   await settings(real); await real.page.getByRole('button',{name:'Разрешить аналитику',exact:true}).click(); await real.page.waitForTimeout(1500);
   const renewed=real.network.slice(before); assert.ok(renewed.length>0); assert.equal(renewed.some(item=>item.url.includes('goal%3A')||item.url.includes('goal://')),false);
   await settings(real); await deny(real);
   results.realLibrary=real.network; pass('cached real library: actual outgoing requests captured/blocked, PII/referrer filtered; none after revoke, cookies cleared, reallow without goal backlog');
   const delayed=await scenario({realTag:true,tagDelay:1000}); await delayed.page.getByRole('button',{name:'Разрешить аналитику',exact:true}).click(); await delayed.page.waitForTimeout(100); await settings(delayed); await deny(delayed); await delayed.page.waitForTimeout(1200);
   assert.equal(await delayed.page.locator('iframe').count(),0); assert.equal(delayed.network.filter(item=>item.type==='blocked-external').length,0);
   pass('actual library delayed load then revoke: no late counter requests');
   const standalone=await real.ctx.newPage(); const beforeStandalone=real.network.length; await standalone.goto(origin+'/analytics-frame.html'); await standalone.waitForTimeout(350); assert.equal(real.network.length,beforeStandalone);
   pass('opening counter frame directly cannot bypass consent/load library');
 } else results.realLibrary='UNVERIFIED: METRICA_TAG_FILE not provided; mock is not evidence of library payloads';
 assert.deepEqual(results.errors,[]);
} catch (error) {
 results.failure = { message: error.message, pages: contexts.flatMap(ctx=>ctx.pages().map(p=>p.url())) }; throw error;
} finally {
 await fs.writeFile(path.join(out,'browser-results.json'),JSON.stringify(results,null,2));
 for (const ctx of contexts) await ctx.close();
 await browser.close();
}
