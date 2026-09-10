import React,{useEffect,useRef} from 'react';
import {createEmaeaBodyRuntime} from './emaeaBodyRuntime.js';
import {attachEmaeaBirthBridge} from './emaeaBirthBridge.js';
import {attachEmaeaRewardBridge} from './emaeaRewardBridge.js';

async function post(path,payload){
  const response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  let data={};try{data=await response.json()}catch{}
  if(!response.ok)throw new Error(data?.error||`Erreur EMÆÄ ${path}`);
  return data;
}

export default function EmaeaBody({entityId}){
  const host=useRef(null),runtimeRef=useRef(null),detachRef=useRef([]);
  useEffect(()=>{
    const cleanupRuntime=()=>{for(const fn of detachRef.current.splice(0))fn?.();runtimeRef.current?.dispose?.();runtimeRef.current=null};
    const onState=event=>{
      const detail=event?.detail||{};
      if(detail.entityId!==entityId||!detail.evolution)return;
      if(!runtimeRef.current){
        const runtime=createEmaeaBodyRuntime(host.current,detail.evolution);runtimeRef.current=runtime;
        detachRef.current.push(
          attachEmaeaBirthBridge(runtime,{entityId,acknowledge:birthId=>post('/api/entity/birth-ack',{entityId,birthId})}),
          attachEmaeaRewardBridge(runtime,{entityId,acknowledge:rewardId=>post('/api/entity/reward-ack',{entityId,rewardId})})
        );
      }else runtimeRef.current.applyState?.(detail.evolution);
    };
    window.addEventListener('emaea:graphic-state',onState);
    return()=>{window.removeEventListener('emaea:graphic-state',onState);cleanupRuntime()};
  },[entityId]);
  return <div className="relative mx-auto h-[42vh] min-h-[320px] max-h-[520px] w-full overflow-hidden rounded-[28px] border border-white/[0.06] bg-[#1d1f22]" aria-label="EMÆÄ"><div ref={host} className="absolute inset-0"/></div>;
}
