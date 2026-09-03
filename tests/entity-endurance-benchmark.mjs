import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { createRecallEngine } from '../server/entity-recall.mjs';
import { createEntityStorage } from '../server/entity-storage.mjs';

// Deterministic, API-free endurance test: 100/500/1000 conversational memories.
delete process.env.ENTITY_RECALL_URL;
const recall=createRecallEngine();
const dims=48;
function vector(i){let x=(i+1)*2654435761>>>0;const v=[];for(let d=0;d<dims;d++){x=(1664525*x+1013904223)>>>0;v.push((x/0xffffffff)*2-1)}return v}
function p95(xs){const a=[...xs].sort((a,b)=>a-b);return a[Math.max(0,Math.ceil(a.length*.95)-1)]||0}
const results=[];
for(const size of [100,500,1000]){
  const candidates=[],cache={};
  for(let i=0;i<size;i++){const path=`faits.${i}`,v=vector(i);candidates.push({type:'faits',path,item:{id:`f${i}`,valeur:`souvenir-${i}`,importance:i%97===0?.9:.45}});cache[path]={v}}
  const lat=[],targets=[3,Math.floor(size*.23),Math.floor(size*.51),Math.floor(size*.77),size-2];let hits=0;
  for(const target of targets){const t=performance.now();const found=await recall.search({entityId:`bench-${size}`,queryVector:vector(target),candidates,cache,budget:8,policy:{faits:[1,8]},salience:x=>Number(x.importance||.5)});lat.push(performance.now()-t);if(found.some(x=>x.path===`faits.${target}`))hits++}
  const hitRate=hits/targets.length;assert.equal(hitRate,1,`recall degraded at ${size}`);results.push({memories:size,hit_rate:hitRate,p95_ms:Number(p95(lat).toFixed(3))});
}

// Simulate 1000 sequential conversation turns persisted through the real storage boundary.
const root=fs.mkdtempSync(path.join(os.tmpdir(),'entity-endurance-'));
try{
  const storage=createEntityStorage({root});const id='conversation-1000';
  const t=performance.now();
  for(let turn=1;turn<=1000;turn++)await storage.mutate(id,'bench-state',{revision:0,working_memory:[]},s=>({revision:s.revision+1,working_memory:[...s.working_memory,{turn,text:`message-${turn}`}].slice(-8)}));
  const state=await storage.get(id,'bench-state');assert.equal(state.revision,1000);assert.equal(state.working_memory.length,8);assert.equal(state.working_memory.at(-1).turn,1000);
  results.push({turns:1000,persistence_ms:Number((performance.now()-t).toFixed(3)),revision:state.revision,working_memory:state.working_memory.length});
}finally{fs.rmSync(root,{recursive:true,force:true})}
console.log('Entity endurance benchmark: OK');
console.table(results);
