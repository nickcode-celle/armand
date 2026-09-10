import {EMOTION_SENTIMENTS,normalizeSentiment} from './entity-emotion-engine.mjs';

const BASE_SENTIMENTS=Object.freeze(EMOTION_SENTIMENTS.filter(s=>s!=='Amour'));

function levelKey(level){
  const key=String(level??'').trim();
  if(!key)throw new Error('Niveau de sentiment manquant');
  return key;
}

export function acquiredAtLevel(state={},level){
  const key=levelKey(level);
  const raw=state?.acquired_by_level?.[key];
  return new Set(Array.isArray(raw)?raw.map(normalizeSentiment):[]);
}

export function canAcquireAmour(state={},level){
  const acquired=acquiredAtLevel(state,level);
  return BASE_SENTIMENTS.every(s=>acquired.has(s));
}

/**
 * Enregistre une acquisition de sentiment pour un niveau donné.
 * Un sentiment actif n'est PAS automatiquement une acquisition :
 * cette fonction doit être appelée explicitement par la mécanique de récompense.
 * Amour n'est enregistrable qu'après les 8 autres sentiments du même niveau.
 */
export function recordSentimentAcquisition(state={}, {sentiment,level}){
  const canonical=normalizeSentiment(sentiment);
  const key=levelKey(level);
  const acquired=acquiredAtLevel(state,key);

  if(canonical==='Amour'&&!canAcquireAmour(state,key)){
    throw new Error(`Amour verrouillé au niveau ${key}: les 8 autres sentiments doivent être acquis`);
  }

  acquired.add(canonical);
  const order=EMOTION_SENTIMENTS.filter(s=>acquired.has(s));
  return{
    ...state,
    acquired_by_level:{
      ...(state.acquired_by_level||{}),
      [key]:order
    }
  };
}

export function acquisitionStatus(state={},level){
  const key=levelKey(level);
  const acquired=acquiredAtLevel(state,key);
  const missing=BASE_SENTIMENTS.filter(s=>!acquired.has(s));
  return{
    level:key,
    acquired:EMOTION_SENTIMENTS.filter(s=>acquired.has(s)),
    missing_before_amour:missing,
    amour_accessible:missing.length===0,
    complete:EMOTION_SENTIMENTS.every(s=>acquired.has(s))
  };
}

export const EMOTION_BASE_SENTIMENTS=BASE_SENTIMENTS;
