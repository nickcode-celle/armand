export const HISTORY_LEVELS=Object.freeze({Anecdotique:0,'Mémorable':1,Marquant:2,Fondateur:3});

const clamp=value=>{
  const n=Number(value);
  if(!Number.isFinite(n))throw new Error(`Niveau Histoire vécue invalide: ${value}`);
  return Math.max(0,Math.min(100,n));
};

/**
 * Histoire vécue suit la même progression asymptotique que les autres jauges.
 * L'Observer qualifie l'événement 0/1/2/3 ; 0 est conservé dans l'histoire mais
 * ne fait pas progresser la jauge.
 */
export function applyHistoryEvent(current,event){
  const before=clamp(current);
  if(event==null)return{level:before,change:null};
  const raw=Number(event?.niveau);
  if(!Number.isInteger(raw)||raw<0||raw>3)throw new Error(`Niveau Histoire invalide: ${event?.niveau}`);
  const after=Math.max(0,Math.min(100,before+raw*(1-before/100)));
  return{level:after,change:{niveau:raw,before,after,evenement:event?.evenement??null,nature:event?.nature??null,justification:event?.justification??null}};
}
