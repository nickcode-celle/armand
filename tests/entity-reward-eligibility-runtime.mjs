import assert from 'node:assert/strict';
import {evaluateRewardEligibility,REWARD_SHAPE_BY_SENTIMENT,REWARD_TIER_COLORS} from '../server/entity-reward-eligibility.mjs';

const blocked=evaluateRewardEligibility({sentiment:'Joie',level:1,constraints:{population:true,domains:false}});
assert.equal(blocked.constraints_valid,false);
assert.equal(blocked.blocked_reason,'constraints');
assert.deepEqual(blocked.target,{type:'digit',value:1,color:'#28C95B'});

const ready=evaluateRewardEligibility({sentiment:'Fierté',level:2,constraints:{population:true,domains:true,previous:true}});
assert.equal(ready.constraints_valid,true);
assert.equal(ready.blocked_reason,null);
assert.deepEqual(ready.target,{type:'digit',value:6,color:'#2468D8'});
assert.equal(ready.graphic_behavior,null);

const emotionState={acquired_by_level:{'3':['Joie','Tristesse','Colère','Peur','Surprise','Fierté','Tendresse','Confiance']}};
const love=evaluateRewardEligibility({emotionState,sentiment:'Amour',level:3,constraints:{population:true,domains:true}});
assert.equal(love.constraints_valid,true);
assert.deepEqual(love.target,{type:'logo',value:'EMÆÄ',color:'#7137C8'});

const loveLocked=evaluateRewardEligibility({emotionState:{acquired_by_level:{'3':['Joie']}},sentiment:'Amour',level:3,constraints:{population:true,domains:true}});
assert.equal(loveLocked.constraints_valid,false);
assert.equal(loveLocked.blocked_reason,'amour_locked');

assert.equal(REWARD_SHAPE_BY_SENTIMENT.Confiance.value,8);
assert.equal(REWARD_TIER_COLORS['4'],'#E5231F');
assert.equal(REWARD_TIER_COLORS.ultimate,'gold');

console.log('Entity reward eligibility runtime tests: OK');
