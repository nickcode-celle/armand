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
  async function hydrate(entityId,record){
    if(!record?.state)return record;
    if(Object.prototype.hasOwnProperty.call(record,'memory_ref')){
      const memory=record.memory_ref?await storage.get(entityId,memoryNamespace(record.memory_ref),null):null;
      if(record.memory_ref&&memory===null)throw Error(`Snapshot mémoire Entity manquant: ${record.memory_ref}`);
      return{...record,memory};
    }
    const inline=record.memory??null,ref=await persistMemory(entityId,inline),migrated={...record,memory_ref:ref};delete migrated.memory;
    const committed=await storage.mutate(entityId,'runtime-snapshot',record,current=>Object.prototype.hasOwnProperty.call(current||{},'memory_ref')?current:migrated);
    return hydrate(entityId,committed);
  }
  async function load(entityId,defaultState){
    const snapshot=await storage.get(entityId,'runtime-snapshot',null);
    if(snapshot?.state)return hydrate(entityId,snapshot);
    const [state,memory,pending]=await Promise.all([memoryService.state(entityId,defaultState),memoryService.memory(entityId),memoryService.pending(entityId)]);
    const ref=await persistMemory(entityId,memory),initial={state,pending:Array.isArray(pending)?pending:[],recent_requests:[],memory_ref:ref,committed_revision:Number(state?.revision||0),updated_at:state?.updated_at||null};
    await storage.put(entityId,'runtime-snapshot',initial);
    return{...initial,memory};
  }
  async function commit(entityId,expectedRevision,next){
    const nextRef=await persistMemory(entityId,next.memory??null),record={...next,memory_ref:nextRef};delete record.memory;let previousRef=null;
    const committed=await storage.mutate(entityId,'runtime-snapshot',null,current=>{
      if(!current)return record;
      const actual=Number(current.committed_revision??current.state?.revision??0);
      if(actual!==Number(expectedRevision))throw Error(`Revision Entity obsolète: ${expectedRevision} != ${actual}`);
      previousRef=current.memory_ref??null;return record;
    });
    if(previousRef&&previousRef!==nextRef)storage.del(entityId,memoryNamespace(previousRef)).catch(()=>{});
    return{...committed,memory:next.memory??null};
  }
  return{load,commit};
}
