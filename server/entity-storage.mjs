import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';

/* Storage priority: Cloudflare R2 (production), versioned HTTP storage, local sharded JSON.
   R2 uses the S3-compatible API directly with AWS Signature V4, so no extra runtime dependency
   is required. Record writes use ETag conditional requests for optimistic concurrency. */
export function createEntityStorage({root=process.cwd()}={}){
  const remote=String(process.env.ENTITY_STORAGE_URL||'').replace(/\/$/,'');
  const token=process.env.ENTITY_STORAGE_TOKEN||'';
  const r2={
    bucket:String(process.env.R2_BUCKET||'').trim(),
    endpoint:String(process.env.R2_ENDPOINT||'').replace(/\/$/,''),
    accessKey:String(process.env.R2_ACCESS_KEY_ID||''),
    secretKey:String(process.env.R2_SECRET_ACCESS_KEY||''),
    region:String(process.env.R2_REGION||'auto'),
  };
  const useR2=Boolean(r2.bucket&&r2.endpoint&&r2.accessKey&&r2.secretKey);
  const configuredRoot=String(process.env.ENTITY_STORAGE_DIR||'').trim();
  const localRoot=configuredRoot?(path.isAbsolute(configuredRoot)?configuredRoot:path.resolve(root,configuredRoot)):path.join(root,'.entity-store');
  const leaseContext=new AsyncLocalStorage();
  const metrics={reads:0,writes:0,deletes:0,conflicts:0,lease_acquires:0,lease_renews:0,lease_losses:0};
  const safe=x=>String(x||'').replace(/[^a-zA-Z0-9_-]/g,'');
  const shard=id=>crypto.createHash('sha256').update(String(id)).digest('hex').slice(0,4);
  const localFile=(id,namespace)=>path.join(localRoot,shard(id),safe(id),`${safe(namespace)}.json`);
  const headers=(extra={})=>{const fencing=leaseContext.getStore()?.fencingToken;return {'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{}) ,...(fencing!=null?{'X-Entity-Fencing-Token':String(fencing)}:{}),...extra}};
  const url=(id,namespace)=>`${remote}/v1/entities/${encodeURIComponent(id)}/records/${encodeURIComponent(namespace)}`;

  const sha256=x=>crypto.createHash('sha256').update(x).digest('hex');
  const hmac=(key,data,encoding)=>crypto.createHmac('sha256',key).update(data).digest(encoding);
  const enc=s=>encodeURIComponent(String(s)).replace(/[!'()*]/g,c=>`%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  const r2RecordKey=(id,namespace)=>`entities/${enc(id)}/records/${enc(namespace)}.json`;
  const r2LeaseKey=id=>`entities/${enc(id)}/lease.json`;
  const stripEtag=x=>x?String(x).replace(/^W\//,'').trim():null;

  async function r2Request(method,key,{body,ifMatch,ifNoneMatch}={}){
    const endpoint=new URL(r2.endpoint);
    const canonicalUri=`/${enc(r2.bucket)}/${String(key).split('/').map(enc).join('/')}`;
    const requestUrl=`${endpoint.origin}${canonicalUri}`;
    const payload=body===undefined?'':(typeof body==='string'?body:JSON.stringify(body));
    const payloadHash=sha256(payload);
    const now=new Date();
    const amzDate=now.toISOString().replace(/[:-]|\.\d{3}/g,'');
    const date=amzDate.slice(0,8);
    const signed={host:endpoint.host,'x-amz-content-sha256':payloadHash,'x-amz-date':amzDate};
    if(ifMatch!==undefined)signed['if-match']=String(ifMatch);
    if(ifNoneMatch!==undefined)signed['if-none-match']=String(ifNoneMatch);
    const names=Object.keys(signed).sort();
    const canonicalHeaders=names.map(k=>`${k}:${String(signed[k]).trim()}\n`).join('');
    const signedHeaders=names.join(';');
    const canonicalRequest=[method,canonicalUri,'',canonicalHeaders,signedHeaders,payloadHash].join('\n');
    const scope=`${date}/${r2.region}/s3/aws4_request`;
    const stringToSign=`AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${sha256(canonicalRequest)}`;
    const kDate=hmac(`AWS4${r2.secretKey}`,date);
    const kRegion=hmac(kDate,r2.region);
    const kService=hmac(kRegion,'s3');
    const kSigning=hmac(kService,'aws4_request');
    const signature=hmac(kSigning,stringToSign,'hex');
    const auth=`AWS4-HMAC-SHA256 Credential=${r2.accessKey}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
    const requestHeaders={...signed,Authorization:auth};
    if(body!==undefined)requestHeaders['Content-Type']='application/json';
    return fetch(requestUrl,{method,headers:requestHeaders,body:body===undefined?undefined:payload});
  }

  async function r2Record(method,id,namespace,value,version){
    const key=r2RecordKey(id,namespace);
    const opts={};
    if(method==='PUT'){
      opts.body={value};
      if(version===0||version===null)opts.ifNoneMatch='*';
      else if(version!==undefined)opts.ifMatch=version;
    }
    const r=await r2Request(method,key,opts);
    if(r.status===404)return null;
    if(r.status===409||r.status===412){metrics.conflicts++;return {conflict:true}}
    if(!r.ok)throw Error(`Entity R2 storage ${r.status}`);
    if(method==='DELETE')return {value:true,version:null};
    if(method==='GET'){
      const d=await r.json();
      return {value:d?.value??d,version:stripEtag(r.headers.get('etag'))};
    }
    return {value,version:stripEtag(r.headers.get('etag'))};
  }

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

  async function getRecord(id,namespace,fallback=null){metrics.reads++;if(useR2)return (await r2Record('GET',id,namespace))||{value:fallback,version:0};return remote?(await remoteRecord('GET',id,namespace))||{value:fallback,version:0}:localReadRecord(id,namespace,fallback)}
  async function putRecord(id,namespace,value,version){metrics.writes++;if(useR2)return r2Record('PUT',id,namespace,value,version);return remote?remoteRecord('PUT',id,namespace,value,version):localWriteRecord(id,namespace,value,version)}

  async function acquireR2Lease(id,ttlMs){
    const owner=`${process.pid}-${crypto.randomUUID()}`;
    const key=r2LeaseKey(id);
    async function readLease(){const r=await r2Request('GET',key);if(r.status===404)return null;if(!r.ok)throw Error(`Entity R2 lease ${r.status}`);return {data:await r.json(),etag:stripEtag(r.headers.get('etag'))}}
    async function writeLease(data,etag,create=false){const r=await r2Request('PUT',key,{body:data,...(create?{ifNoneMatch:'*'}:{ifMatch:etag})});if(r.status===409||r.status===412)return false;if(!r.ok)throw Error(`Entity R2 lease ${r.status}`);return stripEtag(r.headers.get('etag'))}
    let fencingToken=null;
    let leaseEtag=null;
    for(let attempt=0;attempt<8;attempt++){
      const current=await readLease();
      const now=Date.now();
      if(current&&Number(current.data?.expires_at||0)>now&&current.data?.owner!==owner)throw Error('Entity occupée, réessaie dans un instant');
      fencingToken=crypto.randomUUID();
      const data={owner,expires_at:now+ttlMs,fencing_token:fencingToken};
      const next=await writeLease(data,current?.etag,!current);
      if(next){leaseEtag=next;break}
      await new Promise(r=>setTimeout(r,10+attempt*15));
    }
    if(!leaseEtag)throw Error('Conflit de lease Entity persistant');
    metrics.lease_acquires++;
    const lease={owner,fencingToken,ttlMs,lost:false};
    lease.renew=async()=>{try{const current=await readLease();if(!current||current.data?.owner!==owner||String(current.data?.fencing_token)!==String(fencingToken))throw Error('Lease Entity perdue');const next=await writeLease({...current.data,expires_at:Date.now()+ttlMs},current.etag);if(!next)throw Error('Lease Entity perdue');leaseEtag=next;metrics.lease_renews++;return true}catch(e){lease.lost=true;metrics.lease_losses++;throw e}};
    lease.release=async()=>{try{const current=await readLease();if(current&&current.data?.owner===owner&&String(current.data?.fencing_token)===String(fencingToken))await writeLease({...current.data,expires_at:0,released:true},current.etag)}catch{}};
    return lease;
  }

  async function acquireLease(id,ttlMs=30000){
    if(useR2)return acquireR2Lease(id,ttlMs);
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
    mode:useR2?'r2':remote?'remote':'local-sharded',storageRoot:(useR2||remote)?null:localRoot,metrics,
    async get(id,namespace,fallback=null){return (await getRecord(id,namespace,fallback)).value??fallback},
    async put(id,namespace,value){const r=await putRecord(id,namespace,value);if(r?.conflict)throw Error('Conflit de stockage Entity');return r?.value??value},
    async del(id,namespace){metrics.deletes++;if(useR2)return r2Record('DELETE',id,namespace);if(remote)return remoteRecord('DELETE',id,namespace);return localDelete(id,namespace)},
    async mutate(id,namespace,fallback,fn){for(let attempt=0;attempt<8;attempt++){const current=await getRecord(id,namespace,fallback);const next=await fn(structuredClone(current.value??fallback));const written=await putRecord(id,namespace,next,current.version);if(!written?.conflict)return next;await new Promise(r=>setTimeout(r,10+attempt*15))}throw Error('Conflit concurrent Entity persistant')},
    acquireLease,
    runWithLease(lease,fn){return leaseContext.run({fencingToken:lease?.fencingToken},fn)},
    localFile,
  };
}
