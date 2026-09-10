import {clampLevel} from './entity-evolution-engine.mjs';

/**
 * Histoire vécue : Anecdotique=0, Mémorable=1, Marquant=2, Fondateur=3.
 * Même progression asymptotique positive que les autres jauges.
 */
export function applyHistoryEvent(current,event){
  if(!event)return{level:current,change:null};
  if(current==null)throw new Error('Histoire vécue non initialisée');
  const before=clampLevel(current);
  const raw=Number(event?.niveau??event?.level);
  if(![0,1,2,3].includes(raw))throw new Error(`Niveau Histoire invalide: ${event?.niveau??event?.level}`);
  const after=Math.max(0,Math.min(100,before+raw*(1-before/100)));
  return{level:after,change:{niveau:raw,before,after,cause:event?.cause??null,justification:event?.justification??null}};
}
