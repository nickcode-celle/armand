import React,{useEffect,useRef} from 'react';
import {createEmaeaGraphicRuntimeController} from './emaeaGraphicRuntimeController.js';

async function post(path,payload){
  const response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  let data={};try{data=await response.json()}catch{}
  if(!response.ok)throw new Error(data?.error||`Erreur EMÆÄ ${path}`);
  return data;
}
function emitQueue(type,entityId,queue){
  if(!Array.isArray(queue)||!queue.length)return;
  window.dispatchEvent(new CustomEvent(type,{detail:{entityId,queue}}));
}

/**
 * Hôte graphique réutilisable. La mise en page finale reste volontairement hors de ce composant.
 * Une fois E monté, il récupère lui-même les files persistantes afin qu'aucune naissance ou
 * récompense ne soit perdue si les requêtes de restauration arrivent dans un ordre différent.
 */
export default function EmaeaBody({entityId}){
  const host=useRef(null),controllerRef=useRef(null);
  useEffect(()=>{
    let disposed=false;
    const cleanup=()=>{controllerRef.current?.dispose?.();controllerRef.current=null};
    const recoverQueues=async()=>{
      const [births,rewards]=await Promise.all([
        post('/api/entity/births',{entityId}),
        post('/api/entity/rewards',{entityId})
      ]);
      if(disposed)return;
      emitQueue('emaea:birth-queue',entityId,births?.render_queue);
      emitQueue('emaea:reward-queue',entityId,rewards?.render_queue);
    };
    const onState=event=>{
      const detail=event?.detail||{};
      if(detail.entityId!==entityId||!detail.evolution||disposed)return;
      if(!controllerRef.current){
        controllerRef.current=createEmaeaGraphicRuntimeController({
          container:host.current,
          entityId,
          initialEvolution:detail.evolution,
          acknowledgeBirth:birthId=>post('/api/entity/birth-ack',{entityId,birthId}),
          acknowledgeReward:rewardId=>post('/api/entity/reward-ack',{entityId,rewardId})
        });
        recoverQueues().catch(error=>window.dispatchEvent(new CustomEvent('emaea:graphic-error',{detail:{entityId,error}})));
      }else controllerRef.current.applyState?.(detail.evolution);
    };
    window.addEventListener('emaea:graphic-state',onState);
    return()=>{disposed=true;window.removeEventListener('emaea:graphic-state',onState);cleanup()};
  },[entityId]);
  return <div className="relative mx-auto h-[42vh] min-h-[320px] max-h-[520px] w-full overflow-hidden rounded-[28px] border border-white/[0.06] bg-[#1d1f22]" aria-label="EMÆÄ"><div ref={host} className="absolute inset-0"/></div>;
}
