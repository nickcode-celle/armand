import React from 'react';
import EmaeaRuntimeHost from './EmaeaRuntimeHost.jsx';

export default function EmaeaBody({entityId}){
  return <div className="relative mx-auto mb-8 h-[38vh] min-h-[300px] max-h-[480px] w-full overflow-hidden rounded-[28px] border border-white/[0.06] bg-[#1d1f22]" aria-label="EMÆÄ">
    <EmaeaRuntimeHost entityId={entityId} className="absolute inset-0"/>
  </div>;
}
