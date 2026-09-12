import React,{useMemo} from 'react';
import EmaeaRuntimeHost from './EmaeaRuntimeHost.jsx';

export default function EmaeaBody({entityId}){
  const controls=useMemo(()=>({ambient:.50,lighting:.90,satellites:.86}),[]);

  return <div className="relative mx-auto w-full">
    <style>{`
      body:has([aria-label="EMÆÄ"]),
      body:has([aria-label="EMÆÄ"]) .min-h-screen{background:#000!important;color:#f5f5f4}
      body:has([aria-label="EMÆÄ"]) aside{background:#000!important;border-color:rgba(255,255,255,.08)!important}
      body:has([aria-label="EMÆÄ"]) main{background:#000!important}

      body:has([aria-label="EMÆÄ"]) aside nav button:not(:first-child){border:1px solid rgba(52,211,153,.52)!important;background:transparent!important;color:rgba(245,245,244,.88)!important;box-shadow:none!important}
      body:has([aria-label="EMÆÄ"]) aside nav button:not(:first-child):hover{background:rgba(16,185,129,.07)!important;border-color:rgba(110,231,183,.72)!important}
      body:has([aria-label="EMÆÄ"]) aside nav button:nth-child(2) span{font-size:0!important}
      body:has([aria-label="EMÆÄ"]) aside nav button:nth-child(2) span::after{content:"Évolution";font-size:.875rem}

      body:has([aria-label="EMÆÄ"]) main .mb-4.grid.grid-cols-2.gap-2{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:5px!important;margin-bottom:10px!important}
      body:has([aria-label="EMÆÄ"]) main .mb-4.grid.grid-cols-2.gap-2 > div{min-height:40px!important;padding:5px 8px!important;gap:7px!important;border-radius:12px!important;border-color:rgba(52,211,153,.42)!important;background:linear-gradient(180deg,rgba(6,78,59,.66),rgba(4,47,46,.60))!important;box-shadow:inset 0 1px 0 rgba(167,243,208,.07),0 0 18px rgba(16,185,129,.04)!important}
      body:has([aria-label="EMÆÄ"]) main .mb-4.grid.grid-cols-2.gap-2 > div > span:first-child{width:24px!important;height:24px!important;min-width:24px!important;min-height:24px!important;border-radius:999px!important}
      body:has([aria-label="EMÆÄ"]) main .mb-4.grid.grid-cols-2.gap-2 > :nth-child(1) > span:first-child{background:radial-gradient(circle at 32% 28%,#fecaca 0%,#fb7185 28%,#ef4444 58%,#991b1b 100%)!important;border-color:rgba(254,202,202,.75)!important;box-shadow:0 0 14px rgba(239,68,68,.35),inset 0 1px 3px rgba(255,255,255,.45)!important}
      body:has([aria-label="EMÆÄ"]) main .mb-4.grid.grid-cols-2.gap-2 > :nth-child(2) > span:first-child{background:radial-gradient(circle at 31% 25%,rgba(255,255,255,.98) 0 5%,rgba(255,244,176,.95) 7%,transparent 18%),radial-gradient(circle at 36% 31%,#fff1a8 0%,#f6c84b 24%,#c98a16 54%,#6f4307 82%,#2f1a02 100%)!important;border-color:rgba(255,224,120,.88)!important;box-shadow:0 0 12px rgba(234,179,8,.42),inset -3px -4px 7px rgba(63,36,0,.52),inset 3px 3px 5px rgba(255,248,202,.52)!important}
      body:has([aria-label="EMÆÄ"]) main .mb-4.grid.grid-cols-2.gap-2 > div div div:first-child{font-size:14px!important;line-height:15px!important}
      body:has([aria-label="EMÆÄ"]) main .mb-4.grid.grid-cols-2.gap-2 > div div div:last-child{font-size:8px!important}
      body:has([aria-label="EMÆÄ"]) main .mb-4.grid.grid-cols-2.gap-2 > :nth-child(3) div div:last-child,
      body:has([aria-label="EMÆÄ"]) main .mb-4.grid.grid-cols-2.gap-2 > :nth-child(4) div div:last-child{display:none!important}

      body:has([aria-label="EMÆÄ"]) main .mb-4.grid.grid-cols-2.gap-2::before,
      body:has([aria-label="EMÆÄ"]) main .mb-4.grid.grid-cols-2.gap-2::after{
        content:"0";
        min-width:0;
        min-height:40px;
        border-radius:12px;
        border:1px solid rgba(52,211,153,.42);
        display:flex;
        align-items:center;
        padding:5px 8px 5px 39px;
        white-space:nowrap;
        font-size:14px;
        line-height:1;
        color:rgba(245,245,244,.88);
        box-shadow:inset 0 1px 0 rgba(167,243,208,.07),0 0 18px rgba(16,185,129,.04);
        background-color:transparent;
        background-repeat:no-repeat!important;
        background-size:24px 24px,100% 100%!important;
        background-position:8px center,0 0!important;
      }
      body:has([aria-label="EMÆÄ"]) main .mb-4.grid.grid-cols-2.gap-2::before{
        background-image:radial-gradient(circle at 32% 28%,#dbeafe 0%,#60a5fa 28%,#2563eb 58%,#172554 100%),linear-gradient(180deg,rgba(6,78,59,.66),rgba(4,47,46,.60));
        order:5;
      }
      body:has([aria-label="EMÆÄ"]) main .mb-4.grid.grid-cols-2.gap-2::after{
        background-image:radial-gradient(circle at 32% 28%,#fff7cc 0%,#f6c84b 28%,#c98a16 58%,#6f4307 100%),linear-gradient(180deg,rgba(6,78,59,.66),rgba(4,47,46,.60));
        order:6;
      }

      @media(min-width:1024px){
        body:has([aria-label="EMÆÄ"]) main .mb-4.grid.grid-cols-2.gap-2{grid-template-columns:110px 110px 24px 110px 110px 110px 110px!important;justify-content:center!important;max-width:706px!important;margin-left:auto!important;margin-right:auto!important}
        body:has([aria-label="EMÆÄ"]) main .mb-4.grid.grid-cols-2.gap-2 > :nth-child(1){grid-column:1!important}
        body:has([aria-label="EMÆÄ"]) main .mb-4.grid.grid-cols-2.gap-2 > :nth-child(2){grid-column:2!important}
        body:has([aria-label="EMÆÄ"]) main .mb-4.grid.grid-cols-2.gap-2 > :nth-child(3){grid-column:4!important}
        body:has([aria-label="EMÆÄ"]) main .mb-4.grid.grid-cols-2.gap-2 > :nth-child(4){grid-column:5!important}
        body:has([aria-label="EMÆÄ"]) main .mb-4.grid.grid-cols-2.gap-2::before{grid-column:6!important}
        body:has([aria-label="EMÆÄ"]) main .mb-4.grid.grid-cols-2.gap-2::after{grid-column:7!important}
      }
    `}</style>

    <div className="relative aspect-[1.86/1] w-full overflow-hidden rounded-[30px] border border-white/[.11] bg-black shadow-[0_22px_90px_rgba(0,0,0,.72)]" aria-label="EMÆÄ">
      <EmaeaRuntimeHost entityId={entityId} controls={controls} className="absolute inset-0"/>
    </div>
  </div>;
}
