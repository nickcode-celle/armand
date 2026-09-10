import assert from 'node:assert/strict';
import {relationGlobalSpeed,relationIndividualMultipliers,relationSpeedForMarble} from '../src/components/entity/emaeaDomainDynamics.js';

assert.equal(relationGlobalSpeed(0),1);
assert.equal(relationGlobalSpeed(50),1.5);
assert.equal(relationGlobalSpeed(100),2);
assert.equal(relationGlobalSpeed(-20),1);
assert.equal(relationGlobalSpeed(140),2);

const marbles=Array.from({length:200},(_,i)=>({id:`bille-${String(i+1).padStart(3,'0')}`}));
const multipliers=relationIndividualMultipliers(marbles);
assert.equal(multipliers.length,200);
const mean=multipliers.reduce((a,b)=>a+b,0)/multipliers.length;
assert.ok(Math.abs(mean-1)<1e-12);
assert.deepEqual(relationIndividualMultipliers(marbles),multipliers,'variation Relation stable par identité');
assert.equal(relationSpeedForMarble(50,1),1.5);

console.log('EMÆÄ domain dynamics runtime tests: OK');
