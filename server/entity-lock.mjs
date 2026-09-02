import fs from 'node:fs';
import path from 'node:path';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
export function createEntityLock({root,storage}){
 const locks=new Map(),dir=path.join(root,'.entity-memories');
 const safe=x=>String(x||'').replace(/[^a-zA-Z0-9_-]/g,'');
 async function acquire(id){
   if(storage.mode==='remote')return storage.acquireLease(id,30000);
   const f=path.join(dir,safe(id),'.lock');fs.mkdirSync(path.dirname(f),{recursive:true});
   for(let i=0;i<80;i++){try{fs.mkdirSync(f);fs.writeFileSync(path.join(f,'owner'),`${process.pid}:${Date.now()}`);return{lost:false,renew:async()=>true,release:async()=>fs.rmSync(f,{recursive:true,force:true})}}catch{try{if(Date.now()-fs.statSync(f).mtimeMs>30000)fs.rmSync(f,{recursive:true,force:true})}catch{}await sleep(25)}}
   throw Error('Entity occupée, réessaie dans un instant')
 }
 return async(id,fn)=>{const k=String(id),p=locks.get(k)||Promise.resolve();let done;const n=new Promise(r=>done=r);locks.set(k,n);await p;const lease=await acquire(id);let renewError=null;const timer=storage.mode==='remote'?setInterval(()=>lease.renew().catch(e=>{renewError=e}),10000):null;timer?.unref?.();try{return await storage.runWithLease(lease,async()=>{const result=await fn();if(renewError||lease.lost)throw renewError||Error('Lease Entity perdu pendant le traitement');return result})}finally{if(timer)clearInterval(timer);await lease.release();done();if(locks.get(k)===n)locks.delete(k)}};
}
