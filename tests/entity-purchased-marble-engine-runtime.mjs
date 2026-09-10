import assert from 'node:assert/strict';
import {createInitialMarbleAssignments} from '../server/entity-marble-allocation.mjs';
import {initializeMarbleValues} from '../server/entity-initializer.mjs';
import {applyConfirmedMarblePurchase} from '../server/entity-purchased-marble-engine.mjs';

const base=initializeMarbleValues(createInitialMarbleAssignments({seed:'purchase-test'}),{seed:'purchase-test'});
const evolution={marbles:base.marbles,durable_levels:base.durable_levels,applied_marble_purchases:[]};
assert.throws(()=>applyConfirmedMarblePurchase(evolution,{purchaseId:'p1',quantity:3,confirmed:false}),/non confirmé/);
let out=applyConfirmedMarblePurchase(evolution,{purchaseId:'p1',quantity:3,confirmed:true,seed:'purchase-test'});
assert.equal(out.births.length,3);
assert.equal(out.evolution.marbles.length,203);
assert.deepEqual(out.births.map(x=>x.body_count_after),[201,202,203]);
assert.ok(out.births.every(x=>x.birth.source==='purchase'));
assert.deepEqual(out.evolution.applied_marble_purchases,['p1']);
const replay=applyConfirmedMarblePurchase(out.evolution,{purchaseId:'p1',quantity:3,confirmed:true,seed:'purchase-test'});
assert.equal(replay.idempotent,true);
assert.equal(replay.births.length,0);
assert.equal(replay.evolution.marbles.length,203);
console.log('Entity purchased marble engine runtime tests: OK');
