import assert from 'node:assert/strict';
import {applyEmotionChanges,normalizeEmotionChanges,EMOTION_SENTIMENTS} from '../server/entity-emotion-engine.mjs';

assert.deepEqual(EMOTION_SENTIMENTS,['Joie','Tristesse','Colère','Peur','Surprise','Fierté','Tendresse','Confiance','Amour']);

const birth=applyEmotionChanges({},[{sentiment:'Joie',operation:'NAITRE',intensite_avant:null,intensite_apres:'faible',cause:'bonne nouvelle',justification:'impact réel'}],{at:'2026-09-10T09:00:00.000Z'});
assert.equal(birth.active.length,1);
assert.equal(birth.active[0].sentiment,'Joie');
assert.equal(birth.active[0].intensite,'faible');

const reinforce=applyEmotionChanges(birth,[{sentiment:'Joie',operation:'RENFORCER',intensite_avant:'faible',intensite_apres:'fort',cause:'suite',justification:'renforcement net'}],{at:'2026-09-10T09:01:00.000Z'});
assert.equal(reinforce.active[0].intensite,'fort');

const maintain=applyEmotionChanges(reinforce,[{sentiment:'Joie',operation:'MAINTENIR',intensite_avant:'fort',intensite_apres:'fort',cause:'continuité',justification:'état stable'}]);
assert.equal(maintain.active[0].intensite,'fort');

const weaken=applyEmotionChanges(maintain,[{sentiment:'Joie',operation:'AFFAIBLIR',intensite_avant:'fort',intensite_apres:'modéré',cause:'retombée',justification:'effet moins fort'}]);
assert.equal(weaken.active[0].intensite,'modéré');

const gone=applyEmotionChanges(weaken,[{sentiment:'Joie',operation:'DISPARAITRE',intensite_avant:'modéré',intensite_apres:null,cause:'fin',justification:'plus actif'}]);
assert.equal(gone.active.length,0);

const amour=normalizeEmotionChanges({changements:[{sentiment:'Amour',operation:'NAÎTRE',intensite_apres:'modere',ancrage_relationnel:'relation construite'}]});
assert.equal(amour[0].operation,'NAITRE');
assert.equal(amour[0].intensite_apres,'modéré');
assert.equal(amour[0].ancrage_relationnel,'relation construite');

assert.throws(()=>normalizeEmotionChanges([{sentiment:'Aversion',operation:'NAITRE',intensite_apres:'faible'}]));
assert.throws(()=>normalizeEmotionChanges([{sentiment:'Amour',operation:'NAITRE',intensite_apres:'faible'}]));

let tooMany=false;try{normalizeEmotionChanges([{sentiment:'Joie',operation:'NAITRE',intensite_apres:'faible'},{sentiment:'Tristesse',operation:'NAITRE',intensite_apres:'faible'},{sentiment:'Colère',operation:'NAITRE',intensite_apres:'faible'},{sentiment:'Peur',operation:'NAITRE',intensite_apres:'faible'}])}catch{tooMany=true}assert.equal(tooMany,true);
let badMaintain=false;try{applyEmotionChanges(birth,[{sentiment:'Joie',operation:'MAINTENIR',intensite_apres:'fort'}])}catch{badMaintain=true}assert.equal(badMaintain,true);

console.log('Entity emotion engine runtime tests: OK');
