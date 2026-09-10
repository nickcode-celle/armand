import assert from 'node:assert/strict';
import {buildRewardTriggerSignals} from '../server/entity-emotion-graphics-contract.mjs';

const emotion={active:[
  {sentiment:'Joie',intensite:'faible'},
  {sentiment:'Fierté',intensite:'modéré'}
]};

const signals=buildRewardTriggerSignals(emotion,[
  {reward_id:'reward-green-1',required_sentiment:'Joie',constraints_valid:true},
  {reward_id:'reward-logo',required_sentiment:'Fierté',constraints_valid:false},
  {reward_id:'reward-other',required_sentiment:'Peur',constraints_valid:true}
]);

assert.equal(signals.length,1);
assert.equal(signals[0].reward_id,'reward-green-1');
assert.equal(signals[0].trigger_sentiment,'Joie');
assert.equal(signals[0].ready,true);
assert.equal(signals[0].source,'D');
assert.equal(signals[0].graphic_behavior,null);

const none=buildRewardTriggerSignals({active:[]},[
  {reward_id:'reward-green-1',required_sentiment:'Joie',constraints_valid:true}
]);
assert.equal(none.length,0);

let oldRejected=false;
try{buildRewardTriggerSignals({active:[{sentiment:'Gratitude'}]},[])}catch{oldRejected=true}
assert.equal(oldRejected,true);

console.log('Entity emotion reward trigger contract runtime tests: OK');
