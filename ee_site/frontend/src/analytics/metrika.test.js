import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installMetrika } from './metrika.js';

function platform() {
  const calls=[];const scripts=[];let ready=0,failed=0;
  const win={ym:(...args)=>calls.push(args)};
  const doc={createElement:()=>({remove(){this.removed=true;}}),head:{append:s=>scripts.push(s)}};
  const tracker=installMetrika(win,doc,{ready:()=>ready++,failed:()=>failed++});
  return {win,tracker,calls,script:scripts[0],ready:()=>ready,failed:()=>failed};
}
test('main document counter enables Webvisor; hits and goals use the same counter',()=>{
  const p=platform();assert.equal(p.calls.length,0);p.script.onload();
  assert.equal(p.ready(),1);assert.equal(p.calls[0][0],113583806);
  assert.equal(p.calls[0][2].webvisor,true);assert.equal(p.calls[0][2].defer,true);
  p.tracker.send({type:'hit',url:'https://www.energoeffekt-rostov.ru/',title:'Home',referrer:''});
  p.tracker.send({type:'goal',name:'lead_success',params:{product:'bmk'}});
  assert.deepEqual(p.calls.map(c=>c[1]),['init','hit','reachGoal']);
});
test('denial destructs initialized counter and refuses later commands',()=>{
  const p=platform();p.script.onload();p.tracker.stop();
  assert.equal(p.calls.at(-1)[1],'destruct');assert.equal(p.script.removed,true);
  assert.equal(p.tracker.send({type:'goal',name:'lead_success'}),false);
});
test('late library load cannot initialize a counter stopped during loading',()=>{
  const p=platform();const late=p.script.onload;p.tracker.stop();late();
  assert.equal(p.calls.length,0);assert.equal(p.ready(),0);
});
test('blocked library reports failure and never reports readiness',()=>{
  const p=platform();p.script.onerror();assert.equal(p.failed(),1);assert.equal(p.ready(),0);
});
