import assert from 'node:assert/strict';
import {ensureInitialEvolutionState,hasInitialEvolutionState,extractExplicitInterlocutorAge,replayDeferredHistoryEvents} from '../server/entity-initial-state.mjs';

const first=ensureInitialEvolutionState({evolution:{}},'emaea-stable-test',{at:'2026-09-10T10:00:00Z'});
assert.equal(first.marbles.length,200);
assert.equal(first.durable_levels.Capacités,0);
assert.equal(first.history_level,null);
assert.equal(hasInitialEvolutionState({evolution:first}),true);
const again=ensureInitialEvolutionState({evolution:first},'emaea-stable-test',{at:'2026-09-10T11:00:00Z'});
assert.deepEqual(again,first);
const aged=ensureInitialEvolutionState({evolution:{}},'emaea-age-test',{age:50,at:'2026-09-10T10:00:00Z'});
assert.equal(aged.history_level,25);

assert.equal(extractExplicitInterlocutorAge({faits:[{propriete:'âge',valeur:'50 ans'}]}),50);
assert.equal(extractExplicitInterlocutorAge({faits:{profil:{age:42}}}),42);
assert.equal(extractExplicitInterlocutorAge({faits:{annee:2026}}),null);
const lateAge=ensureInitialEvolutionState({evolution:first},'emaea-stable-test',{age:50,at:'2026-09-10T12:00:00Z'});
assert.equal(lateAge.history_level,25);
assert.equal(lateAge.marbles.length,200);

const replay=replayDeferredHistoryEvents(25,[
  {evenement:'souvenir',niveau:1,before:null,after:null,history_deferred:true},
  {evenement:'événement marquant',niveau:2,before:null,after:null,history_deferred:true}
],{at:'2026-09-10T12:30:00Z'});
assert.equal(replay.level,27.235);
assert.equal(replay.events[0].before,25);
assert.equal(replay.events[0].after,25.75);
assert.equal(replay.events[1].before,25.75);
assert.equal(replay.events[1].after,27.235);
assert.equal(replay.events.every(x=>x.history_deferred===false),true);

const withDeferred={...first,history_events:[{evenement:'souvenir',niveau:1,before:null,after:null,history_deferred:true}]};
const lateWithHistory=ensureInitialEvolutionState({evolution:withDeferred},'emaea-stable-test',{age:50,at:'2026-09-10T13:00:00Z'});
assert.equal(lateWithHistory.history_level,25.75);
assert.equal(lateWithHistory.history_events[0].history_deferred,false);

console.log('Entity initial state runtime tests: OK');
