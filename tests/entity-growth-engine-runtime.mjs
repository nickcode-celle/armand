import assert from 'node:assert/strict';
import {createInitialMarbleAssignments} from '../server/entity-marble-allocation.mjs';
import {initializeMarbleValues} from '../server/entity-initializer.mjs';
import {applyGrowthFromChanges,MARBLE_GROWTH_THRESHOLDS} from '../server/entity-growth-engine.mjs';
import {PER_MARBLE_DOMAINS} from '../server/entity-marble-catalog.mjs';

assert.deepEqual(MARBLE_GROWTH_THRESHOLDS,[40,60,80,100]);
const base=initializeMarbleValues(createInitialMarbleAssignments({seed:'growth-test'}),{seed:'growth-test'});
let evolution={marbles:base.marbles,durable_levels:structuredClone(base.durable_levels),birth_thresholds:{}};
evolution.durable_levels.Personnalité.Curiosité=40;
let out=applyGrowthFromChanges(evolution,[{domaine:'Personnalité',sous_domaine:'Curiosité',before:39.8,after:40,evolution:1}],{seed:'growth-test'});
assert.equal(out.births.length,1);
assert.equal(out.births[0].threshold,40);
assert.equal(out.marbles.length,201);
for(const domain of PER_MARBLE_DOMAINS)assert.notEqual(out.births[0].domains[domain].value,null);

evolution={...evolution,marbles:out.marbles,birth_thresholds:out.birth_thresholds,durable_levels:structuredClone(evolution.durable_levels)};
evolution.durable_levels.Personnalité.Curiosité=60;
out=applyGrowthFromChanges(evolution,[{domaine:'Personnalité',sous_domaine:'Curiosité',before:59.9,after:60,evolution:1}],{seed:'growth-test'});
assert.equal(out.births.length,1);
assert.equal(out.births[0].threshold,60);
assert.equal(out.marbles.length,202);

const replay=applyGrowthFromChanges({...evolution,marbles:out.marbles,birth_thresholds:out.birth_thresholds},[{domaine:'Personnalité',sous_domaine:'Curiosité',before:59.9,after:60,evolution:1}],{seed:'growth-test'});
assert.equal(replay.births.length,0);
assert.equal(replay.marbles.length,202);
console.log('Entity growth engine runtime tests: OK');
