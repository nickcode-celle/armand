import assert from 'node:assert/strict';
import {buildEmotionRenderIntents} from '../server/entity-emotion-graphics-contract.mjs';

const intents=buildEmotionRenderIntents({active:[
  {sentiment:'Joie',intensite:'faible'},
  {sentiment:'Fierté',intensite:'modéré'},
  {sentiment:'Amour',intensite:'fort',ancrage_relationnel:'lien réel'}
]});
assert.equal(intents.length,3);
assert.deepEqual(intents.map(x=>x.sentiment),['Joie','Fierté','Amour']);
assert.equal(intents[2].ancrage_relationnel,'lien réel');
assert.ok(intents.every(x=>x.source==='D'&&x.temporary===true));

let oldRejected=false;
try{buildEmotionRenderIntents({active:[{sentiment:'Gratitude',intensite:'faible'}]})}catch{oldRejected=true}
assert.equal(oldRejected,true);

let loveWithoutAnchor=false;
try{buildEmotionRenderIntents({active:[{sentiment:'Amour',intensite:'fort'}]})}catch{loveWithoutAnchor=true}
assert.equal(loveWithoutAnchor,true);

console.log('Entity emotion graphics contract runtime tests: OK');
