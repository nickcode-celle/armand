import {normalizeSentiment} from './entity-emotion-engine.mjs';
import {recordSentimentAcquisition,acquisitionStatus} from './entity-sentiment-acquisition.mjs';
import {evaluateSentimentReward} from './entity-reward-eligibility.mjs';

const QUALIFYING_OPERATIONS=new Set(['NAITRE','RENFORCER']);

function canonicalIntensity(value){
  const raw=String(value??'').trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'');
  if(raw==='faible')return'faible';
  if(raw==='modere')return'modéré';
  if(raw==='fort')return'fort';
  return null;
}

/**
 * Traite uniquement les événements émotionnels du tour courant.
 * - Le palier doit déjà être ouvert.
 * - Un sentiment non-Amour est acquis lorsqu'un événement NAITRE ou RENFORCER
 *   l'amène à une intensité au moins MODÉRÉE.
 * - Une acquisition déjà faite dans ce palier n'est jamais rejouée.
 * - Le rang d'acquisition détermine le chiffre 1..8.
 * - Amour n'est accepté qu'après les 8 acquisitions, via un événement postérieur,
 *   au moins MODÉRÉ, avec ancrage_relationnel=ETABLI.
 */
export function processRewardProgression({emotionState={},observerChanges=[],tier,thresholdValid=false,at=new Date().toISOString()}={}){
  let state={...emotionState};
  const rewards=[];

  for(const change of Array.isArray(observerChanges)?observerChanges:[]){
    const operation=String(change?.operation??'').trim().toUpperCase();
    if(!QUALIFYING_OPERATIONS.has(operation))continue;

    const sentiment=normalizeSentiment(change?.sentiment);
    const intensity=canonicalIntensity(change?.intensite_apres??change?.intensity_after??change?.intensite??change?.intensity);
    if(!intensity)continue;

    const eligibility=evaluateSentimentReward({
      emotionState:state,
      sentiment,
      intensity,
      relationalAnchor:change?.ancrage_relationnel??change?.relational_anchor,
      tier,
      thresholdValid
    });
    if(!eligibility.ready)continue;

    state=recordSentimentAcquisition(state,{sentiment,level:tier});
    rewards.push({
      ...eligibility.reward,
      tier:String(tier),
      sentiment,
      acquired_at:at,
      completes_tier:eligibility.completes_tier===true
    });
  }

  return{
    emotionState:state,
    rewards,
    status:acquisitionStatus(state,tier)
  };
}
