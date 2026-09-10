import assert from 'node:assert/strict';
import {applyQualifiedDelta,applyEvolutionEvents} from '../server/entity-evolution-engine.mjs';

assert.equal(applyQualifiedDelta(0,1),1);
assert.equal(applyQualifiedDelta(50,2),51);
assert.equal(applyQualifiedDelta(100,3),100);
assert.equal(applyQualifiedDelta(50,-1),49.5);
assert.equal(applyQualifiedDelta(0,-1),0);

const initial={
  'Personnalité':{Curiosité:50},
  'Relation':{Confiance:20}
};
const out=applyEvolutionEvents(initial,[
  {domaine:'Personnalité',sous_domaine:'Curiosité',evolution:2,preuve:'nouveau comportement',justification:'évolution claire'},
  {domaine:'Relation',sous_domaine:'Confiance',evolution:1,preuve:'échange',justification:'petit progrès'}
]);

assert.equal(out.levels['Personnalité'].Curiosité,51);
assert.equal(out.levels.Relation.Confiance,20.8);
assert.equal(initial['Personnalité'].Curiosité,50,'le moteur ne doit pas muter l’état d’entrée');
assert.equal(out.changes.length,2);

assert.throws(()=>applyEvolutionEvents(initial,[
  {domaine:'Personnalité',sous_domaine:'Curiosité',evolution:1},
  {domaine:'Relation',sous_domaine:'Confiance',evolution:1},
  {domaine:'Goûts',sous_domaine:'Musique',evolution:1}
]),/Maximum deux domaines/);

assert.throws(()=>applyEvolutionEvents(initial,[
  {domaine:'Histoire vécue',sous_domaine:'x',evolution:1}
]),/Domaine non géré par une jauge/);

console.log('entity-evolution-engine-runtime: ok');
