import React,{useEffect,useRef} from 'react';
import {createEmaeaBodyRuntime} from './emaeaBodyRuntime.js';

async function readEvolution(entityId){
  const response=await fetch('/api/entity/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({entityId})});
  let data={};try{data=await response.json()}catch{}
  if(!response.ok)throw new Error(data?.error||'Etat EMÆÄ indisponible');
  return data?.evolution||{};
}

export default function EmaeaRuntimeHost({entityId,className=''}){
  const hostRef=useRef(null);
  useEffect(()=>{
    if(!entityId||!hostRef.current)return;
    let cancelled=false,runtime=null,timer=null,busy=false;
    const sync=async()=>{
      if(cancelled||busy)return;busy=true;
      try{
        const evolution=await readEvolution(entityId);
        if(cancelled)return;
        if(!runtime)runtime=createEmaeaBodyRuntime(hostRef.current,evolution);
        else await runtime.applyState?.(evolution);
      }catch(error){if(!cancelled)console.error('[EMÆÄ graphic]',error)}finally{busy=false}
    };
    sync().then(()=>{if(!cancelled)timer=setInterval(sync,1500)});
    return()=>{cancelled=true;if(timer)clearInterval(timer);runtime?.dispose?.();runtime=null};
  },[entityId]);
  return <div ref={hostRef} className={className}/>;
}
