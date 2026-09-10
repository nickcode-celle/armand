import {recordSentimentAcquisition,acquisitionStatus} from './entity-sentiment-acquisition.mjs';
import {evaluateTierThreshold,evaluateSentimentReward,REWARD_TIER_COLORS} from './entity-reward-eligibility.mjs';

const TIERS=Object.freeze(['1','2','3','4']);
const QUALIFYING_OPERATIONS=new Set(['NAITRE','RENFORCER']);
export const ULTIMATE_GOLD='#FFC928';

export function rewardDefaults(){return{current_tier:'1',completed_tiers:[],threshold_open:false,acquisition_order_by_level:{},pending_rewards:[],reward_history:[],final_red_complete:false,ultimate_pending:false,ultimate_complete:false,updated_at:null}}

function canonicalIntensity(value){
  const raw=String(value??'').trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'');
  if(raw==='faible')return'faible';if(raw==='modere')return'modéré';if(raw==='fort')return'fort';return null;
}
function intensityRank(value){return{faible:1,'modéré':2,fort:3}[canonicalIntensity(value)]??0}
function average(value){
  if(value==null||value==='')return null;
  if(typeof value==='number')return Number.isFinite(value)?value:null;
  if(typeof value!=='object')return null;
  const xs=Object.values(value).filter(v=>v!=null&&v!=='').map(Number).filter(Number.isFinite);
  return xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;
}
export function rewardDomainLevels(evolution={}){
  const d=evolution?.durable_levels||{};
  const rawHistory=evolution?.history_level;
  const h=rawHistory==null||rawHistory===''?null:Number(rawHistory);
  return{'Personnalité':average(d['Personnalité']),'Relation':average(d['Relation']),'Goûts':average(d['Goûts']),'Opinions/Valeurs':average(d['Opinions/Valeurs']),'Connaissances':average(d['Connaissances']),'Monde propre':average(d['Monde propre']),'Histoire vécue':Number.isFinite(h)?h:null,'Capacités':average(d['Capacités'])};
}

function processUltimate(rewards,observerChanges,at){
  if(!rewards.final_red_complete||!rewards.ultimate_pending||rewards.ultimate_complete)return null;
  if((rewards.pending_rewards||[]).some(x=>x?.ultimate===true))return null;
  for(const change of Array.isArray(observerChanges)?observerChanges:[]){
    if(String(change?.sentiment||'').trim().toLowerCase()!=='amour')continue;
    if(!QUALIFYING_OPERATIONS.has(String(change?.operation||'').trim().toUpperCase()))continue;
    if(intensityRank(change?.intensite_apres??change?.intensity_after??change?.intensite??change?.intensity)<2)continue;
    if(String(change?.ancrage_relationnel??change?.relational_anchor??'').trim().toUpperCase()!=='ETABLI')continue;
    const item={id:`ultimate:logo:EMÆÄ:${at}`,tier:'ultimate',color:ULTIMATE_GOLD,sentiment:'Amour',target:{type:'logo',value:'EMÆÄ',color:ULTIMATE_GOLD,gold:true},created_at:at,status:'pending',completes_tier:false,ultimate:true};
    rewards.pending_rewards=[...(rewards.pending_rewards||[]),item];
    rewards.ultimate_pending=false;
    rewards.updated_at=at;
    return item;
  }
  return null;
}

