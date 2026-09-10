import React,{useState} from 'react';
import EmaeaRuntimeHost from '@/components/entity/EmaeaRuntimeHost.jsx';

const ENTITY_ID_KEY='entity-instance-id';
const entityId=()=>localStorage.getItem(ENTITY_ID_KEY)||'';

export default function EmaeaGraphicTest(){
  const[id]=useState(entityId),[status,setStatus]=useState(id?'chargement':'Aucune EMÆÄ locale');
  return <div className="fixed inset-0 bg-[#1d1f22]">
    {id&&<EmaeaRuntimeHost entityId={id} className="absolute inset-0" onReady={()=>setStatus('prêt')} onError={error=>{console.error('EMÆÄ graphique test',error);setStatus('erreur')}}/>}
    <div className="pointer-events-none absolute bottom-3 left-3 rounded bg-black/45 px-2 py-1 text-[10px] uppercase tracking-widest text-white/45">EMÆÄ E · {status}</div>
  </div>;
}
