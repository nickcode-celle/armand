import assert from 'node:assert/strict';
import {processRewardProgression,acknowledgeReward,rewardDomainLevels,ULTIMATE_GOLD} from '../server/entity-reward-progression.mjs';

const evolution={
  marbles:Array.from({length:300},(_,i)=>({id:`m${i}`})),
  durable_levels:{
    'Personnalité':{a:40,b:42},'Relation':{a:41,b:42},'Goûts':{a:42},'Opinions/Valeurs':{a:43},'Connaissances':{a:42},'Monde propre':{a:41},'Capacités':10
  },
  history_level:42
};
assert.equal(rewardDomainLevels(evolution)['Personnalité'],41);

let emotion={active:[],last_changes:[],acquired_by_level:{},updated_at:null};
let rewardState={};

let out=processRewardProgression({rewardState,emotionState:emotion,evolution,observerChanges:[{sentiment:'Peur',operation:'NAITRE',intensite_apres:'modéré'}],at:'2026-09-10T10:00:00Z'});
assert.equal(out.threshold.threshold_valid,true);
assert.equal(out.threshold.opened_now,true);
assert.equal(out.rewards.length,0);
assert.equal(out.status.acquired.length,0);

// Un palier ouvert reste acquis même si les domaines repassent ensuite sous son seuil.
const dropped={...evolution,durable_levels:{...evolution.durable_levels,'Personnalité':{a:10},'Relation':{a:10},'Goûts':{a:10},'Opinions/Valeurs':{a:10},'Connaissances':{a:10},'Monde propre':{a:10}},history_level:10};
out=processRewardProgression({rewardState:out.rewardState,emotionState:out.emotionState,evolution:dropped,observerChanges:[{sentiment:'Peur',operation:'NAITRE',intensite_apres:'modéré'}],at:'2026-09-10T10:01:00Z'});
assert.equal(out.threshold.threshold_valid,false);
assert.equal(out.threshold.threshold_open,true);
assert.equal(out.rewards.length,1);
assert.equal(out.rewards[0].target.value,1);
emotion=out.emotionState;rewardState=out.rewardState;

out=processRewardProgression({rewardState,emotionState:emotion,evolution:dropped,observerChanges:[{sentiment:'Peur',operation:'RENFORCER',intensite_apres:'fort'}],at:'2026-09-10T10:02:00Z'});
assert.equal(out.rewards.length,0);

for(const sentiment of ['Joie','Tristesse','Colère','Surprise','Fierté','Tendresse']){
  out=processRewardProgression({rewardState:out.rewardState,emotionState:out.emotionState,evolution:dropped,observerChanges:[{sentiment,operation:'NAITRE',intensite_apres:'modéré'}],at:`2026-09-10T10:0${Math.min(9,out.rewardState.pending_rewards.length+2)}:00Z`});
}
assert.equal(out.status.acquired.length,7);

out=processRewardProgression({rewardState:out.rewardState,emotionState:out.emotionState,evolution:dropped,observerChanges:[
  {sentiment:'Confiance',operation:'NAITRE',intensite_apres:'modéré'},
  {sentiment:'Amour',operation:'NAITRE',intensite_apres:'modéré',ancrage_relationnel:'ETABLI'}
],at:'2026-09-10T10:15:00Z'});
assert.equal(out.status.acquired.length,8);
assert.equal(out.rewards.length,1);
assert.equal(out.rewards[0].target.value,8);

out=processRewardProgression({rewardState:out.rewardState,emotionState:out.emotionState,evolution:dropped,observerChanges:[{sentiment:'Amour',operation:'NAITRE',intensite_apres:'modéré',ancrage_relationnel:'ETABLI'}],at:'2026-09-10T10:20:00Z'});
assert.equal(out.rewards[0].target.type,'logo');
assert.equal(out.rewardState.current_tier,'2');

const first=out.rewardState.pending_rewards[0];
const ack=acknowledgeReward(out.rewardState,first.id,{at:'2026-09-10T10:21:00Z'});
assert.equal(ack.reward_history.at(-1).status,'shown');

// Rouge : le nouvel Amour ultime ne peut commencer qu'après affichage confirmé du logo rouge.
const redLogo={id:'4:logo:EMÆÄ:test',tier:'4',color:'#E5231F',sentiment:'Amour',target:{type:'logo',value:'EMÆÄ',color:'#E5231F'},created_at:'2026-09-10T10:50:00Z',status:'pending',completes_tier:true};
let ultimateState={...out.rewardState,current_tier:null,completed_tiers:['1','2','3','4'],pending_rewards:[redLogo],final_red_complete:true,ultimate_pending:false,ultimate_complete:false};
let ultimate=processRewardProgression({rewardState:ultimateState,emotionState:out.emotionState,evolution,observerChanges:[{sentiment:'Amour',operation:'RENFORCER',intensite_apres:'fort',ancrage_relationnel:'ETABLI'}],at:'2026-09-10T11:00:00Z'});
assert.equal(ultimate.rewards.length,0);
assert.equal(ultimate.rewardState.ultimate_pending,false);
ultimateState=acknowledgeReward(ultimate.rewardState,redLogo.id,{at:'2026-09-10T11:00:30Z'});
assert.equal(ultimateState.ultimate_pending,true);

// Un maintien ne suffit jamais : il faut un nouvel événement Amour qualifiant.
ultimate=processRewardProgression({rewardState:ultimateState,emotionState:out.emotionState,evolution,observerChanges:[{sentiment:'Amour',operation:'MAINTENIR',intensite_apres:'fort',ancrage_relationnel:'ETABLI'}],at:'2026-09-10T11:01:00Z'});
assert.equal(ultimate.rewards.length,0);
ultimate=processRewardProgression({rewardState:ultimate.rewardState,emotionState:out.emotionState,evolution,observerChanges:[{sentiment:'Amour',operation:'RENFORCER',intensite_apres:'modéré',ancrage_relationnel:'ETABLI'}],at:'2026-09-10T11:02:00Z'});
assert.equal(ultimate.rewards.length,1);
assert.equal(ultimate.rewards[0].target.type,'logo');
assert.equal(ultimate.rewards[0].target.color,ULTIMATE_GOLD);
assert.equal(ultimate.rewards[0].target.gold,true);
assert.equal(ultimate.rewardState.ultimate_pending,false);
assert.equal(ultimate.rewardState.ultimate_complete,false);
const goldAck=acknowledgeReward(ultimate.rewardState,ultimate.rewards[0].id,{at:'2026-09-10T11:03:00Z'});
assert.equal(goldAck.ultimate_complete,true);

console.log('Entity reward progression runtime tests: OK');
