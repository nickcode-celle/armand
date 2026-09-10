import assert from 'node:assert/strict';
import {growthCapacityReport} from '../server/entity-growth-diagnostics.mjs';

const report=growthCapacityReport();
assert.equal(report.subdomain_count,57);
assert.equal(report.births_per_subdomain,4);
assert.equal(report.maximum_births,228);
assert.equal(report.maximum_body_count,428);
assert.deepEqual(report.gates,[
  {population:300,reachable:true},
  {population:500,reachable:false},
  {population:1000,reachable:false},
  {population:2000,reachable:false}
]);
console.log('Entity growth diagnostics runtime tests: OK');
