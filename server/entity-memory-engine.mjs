import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const TYPES = ['travail','moyen_terme','faits','histoires','graphe','modele_personne','relation','entity_core','autobiographie','monde_entity','engagements'];
const EMBEDDING_DIR = path.resolve(process.cwd(), '.entity-embeddings');
const INDEX_VERSION = 2;
const DEFAULT_BITS = 12;

function safeId(id) { return String(id || '').replace(/[^a-zA-Z0-9_-]/g, ''); }
function atomic(file, value) { fs.mkdirSync(path.dirname(file), { recursive: true }); const tmp = `${file}.${process.pid}.${Date.now()}.tmp`; fs.writeFileSync(tmp, JSON.stringify(value), 'utf8'); fs.renameSync(tmp, file); }
function hash(text) { return crypto.createHash('sha256').update(String(text || ''), 'utf8').digest('hex'); }
function cacheFile(id) { const s=safeId(id); return s ? path.join(EMBEDDING_DIR, `${s}.engine-cache.json`) : null; }
function indexFile(id) { const s=safeId(id); return s ? path.join(EMBEDDING_DIR, `${s}.engine-index.json`) : null; }
function load(file, fallback) { try { if (!file || !fs.existsSync(file)) return fallback; const v=JSON.parse(fs.readFileSync(file,'utf8')); return v ?? fallback; } catch { return fallback; } }
function saveCache(id, v) { const f=cacheFile(id); if (f) atomic(f,v); }
function loadCache(id) { return load(cacheFile(id), {}); }
function saveIndex(id, v) { const f=indexFile(id); if (f) atomic(f,v); }
function loadIndex(id) { return load(indexFile(id), null); }

function candidates(memory) {
  const out=[];
  function add(type,item,p) { if (!item || typeof item !== 'object') return; out.push({type,path:p,item,text:JSON.stringify(item)}); }
  for (const type of TYPES) {
    const value=memory?.[type];
    if (Array.isArray(value)) value.forEach((x,i)=>add(type,x,`${type}.${i}`));
    else if (value && typeof value==='object') {
      for (const [k,x] of Object.entries(value)) {
        if (Array.isArray(x)) x.forEach((y,i)=>add(type,y,`${type}.${k}.${i}`));
        else if (x && typeof x==='object') add(type,x,`${type}.${k}`);
      }
    }
  }
  return out;
}
function bucket(v,bits=DEFAULT_BITS) { if(!Array.isArray(v)||!v.length)return null; let s=''; for(let i=0;i<bits;i++){const n=Math.floor(i*v.length/bits);s+=Number(v[n]||0)>=0?'1':'0';} return s; }
function neighbors(b,r=2) { if(!b)return[]; const a=new Set([b]); const flip=(s,n,start=0)=>{if(n===0){a.add(s);return;}for(let i=start;i<=s.length-n;i++){const c=s.split('');c[i]=c[i]==='1'?'0':'1';flip(c.join(''),n-1,i+1);}}; flip(b,1); if(r>=2)flip(b,2); return [...a]; }
function cosine(a,b){if(!Array.isArray(a)||!Array.isArray(b)||a.length!==b.length)return 0;let d=0,na=0,nb=0;for(let i=0;i<a.length;i++){d+=a[i]*b[i];na+=a[i]*a[i];nb+=b[i]*b[i];}return na&&nb?d/(Math.sqrt(na)*Math.sqrt(nb)):0;}
function salience(item, now=Date.now()) {
  const importance=Number(item?.importance ?? item?.importance_personne ?? item?.importance_entity ?? 0.5);
  const repetition=Number(item?.repetition ?? item?.nombre_mentions ?? item?.nombre_evocations ?? item?.nombre_confirmations ?? 1);
  const relation=Number(item?.force_relationnelle ?? item?.importance_entity ?? 0);
  const access=Number(item?.accessibilite ?? 1);
  const last=item?.derniere_activation || item?.date_derniere_evocation || item?.derniere_confirmation;
  const age=last ? Math.max(0,(now-new Date(last).getTime())/86400000) : 0;
  const recency=Math.exp(-age/180);
  const structural=item?.structurel===true?1:0;
  return Math.max(0,Math.min(1, importance*.28+Math.min(repetition,10)/10*.18+relation*.18+access*.16+recency*.12+structural*.08));
}
function graphIds(item){return new Set([...(Array.isArray(item?.liens)?item.liens:[]),...(Array.isArray(item?.relations)?item.relations:[]),...(Array.isArray(item?.entites_liees)?item.entites_liees:[]),item?.id].filter(Boolean).map(String));}
function graphBoost(candidate, selected){if(!selected.length)return 0;const ids=graphIds(candidate.item);let n=0;for(const s of selected){const sid=graphIds(s.item);for(const x of ids)if(sid.has(x)){n++;break;}}return Math.min(.12,n*.04);}
function dynamicBudget(conversation, pool){const words=String(conversation||'').trim().split(/\s+/).filter(Boolean).length; return Math.max(6,Math.min(18,Math.round(7+words/80+Math.log10(pool+1)*2)));}
function typeWeight(type){return {faits:1.05,histoires:1.12,relation:1.15,engagements:1.2,graphe:1.05,modele_personne:1.0,travail:1.0,moyen_terme:1.05,entity_core:.95,autobiographie:.9,monde_entity:.9}[type]||1;}

