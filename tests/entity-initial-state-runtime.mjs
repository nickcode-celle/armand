import assert from 'node:assert/strict';
import {ensureInitialEvolutionState,hasInitialEvolutionState} from '../server/entity-initial-state.mjs';

const first=ensureInitialEvolutionState({evolution:{}},'emaea-stable-test',{at:'2026-09-10T10:00:00Z'});
assert.equal(first.marbles.length,200);
assert.equal(first.durable_levels.Capacités,0);
assert.equal(first.history_level,null);
assert.equal(hasInitialEvolutionState({evolution:first}),true);
const again=ensureInitialEvolutionState({evolution:first},'emaea-stable-test',{at:'2026-09-10T11:00:00Z'});
assert.deepEqual(again,first);
const aged=ensureInitialEvolutionState({evolution:{}},'emaea-age-test',{age:50,at:'2026-09-10T10:00:00Z'});
assert.equal(aged.history_level,25);
console.log('Entity initial state runtime tests: OK');
