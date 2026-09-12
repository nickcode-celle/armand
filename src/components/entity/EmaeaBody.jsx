import React,{useMemo,useState} from 'react';
import EmaeaRuntimeHost from './EmaeaRuntimeHost.jsx';

function Slider({label,value,onChange,min=0,max=1,step=.01}){
  const pct=Math.round(((value-min)/(max-min))*100);
  return <label className="block">
    <div className="mb-1 flex items-center justify-between gap-3 text-[11px] text-white/75">
      <span>{label}</span><span className="tabular-nums text-white/45">{pct}%</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={e=>onChange(Number(e.target.value))}
      className="w-full accent-emerald-300"
    />
  </label>;
}

export default function EmaeaBody({entityId}){
  const[ambient,setAmbient]=useState(.12);
  const[lighting,setLighting]=useState(.58);
  const[satellites,setSatellites]=useState(.72);
  const controls=useMemo(()=>({ambient,lighting,satellites}),[ambient,lighting,satellites]);

  return <div className="relative mx-auto mb-7 w-full">
    <style>{`
      body:has([aria-label="EMÆÄ"]),
      body:has([aria-label="EMÆÄ"]) .min-h-screen{background:#000!important;color:#f5f5f4}
      body:has([aria-label="EMÆÄ"]) aside{background:#000!important;border-color:rgba(255,255,255,.08)!important}
      body:has([aria-label="EMÆÄ"]) main{background:#000!important}
    `}</style>

    <div className="relative aspect-[1.86/1] w-full overflow-hidden rounded-[30px] border border-white/[.11] bg-black shadow-[0_22px_90px_rgba(0,0,0,.72)]" aria-label="EMÆÄ">
      <EmaeaRuntimeHost entityId={entityId} controls={controls} className="absolute inset-0"/>

      <div className="absolute right-3 top-3 z-20 hidden w-[190px] rounded-2xl border border-white/10 bg-black/65 p-3 shadow-2xl backdrop-blur-md lg:block">
        <div className="mb-3 text-[10px] font-medium uppercase tracking-[.18em] text-emerald-200/80">Réglages graphiques</div>
        <div className="space-y-3">
          <Slider label="Lumière ambiante" value={ambient} onChange={setAmbient}/>
          <Slider label="Éclairage" value={lighting} onChange={setLighting}/>
          <Slider label="Satellites" value={satellites} min={.35} max={1} onChange={setSatellites}/>
        </div>
      </div>
    </div>
  </div>;
}
