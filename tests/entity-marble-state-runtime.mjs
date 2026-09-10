import assert from 'node:assert/strict';
import {applyChangesToMarbles} from '../server/entity-marble-state.mjs';

const marbles=[
  {id:'b1',domains:{Personnalité:{subdomain:'Curiosité',value:20},Goûts:{subdomain:'Musique',value:40}}},
  {id:'b2',domains:{Personnalité:{subdomain:'Curiosité',value:40},Goûts:{subdomain:'Cinéma/fiction',value:50}}},
  {id:'b3',domains:{Personnalité:{subdomain:'Humour',value:70}}}
];

const before=structuredClone(marbles);
const {marbles:next,reports}=applyChangesToMarbles(marbles,[
  {domaine:'Personnalité',sous_domaine:'Curiosité',before:30,after:35,evolution:1},
  {domaine:'Capacités',sous_domaine:'Fluidité',before:0,after:1,evolution:1}
],{rng:()=>.5});

assert.deepEqual(marbles,before,'la source ne doit pas être mutée');
assert.equal(reports[0].applied,true);
assert.equal(reports[0].count,2);
assert.equal(reports[1].reason,'global_domain');
const curio=next.filter(x=>x.domains.Personnalité?.subdomain==='Curiosité').map(x=>x.domains.Personnalité.value);
assert.ok(Math.abs(curio.reduce((a,b)=>a+b,0)/curio.length-35)<1e-9);
assert.ok(curio[0]>=20&&curio[1]>=40);
assert.equal(next[2].domains.Personnalité.value,70,'une autre sous-catégorie ne doit pas changer');
assert.equal(next[0].domains.Goûts.value,40,'un autre domaine ne doit pas changer');

console.log('Entity persistent marble-state evolution tests: OK');
