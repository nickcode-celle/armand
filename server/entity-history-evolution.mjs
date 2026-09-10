import {clampLevel} from './entity-evolution-engine.mjs';

/**
 * Histoire vécue : Anecdotique=0, Mémorable=1, Marquant=2, Fondateur=3.
 * Même progression asymptotique positive que les autres jauges.
 * Le niveau initial doit venir de l'âge de l'interlocuteur (âge × 0,5).
 * Tant que cet âge n'est pas connu, l'événement peut être mémorisé mais la jauge
 * numérique reste indéterminée : on ne fabrique pas artificiellement un départ à 0.
 */
export function applyHistoryEvent(current,event){
  if(!event)return{level:current,change:null,deferred:false};
  const raw=Number(event?.niveau??event?.level);
  if(![0,1,2,3].includes(raw))throw new Error(`Niveau Histoire invalide: ${event?.niveau??event?.level}`);
  if(current==null||current==='')return{level:null,change:null,deferred:true};
  const before=clampLevel(current);
  const after=Math.max(0,Math.min(100,before+raw*(1-before/100)));
  return{level:after,change:{niveau:raw,before,after,evenement:event?.evenement??null,nature:event?.nature??null,cause:event?.cause??null,justification:event?.justification??null},deferred:false};
}
