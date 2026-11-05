import test from 'node:test';
import assert from 'node:assert/strict';
import { createCalltouch, registrationBody, CALLTOUCH_MODULE } from './calltouch.js';
import { createStore } from './store.js';
const id='11111111-1111-4111-8111-111111111111';
function fixture(overrides={}) {
  const calls=[], events=[];
  const win={location:{protocol:'https:',hostname:'www.energoeffekt-rostov.ru',pathname:'/solutions/bmk'},setTimeout,clearTimeout};
  const api=createCalltouch({window:win,production:true,enabled:'true',configurationApproved:'true',registrationEnabled:'true',fieldsApproved:'true',siteId:'12345',
    startTracker:()=>events.push('start'),stopTracker:()=>events.push('stop'),readSession:()=> 'session_abc',fetch:(url,options)=>{calls.push({url,options});return Promise.resolve({ok:true});},...overrides});
  return {api,calls,events};
}
test('old Metrika permission does not authorize the expanded consent scope',()=>{
  const data=new Map();const storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
  const old=createStore(storage,()=>1000,1);old.choose('allowed');
  const expanded=createStore(storage,()=>1000,2);assert.equal(expanded.consent(),'unknown');expanded.choose('denied');assert.equal(expanded.consent(),'denied');
});
test('project module is from supplied file; payload has an exact minimal allowlist',()=>{
  assert.equal(CALLTOUCH_MODULE,'q0fhtb2e');const body=registrationBody('session_abc','/solutions/bmk?email=secret');
  assert.deepEqual([...body.keys()].sort(),['requestUrl','sessionId','subject']);assert.equal(body.get('requestUrl'),'https://www.energoeffekt-rostov.ru/404');
  assert.equal(registrationBody('bad\nvalue','/').has('sessionId'),false);
});
test('no consent, denial and all disabled/missing configuration gates fail closed',()=>{
  for(const override of [{},{enabled:'false'},{configurationApproved:'false'},{production:false},{siteId:''},{fieldsApproved:'false'},{registrationEnabled:'false'}]){
    const {api,calls}=fixture(override);assert.equal(api.snapshot(),null);api.sync('denied');assert.equal(api.confirmed({id:1},id,api.snapshot()),false);assert.equal(calls.length,0);
    if(Object.keys(override).length){api.sync('allowed');assert.equal(api.confirmed({id:1},id,api.snapshot()),false);api.stop();}
  }
});
test('one confirmed new Lead creates one attempt; repeat and API duplicate do not',()=>{
 const {api,calls,events}=fixture();api.sync('allowed');const snap=api.snapshot();assert.equal(api.confirmed({id:1},id,snap),true);assert.equal(api.confirmed({id:1},id,snap),false);assert.equal(api.confirmed({id:1,duplicate:true},'22222222-2222-4222-8222-222222222222',snap),false);
 assert.equal(calls.length,1);assert.equal(events[0],'start');assert.equal(calls[0].options.body.get('sessionId'),'session_abc');api.stop();
});
test('several questionnaire products still correspond to one saved Lead',()=>{
 const {api,calls}=fixture();api.sync('allowed');api.confirmed({id:7,questionnaires:{version:1,products:['bmk','btp']}},id,api.snapshot());assert.equal(calls.length,1);assert.equal(calls[0].options.body.has('questionnaires'),false);api.stop();
});
test('invalid/unconfirmed Lead and revoked consent never register; re-allow cannot resurrect snapshot',()=>{
 const {api,calls}=fixture();api.sync('allowed');const snap=api.snapshot();assert.equal(api.confirmed(null,id,snap),false);api.sync('denied');assert.equal(api.confirmed({id:1},id,snap),false);api.sync('allowed');assert.equal(api.confirmed({id:1},id,snap),false);assert.equal(calls.length,0);api.stop();
});
test('missing session is allowed, service rejection/throw cannot escape or retry',async()=>{
 for(const send of [()=>Promise.reject(Error('blocked')),()=>{throw Error('blocked');}]){
 const {api}=fixture({readSession:()=>null,fetch:send});api.sync('allowed');const snap=api.snapshot();assert.doesNotThrow(()=>api.confirmed({id:1},id,snap));assert.equal(api.confirmed({id:1},id,snap),false);api.stop();await Promise.resolve();
 }
});
