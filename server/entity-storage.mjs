import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

/*
 Entity storage boundary.
 Development uses sharded atomic JSON without changing ARMAND.
 Production can switch to a horizontally scalable HTTP storage service by setting
 ENTITY_STORAGE_URL and ENTITY_STORAGE_TOKEN. The Entity runtime never needs to
 know where its records physically live.
*/
export function createEntityStorage({root=process.cwd()}={}){
  const remote=String(process.env.ENTITY_STORAGE_URL||'').replace(/\/$/,'');
  const token=process.env.ENTITY_STORAGE_TOKEN||'';
  const localRoot=path.join(root,'.entity-store');
  const safe=x=>String(x||'').replace(/[^a-zA-Z0-9_-]/g,'');
  const shard=id=>crypto.createHash('sha256').update(String(id)).digest('hex').slice(0,4);
  const localFile=(id,namespace)=>path.join(localRoot,shard(id),safe(id),`${safe(namespace)}.json`);
  const headers=()=>({'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})});

  async function remoteCall(method,id,namespace,value){
    const r=await fetch(`${remote}/v1/entities/${encodeURIComponent(id)}/records/${encodeURIComponent(namespace)}`,{method,headers:headers(),body:value===undefined?undefined:JSON.stringify({value})});
    if(r.status===404)return null;
    if(!r.ok)throw Error(`Entity storage ${r.status}`);
    if(method==='DELETE')return true;
    const d=await r.json();return d?.value??d;
  }
  function localRead(id,namespace,fallback=null){try{const f=localFile(id,namespace);return fs.existsSync(f)?JSON.parse(fs.readFileSync(f,'utf8')):fallback}catch{return fallback}}
  function localWrite(id,namespace,value){const f=localFile(id,namespace);fs.mkdirSync(path.dirname(f),{recursive:true});const t=`${f}.${process.pid}.${Date.now()}.${crypto.randomBytes(3).toString('hex')}.tmp`;fs.writeFileSync(t,JSON.stringify(value,null,2));fs.renameSync(t,f);return value}
  function localDelete(id,namespace){const f=localFile(id,namespace);if(fs.existsSync(f))fs.unlinkSync(f)}
  return {
    mode:remote?'remote':'local-sharded',
    async get(id,namespace,fallback=null){const v=remote?await remoteCall('GET',id,namespace):localRead(id,namespace,fallback);return v??fallback},
    async put(id,namespace,value){return remote?remoteCall('PUT',id,namespace,value):localWrite(id,namespace,value)},
    async del(id,namespace){return remote?remoteCall('DELETE',id,namespace):localDelete(id,namespace)},
    async mutate(id,namespace,fallback,fn){const current=await this.get(id,namespace,fallback);const next=await fn(structuredClone(current));await this.put(id,namespace,next);return next},
    localFile,
  };
}