async function buildIndex(apiKey, entityId, memory, embedFn) {
  const old=loadIndex(entityId); const cache=loadCache(entityId); const entries={...(old?.entries||{})}; const buckets={};
  const seen=new Set();
  for(const c of candidates(memory)){
    seen.add(c.path); const h=hash(c.text); let e=cache[c.path];
    if(!e || e.hash!==h || !Array.isArray(e.embedding)){e={hash:h,embedding:await embedFn(c.text)};cache[c.path]=e;}
    const b=bucket(e.embedding,old?.bits||DEFAULT_BITS); if(!b)continue;
    entries[c.path]={bucket:b,type:c.type,hash:h,updated_at:new Date().toISOString()}; (buckets[b] ||= []).push(c.path);
  }
  for(const p of Object.keys(entries))if(!seen.has(p))delete entries[p];
  const idx={version:INDEX_VERSION,bits:old?.bits||DEFAULT_BITS,updated_at:new Date().toISOString(),entries,buckets}; saveCache(entityId,cache); saveIndex(entityId,idx); return idx;
}

export async function recall({entityId,memory,conversation,embedFn}) {
  if(!memory||typeof memory!=='object')return null;
  const query=await embedFn(conversation); const cache=loadCache(entityId); let idx=loadIndex(entityId); const current=candidates(memory);
  const currentMap=new Map(current.map(c=>[c.path,c]));
  if(!idx || idx.version!==INDEX_VERSION) idx=await buildIndex(null,entityId,memory,embedFn);
  else {
    let dirty=false; for(const c of current){const e=idx.entries?.[c.path];if(!e||e.hash!==hash(c.text)){dirty=true;break;}}
    if(dirty) idx=await buildIndex(null,entityId,memory,embedFn);
  }
  const qbucket=bucket(query,idx.bits); const paths=new Set(); for(const b of neighbors(qbucket,2))for(const p of idx.buckets?.[b]||[])paths.add(p);
  if(!paths.size){for(const c of current.slice(0,Math.min(80,current.length)))paths.add(c.path);}
  const scored=[];
  for(const p of paths){const c=currentMap.get(p),e=cache[p];if(!c||!e?.embedding)continue;const semantic=cosine(query,e.embedding);const s=salience(c.item);scored.push({...c,semantic,salience:s,score:(semantic*.62+s*.25+typeWeight(c.type)*.08)});}
  scored.sort((a,b)=>b.score-a.score); const selected=[]; const budget=dynamicBudget(conversation,scored.length);
  for(const c of scored){if(selected.length>=budget)break;const diversity=selected.some(x=>x.type===c.type&&JSON.stringify(x.item).slice(0,80)===JSON.stringify(c.item).slice(0,80));if(diversity)continue;c.score+=graphBoost(c,selected);selected.push(c);}
  selected.sort((a,b)=>b.score-a.score); return selected.length?selected:null;
}

