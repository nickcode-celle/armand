export function createRuntimeStore({storage,memoryService}){
  async function load(entityId,defaultState){
    const snapshot=await storage.get(entityId,'runtime-snapshot',null);
    if(snapshot?.state)return snapshot;
    const [state,memory,pending]=await Promise.all([
      memoryService.state(entityId,defaultState),
      memoryService.memory(entityId),
      memoryService.pending(entityId),
    ]);
    const initial={state,memory,pending:Array.isArray(pending)?pending:[],committed_revision:Number(state?.revision||0),updated_at:state?.updated_at||null};
    await storage.put(entityId,'runtime-snapshot',initial);
    return initial;
  }
  async function commit(entityId,expectedRevision,next){
    return storage.mutate(entityId,'runtime-snapshot',null,current=>{
      if(!current)return next;
      const actual=Number(current.committed_revision??current.state?.revision??0);
      if(actual!==Number(expectedRevision))throw Error(`Revision Entity obsolète: ${expectedRevision} != ${actual}`);
      return next;
    });
  }
  return{load,commit};
}
