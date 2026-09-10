import assert from 'node:assert/strict';
import {EMOTION_SENTIMENTS,normalizeEmotionChanges} from '../server/entity-emotion-engine.mjs';
import {recordSentimentAcquisition,acquisitionStatus} from '../server/entity-sentiment-acquisition.mjs';

assert.deepEqual(EMOTION_SENTIMENTS,['Joie','Tristesse','Colère','Peur','Surprise','Fierté','Tendresse','Confiance','Amour']);
assert.throws(()=>normalizeEmotionChanges([{sentiment:'Aversion',operation:'NAITRE',intensite_apres:'faible'}]));
assert.throws(()=>normalizeEmotionChanges([{sentiment:'Amour',operation:'NAITRE',intensite_apres:'faible'}]));

let state={};
for(const sentiment of EMOTION_SENTIMENTS.slice(0,8))state=recordSentimentAcquisition(state,{sentiment,level:'vert'});
let status=acquisitionStatus(state,'vert');
assert.equal(status.amour_accessible,true);
assert.equal(status.complete,false);
state=recordSentimentAcquisition(state,{sentiment:'Amour',level:'vert'});
status=acquisitionStatus(state,'vert');
assert.equal(status.complete,true);

let locked={};
for(const sentiment of EMOTION_SENTIMENTS.slice(0,7))locked=recordSentimentAcquisition(locked,{sentiment,level:'bleu'});
assert.throws(()=>recordSentimentAcquisition(locked,{sentiment:'Amour',level:'bleu'}));
assert.equal(acquisitionStatus(locked,'bleu').amour_accessible,false);

let order={};
for(const sentiment of ['Peur','Joie','Confiance','Tristesse'])order=recordSentimentAcquisition(order,{sentiment,level:'1'});
assert.deepEqual(acquisitionStatus(order,'1').acquired,['Peur','Joie','Confiance','Tristesse']);
order=recordSentimentAcquisition(order,{sentiment:'Joie',level:'1'});
assert.deepEqual(acquisitionStatus(order,'1').acquired,['Peur','Joie','Confiance','Tristesse'],'une répétition ne change pas le rang');

console.log('Entity sentiment acquisition runtime tests: OK');
