// All external requests are intercepted. No production counters or Calltouch APIs are contacted.
import process from 'node:process';
const {chromium} = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');import assert from 'node:assert/strict';
const base=process.env.CALLTOUCH_TEST_BASE || 'http://127.0.0.1:8762';
const b=await chromium.launch({executablePath:process.env.CHROME_PATH || '/usr/bin/chromium',args:['--no-sandbox']});const results=[];
for(const scenario of ['success','several-OL','invalid','duplicate','denied','revoke','blocked']){
 const c=await b.newContext({viewport:{width:1440,height:1000}});let visits=0,registrations=[],leads=0,held;
 await c.addInitScript(({scenario})=>{if(window!==top)return;
  localStorage.setItem('ee_analytics_consent_v1',JSON.stringify({version:1,choice:'allowed',at:Date.now()}));
  if(scenario==='several-OL')sessionStorage.setItem('ee-lead-draft-v1',JSON.stringify({version:1,changedAt:Date.now(),fields:{name:'Synthetic',company_name:'Dev',phone:'+79990000000',email:'test@example.invalid',description:'Never export this text',consent:false},topic:'Водопроводные насосные станции',sourcePage:'/solutions/vns',started:true,questionnaires:{vns:{enabled:true,expanded:true,sheet:'technical',scroll:{},answers:{technical:{flow:'12',head:'10'}}},pns:{enabled:true,expanded:true,sheet:'technical',scroll:{},answers:{technical:{flow:'12',head:'10',jockey:'Нет'}}}},submission:null,hadFiles:false}));
 },{scenario});
 await c.route('**/*',async r=>{
  const u=new URL(r.request().url());
  if(u.hostname==='mod.calltouch.ru'){visits++;return scenario==='blocked'?r.abort():r.fulfill({contentType:'text/javascript',body:'window.ct = function(){return {sessionId:"stub_session"}};'});}
  if(u.hostname==='api.calltouch.ru'){registrations.push(Object.fromEntries(new URLSearchParams(r.request().postData())));return scenario==='blocked'?r.abort():r.fulfill({json:{requestId:1},headers:{'Access-Control-Allow-Origin':'*'}});}
  if(u.hostname==='mc.yandex.ru')return r.fulfill({contentType:'text/javascript',body:'window.ym=function(){};'});
  if(u.pathname==='/api/leads/questionnaire-capabilities/')return r.fulfill({json:{version:1,enabled:true,products:['vns','pns','bmk','btp']}});
  if(u.pathname==='/api/leads/'){
   leads++;const data={id:1,...(scenario==='duplicate'?{duplicate:true}:{}),...(scenario==='several-OL'?{questionnaires:{version:1,products:['vns','pns']}}:{})};
   if(scenario==='revoke')await new Promise(resolve=>held=resolve);
   return r.fulfill({status:scenario==='duplicate'?200:201,json:data});
  }
  if(u.hostname==='www.energoeffekt-rostov.ru')return r.fulfill({response:await r.fetch({url:base+u.pathname+u.search})});
  return r.abort();
 });
 const p=await c.newPage();p.setDefaultTimeout(10000);p.on('pageerror',e=>{throw e;});await p.goto('https://www.energoeffekt-rostov.ru'+(scenario==='several-OL'?'/solutions/vns':'/'));await p.locator('.cookie-banner').waitFor();assert.equal(visits,0,'old Metrika consent must not start Calltouch');
 await p.getByRole('button',{name:scenario==='denied'?'Без аналитики':'Разрешить аналитику',exact:true}).click();
 if(scenario!=='denied')await p.waitForFunction(()=>[...document.querySelectorAll('iframe')].some(e=>e.title.includes('Calltouch')));
 await p.waitForTimeout(150);
 await p.locator('.lead-form[aria-busy=false]').waitFor();
 if(scenario!=='invalid'){
  await p.locator('input[name=name]').fill('Synthetic');await p.locator('input[name=phone]').fill('+79990000000');await p.locator('input[name=email]').fill('test@example.invalid');await p.locator('textarea[name=description]').fill('Never export this text');await p.locator('input[name=consent]').check();
 }
 await p.locator('.lead-form button[type=submit]').click();
 if(scenario==='revoke'){
  for(let i=0;!held&&i<30;i++)await p.waitForTimeout(50);
  assert.ok(held);await p.locator('.footer__analytics-settings').click();await p.getByRole('button',{name:'Без аналитики',exact:true}).click();held();
 }
 if(scenario!=='invalid')await p.getByText('Заявка отправлена. Мы свяжемся с вами после обработки обращения.',{exact:true}).waitFor();else await p.waitForTimeout(200);
 await p.waitForTimeout(200);const expected=['success','several-OL','blocked'].includes(scenario)?1:0;
 assert.equal(registrations.length,expected,scenario);assert.equal(leads,scenario==='invalid'?0:1);
 for(const body of registrations){assert.deepEqual(Object.keys(body).sort(),scenario==='blocked'?['requestUrl','subject']:['requestUrl','sessionId','subject']);assert.ok(!JSON.stringify(body).includes('Never export'));}
 if(scenario==='denied')assert.equal(visits,0);if(scenario==='revoke')assert.equal(await p.locator('iframe[title*="Calltouch"]').count(),0);
 results.push({scenario,visits,leads,registrations:registrations.length,result:'passed'});await c.close();
}
console.log(JSON.stringify(results,null,2));await b.close();console.log('All 7 Calltouch browser scenarios passed; all external traffic stubbed');
