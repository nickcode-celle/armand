import assert from 'node:assert/strict';
import {ENTITY_SCHEMA_VERSION,ENTITY_MIGRATIONS,migrateEntityState} from '../server/entity-schema.mjs';

assert.equal(ENTITY_SCHEMA_VERSION,14);
assert.deepEqual(ENTITY_MIGRATIONS,[6,7,8,9,10,11,12,13,14]);
const migrated=migrateEntityState({schema_version:5,revision:12});
assert.equal(migrated.schema_version,14);
assert.equal(migrated.runtime_version,1);
assert.equal(migrated.recall_version,2);
assert.equal(migrated.metrics.consolidation_failures,0);
assert.deepEqual(migrated.evolution.durable_levels,{});
assert.deepEqual(migrated.evolution.history_events,[]);
assert.deepEqual(migrated.evolution.marbles,[]);
assert.equal(migrated.evolution.history_level,null);
assert.deepEqual(migrated.evolution.birth_thresholds,{});
assert.deepEqual(migrated.evolution.birth_history,[]);
assert.deepEqual(migrated.evolution.pending_births,[]);
assert.equal(migrated.evolution.observer_last,null);
assert.deepEqual(migrated.emotion.active,[]);
assert.deepEqual(migrated.emotion.last_changes,[]);
assert.deepEqual(migrated.emotion.acquired_by_level,{});
assert.equal(migrated.rewards.current_tier,'1');
assert.deepEqual(migrated.rewards.completed_tiers,[]);
assert.deepEqual(migrated.rewards.pending_rewards,[]);
assert.equal(migrated.rewards.ultimate_pending,false);
assert.equal(migrated.rewards.ultimate_complete,false);
let future=false;try{migrateEntityState({schema_version:99})}catch{future=true}
assert.equal(future,true);
console.log('Entity schema migration runtime tests: OK');
