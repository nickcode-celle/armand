import {EMOTION_SENTIMENTS,normalizeSentiment} from './entity-emotion-engine.mjs';

const BASE_SENTIMENTS=Object.freeze(EMOTION_SENTIMENTS.filter(s=>s!=='Amour'));

function levelKey(level){
  const key=String(level??'').trim();
  if(!key)throw new Error('Niveau de sentiment manquant');
  return key;
}

function acquiredSequence(state={},level){
  const key=levelKey(level),raw=state?.acquired_by_level?.[key];
  if(!Array.isArray(raw))return[];
  const seen=new Set(),out=[];
  for(const item of raw){
    const canonical=normalizeSentiment(item);
    if(seen.has(canonical))continue;
    seen.add(canonical);out.push(canonical);
  }
  return out;
}

export function acquiredAtLevel(state={},level){return new Set(acquiredSequence(state,level))}

export function canAcquireAmour(state={},level){
  const acquired=acquiredAtLevel(state,level);
  return BASE_SENTIMENTS.every(s=>acquired.has(s));
}

/**
 * Enregistre l'ordre réel d'acquisition pour un niveau donné.
 * L'ordre ne dépend jamais de la liste canonique des sentiments : il est celui des
 * événements réellement acquis. Cela permet au rang 1..8 de rester fidèle à l'histoire.
 */
export function recordSentimentAcquisition(state={}, {sentiment,level}){
  const canonical=normalizeSentiment(sentiment),key=levelKey(level),sequence=acquiredSequence(state,key),acquired=new Set(sequence);
  if(canonical==='Amour'&&!canAcquireAmour(state,key))throw new Error(`Amour verrouillé au niveau ${key}: les 8 autres sentiments doivent être acquis`);
  if(!acquired.has(canonical))sequence.push(canonical);
  return{...state,acquired_by_level:{...(state.acquired_by_level||{}),[key]:sequence}};
}

export function acquisitionStatus(state={},level){
  const key=levelKey(level),sequence=acquiredSequence(state,key),acquired=new Set(sequence),missing=BASE_SENTIMENTS.filter(s=>!acquired.has(s));
  return{
    level:key,
    acquired:sequence,
    missing_before_amour:missing,
    amour_accessible:missing.length===0,
    complete:EMOTION_SENTIMENTS.every(s=>acquired.has(s))
  };
}

export const EMOTION_BASE_SENTIMENTS=BASE_SENTIMENTS;
