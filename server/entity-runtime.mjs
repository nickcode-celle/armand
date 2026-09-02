import crypto from 'node:crypto';
const memoryHash=memory=>crypto.createHash('sha256').update(JSON.stringify(memory)).digest('hex');
const memoryNamespace=ref=>`memory-blob-${ref}`;
export function createRuntimeStore({storage,memoryService}){
  async function persistMemory(entityId,memory){
    if(memory==null)return null;
    const ref=memoryHash(memory),namespace=memoryNamespace(ref),existing=await storage.get(entityId,namespace,null);
    if(existing===null)await storage.put(entityId,namespace,memory);
    return ref;
  }
  async function readMemory(entityId,record){
    if(!record?.memory_ref)return null;
    const memory=await storage.get(entityId,memoryNamespace(record.memory_ref),null);
    if(memory===null)throw Error(`Snapshot mémoire Entity manquant: ${record.memory_ref}`);
    return memory;
  }
  async function hydrate(entityId,record,withMemory=true){
    if(!record?.state)return record;
    if(Object.prototype.hasOwnProperty.call(record,'memory_ref'))return withMemory?{...record,memory:await readMemory(entityId,record)}:{...record};
    const inline=record.memory??null,ref=await persistMemory(entityId,inline),migrated={...record,memory_ref:ref};delete migrated.memory;
    const committed=await storage.mutate(entityId,'runtime-snapshot',record,current=>Object.prototype.hasOwnProperty.call(current||{},'memory_ref')?current:migrated);
    return hydrate(entityId,committed,withMemory);
  }
  async function load(entityId,defaultState,{withMemory=true}={}){
    const snapshot=await storage.get(entityId,'runtime-snapshot',null);
    if(snapshot?.state)return hydrate(entityId,snapshot,withMemory);
    const [state,memory,pending]=await Promise.all([memoryService.state(entityId,defaultState),memoryService.memory(entityId),memoryService.pending(entityId)]);
    const ref=await persistMemory(entityId,memory),initial={state,pending:Array.isArray(pending)?pending:[],recent_requests:[],memory_ref:ref,committed_revision:Number(state?.revision||0),updated_at:state?.updated_at||null};
    const committed=await storage.mutate(entityId,'runtime-snapshot',null,current=>current?.state?current:initial);
    return hydrate(entityId,committed,withMemory);
  }
  async function commit(entityId,expectedRevision,next){
    const hasMemory=Object.prototype.hasOwnProperty.call(next,'memory'),nextRef=hasMemory?await persistMemory(entityId,next.memory):undefined,base={...next};delete base.memory;let previousRef=null,finalRef=null;
    const committed=await storage.mutate(entityId,'runtime-snapshot',null,current=>{
      const actual=Number(current?.committed_revision??current?.state?.revision??0);
      if(current&&actual!==Number(expectedRevision))throw Error(`Revision Entity obsolète: ${expectedRevision} != ${actual}`);
      previousRef=current?.memory_ref??null;finalRef=hasMemory?nextRef:(base.memory_ref??previousRef??null);return{...base,memory_ref:finalRef};
    });
    if(previousRef&&previousRef!==finalRef)storage.del(entityId,memoryNamespace(previousRef)).catch(()=>{});
    return hasMemory?{...committed,memory:next.memory}:{...committed};
  }
  return{load,commit,readMemory};
}
