import assert from 'node:assert/strict';
import {applyHistoryEvent} from '../server/entity-history-evolution.mjs';
import {applyGrowthFromChanges} from '../server/entity-growth-engine.mjs';
import {createInitialMarbleAssignments} from '../server/entity-marble-allocation.mjs';
import {initializeMarbleValues} from '../server/entity-initializer.mjs';

const h=applyHistoryEvent(25,{niveau:2});
assert.equal(h.level,26.5);
assert.equal(applyHistoryEvent(25,{niveau:0}).level,25);

const base=initializeMarbleValues(createInitialMarbleAssignments({seed:'growth'}),{seed:'growth'});
base.durable_levels.Personnalité.Curiosité=40.5;
const evolution={marbles:base.marbles,durable_levels:{...base.durable_levels,Capacités:0},birth_thresholds:{}};
const change={domaine:'Personnalité',sous_domaine:'Curiosité',before:39.9,after:40.5,evolution:1};
const once=applyGrowthFromChanges(evolution,[change],{seed:'growth'});
assert.equal(once.births.length,1);
assert.equal(once.marbles.length,201);
assert.equal(once.births[0].threshold,40);
const twice=applyGrowthFromChanges({...evolution,marbles:once.marbles,birth_thresholds:once.birth_thresholds},[change],{seed:'growth'});
assert.equal(twice.births.length,0);
assert.equal(twice.marbles.length,201);

console.log('Entity growth/history runtime tests: OK');
