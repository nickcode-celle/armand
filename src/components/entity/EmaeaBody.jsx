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

      /* Tuiles du haut : même famille verte que l'onglet EMÆÄ. */
      body:has([aria-label="EMÆÄ"]) main .mb-4.grid.grid-cols-2.gap-2{
        grid-template-columns:repeat(2,minmax(0,1fr))!important;
      }
      body:has([aria-label="EMÆÄ"]) main .mb-4.grid.grid-cols-2.gap-2 > div{
        border-color:rgba(52,211,153,.46)!important;
        background:linear-gradient(180deg,rgba(6,78,59,.72),rgba(4,47,46,.66))!important;
        box-shadow:inset 0 1px 0 rgba(167,243,208,.08),0 0 24px rgba(16,185,129,.05)!important;
      }
      body:has([aria-label="EMÆÄ"]) main .mb-4.grid.grid-cols-2.gap-2::before,
      body:has([aria-label="EMÆÄ"]) main .mb-4.grid.grid-cols-2.gap-2::after{
        min-width:0;
        min-height:53px;
        border-radius:16px;
        border:1px solid rgba(52,211,153,.46);
        display:flex;
        align-items:center;
        padding:10px 12px;
        white-space:pre-line;
        font-size:10px;
        line-height:1.35;
        color:rgba(214,211,209,.82);
        box-shadow:inset 0 1px 0 rgba(255,255,255,.05);
      }
      body:has([aria-label="EMÆÄ"]) main .mb-4.grid.grid-cols-2.gap-2::before{
        content:"🔵  0\\A récompenses bleues";
        background:linear-gradient(180deg,rgba(6,78,59,.72),rgba(4,47,46,.66));
      }
      body:has([aria-label="EMÆÄ"]) main .mb-4.grid.grid-cols-2.gap-2::after{
        content:"🟡  0\\A récompense or";
        border-color:rgba(250,204,21,.56);
        background:linear-gradient(180deg,rgba(113,63,18,.72),rgba(66,42,10,.68));
        color:rgba(254,240,138,.9);
        box-shadow:inset 0 1px 0 rgba(254,240,138,.11),0 0 22px rgba(234,179,8,.07);
      }
      @media(min-width:1024px){
        body:has([aria-label="EMÆÄ"]) main .mb-4.grid.grid-cols-2.gap-2{
          grid-template-columns:repeat(6,minmax(0,1fr))!important;
        }
      }
    `}</style>

    <div className="relative aspect-[1.86/1] w-full overflow-hidden rounded-[30px] border border-white/[.11] bg-black shadow-[0_22px_90px_rgba(0,0,0,.72)]" aria-label="EMÆÄ">
      <EmaeaRuntimeHost entityId={entityId} controls={controls} className="absolute inset-0"/>
    </div>
  </div>;
}
