export const ENTITY_SCHEMA_VERSION=8;
const migrations={
  6:s=>({...s,schema_version:6,metrics:s.metrics||{}}),
  7:s=>({...s,schema_version:7,metrics:s.metrics||{},recall_version:Number(s.recall_version||1)}),
  8:s=>({...s,schema_version:8,runtime_version:1,metrics:{calls:0,response_calls:0,embedding_calls:0,input_tokens:0,output_tokens:0,total_tokens:0,consolidation_failures:0,...(s.metrics||{})},recall_version:Math.max(2,Number(s.recall_version||1))})
};
export const ENTITY_MIGRATIONS=Object.freeze(Object.keys(migrations).map(Number).sort((a,b)=>a-b));
export function migrateEntityState(input={}){
  let s={...input},v=Math.max(5,Number(s.schema_version||5));
  if(v>ENTITY_SCHEMA_VERSION)throw Error(`Schéma Entity futur non supporté: v${v}`);
  while(v<ENTITY_SCHEMA_VERSION){v++;const fn=migrations[v];if(!fn)throw Error(`Migration Entity manquante vers v${v}`);s=fn(s)}
  return{...s,schema_version:ENTITY_SCHEMA_VERSION};
}
