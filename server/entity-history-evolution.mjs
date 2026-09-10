import {clampLevel} from './entity-evolution-engine.mjs';

/**
 * Histoire vécue : Anecdotique=0, Mémorable=1, Marquant=2, Fondateur=3.
 * Même progression asymptotique positive que les autres jauges.
 * Si l'âge n'était pas connu à l'initialisation, la première évolution part de 0.
 */
export function applyHistoryEvent(current,event){
  if(!event)return{level:current,change:null};
  const before=clampLevel(current==null?0:current);
  const raw=Number(event?.niveau??event?.level);
  if(![0,1,2,3].includes(raw))throw new Error(`Niveau Histoire invalide: ${event?.niveau??event?.level}`);
  const after=Math.max(0,Math.min(100,before+raw*(1-before/100)));
  return{level:after,change:{niveau:raw,before,after,evenement:event?.evenement??null,nature:event?.nature??null,cause:event?.cause??null,justification:event?.justification??null}};
}
