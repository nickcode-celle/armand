import React,{useMemo} from 'react';
import EmaeaRuntimeHost from './EmaeaRuntimeHost.jsx';

export default function EmaeaBody({entityId}){
  // Valeurs validées à l'écran par Nicolas avant suppression des curseurs.
  const controls=useMemo(()=>({ambient:.50,lighting:.90,satellites:.86}),[]);

  return <div className="relative mx-auto w-full">
    <style>{`
      body:has([aria-label="EMÆÄ"]),
      body:has([aria-label="EMÆÄ"]) .min-h-screen{background:#000!important;color:#f5f5f4}
      body:has([aria-label="EMÆÄ"]) aside{background:#000!important;border-color:rgba(255,255,255,.08)!important}
      body:has([aria-label="EMÆÄ"]) main{background:#000!important}

      /* Navigation secondaire : liseré vert, sans remplissage. */
      body:has([aria-label="EMÆÄ"]) aside nav button:not(:first-child){
        border:1px solid rgba(52,211,153,.52)!important;
        background:transparent!important;
        color:rgba(245,245,244,.88)!important;
        box-shadow:none!important;
      }
      body:has([aria-label="EMÆÄ"]) aside nav button:not(:first-child):hover{
        background:rgba(16,185,129,.07)!important;
        border-color:rgba(110,231,183,.72)!important;
      }
      /* Score devient Évolution sans toucher au moteur ni à la navigation. */
      body:has([aria-label="EMÆÄ"]) aside nav button:nth-child(2) span{
        font-size:0!important;
      }
      body:has([aria-label="EMÆÄ"]) aside nav button:nth-child(2) span::after{
        content:"Évolution";
        font-size:.875rem;
      }

      /* Barre haute compacte, séparée en 2 + 4. */
      body:has([aria-label="EMÆÄ"]) main .mb-4.grid.grid-cols-2.gap-2{
        grid-template-columns:repeat(2,minmax(0,1fr))!important;
        gap:5px!important;
        margin-bottom:10px!important;
      }
      body:has([aria-label="EMÆÄ"]) main .mb-4.grid.grid-cols-2.gap-2 > div{
        min-height:40px!important;
        padding:5px 8px!important;
        gap:7px!important;
        border-radius:12px!important;
        border-color:rgba(52,211,153,.42)!important;
        background:linear-gradient(180deg,rgba(6,78,59,.66),rgba(4,47,46,.60))!important;
        box-shadow:inset 0 1px 0 rgba(167,243,208,.07),0 0 18px rgba(16,185,129,.04)!important;
      }
      body:has([aria-label="EMÆÄ"]) main .mb-4.grid.grid-cols-2.gap-2 > div > span:first-child{
        width:24px!important;
        height:24px!important;
      }
      /* Bille totale : bille rouge. */
      body:has([aria-label="EMÆÄ"]) main .mb-4.grid.grid-cols-2.gap-2 > :nth-child(1) > span:first-child{
        background:radial-gradient(circle at 32% 28%,#fecaca 0%,#fb7185 28%,#ef4444 58%,#991b1b 100%)!important;
        border-color:rgba(254,202,202,.75)!important;
        box-shadow:0 0 14px rgba(239,68,68,.35),inset 0 1px 3px rgba(255,255,255,.45)!important;
      }
      body:has([aria-label="EMÆÄ"]) main .mb-4.grid.grid-cols-2.gap-2 > div div div:first-child{
        font-size:14px!important;
        line-height:15px!important;
      }
      body:has([aria-label="EMÆÄ"]) main .mb-4.grid.grid-cols-2.gap-2 > div div div:last-child{
        font-size:8px!important;
      }
      /* Les quatre onglets récompenses ne gardent que la couleur et le compteur. */
      body:has([aria-label="EMÆÄ"]) main .mb-4.grid.grid-cols-2.gap-2 > :nth-child(3) div div:last-child,
      body:has([aria-label="EMÆÄ"]) main .mb-4.grid.grid-cols-2.gap-2 > :nth-child(4) div div:last-child{
        display:none!important;
      }
      body:has([aria-label="EMÆÄ"]) main .mb-4.grid.grid-cols-2.gap-2::before,
      body:has([aria-label="EMÆÄ"]) main .mb-4.grid.grid-cols-2.gap-2::after{
        min-width:0;
        min-height:40px;
        border-radius:12px;
        border:1px solid rgba(52,211,153,.42);
        display:flex;
        align-items:center;
        padding:5px 8px;
        white-space:nowrap;
        font-size:12px;
        line-height:1;
        color:rgba(245,245,244,.88);
        box-shadow:inset 0 1px 0 rgba(255,255,255,.04);
      }
      body:has([aria-label="EMÆÄ"]) main .mb-4.grid.grid-cols-2.gap-2::before{
        content:"🔵  0";
        background:linear-gradient(180deg,rgba(6,78,59,.66),rgba(4,47,46,.60));
        order:5;
      }
      body:has([aria-label="EMÆÄ"]) main .mb-4.grid.grid-cols-2.gap-2::after{
        content:"🟡  0";
        border-color:rgba(250,204,21,.56);
        background:linear-gradient(180deg,rgba(113,63,18,.68),rgba(66,42,10,.64));
        color:rgba(254,240,138,.9);
        box-shadow:inset 0 1px 0 rgba(254,240,138,.10),0 0 18px rgba(234,179,8,.06);
        order:6;
      }
      @media(min-width:1024px){
        body:has([aria-label="EMÆÄ"]) main .mb-4.grid.grid-cols-2.gap-2{
          grid-template-columns:110px 110px 24px 110px 110px 110px 110px!important;
          justify-content:center!important;
          max-width:706px!important;
          margin-left:auto!important;
          margin-right:auto!important;
        }
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
