import React from 'react';
import EmaeaRuntimeHost from './EmaeaRuntimeHost.jsx';

export default function EmaeaBody({entityId}){
  return <div className="relative mx-auto mb-7 w-full">
    <style>{`
      body:has([aria-label="EMÆÄ"]),
      body:has([aria-label="EMÆÄ"]) .min-h-screen{background:#050607!important;color:#f5f5f4}
      body:has([aria-label="EMÆÄ"]) aside{background:#060708!important;border-color:rgba(255,255,255,.07)!important}
      body:has([aria-label="EMÆÄ"]) main{background:radial-gradient(ellipse at 55% 23%,rgba(255,196,88,.035) 0%,rgba(255,255,255,.012) 24%,transparent 58%),#050607!important}
    `}</style>
    <div className="pointer-events-none absolute -inset-x-8 -bottom-12 top-8 rounded-[46px] bg-[radial-gradient(ellipse_at_50%_34%,rgba(255,196,88,.12)_0%,rgba(255,196,88,.045)_27%,rgba(34,197,94,.025)_46%,transparent_72%)] blur-3xl"/>
    <div className="relative h-[48vh] min-h-[405px] max-h-[610px] w-full overflow-hidden rounded-[30px] border border-white/[.10] bg-[#020304] shadow-[0_0_0_1px_rgba(255,255,255,.02),0_0_24px_rgba(255,198,85,.045),0_30px_90px_rgba(0,0,0,.58)] sm:h-[51vh] sm:min-h-[435px] lg:h-[53vh] lg:min-h-[465px] lg:max-h-[630px]" aria-label="EMÆÄ">
      <EmaeaRuntimeHost entityId={entityId} className="absolute inset-0"/>
    </div>
  </div>;
}
