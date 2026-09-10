import assert from 'node:assert/strict';
import {processRewardProgression,acknowledgeReward,rewardDomainLevels} from '../server/entity-reward-progression.mjs';

const evolution={
  marbles:Array.from({length:300},(_,i)=>({id:`m${i}`})),
  durable_levels:{
    'Personnalité':{a:40,b:42},'Relation':{a:41,b:42},'Goûts':{a:42},'Opinions/Valeurs':{a:43},'Connaissances':{a:42},'Monde propre':{a:41},'Capacités':10
  },
  history_level:20
};
assert.equal(rewardDomainLevels(evolution)['Personnalité'],41);

let emotion={active:[],last_changes:[],acquired_by_level:{},updated_at:null};
let rewardState={};

// Le tour qui atteint le seuil ouvre le palier mais ne compte pas encore un sentiment.
let out=processRewardProgression({rewardState,emotionState:emotion,evolution,observerChanges:[{sentiment:'Peur',operation:'NAITRE',intensite_apres:'modéré'}],at:'2026-09-10T10:00:00Z'});
assert.equal(out.threshold.threshold_valid,true);
assert.equal(out.threshold.opened_now,true);
assert.equal(out.rewards.length,0);
assert.equal(out.status.acquired.length,0);

out=processRewardProgression({rewardState:out.rewardState,emotionState:out.emotionState,evolution,observerChanges:[{sentiment:'Peur',operation:'NAITRE',intensite_apres:'modéré'}],at:'2026-09-10T10:01:00Z'});
assert.equal(out.rewards.length,1);
assert.equal(out.rewards[0].target.value,1);
assert.equal(out.rewardState.pending_rewards.length,1);
emotion=out.emotionState;rewardState=out.rewardState;

out=processRewardProgression({rewardState,emotionState:emotion,evolution,observerChanges:[{sentiment:'Peur',operation:'RENFORCER',intensite_apres:'fort'}],at:'2026-09-10T10:02:00Z'});
assert.equal(out.rewards.length,0);

for(const sentiment of ['Joie','Tristesse','Colère','Surprise','Fierté','Tendresse']){
  out=processRewardProgression({rewardState:out.rewardState,emotionState:out.emotionState,evolution,observerChanges:[{sentiment,operation:'NAITRE',intensite_apres:'modéré'}],at:`2026-09-10T10:0${Math.min(9,out.rewardState.pending_rewards.length+2)}:00Z`});
}
assert.equal(out.status.acquired.length,7);

// Le 8e sentiment et Amour dans le même tour : seul le 8e compte.
out=processRewardProgression({rewardState:out.rewardState,emotionState:out.emotionState,evolution,observerChanges:[
  {sentiment:'Confiance',operation:'NAITRE',intensite_apres:'modéré'},
  {sentiment:'Amour',operation:'NAITRE',intensite_apres:'modéré',ancrage_relationnel:'ETABLI'}
],at:'2026-09-10T10:15:00Z'});
assert.equal(out.status.acquired.length,8);
assert.equal(out.status.amour_accessible,true);
assert.equal(out.rewards.length,1);
assert.equal(out.rewards[0].target.value,8);

// Amour doit être un nouvel événement postérieur au déverrouillage.
out=processRewardProgression({rewardState:out.rewardState,emotionState:out.emotionState,evolution,observerChanges:[{sentiment:'Amour',operation:'NAITRE',intensite_apres:'modéré',ancrage_relationnel:'ETABLI'}],at:'2026-09-10T10:20:00Z'});
assert.equal(out.rewards.length,1);
assert.equal(out.rewards[0].target.type,'logo');
assert.deepEqual(out.rewardState.completed_tiers,['1']);
assert.equal(out.rewardState.current_tier,'2');

const first=out.rewardState.pending_rewards[0];
const ack=acknowledgeReward(out.rewardState,first.id,{at:'2026-09-10T10:21:00Z'});
assert.equal(ack.pending_rewards.length,out.rewardState.pending_rewards.length-1);
assert.equal(ack.reward_history.at(-1).status,'shown');

console.log('Entity reward progression runtime tests: OK');
