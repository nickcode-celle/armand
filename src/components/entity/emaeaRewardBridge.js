import {playEmaeaRewardQueue} from './emaeaRewardAnimator.js';

/**
 * Branche le moteur graphique normal d'EMÆÄ sur la file de récompenses.
 * Le runtime fourni doit exposer les vraies marbles, leurs centers et updateCells().
 */
export function attachEmaeaRewardBridge(runtime,{entityId,acknowledge}={}){
  let chain=Promise.resolve();
  const queued=new Set();
  const completed=new Set();

  const onQueue=event=>{
    const detail=event?.detail||{};
    if(entityId&&detail.entityId!==entityId)return;
    const fresh=(Array.isArray(detail.queue)?detail.queue:[]).filter(command=>{
      const id=String(command?.reward_id||'');
      if(!id||queued.has(id)||completed.has(id))return false;
      queued.add(id);return true;
    });
    if(!fresh.length)return;
    chain=chain.then(()=>playEmaeaRewardQueue(runtime,fresh,{acknowledge:async rewardId=>{
      await acknowledge?.(rewardId);
      queued.delete(rewardId);completed.add(rewardId);
    }})).catch(error=>{
      fresh.forEach(x=>queued.delete(String(x?.reward_id||'')));
      window.dispatchEvent(new CustomEvent('emaea:reward-error',{detail:{entityId,error}}));
    });
  };

  window.addEventListener('emaea:reward-queue',onQueue);
  return()=>window.removeEventListener('emaea:reward-queue',onQueue);
}
