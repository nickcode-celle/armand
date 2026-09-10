import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {createEntityStorage} from '../server/entity-storage.mjs';import {createMemoryService} from '../server/entity-memory.mjs';import {createRuntimeStore} from '../server/entity-runtime.mjs';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'entity-resilience-')),id='entity-test';
const storageA=createEntityStorage({root}),storageB=createEntityStorage({root}),memory=createMemoryService({root,storage:storageA}),runtimeA=createRuntimeStore({storage:storageA,memoryService:memory}),runtimeB=createRuntimeStore({storage:storageB,memoryService:createMemoryService({root,storage:storageB})});
const def={schema_version:7,revision:0,user_turns:0,working_memory:[],recent_messages:[],metrics:{}};
const initial=await runtimeA.load(id,def);assert.equal(initial.committed_revision,0);
await runtimeA.commit(id,0,{state:{...def,revision:1},memory:{faits:[{id:'f1',valeur:'Dijon'}]},pending:[{role:'user',content:'bonjour'}],committed_revision:1,updated_at:new Date().toISOString()});
// Simule un crash après une écriture dérivée incohérente : le snapshot atomique reste la source de vérité.
await storageA.put(id,'memory-catalog',{faits:[{id:'corrupt',valeur:'Paris'}]});const recovered=await runtimeB.load(id,def);assert.equal(recovered.memory.faits[0].valeur,'Dijon');assert.equal(recovered.committed_revision,1);
// Deux écrivains partis de la même révision : un seul commit logique doit être accepté.
await runtimeA.commit(id,1,{...recovered,state:{...recovered.state,revision:2},committed_revision:2});let stale=false;try{await runtimeB.commit(id,1,{...recovered,state:{...recovered.state,revision:2},committed_revision:2})}catch{stale=true}assert.equal(stale,true);
const final=await runtimeA.load(id,def);assert.equal(final.committed_revision,2);assert.equal(final.memory.faits[0].valeur,'Dijon');
fs.rmSync(root,{recursive:true,force:true});console.log('Entity atomic runtime/crash/concurrency tests: OK');
