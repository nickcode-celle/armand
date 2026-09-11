import React from 'react';
import EmaeaRuntimeHost from './EmaeaRuntimeHost.jsx';

export default function EmaeaBody({entityId}){
  return <div className="relative mx-auto mb-7 w-full">
    <style>{`
      body:has([aria-label="EMÆÄ"]),
      body:has([aria-label="EMÆÄ"]) .min-h-screen{background:#000!important;color:#f5f5f4}
      body:has([aria-label="EMÆÄ"]) aside{background:#000!important;border-color:rgba(255,255,255,.08)!important}
      body:has([aria-label="EMÆÄ"]) main{background:#000!important}
    `}</style>
    <div className="relative h-[48vh] min-h-[405px] max-h-[610px] w-full overflow-hidden rounded-[30px] border border-white/[.11] bg-black shadow-[0_22px_90px_rgba(0,0,0,.72)] sm:h-[51vh] sm:min-h-[435px] lg:h-[53vh] lg:min-h-[465px] lg:max-h-[630px]" aria-label="EMÆÄ">
      <EmaeaRuntimeHost entityId={entityId} className="absolute inset-0"/>
    </div>
  </div>;
}
