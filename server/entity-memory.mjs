import fs from 'node:fs';import path from 'node:path';
export const TYPES=['travail','moyen_terme','faits','histoires','graphe','modele_personne','relation','entity_core','autobiographie','monde_entity','engagements'];
const safe=x=>String(x||'').replace(/[^a-zA-Z0-9_-]/g,'');
export function createMemoryService({root,storage}){const dir=path.join(root,'.entity-memories'),read=(f,d=null)=>{try{return fs.existsSync(f)?JSON.parse(fs.readFileSync(f,'utf8')):d}catch{return d}},legacy=(id,n)=>path.join(dir,safe(id),n);async function stored(id,n,file,fallback=null){const v=await storage.get(id,n,null);if(v!==null)return v;const old=read(file,null);if(old!==null){await storage.put(id,n,old);return old}return fallback}return{
 async memory(id){const c=await storage.get(id,'memory-catalog',null);if(c)return c;const vals=await Promise.all(TYPES.map(t=>stored(id,`memory-${t}`,legacy(id,`${t}.json`),null))),o={};let any=false;TYPES.forEach((t,i)=>{o[t]=vals[i];if(vals[i]!=null)any=true});if(any)await storage.put(id,'memory-catalog',o);return any?o:null},
 async save(id,m){await storage.put(id,'memory-catalog',m);await Promise.all(TYPES.filter(t=>m?.[t]!=null).map(t=>storage.put(id,`memory-${t}`,m[t])))},
 state:(id,f)=>stored(id,'state',legacy(id,'state.json'),f),pending:(id)=>stored(id,'pending',legacy(id,'pending.json'),[])
}}
