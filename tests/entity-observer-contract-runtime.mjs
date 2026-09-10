import assert from 'node:assert/strict';
import {normalizeObserverOutput} from '../server/entity-observer-contract.mjs';

const out=normalizeObserverOutput({
  evolutions_durables:[
    {domaine:'Personnalité',sous_domaine:'Curiosité',evolution:2,preuve:'fait nouveau',justification:'évolution claire'}
  ],
  histoire:{evenement:'soirée marquante',niveau:2,nature:'étirement',justification:'impact durable'},
  sentiments:{changements:[{sentiment:'Amour',operation:'NAITRE',intensite_avant:null,intensite_apres:'modéré',cause:'relation',justification:'effet réel',ancrage_relationnel:'lien construit'}]}
});

assert.equal(out.evolutions_durables.length,1);
assert.equal(out.evolutions_durables[0].evolution,2);
assert.equal(out.histoire.niveau,2);
assert.equal(out.sentiments.length,1);
assert.equal(out.sentiments[0].sentiment,'Amour');
assert.equal(out.sentiments[0].operation,'NAITRE');
assert.equal(out.sentiments[0].intensite_apres,'modéré');
assert.equal(out.sentiments[0].ancrage_relationnel,'lien construit');

assert.deepEqual(normalizeObserverOutput({sentiments:null}).sentiments,[]);
assert.throws(()=>normalizeObserverOutput({evolutions_durables:[{domaine:'A',sous_domaine:'a',evolution:1},{domaine:'B',sous_domaine:'b',evolution:1},{domaine:'C',sous_domaine:'c',evolution:1}]}),/maximum deux/i);
assert.throws(()=>normalizeObserverOutput({histoire:{niveau:4}}),/Niveau Histoire invalide/);
assert.throws(()=>normalizeObserverOutput({sentiments:[{sentiment:'Joie',operation:'NAITRE',intensite_apres:'énorme'}]}),/Intensité émotionnelle invalide/);

console.log('entity-observer-contract-runtime: ok');
