import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

/* Entity storage boundary. Local development uses sharded atomic JSON.
   Remote production storage must implement versioned records + leases/CAS. */
export function createEntityStorage({root=process.cwd()}={}){
  const remote=String(process.env.ENTITY_STORAGE_URL||'').replace(/\/$/,'');
  const token=process.env.ENTITY_STORAGE_TOKEN||'';
  const localRoot=path.join(root,'.entity-store');
  const safe=x=>String(x||'').replace(/[^a-zA-Z0-9_-]/g,'');
  const shard=id=>crypto.createHash('sha256').update(String(id)).digest('hex').slice(0,4);
  const localFile=(id,namespace)=>path.join(localRoot,shard(id),safe(id),`${safe(namespace)}.json`);
  const headers=(extra={})=>({'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{}) ,...extra});
  const url=(id,namespace)=>`${remote}/v1/entities/${encodeURIComponent(id)}/records/${encodeURIComponent(namespace)}`;

  async function remoteRecord(method,id,namespace,value,version){
    const extra=version!==undefined?{'If-Match':String(version)}:{};
    const r=await fetch(url(id,namespace),{method,headers:headers(extra),body:value===undefined?undefined:JSON.stringify({value})});
    if(r.status===404)return null;
    if(r.status===409||r.status===412)return {conflict:true};
    if(!r.ok)throw Error(`Entity storage ${r.status}`);
    if(method==='DELETE')return {value:true,version:null};
    const d=await r.json();
    return {value:d?.value??d,version:d?.version??r.headers.get('etag')??null};
  }
  function localReadRecord(id,namespace,fallback=null){try{const f=localFile(id,namespace);if(!fs.existsSync(f))return{value:fallback,version:0};const raw=JSON.parse(fs.readFileSync(f,'utf8'));return raw&&raw.__entity_record===1?{value:raw.value,version:Number(raw.version||0)}:{value:raw,version:0}}catch{return{value:fallback,version:0}}}
  function localWriteRecord(id,namespace,value,expected){const current=localReadRecord(id,namespace,null);if(expected!==undefined&&Number(current.version)!==Number(expected))return{conflict:true};const f=localFile(id,namespace);fs.mkdirSync(path.dirname(f),{recursive:true});const record={__entity_record:1,version:Number(current.version||0)+1,value};const t=`${f}.${process.pid}.${Date.now()}.${crypto.randomBytes(3).toString('hex')}.tmp`;fs.writeFileSync(t,JSON.stringify(record,null,2));fs.renameSync(t,f);return{value,version:record.version}}
  function localDelete(id,namespace){const f=localFile(id,namespace);if(fs.existsSync(f))fs.unlinkSync(f)}

  async function getRecord(id,namespace,fallback=null){return remote?(await remoteRecord('GET',id,namespace))||{value:fallback,version:0}:localReadRecord(id,namespace,fallback)}
  async function putRecord(id,namespace,value,version){return remote?remoteRecord('PUT',id,namespace,value,version):localWriteRecord(id,namespace,value,version)}

  async function acquireLease(id,ttlMs=30000){
    if(!remote)return()=>{};
    const owner=`${process.pid}-${crypto.randomUUID()}`;
    const r=await fetch(`${remote}/v1/entities/${encodeURIComponent(id)}/lease`,{method:'POST',headers:headers(),body:JSON.stringify({owner,ttl_ms:ttlMs})});
    if(r.status===409||r.status===423)throw Error('Entity occupée, réessaie dans un instant');
    if(!r.ok)throw Error(`Entity storage lease ${r.status}`);
    return async()=>{try{await fetch(`${remote}/v1/entities/${encodeURIComponent(id)}/lease`,{method:'DELETE',headers:headers(),body:JSON.stringify({owner})})}catch{}};
  }

  return {
    mode:remote?'remote':'local-sharded',
    async get(id,namespace,fallback=null){return (await getRecord(id,namespace,fallback)).value??fallback},
    async put(id,namespace,value){const r=await putRecord(id,namespace,value);if(r?.conflict)throw Error('Conflit de stockage Entity');return r?.value??value},
    async del(id,namespace){if(remote)return remoteRecord('DELETE',id,namespace);return localDelete(id,namespace)},
    async mutate(id,namespace,fallback,fn){for(let attempt=0;attempt<8;attempt++){const current=await getRecord(id,namespace,fallback);const next=await fn(structuredClone(current.value??fallback));const written=await putRecord(id,namespace,next,current.version);if(!written?.conflict)return next;await new Promise(r=>setTimeout(r,10+attempt*15))}throw Error('Conflit concurrent Entity persistant')},
    acquireLease,
    localFile,
  };
}
