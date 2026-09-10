import {normalizeSentiment} from './entity-emotion-engine.mjs';
import {canAcquireAmour,acquisitionStatus} from './entity-sentiment-acquisition.mjs';

export const REWARD_TIER_COLORS=Object.freeze({
  '1':'#28C95B',
  '2':'#2468D8',
  '3':'#7137C8',
  '4':'#E5231F'
});

const DOMAIN_NAMES=Object.freeze([
  'Personnalité','Relation','Goûts','Opinions/Valeurs','Connaissances','Monde propre','Histoire vécue','Capacités'
]);
const PREVIOUS_TIERS=Object.freeze({'1':[],'2':['1'],'3':['1','2'],'4':['1','2','3']});

function tierKey(level){
  const key=String(level??'').trim();
  if(!['1','2','3','4'].includes(key))throw new Error(`Palier invalide: ${level}`);
  return key;
}

function numericOrNaN(value){
  if(value==null||value==='')return Number.NaN;
  const n=Number(value);
  return Number.isFinite(n)?n:Number.NaN;
}
function domainValues(levels={}){
  return DOMAIN_NAMES.map(name=>({name,value:numericOrNaN(levels?.[name])}));
}

function inRange(v,min,max){return Number.isFinite(v)&&v>=min&&v<=max}
function spreadOK(items,maxSpread=3){
  if(!items.length)return false;
  const vals=items.map(x=>x.value);
  return Math.max(...vals)-Math.min(...vals)<=maxSpread;
}
function chooseGroup(items,count,min,max,maxSpread=3,excluded=new Set()){
  const eligible=items.filter(x=>!excluded.has(x.name)&&inRange(x.value,min,max));
  if(eligible.length<count)return null;
  let found=null;
  function walk(start,pick){
    if(found)return;
    if(pick.length===count){if(spreadOK(pick,maxSpread))found=[...pick];return}
    for(let i=start;i<eligible.length;i++)walk(i+1,[...pick,eligible[i]]);
  }
  walk(0,[]);
  return found;
}

/** Seuils d'entrée des quatre paliers sentimentaux. */
export function evaluateTierThreshold({tier,population,levels={},completedTiers=[]}={}){
  const key=tierKey(tier);
  const pop=Number(population);
  const domains=domainValues(levels);
  const completed=new Set((completedTiers||[]).map(String));
  const previousComplete=PREVIOUS_TIERS[key].every(x=>completed.has(x));
  let valid=false,groups=[];

  if(key==='1'){
    const g=chooseGroup(domains,6,40,45,3);
    valid=pop>=300&&!!g; if(g)groups=[g.map(x=>x.name)];
  }else if(key==='2'){
    const g=chooseGroup(domains,5,60,65,3);
    valid=pop>=500&&previousComplete&&!!g; if(g)groups=[g.map(x=>x.name)];
  }else if(key==='3'){
    const high=chooseGroup(domains,3,75,80,3);
    const excluded=new Set((high||[]).map(x=>x.name));
    const mid=high?chooseGroup(domains,3,43,46,3,excluded):null;
    valid=pop>=1000&&previousComplete&&!!high&&!!mid;
    if(high&&mid)groups=[high.map(x=>x.name),mid.map(x=>x.name)];
  }else{
    const high=chooseGroup(domains,5,90,95,3);
    valid=pop>=2000&&previousComplete&&domains.every(x=>inRange(x.value,70,100))&&!!high;
    if(high)groups=[high.map(x=>x.name)];
  }

  return{tier:key,color:REWARD_TIER_COLORS[key],population:pop,previous_tiers_complete:previousComplete,threshold_valid:valid,matched_groups:groups};
}

/** Le chiffre dépend du rang d'acquisition dans le palier, jamais du sentiment. */
export function evaluateSentimentReward({emotionState={},sentiment,intensity,relationalAnchor,tier,thresholdValid=false}={}){
  const key=tierKey(tier);
  const canonical=normalizeSentiment(sentiment);
  const rawIntensity=String(intensity??'').trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'');
  const rank={faible:1,modere:2,fort:3}[rawIntensity]??0;
  const status=acquisitionStatus(emotionState,key);
  const already=status.acquired.includes(canonical);
  if(!thresholdValid)return{ready:false,blocked_reason:'tier_threshold'};
  if(rank<2)return{ready:false,blocked_reason:'intensity'};

  if(canonical==='Amour'){
    if(!canAcquireAmour(emotionState,key))return{ready:false,blocked_reason:'amour_locked'};
    if(String(relationalAnchor??'').trim().toUpperCase()!=='ETABLI')return{ready:false,blocked_reason:'relational_anchor'};
    if(already)return{ready:false,blocked_reason:'already_acquired'};
    return{ready:true,tier:key,sentiment:canonical,reward:{type:'logo',value:'EMÆÄ',color:REWARD_TIER_COLORS[key]},completes_tier:true};
  }

  if(already)return{ready:false,blocked_reason:'already_acquired'};
  const digit=status.acquired.filter(s=>s!=='Amour').length+1;
  if(digit<1||digit>8)throw new Error('Compteur de sentiments hors limites');
  return{ready:true,tier:key,sentiment:canonical,reward:{type:'digit',value:digit,color:REWARD_TIER_COLORS[key]},completes_tier:false};
}

export const REWARD_DOMAIN_NAMES=DOMAIN_NAMES;
