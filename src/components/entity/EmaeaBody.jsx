import React from 'react';
import EmaeaRuntimeHost from './EmaeaRuntimeHost.jsx';

export default function EmaeaBody({entityId}){
  return <div className="relative mx-auto mb-7 w-full">
    <div className="pointer-events-none absolute -inset-x-8 -bottom-14 top-10 rounded-[46px] bg-[radial-gradient(ellipse_at_50%_35%,rgba(34,197,94,.18)_0%,rgba(250,204,21,.10)_28%,rgba(16,185,129,.055)_48%,transparent_74%)] blur-3xl"/>
    <div className="relative h-[47vh] min-h-[390px] max-h-[590px] w-full overflow-hidden rounded-[30px] border border-emerald-300/20 bg-[#06100d] shadow-[0_0_0_1px_rgba(134,239,172,.03),0_0_34px_rgba(34,197,94,.09),0_28px_90px_rgba(0,0,0,.46),0_28px_110px_rgba(234,179,8,.06)] sm:h-[50vh] sm:min-h-[420px] lg:h-[52vh] lg:min-h-[455px] lg:max-h-[620px]" aria-label="EMÆÄ">
      <EmaeaRuntimeHost entityId={entityId} className="absolute inset-0"/>
    </div>
  </div>;
}
