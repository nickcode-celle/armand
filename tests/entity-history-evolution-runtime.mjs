import assert from 'node:assert/strict';
import {applyHistoryEvent} from '../server/entity-history-evolution.mjs';

let out=applyHistoryEvent(null,{niveau:0,evenement:'petit détail'});
assert.equal(out.level,0);
assert.equal(out.change.before,0);
assert.equal(out.change.after,0);

out=applyHistoryEvent(25,{niveau:1,evenement:'souvenir'});
assert.equal(out.level,25.75);

out=applyHistoryEvent(25,{niveau:2,evenement:'événement marquant'});
assert.equal(out.level,26.5);

out=applyHistoryEvent(25,{niveau:3,evenement:'événement fondateur'});
assert.equal(out.level,27.25);

assert.throws(()=>applyHistoryEvent(10,{niveau:4}),/Niveau Histoire invalide/);
console.log('Entity history evolution runtime tests: OK');
