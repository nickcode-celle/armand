import React,{useEffect,useRef} from 'react';
import {createEmaeaGraphicRuntimeController} from './emaeaGraphicRuntimeController.js';

async function post(path,body){
  const response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  let data={};try{data=await response.json()}catch{}
  if(!response.ok)throw new Error(data?.error||path);
  return data;
}

function dispatch(entityId,type,queue){
  if(!Array.isArray(queue)||!queue.length)return;
  window.dispatchEvent(new CustomEvent(type,{detail:{entityId,queue}}));
}

/**
 * Hôte graphique sans décision de mise en page. L'interface finale fournit simplement
 * sa place et sa taille. L'état est toujours chargé avant les files d'animations.
 */
export default function EmaeaRuntimeHost({entityId,className='',onReady,onError}){
  const hostRef=useRef(null),controllerRef=useRef(null),onReadyRef=useRef(onReady),onErrorRef=useRef(onError);
  onReadyRef.current=onReady;
  onErrorRef.current=onError;

  useEffect(()=>{
    if(!entityId||!hostRef.current)return;
    let cancelled=false;
    (async()=>{
      const state=await post('/api/entity/state',{entityId});
      if(cancelled)return;
      const controller=createEmaeaGraphicRuntimeController({
        container:hostRef.current,
        entityId,
        initialEvolution:state.evolution,
        acknowledgeReward:rewardId=>post('/api/entity/reward-ack',{entityId,rewardId}),
        acknowledgeBirth:birthId=>post('/api/entity/birth-ack',{entityId,birthId}),
        requestDailyBirth:id=>post('/api/entity/daily-births',{entityId:id})
      });
      controllerRef.current=controller;
      onReadyRef.current?.(controller);

      const [births,rewards]=await Promise.all([
        post('/api/entity/births',{entityId}),
        post('/api/entity/rewards',{entityId})
      ]);
      if(cancelled)return;
      dispatch(entityId,'emaea:birth-queue',births?.render_queue);
      dispatch(entityId,'emaea:reward-queue',rewards?.render_queue);
    })().catch(error=>{
      if(cancelled)return;
      onErrorRef.current?.(error);
      window.dispatchEvent(new CustomEvent('emaea:graphic-error',{detail:{entityId,error}}));
    });
    return()=>{
      cancelled=true;
      controllerRef.current?.dispose?.();
      controllerRef.current=null;
    };
  },[entityId]);

  return <div ref={hostRef} className={className}/>;
}
