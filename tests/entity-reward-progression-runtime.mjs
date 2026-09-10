import assert from 'node:assert/strict';
import {processRewardProgression} from '../server/entity-reward-progression.mjs';

let emotion={active:[],last_changes:[],acquired_by_level:{},updated_at:null};

let out=processRewardProgression({emotionState:emotion,tier:1,thresholdValid:false,observerChanges:[{sentiment:'Peur',operation:'NAITRE',intensite_apres:'modéré'}]});
assert.equal(out.rewards.length,0);
assert.equal(out.status.acquired.length,0);

out=processRewardProgression({emotionState:emotion,tier:1,thresholdValid:true,observerChanges:[{sentiment:'Peur',operation:'NAITRE',intensite_apres:'faible'}]});
assert.equal(out.rewards.length,0);

out=processRewardProgression({emotionState:emotion,tier:1,thresholdValid:true,observerChanges:[{sentiment:'Peur',operation:'NAITRE',intensite_apres:'modéré'}]});
assert.equal(out.rewards.length,1);
assert.equal(out.rewards[0].value,1);
assert.equal(out.rewards[0].sentiment,'Peur');
emotion=out.emotionState;

out=processRewardProgression({emotionState:emotion,tier:1,thresholdValid:true,observerChanges:[{sentiment:'Peur',operation:'RENFORCER',intensite_apres:'fort'}]});
assert.equal(out.rewards.length,0);

const others=['Joie','Tristesse','Colère','Surprise','Fierté','Tendresse','Confiance'];
for(const sentiment of others){
  out=processRewardProgression({emotionState:emotion,tier:1,thresholdValid:true,observerChanges:[{sentiment,operation:'NAITRE',intensite_apres:'modéré'}]});
  emotion=out.emotionState;
}
assert.equal(out.status.acquired.length,8);
assert.equal(out.status.amour_accessible,true);
assert.equal(out.rewards.at(-1).value,8);

out=processRewardProgression({emotionState:emotion,tier:1,thresholdValid:true,observerChanges:[{sentiment:'Amour',operation:'MAINTENIR',intensite_apres:'fort',ancrage_relationnel:'ETABLI'}]});
assert.equal(out.rewards.length,0);

out=processRewardProgression({emotionState:emotion,tier:1,thresholdValid:true,observerChanges:[{sentiment:'Amour',operation:'NAITRE',intensite_apres:'modéré',ancrage_relationnel:'ETABLI'}]});
assert.equal(out.rewards.length,1);
assert.equal(out.rewards[0].type,'logo');
assert.equal(out.rewards[0].completes_tier,true);
assert.equal(out.status.complete,true);

console.log('Entity reward progression runtime tests: OK');
