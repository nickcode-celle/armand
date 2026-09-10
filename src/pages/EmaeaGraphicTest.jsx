import React,{useEffect,useRef,useState} from 'react';
import {createEmaeaGraphicRuntimeController} from '@/components/entity/emaeaGraphicRuntimeController.js';

const ENTITY_ID_KEY='entity-instance-id';
const post=async(path,body)=>{const r=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await r.json();if(!r.ok)throw new Error(data?.error||path);return data};
const entityId=()=>localStorage.getItem(ENTITY_ID_KEY)||'';

export default function EmaeaGraphicTest(){
  const hostRef=useRef(null),controllerRef=useRef(null);const[status,setStatus]=useState('chargement');
  useEffect(()=>{let cancelled=false;const id=entityId();if(!id){setStatus('Aucune EMÆÄ locale');return}
    const dispatchBirths=queue=>{if(queue?.length)window.dispatchEvent(new CustomEvent('emaea:birth-queue',{detail:{entityId:id,queue}}))};
    (async()=>{
      const state=await post('/api/entity/state',{entityId:id});if(cancelled)return;
      const controller=createEmaeaGraphicRuntimeController({
        container:hostRef.current,
        entityId:id,
        initialEvolution:state.evolution,
        acknowledgeReward:rewardId=>post('/api/entity/reward-ack',{entityId:id,rewardId}),
        acknowledgeBirth:birthId=>post('/api/entity/birth-ack',{entityId:id,birthId}),
        requestDailyBirth:entityId=>post('/api/entity/daily-births',{entityId})
      });
      controllerRef.current=controller;setStatus('prêt');
      const [births,rewards]=await Promise.all([post('/api/entity/births',{entityId:id}),post('/api/entity/rewards',{entityId:id})]);if(cancelled)return;
      dispatchBirths(births?.render_queue);
      if(rewards?.render_queue?.length)window.dispatchEvent(new CustomEvent('emaea:reward-queue',{detail:{entityId:id,queue:rewards.render_queue}}));
    })().catch(error=>{console.error('EMÆÄ graphique test',error);if(!cancelled)setStatus('erreur')});
    return()=>{cancelled=true;controllerRef.current?.dispose?.();controllerRef.current=null};
  },[]);
  return <div className="fixed inset-0 bg-[#1d1f22]"><div ref={hostRef} className="absolute inset-0"/><div className="pointer-events-none absolute bottom-3 left-3 rounded bg-black/45 px-2 py-1 text-[10px] uppercase tracking-widest text-white/45">EMÆÄ E · {status}</div></div>;
}
