export const ENTITY_SCHEMA_VERSION=7;
const migrations={
  6:s=>({...s,schema_version:6,metrics:s.metrics||{}}),
  7:s=>({...s,schema_version:7,metrics:s.metrics||{},recall_version:Number(s.recall_version||1)})
};
export function migrateEntityState(input={}){
  let s={...input},v=Math.max(5,Number(s.schema_version||5));
  while(v<ENTITY_SCHEMA_VERSION){v++;const fn=migrations[v];if(!fn)throw Error(`Migration Entity manquante vers v${v}`);s=fn(s)}
  return{...s,schema_version:ENTITY_SCHEMA_VERSION};
}
