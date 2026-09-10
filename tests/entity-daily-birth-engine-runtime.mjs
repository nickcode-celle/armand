import assert from 'node:assert/strict';
import {createInitialMarbleAssignments} from '../server/entity-marble-allocation.mjs';
import {initializeMarbleValues} from '../server/entity-initializer.mjs';
import {applyDailyBirths,DAILY_BIRTH_HOUR,DAILY_BIRTH_CATCHUP_LIMIT,DEFAULT_DAILY_BIRTH_TIME_ZONE} from '../server/entity-daily-birth-engine.mjs';

const base=initializeMarbleValues(createInitialMarbleAssignments({seed:'daily-birth-test'}),{seed:'daily-birth-test'});
const evolution={marbles:base.marbles,durable_levels:{...base.durable_levels,Capacités:0},initialized_at:'2026-09-10T04:00:00.000Z',pending_births:[],birth_history:[]};
assert.equal(DAILY_BIRTH_HOUR,8);
assert.equal(DAILY_BIRTH_CATCHUP_LIMIT,2);
assert.equal(DEFAULT_DAILY_BIRTH_TIME_ZONE,'Europe/Paris');

// 07:59 à Paris : aucune naissance. 08:00 : une naissance.
let out=applyDailyBirths(evolution,{now:new Date('2026-09-10T05:59:00.000Z'),seed:'daily'});
assert.equal(out.births.length,0);
out=applyDailyBirths(evolution,{now:new Date('2026-09-10T06:00:00.000Z'),seed:'daily'});
assert.equal(out.births.length,1);
assert.equal(out.births[0].birth.source,'daily');
assert.equal(out.births[0].daily_date,'2026-09-10');
assert.equal(out.births[0].body_count_after,201);
assert.equal(out.evolution.daily_birth_last_date,'2026-09-10');

// Même journée : pas de doublon.
out=applyDailyBirths(out.evolution,{now:new Date('2026-09-10T12:00:00.000Z'),seed:'daily'});
assert.equal(out.births.length,0);
assert.equal(out.evolution.marbles.length,201);

// Déconnexion prolongée : seulement les deux échéances les plus récentes sont récupérées.
const stale={...evolution,daily_birth_last_date:'2026-09-01'};
out=applyDailyBirths(stale,{now:new Date('2026-09-10T12:00:00.000Z'),seed:'daily'});
assert.equal(out.births.length,2);
assert.deepEqual(out.births.map(x=>x.daily_date),['2026-09-09','2026-09-10']);
assert.equal(out.evolution.marbles.length,202);
assert.equal(out.evolution.daily_birth_last_date,'2026-09-10');
assert.equal(out.evolution.daily_birth_missed_discarded,7);

console.log('Entity daily birth engine runtime tests: OK');
