import {applyEvolutionEvents} from './entity-evolution-engine.mjs';
import {ensureInitialEvolutionState} from './entity-initial-state.mjs';
import {applyHistoryEvent} from './entity-history-evolution.mjs';
import {applyChangesToMarbles} from './entity-marble-evolution.mjs';

export function createPostReplyEvolution({storage}){
  return async function evolveAfterObservation({entityId,observerRecord}){
    const id=String(entityId||'').trim();
    if(!id||!observerRecord?.output)return null;
    const observerRevision=Number(observerRecord.revision??0);
    const observerAt=observerRecord.at??new Date().toISOString();
    return storage.mutate(id,'evolution-state',{evolution:null,last_observer_revision:null,last_observer_at:null},current=>{
      const lastRevision=Number(current?.last_observer_revision??-1);
      if(lastRevision===observerRevision&&current?.last_observer_at===observerAt)return current;
      const initialized=ensureInitialEvolutionState({evolution:current?.evolution||{}},id,{at:observerAt});
      const applied=applyEvolutionEvents(initialized.durable_levels||{},observerRecord.output.evolutions_durables||[]);
      const marbleApplied=applyChangesToMarbles(initialized.marbles||[],applied.changes,{seed:`${id}|${observerRevision}|${observerAt}`});
      let historyLevel=initialized.history_level??null;
      let historyEvents=Array.isArray(initialized.history_events)?[...initialized.history_events]:[];
      let historyChange=null;
      let historyDeferred=false;
      if(observerRecord.output.histoire){
        const out=applyHistoryEvent(historyLevel,observerRecord.output.histoire);
        historyLevel=out.level;
        historyChange=out.change;
        historyDeferred=out.deferred===true;
        historyEvents.push({...observerRecord.output.histoire,before:out.change?.before??historyLevel,after:out.change?.after??historyLevel,history_deferred:historyDeferred,at:observerAt});
      }
      const evolution={...initialized,durable_levels:applied.levels,marbles:marbleApplied.marbles,history_level:historyLevel,history_events:historyEvents.slice(-200),history_last_change:historyChange,observer_last:observerRecord.output,last_changes:applied.changes,last_marble_changes:marbleApplied.changes,updated_at:observerAt};
      return{evolution,last_observer_revision:observerRevision,last_observer_at:observerAt};
    });
  };
}
