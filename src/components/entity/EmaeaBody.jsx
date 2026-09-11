import React from 'react';
import EmaeaRuntimeHost from './EmaeaRuntimeHost.jsx';

export default function EmaeaBody({entityId}){
  return <div className="relative mx-auto mb-8 h-[46vh] min-h-[360px] max-h-[560px] w-full overflow-hidden rounded-[28px] border border-emerald-300/10 bg-[#0b1514] shadow-[0_22px_80px_rgba(0,0,0,.35)] sm:h-[50vh] sm:min-h-[410px] lg:h-[54vh] lg:min-h-[450px] lg:max-h-[640px]" aria-label="EMÆÄ">
    <EmaeaRuntimeHost entityId={entityId} className="absolute inset-0"/>
  </div>;
}
