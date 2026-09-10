import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';

const root=process.cwd();
const storageDir=fs.mkdtempSync(path.join(os.tmpdir(),'emaea-prod-'));
const port=4457;
const base=`http://127.0.0.1:${port}`;
const entityId='production-persistence-smoke';

const sleep=ms=>new Promise(r=>setTimeout(r,ms));

async function waitHealth(){
  let last;
  for(let i=0;i<80;i++){
    try{
      const r=await fetch(`${base}/health`);
      if(r.ok)return r.json();
    }catch(error){last=error}
    await sleep(100);
  }
  throw last||new Error('Serveur EMÆÄ indisponible');
}

function start(){
  return spawn(process.execPath,['server/entity-server-v2.mjs'],{
    cwd:root,
    stdio:['ignore','pipe','pipe'],
    env:{...process.env,HOST:'127.0.0.1',PORT:String(port),ENTITY_STORAGE_DIR:storageDir,NODE_ENV:'production'}
  });
}

async function stop(child){
  if(!child||child.killed)return;
  child.kill('SIGTERM');
  await Promise.race([new Promise(resolve=>child.once('exit',resolve)),sleep(2000)]);
  if(!child.killed)child.kill('SIGKILL');
}

async function state(){
  const r=await fetch(`${base}/api/entity/state`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({entityId})});
  assert.equal(r.status,200);
  return r.json();
}

let child;
try{
  child=start();
  const health1=await waitHealth();
  assert.equal(health1.ok,true);
  assert.equal(health1.storage,'local-sharded');
  assert.equal(path.resolve(health1.storage_root),path.resolve(storageDir));

  const first=await state();
  assert.ok(Array.isArray(first.evolution?.marbles));
  assert.ok(first.evolution.marbles.length>=200);
  const ids1=first.evolution.marbles.map(x=>x.id);
  const dailyDate1=first.evolution.daily_birth_last_date??null;

  await stop(child);child=null;
  child=start();
  await waitHealth();
  const second=await state();
  const ids2=second.evolution.marbles.map(x=>x.id);
  assert.deepEqual(ids2,ids1,'La population doit survivre au redémarrage');
  assert.equal(second.evolution.daily_birth_last_date??null,dailyDate1,'La réconciliation quotidienne doit rester idempotente après redémarrage');

  console.log('Entity production persistence runtime test: OK');
}finally{
  await stop(child);
  fs.rmSync(storageDir,{recursive:true,force:true});
}
