import assert from 'node:assert/strict';
import {createInitialMarbleAssignments} from '../server/entity-marble-allocation.mjs';
import {initializeMarbleValues} from '../server/entity-initializer.mjs';
import {applyGrowthFromChanges,MARBLE_GROWTH_THRESHOLDS} from '../server/entity-growth-engine.mjs';
import {PER_MARBLE_DOMAINS} from '../server/entity-marble-catalog.mjs';

assert.deepEqual(MARBLE_GROWTH_THRESHOLDS,[40,45,50,55,60,65,70,75,80,85,90,95,100]);
const base=initializeMarbleValues(createInitialMarbleAssignments({seed:'growth-test'}),{seed:'growth-test'});
let evolution={marbles:base.marbles,durable_levels:structuredClone(base.durable_levels),birth_thresholds:{}};
evolution.durable_levels.Personnalité.Curiosité=40;
let out=applyGrowthFromChanges(evolution,[{domaine:'Personnalité',sous_domaine:'Curiosité',before:39.8,after:40,evolution:1}],{seed:'growth-test'});
assert.equal(out.births.length,1);
assert.equal(out.births[0].threshold,40);
assert.equal(out.marbles.length,201);
for(const domain of PER_MARBLE_DOMAINS)assert.notEqual(out.births[0].domains[domain].value,null);

evolution={...evolution,marbles:out.marbles,birth_thresholds:out.birth_thresholds,durable_levels:structuredClone(evolution.durable_levels)};
evolution.durable_levels.Personnalité.Curiosité=45;
out=applyGrowthFromChanges(evolution,[{domaine:'Personnalité',sous_domaine:'Curiosité',before:44.9,after:45,evolution:1}],{seed:'growth-test'});
assert.equal(out.births.length,1);
assert.equal(out.births[0].threshold,45);
assert.equal(out.marbles.length,202);

// Un saut de plusieurs paliers produit une bille pour chaque seuil réellement franchi.
evolution={...evolution,marbles:out.marbles,birth_thresholds:out.birth_thresholds,durable_levels:structuredClone(evolution.durable_levels)};
evolution.durable_levels.Personnalité.Curiosité=60;
out=applyGrowthFromChanges(evolution,[{domaine:'Personnalité',sous_domaine:'Curiosité',before:45,after:60,evolution:3}],{seed:'growth-test'});
assert.deepEqual(out.births.map(x=>x.threshold),[50,55,60]);
assert.equal(out.marbles.length,205);

const replay=applyGrowthFromChanges({...evolution,marbles:out.marbles,birth_thresholds:out.birth_thresholds},[{domaine:'Personnalité',sous_domaine:'Curiosité',before:45,after:60,evolution:3}],{seed:'growth-test'});
assert.equal(replay.births.length,0);
assert.equal(replay.marbles.length,205);
console.log('Entity growth engine runtime tests: OK');
