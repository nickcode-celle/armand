import assert from 'node:assert/strict';
import {createBornMarble,appendBornMarble} from '../server/entity-marble-birth-state.mjs';
import {PER_MARBLE_DOMAINS,MARBLE_DOMAIN_CATALOG} from '../server/entity-marble-catalog.mjs';

const existing=Array.from({length:200},(_,i)=>({id:`bille-${String(i+1).padStart(3,'0')}`,domains:{}}));
const domainLevels={};
for(const domain of PER_MARBLE_DOMAINS){
  domainLevels[domain]={};
  for(const sub of MARBLE_DOMAIN_CATALOG[domain])domainLevels[domain][sub]=50;
}
const born=createBornMarble(existing,{triggerDomain:'Personnalité',triggerSubdomain:'Curiosité',triggerLevel:42.5,domainLevels,seed:'entity-A'});
assert.equal(born.id,'bille-201');
assert.equal(born.domains.Personnalité.subdomain,'Curiosité');
assert.equal(born.domains.Personnalité.value,42.5);
assert.equal(Object.keys(born.domains).length,PER_MARBLE_DOMAINS.length);
for(const domain of PER_MARBLE_DOMAINS){
  assert.ok(born.domains[domain].subdomain);
  if(domain!=='Personnalité')assert.equal(born.domains[domain].value,50);
}
const replay=createBornMarble(existing,{triggerDomain:'Personnalité',triggerSubdomain:'Curiosité',triggerLevel:42.5,domainLevels,seed:'entity-A'});
assert.deepEqual(replay,born,'même état + même seed = même identité de naissance');
const appended=appendBornMarble(existing,{triggerDomain:'Goûts',triggerSubdomain:'Musique',triggerLevel:61,domainLevels,seed:'entity-A'});
assert.equal(appended.marbles.length,201);
assert.equal(existing.length,200,'la source ne doit pas être mutée');
assert.equal(appended.born.domains.Goûts.value,61);
console.log('Entity marble birth state runtime tests: OK');
