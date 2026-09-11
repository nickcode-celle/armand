import {clampLevel} from './entity-evolution-engine.mjs';

export function applyHistoryEvent(current,event){
  if(!event)return{level:current,change:null,deferred:false};
  const raw=Number(event?.niveau??event?.level);
  if(![0,1,2,3].includes(raw))throw new Error(`Niveau Histoire invalide: ${event?.niveau??event?.level}`);
  if(current==null||current==='')return{level:null,change:null,deferred:true};
  const before=clampLevel(current);
  const after=Math.max(0,Math.min(100,before+raw*(1-before/100)));
  return{level:after,change:{niveau:raw,before,after,evenement:event?.evenement??null,nature:event?.nature??null,cause:event?.cause??null,justification:event?.justification??null},deferred:false};
}
