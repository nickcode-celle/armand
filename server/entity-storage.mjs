import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';

/* Local development uses sharded atomic JSON.
   Remote production storage must implement versioned records and renewable leases.
   Lease contract: POST /lease acquires or renews {owner,ttl_ms,fencing_token?,renew?};
   response may return {fencing_token}. All record writes carry X-Entity-Fencing-Token. */
export function createEntityStorage({root=process.cwd()}={}){
  const remote=String(process.env.ENTITY_STORAGE_URL||'').replace(/\/$/,'');
  const token=process.env.ENTITY_STORAGE_TOKEN||'';
  const localRoot=path.join(root,'.entity-store');
  const leaseContext=new AsyncLocalStorage();
  const metrics={reads:0,writes:0,deletes:0,conflicts:0,lease_acquires:0,lease_renews:0,lease_losses:0};
  const safe=x=>String(x||'').replace(/[^a-zA-Z0-9_-]/g,'');
  const shard=id=>crypto.createHash('sha256').update(String(id)).digest('hex').slice(0,4);
  const localFile=(id,namespace)=>path.join(localRoot,shard(id),safe(id),`${safe(namespace)}.json`);
  const headers=(extra={})=>{const fencing=leaseContext.getStore()?.fencingToken;return {'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{}) ,...(fencing!=null?{'X-Entity-Fencing-Token':String(fencing)}:{}),...extra}};
  const url=(id,namespace)=>`${remote}/v1/entities/${encodeURIComponent(id)}/records/${encodeURIComponent(namespace)}`;

  async function remoteRecord(method,id,namespace,value,version){
    const extra=version!==undefined?{'If-Match':String(version)}:{};
    const r=await fetch(url(id,namespace),{method,headers:headers(extra),body:value===undefined?undefined:JSON.stringify({value})});
    if(r.status===404)return null;
    if(r.status===409||r.status===412){metrics.conflicts++;return {conflict:true}}
    if(!r.ok)throw Error(`Entity storage ${r.status}`);
    if(method==='DELETE')return {value:true,version:null};
    const d=await r.json();
    return {value:d?.value??d,version:d?.version??r.headers.get('etag')??null};
  }
  function localReadRecord(id,namespace,fallback=null){try{const f=localFile(id,namespace);if(!fs.existsSync(f))return{value:fallback,version:0};const raw=JSON.parse(fs.readFileSync(f,'utf8'));return raw&&raw.__entity_record===1?{value:raw.value,version:Number(raw.version||0)}:{value:raw,version:0}}catch{return{value:fallback,version:0}}}
  function localWriteRecord(id,namespace,value,expected){const current=localReadRecord(id,namespace,null);if(expected!==undefined&&Number(current.version)!==Number(expected)){metrics.conflicts++;return{conflict:true}}const f=localFile(id,namespace);fs.mkdirSync(path.dirname(f),{recursive:true});const record={__entity_record:1,version:Number(current.version||0)+1,value};const t=`${f}.${process.pid}.${Date.now()}.${crypto.randomBytes(3).toString('hex')}.tmp`;fs.writeFileSync(t,JSON.stringify(record,null,2));fs.renameSync(t,f);return{value,version:record.version}}
  function localDelete(id,namespace){const f=localFile(id,namespace);if(fs.existsSync(f))fs.unlinkSync(f)}

  async function getRecord(id,namespace,fallback=null){metrics.reads++;return remote?(await remoteRecord('GET',id,namespace))||{value:fallback,version:0}:localReadRecord(id,namespace,fallback)}
  async function putRecord(id,namespace,value,version){metrics.writes++;return remote?remoteRecord('PUT',id,namespace,value,version):localWriteRecord(id,namespace,value,version)}

  async function acquireLease(id,ttlMs=30000){
    if(!remote)return{owner:`local-${process.pid}`,fencingToken:0,ttlMs,release:async()=>{},renew:async()=>true};
    const owner=`${process.pid}-${crypto.randomUUID()}`;
    const leaseUrl=`${remote}/v1/entities/${encodeURIComponent(id)}/lease`;
    const request=async(body)=>{const r=await fetch(leaseUrl,{method:'POST',headers:headers(),body:JSON.stringify(body)});if(r.status===409||r.status===423)throw Error('Entity occupée, réessaie dans un instant');if(!r.ok)throw Error(`Entity storage lease ${r.status}`);try{return await r.json()}catch{return {}}};
    const first=await request({owner,ttl_ms:ttlMs});metrics.lease_acquires++;
    const lease={owner,fencingToken:first?.fencing_token??first?.fencingToken??null,ttlMs,lost:false};
    lease.renew=async()=>{try{const d=await request({owner,ttl_ms:ttlMs,fencing_token:lease.fencingToken,renew:true});if(d?.fencing_token!=null&&lease.fencingToken!=null&&String(d.fencing_token)!==String(lease.fencingToken))throw Error('Fencing token modifié');metrics.lease_renews++;return true}catch(e){lease.lost=true;metrics.lease_losses++;throw e}};
    lease.release=async()=>{try{await fetch(leaseUrl,{method:'DELETE',headers:headers(),body:JSON.stringify({owner,fencing_token:lease.fencingToken})})}catch{}};
    return lease;
  }

  return {
    mode:remote?'remote':'local-sharded',metrics,
    async get(id,namespace,fallback=null){return (await getRecord(id,namespace,fallback)).value??fallback},
    async put(id,namespace,value){const r=await putRecord(id,namespace,value);if(r?.conflict)throw Error('Conflit de stockage Entity');return r?.value??value},
    async del(id,namespace){metrics.deletes++;if(remote)return remoteRecord('DELETE',id,namespace);return localDelete(id,namespace)},
    async mutate(id,namespace,fallback,fn){for(let attempt=0;attempt<8;attempt++){const current=await getRecord(id,namespace,fallback);const next=await fn(structuredClone(current.value??fallback));const written=await putRecord(id,namespace,next,current.version);if(!written?.conflict)return next;await new Promise(r=>setTimeout(r,10+attempt*15))}throw Error('Conflit concurrent Entity persistant')},
    acquireLease,
    runWithLease(lease,fn){return leaseContext.run({fencingToken:lease?.fencingToken},fn)},
    localFile,
  };
}
