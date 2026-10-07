import fs from 'node:fs/promises';
import path from 'node:path';
const [before, after] = process.argv.slice(2);
if (!before || !after) throw new Error('Usage: node scripts/summarize-quality.mjs BEFORE_DIRECTORY AFTER_DIRECTORY');
const median = values => [...values].sort((a,b)=>a-b)[Math.floor(values.length/2)];
const keys = ['largest-contentful-paint','cumulative-layout-shift','first-contentful-paint','total-blocking-time','total-byte-weight'];
const rows = [];
for (const mode of ['mobile','desktop']) for (const page of ['home','btp','cases','contacts']) {
  const row={mode,page};
  for (const [phase,dir] of [['before',before],['after',after]]) {
    const runs=await Promise.all([1,2,3].map(async run=>JSON.parse(await fs.readFile(path.join(dir,`${mode}-${page}-${run}.json`),'utf8'))));
    for (const run of runs) if (run.runtimeError) throw new Error(JSON.stringify(run.runtimeError));
    row[phase]=Object.fromEntries(keys.map(key=>[key,median(runs.map(run=>{
      const value=run.audits[key].numericValue;
      if (!Number.isFinite(value)) throw new Error(`Missing metric: ${phase}/${mode}/${page}/${key}`);
      return value;
    }))]));
    row[phase].longTaskCount=median(runs.map(run=>run.audits['long-tasks'].details.items.length));
    row[phase].longestTaskMs=median(runs.map(run=>Math.max(0,...run.audits['long-tasks'].details.items.map(item=>item.duration))));
  }
  rows.push(row);
}
console.log(JSON.stringify(rows,null,2));
