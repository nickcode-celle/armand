import {playEmaeaRewardQueue} from './emaeaRewardAnimator.js';
import {enqueueEmaeaGraphicTask} from './emaeaGraphicScheduler.js';

/** Branche les récompenses au moteur normal sans chevauchement avec les naissances. */
export function attachEmaeaRewardBridge(runtime,{entityId,acknowledge}={}){
  const queued=new Set(),completed=new Set();
  const onQueue=event=>{
    const detail=event?.detail||{};
    if(entityId&&detail.entityId!==entityId)return;
    const fresh=(Array.isArray(detail.queue)?detail.queue:[]).filter(command=>{
      const id=String(command?.reward_id||'');
      if(!id||queued.has(id)||completed.has(id))return false;
      queued.add(id);return true;
    });
    if(!fresh.length)return;
    enqueueEmaeaGraphicTask(runtime,()=>playEmaeaRewardQueue(runtime,fresh,{acknowledge:async rewardId=>{
      if(typeof acknowledge!=='function')throw new Error('Accusé de rendu récompense EMÆÄ manquant');
      await acknowledge(rewardId);queued.delete(rewardId);completed.add(rewardId);
    }})).catch(error=>{
      fresh.forEach(x=>queued.delete(String(x?.reward_id||'')));
      window.dispatchEvent(new CustomEvent('emaea:reward-error',{detail:{entityId,error}}));
    });
  };
  window.addEventListener('emaea:reward-queue',onQueue);
  return()=>window.removeEventListener('emaea:reward-queue',onQueue);
}