/** Applique un tour complet au cycle de récompenses sentimentales. */
export function processRewardProgression({rewardState={},emotionState={},evolution={},observerChanges=[],at=new Date().toISOString()}={}){
  let rewards={...rewardDefaults(),...structuredClone(rewardState||{})};
  let emotion={...emotionState,acquired_by_level:{...(emotionState?.acquired_by_level||{})}};
  const tier=TIERS.includes(String(rewards.current_tier))?String(rewards.current_tier):null;

  if(!tier){
    const ultimate=processUltimate(rewards,observerChanges,at);
    return{rewardState:rewards,emotionState:emotion,rewards:ultimate?[ultimate]:[],threshold:null,status:null};
  }

  const threshold=evaluateTierThreshold({tier,population:Array.isArray(evolution?.marbles)?evolution.marbles.length:0,levels:rewardDomainLevels(evolution),completedTiers:rewards.completed_tiers});
  const wasOpen=rewards.threshold_open===true;
  rewards.threshold_open=wasOpen||threshold.threshold_valid;
  const produced=[];
  if(!rewards.threshold_open){rewards.updated_at=at;return{rewardState:rewards,emotionState:emotion,rewards:produced,threshold:{...threshold,threshold_open:false},status:acquisitionStatus(emotion,tier)}}

  if(!wasOpen&&threshold.threshold_valid){
    rewards.updated_at=at;
    return{rewardState:rewards,emotionState:emotion,rewards:produced,threshold:{...threshold,threshold_open:true,opened_now:true},status:acquisitionStatus(emotion,tier)};
  }

  const startStatus=acquisitionStatus(emotion,tier);
  const amourAccessibleAtStart=startStatus.amour_accessible;

  for(const change of Array.isArray(observerChanges)?observerChanges:[]){
    const operation=String(change?.operation??'').trim().toUpperCase();
    if(!QUALIFYING_OPERATIONS.has(operation))continue;
    const intensity=canonicalIntensity(change?.intensite_apres??change?.intensity_after??change?.intensite??change?.intensity);
    if(!intensity)continue;
    if(String(change?.sentiment||'').trim().toLowerCase()==='amour'&&!amourAccessibleAtStart)continue;

    const eligibility=evaluateSentimentReward({emotionState:emotion,sentiment:change?.sentiment,intensity,relationalAnchor:change?.ancrage_relationnel??change?.relational_anchor,tier,thresholdValid:true});
    if(!eligibility.ready)continue;

    emotion=recordSentimentAcquisition(emotion,{sentiment:eligibility.sentiment,level:tier});
    const status=acquisitionStatus(emotion,tier);
    rewards.acquisition_order_by_level={...(rewards.acquisition_order_by_level||{}),[tier]:status.acquired};
    const item={id:`${tier}:${eligibility.reward.type}:${eligibility.reward.value}:${status.acquired.length}:${at}`,tier,color:REWARD_TIER_COLORS[tier],sentiment:eligibility.sentiment,target:eligibility.reward,created_at:at,status:'pending',completes_tier:eligibility.completes_tier===true};
    rewards.pending_rewards=[...(rewards.pending_rewards||[]),item];
    produced.push(item);

    if(eligibility.completes_tier){
      rewards.completed_tiers=[...new Set([...(rewards.completed_tiers||[]),tier])];
      rewards.threshold_open=false;
      if(tier==='4'){
        rewards.final_red_complete=true;
        rewards.ultimate_pending=true;
        rewards.ultimate_complete=false;
        rewards.current_tier=null;
      }else rewards.current_tier=String(Number(tier)+1);
      break;
    }
  }

  rewards.updated_at=at;
  return{rewardState:rewards,emotionState:emotion,rewards:produced,threshold:{...threshold,threshold_open:true},status:acquisitionStatus(emotion,tier)};
}

export function acknowledgeReward(rewardState={},rewardId,{at=new Date().toISOString()}={}){
  const state={...rewardDefaults(),...structuredClone(rewardState||{})};
  const id=String(rewardId||'');
  const found=(state.pending_rewards||[]).find(x=>x.id===id);
  if(!found)return state;
  state.pending_rewards=(state.pending_rewards||[]).filter(x=>x.id!==id);
  state.reward_history=[...(state.reward_history||[]),{...found,status:'shown',shown_at:at}].slice(-200);
  if(found.ultimate===true)state.ultimate_complete=true;
  state.updated_at=at;
  return state;
}
