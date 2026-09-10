import {EMOTION_SENTIMENTS,normalizeSentiment} from './entity-emotion-engine.mjs';
import {canAcquireAmour} from './entity-sentiment-acquisition.mjs';

const BASE=Object.freeze(EMOTION_SENTIMENTS.filter(s=>s!=='Amour'));
const SHAPE_BY_SENTIMENT=Object.freeze(Object.fromEntries(BASE.map((s,i)=>[s,{type:'digit',value:i+1}]).concat([['Amour',{type:'logo',value:'EMÆÄ'}]])));
const TIER_COLORS=Object.freeze({
  '1':'#28C95B',
  '2':'#2468D8',
  '3':'#7137C8',
  '4':'#E5231F',
  'ultimate':'gold'
});

function normalizeLevel(level){
  const raw=String(level??'').trim().toLowerCase();
  if(raw==='ultime'||raw==='ultimate'||raw==='or'||raw==='gold')return'ultimate';
  if(['1','2','3','4'].includes(raw))return raw;
  throw new Error(`Palier de récompense invalide: ${level}`);
}

function normalizeConstraints(input){
  if(input===true)return[{id:'all',valid:true}];
  if(!input||typeof input!=='object')return[];
  if(Array.isArray(input))return input.map((x,i)=>({id:String(x?.id??i),valid:x?.valid===true}));
  return Object.entries(input).map(([id,valid])=>({id,valid:valid===true}));
}

/**
 * Évalue uniquement l'éligibilité d'une récompense émotionnelle.
 * Aucun sentiment ne produit d'effet graphique propre.
 * Une récompense n'est prête que si TOUTES ses autres contraintes sont vraies
 * et si les règles particulières du sentiment sont respectées.
 */
export function evaluateRewardEligibility({emotionState={},sentiment,level,constraints}={}){
  const canonical=normalizeSentiment(sentiment);
  const tier=normalizeLevel(level);
  const checks=normalizeConstraints(constraints);
  const constraintsValid=checks.length>0&&checks.every(x=>x.valid);
  const amourUnlocked=canonical!=='Amour'||canAcquireAmour(emotionState,tier);
  const shape=SHAPE_BY_SENTIMENT[canonical];
  return{
    reward_id:`${tier}:${canonical}`,
    sentiment:canonical,
    level:tier,
    constraints:checks,
    constraints_valid:constraintsValid&&amourUnlocked,
    blocked_reason:!constraintsValid?'constraints':(!amourUnlocked?'amour_locked':null),
    required_sentiment:canonical,
    target:{...shape,color:TIER_COLORS[tier]},
    graphic_behavior:null
  };
}

export function buildRewardCandidates({emotionState={},level,constraintsBySentiment={}}={}){
  return EMOTION_SENTIMENTS.map(sentiment=>evaluateRewardEligibility({
    emotionState,
    sentiment,
    level,
    constraints:constraintsBySentiment[sentiment]
  }));
}

export const REWARD_SHAPE_BY_SENTIMENT=SHAPE_BY_SENTIMENT;
export const REWARD_TIER_COLORS=TIER_COLORS;