function clone(v){return v===undefined?undefined:JSON.parse(JSON.stringify(v));}
function mergeArray(oldArr,newArr){const out=Array.isArray(oldArr)?clone(oldArr):[];for(const n of (Array.isArray(newArr)?newArr:[])){const id=n?.id;const key=id?String(id):hash(JSON.stringify(n));const i=out.findIndex(x=>(x?.id&&String(x.id)===key)||(!x?.id&&hash(JSON.stringify(x))===key));if(i<0){out.push(n);continue;}const o=out[i];if(o?.valeur&&n?.valeur&&o.valeur!==n.valeur){out[i]={...o,ancien_valeur:o.valeur,valeur:n.valeur,statut:'actif',historique:[...(o.historique||[]),{valeur:o.valeur,date:new Date().toISOString()}]};}else out[i]=deepMerge(o,n);}return out;}
function deepMerge(a,b){if(Array.isArray(a)||Array.isArray(b))return mergeArray(a,b);if(a&&typeof a==='object'&&b&&typeof b==='object'){const o={...a};for(const k of Object.keys(b))o[k]=k in o?deepMerge(o[k],b[k]):b[k];return o;}return b;}
function enrich(value,now){if(Array.isArray(value))return value.map(x=>enrich(x,now));if(value&&typeof value==='object'){const o={...value};o.accessibilite=Math.max(0,Math.min(1,Number(o.accessibilite??1)*.97+.03*salience(o,now)));o.derniere_activation=o.derniere_activation||null;o.nombre_confirmations=Number(o.nombre_confirmations??o.nombre_mentions??o.nombre_evocations??1);return o;}return value;}
function prune(value){if(Array.isArray(value)){const enriched=value.map(x=>enrich(x,Date.now())).filter(x=>salience(x)>0.07||x?.structurel===true);enriched.sort((a,b)=>salience(b)-salience(a));return enriched.slice(0,160);}if(value&&typeof value==='object'){const o={};for(const [k,v] of Object.entries(value))o[k]=prune(v);return o;}return value;}

export async function consolidate({apiKey,previousMemory,newConversation,recallFn,openaiFn,memoryPrompt}) {
  const relevant=previousMemory?await recallFn(previousMemory,newConversation):null;
  const selective={}; for(const item of relevant||[]){((selective[item.type] ||= []));selective[item.type].push(item.item);}
  const patchPrompt=`${memoryPrompt}\n\nMODE CONSOLIDATION SÉLECTIVE\nNe renvoie PAS toute la mémoire. Analyse uniquement le nouvel échange et les fragments de mémoire ci-dessous. Retourne un OBJET PATCH contenant uniquement les catégories réellement nouvelles, modifiées ou confirmées. Préserve les distinctions faits/histoires/relation/Entity. Pour une contradiction factuelle, conserve l'ancien fait et marque la situation à vérifier plutôt que d'inventer. Chaque souvenir durable doit conserver importance, récence, répétition, force_relationnelle, accessibilite lorsque pertinent.\n\nFRAGMENTS EXISTANTS PERTINENTS:\n${JSON.stringify(selective,null,2)}\n\nNOUVEL ÉCHANGE:\n${newConversation}`;
  let patch=null,last='';
  for(let i=0;i<2;i++){try{const raw=await openaiFn(apiKey,patchPrompt+(i?'\nRetourne uniquement du JSON strict valide.':'') ,{maxOutputTokens:1800,temperature:.15});patch=JSON.parse(String(raw).replace(/^```json\s*|\s*```$/g,''));if(patch&&typeof patch==='object')break;}catch(e){last=e?.message||String(e);}}
  if(!patch||typeof patch!=='object')return null;
  const merged={...(previousMemory||{})}; for(const type of TYPES)if(patch[type]!==undefined)merged[type]=deepMerge(merged[type],patch[type]);
  merged._meta={...(merged._meta||{}),schema_version:2,last_consolidation:new Date().toISOString(),consolidations:Number(merged._meta?.consolidations||0)+1};
  for(const type of TYPES)if(merged[type]!==undefined)merged[type]=prune(merged[type]);
  return merged;
}

export const memoryTypes=TYPES;
