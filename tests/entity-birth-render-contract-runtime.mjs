import assert from 'node:assert/strict';
import {buildBirthRenderCommand,buildBirthRenderQueue,acknowledgeBirth,BIRTH_GOLD,BIRTH_POSITION,BIRTH_ENVELOPES,BIRTH_TIMING} from '../server/entity-birth-render-contract.mjs';

const birth={birth_id:'bille-201',marble_id:'bille-201',marble:{id:'bille-201',domains:{}},body_count_after:201,status:'pending'};
const command=buildBirthRenderCommand(birth);
assert.deepEqual(command.start_position,BIRTH_POSITION);
assert.deepEqual(command.envelopes,BIRTH_ENVELOPES);
assert.deepEqual(command.gold_material,BIRTH_GOLD);
assert.deepEqual(command.timing,BIRTH_TIMING);
assert.equal(command.real_three_mesh,true);
assert.equal(command.same_mesh_integrates,true);
assert.equal(command.serial,true);
assert.equal(command.engine,'EMAEA_NORMAL');
assert.equal(buildBirthRenderQueue({pending_births:[birth]}).length,1);
assert.throws(()=>buildBirthRenderCommand({...birth,body_count_after:200}),/Population après naissance invalide/);

const evolution={pending_births:[birth],birth_history:[birth],marbles:Array.from({length:201},(_,i)=>({id:`bille-${i+1}`}))};
const ack=acknowledgeBirth(evolution,'bille-201',{at:'2026-09-10T12:00:00Z'});
assert.equal(ack.pending_births.length,0);
assert.equal(ack.birth_history[0].status,'shown');
assert.equal(ack.birth_history[0].shown_at,'2026-09-10T12:00:00Z');
assert.equal(evolution.pending_births.length,1,'la source ne doit pas être mutée');
console.log('Entity birth render contract runtime tests: OK');
