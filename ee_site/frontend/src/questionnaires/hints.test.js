import test from 'node:test';
import assert from 'node:assert/strict';
import { hints, fieldHint } from './hints.js';
import { contract } from './domain.js';
test('placeholder hints reference real numeric fields across all questionnaires',()=>{
  const products=new Set();
  for(const path of Object.keys(hints)){
    const [product,sheet,key]=path.split('.');products.add(product);
    const field=contract.products[product].sheets.find(s=>s.key===sheet)?.fields.find(f=>f.key===key);
    assert.equal(field?.type,'number',path);assert.ok(fieldHint(path).length>10);
  }
  assert.equal(products.size,4);assert.equal(fieldHint('unknown'),undefined);
});
