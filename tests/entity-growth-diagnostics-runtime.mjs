import assert from 'node:assert/strict';
import {growthCapacityReport} from '../server/entity-growth-diagnostics.mjs';

const report=growthCapacityReport();
assert.equal(report.subdomain_count,57);
assert.equal(report.births_per_subdomain,13);
assert.equal(report.threshold_maximum_births,741);
assert.equal(report.threshold_maximum_body_count,941);
assert.equal(report.daily_birth_hour,8);
assert.equal(report.daily_catchup_limit,2);
assert.equal(report.purchased_births_enabled_by_design,true);
assert.deepEqual(report.gates,[
  {population:300,reachable_by_thresholds_alone:true,reachable_with_daily_or_purchased_births:true,additional_balls_beyond_threshold_maximum:0},
  {population:500,reachable_by_thresholds_alone:true,reachable_with_daily_or_purchased_births:true,additional_balls_beyond_threshold_maximum:0},
  {population:1000,reachable_by_thresholds_alone:false,reachable_with_daily_or_purchased_births:true,additional_balls_beyond_threshold_maximum:59},
  {population:2000,reachable_by_thresholds_alone:false,reachable_with_daily_or_purchased_births:true,additional_balls_beyond_threshold_maximum:1059}
]);
console.log('Entity growth diagnostics runtime tests: OK');
