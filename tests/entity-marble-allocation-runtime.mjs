import assert from 'node:assert/strict';
import {allocationPlan200,EMAEA_BODY_COUNT,EMAEA_INITIAL_GROUP_SIZE} from '../server/entity-marble-allocation.mjs';

assert.equal(EMAEA_BODY_COUNT,200);
assert.equal(EMAEA_INITIAL_GROUP_SIZE,20);
assert.deepEqual(allocationPlan200(10),{body_count:200,subdomain_count:10,per_subdomain:20,assigned:200,unassigned:0});
assert.deepEqual(allocationPlan200(9),{body_count:200,subdomain_count:9,per_subdomain:20,assigned:180,unassigned:20});
assert.deepEqual(allocationPlan200(8),{body_count:200,subdomain_count:8,per_subdomain:20,assigned:160,unassigned:40});
assert.throws(()=>allocationPlan200(11));
console.log('Entity 200-marble allocation runtime tests: OK');
