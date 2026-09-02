export const TYPES=['travail','moyen_terme','faits','histoires','graphe','modele_personne','relation','entity_core','autobiographie','monde_entity','engagements'];
export function createMemoryService({storage,legacy=null}){
 async function stored(id,n,old,fallback=null){const v=await storage.get(id,n,null);if(v!==null)return v;const legacyValue=old?.();if(legacyValue!==null&&legacyValue!==undefined){await storage.put(id,n,legacyValue);return legacyValue}return fallback}
 return{
  async memory(id){const c=await storage.get(id,'memory-catalog',null);if(c)return c;const vals=await Promise.all(TYPES.map(t=>stored(id,`memory-${t}`,()=>legacy?.memory(id,t),null))),o={};let any=false;TYPES.forEach((t,i)=>{o[t]=vals[i];if(vals[i]!=null)any=true});if(any)await storage.put(id,'memory-catalog',o);return any?o:null},
  async save(id,m){await storage.put(id,'memory-catalog',m);await Promise.all(TYPES.filter(t=>m?.[t]!=null).map(t=>storage.put(id,`memory-${t}`,m[t])))},
  state:(id,f)=>stored(id,'state',()=>legacy?.state(id),f),
  pending:(id)=>stored(id,'pending',()=>legacy?.pending(id),[])
 }
}
