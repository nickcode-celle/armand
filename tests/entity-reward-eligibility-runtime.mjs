import assert from 'node:assert/strict';
import {evaluateTierThreshold,evaluateSentimentReward,REWARD_TIER_COLORS} from '../server/entity-reward-eligibility.mjs';

const tier1=evaluateTierThreshold({tier:1,population:300,levels:{
  'Personnalité':40,'Relation':41,'Goûts':42,'Opinions/Valeurs':43,'Connaissances':42,'Monde propre':41,'Histoire vécue':20,'Capacités':10
}});
assert.equal(tier1.threshold_valid,true);
assert.equal(tier1.color,'#28C95B');

const tier1SpreadFail=evaluateTierThreshold({tier:1,population:300,levels:{
  'Personnalité':40,'Relation':41,'Goûts':42,'Opinions/Valeurs':43,'Connaissances':44,'Monde propre':45,'Histoire vécue':20,'Capacités':10
}});
assert.equal(tier1SpreadFail.threshold_valid,false);

const tier2Locked=evaluateTierThreshold({tier:2,population:500,completedTiers:[],levels:{
  'Personnalité':61,'Relation':62,'Goûts':63,'Opinions/Valeurs':61,'Connaissances':62,'Monde propre':20,'Histoire vécue':20,'Capacités':20
}});
assert.equal(tier2Locked.threshold_valid,false);

const tier2=evaluateTierThreshold({tier:2,population:500,completedTiers:['1'],levels:{
  'Personnalité':61,'Relation':62,'Goûts':63,'Opinions/Valeurs':61,'Connaissances':62,'Monde propre':20,'Histoire vécue':20,'Capacités':20
}});
assert.equal(tier2.threshold_valid,true);

const tier3=evaluateTierThreshold({tier:3,population:1000,completedTiers:['1','2'],levels:{
  'Personnalité':75,'Relation':76,'Goûts':77,'Opinions/Valeurs':43,'Connaissances':44,'Monde propre':46,'Histoire vécue':20,'Capacités':20
}});
assert.equal(tier3.threshold_valid,true);

const tier4=evaluateTierThreshold({tier:4,population:2000,completedTiers:['1','2','3'],levels:{
  'Personnalité':90,'Relation':91,'Goûts':92,'Opinions/Valeurs':93,'Connaissances':92,'Monde propre':75,'Histoire vécue':74,'Capacités':70
}});
assert.equal(tier4.threshold_valid,true);

const emotionState={acquired_by_level:{'1':['Peur']}};
const next=evaluateSentimentReward({emotionState,sentiment:'Joie',intensity:'modéré',tier:1,thresholdValid:true});
assert.equal(next.ready,true);
assert.deepEqual(next.reward,{type:'digit',value:2,color:'#28C95B'});

const repeat=evaluateSentimentReward({emotionState,sentiment:'Peur',intensity:'fort',tier:1,thresholdValid:true});
assert.equal(repeat.ready,false);
assert.equal(repeat.blocked_reason,'already_acquired');

const low=evaluateSentimentReward({emotionState,sentiment:'Joie',intensity:'faible',tier:1,thresholdValid:true});
assert.equal(low.ready,false);
assert.equal(low.blocked_reason,'intensity');

const eight={acquired_by_level:{'1':['Joie','Tristesse','Colère','Peur','Surprise','Fierté','Tendresse','Confiance']}};
const love=evaluateSentimentReward({emotionState:eight,sentiment:'Amour',intensity:'modéré',relationalAnchor:'ETABLI',tier:1,thresholdValid:true});
assert.equal(love.ready,true);
assert.deepEqual(love.reward,{type:'logo',value:'EMÆÄ',color:'#28C95B'});
assert.equal(love.completes_tier,true);

assert.equal(REWARD_TIER_COLORS['4'],'#E5231F');
console.log('Entity reward eligibility runtime tests: OK');
