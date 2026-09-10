import {playEmaeaBirthQueue} from './emaeaBirthAnimator.js';
import {enqueueEmaeaGraphicTask} from './emaeaGraphicScheduler.js';

export function attachEmaeaBirthBridge(runtime,{entityId,acknowledge}={}){
  const queued=new Set(),completed=new Set();
  const onQueue=event=>{
    const detail=event?.detail||{};
    if(entityId&&detail.entityId!==entityId)return;
    const fresh=(Array.isArray(detail.queue)?detail.queue:[]).filter(command=>{
      const id=String(command?.birth_id||'');
      if(!id||queued.has(id)||completed.has(id))return false;
      queued.add(id);return true;
    });
    if(!fresh.length)return;
    enqueueEmaeaGraphicTask(runtime,()=>playEmaeaBirthQueue(runtime,fresh,{acknowledge:async birthId=>{
      if(typeof acknowledge!=='function')throw new Error('Accusé de rendu naissance EMÆÄ manquant');
      await acknowledge(birthId);queued.delete(birthId);completed.add(birthId);
    }})).catch(error=>{
      fresh.forEach(x=>queued.delete(String(x?.birth_id||'')));
      window.dispatchEvent(new CustomEvent('emaea:birth-error',{detail:{entityId,error}}));
    });
  };
  window.addEventListener('emaea:birth-queue',onQueue);
  return()=>window.removeEventListener('emaea:birth-queue',onQueue);
}
