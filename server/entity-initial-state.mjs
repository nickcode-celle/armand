import {createInitialMarbleAssignments} from './entity-marble-allocation.mjs';
import {initializeMarbleValues,initialHistoryLevel} from './entity-initializer.mjs';

/**
 * Initialise une seule fois la matière persistante d'EMÆÄ.
 * Le seed repose sur l'identité durable de l'Entity, jamais sur l'heure.
 * L'âge n'est utilisé que s'il est explicitement disponible.
 */
export function ensureInitialEvolutionState(state={},entityId,{age=null,at=new Date().toISOString()}={}){
  const current=state.evolution||{};
  if(Array.isArray(current.marbles)&&current.marbles.length&&current.durable_levels&&Object.keys(current.durable_levels).length)return current;
  const id=String(entityId||'').trim();
  if(!id)throw new Error('entityId requis pour initialiser EMÆÄ');
  const assigned=createInitialMarbleAssignments({seed:`${id}|allocation`});
  const initialized=initializeMarbleValues(assigned,{seed:`${id}|initial-values`});
  const ageHistory=age==null?null:initialHistoryLevel(age);
  return{
    ...current,
    marbles:initialized.marbles,
    durable_levels:{...initialized.durable_levels,'Capacités':initialized.capacities_level},
    history_level:current.history_level??ageHistory,
    history_events:Array.isArray(current.history_events)?current.history_events:[],
    initialized_at:current.initialized_at??at,
    updated_at:at
  };
}

export function hasInitialEvolutionState(state={}){
  return Array.isArray(state?.evolution?.marbles)&&state.evolution.marbles.length>0&&!!state.evolution?.durable_levels&&Object.keys(state.evolution.durable_levels).length>0;
}
