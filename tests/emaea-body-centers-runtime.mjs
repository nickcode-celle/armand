import assert from 'node:assert/strict';
import {makeEmaeaBodyCenters} from '../src/components/entity/emaeaBodyRuntime.js';

for(const count of [1,200,201,300,500,941,1000,2000,2001]){
  const centers=makeEmaeaBodyCenters(count);
  assert.equal(centers.length,count,`population ${count}`);
  for(const point of centers){
    assert.ok(Number.isFinite(point.x));
    assert.ok(Number.isFinite(point.y));
    assert.ok(Number.isFinite(point.z));
  }
}
const base=makeEmaeaBodyCenters(200);
assert.equal(base[0].length(),0);
assert.equal(base.length,200);
console.log('EMÆÄ body centers runtime tests: OK');
