import assert from 'node:assert/strict';
import {makeDigitOneCenters,makeDigitFourCenters,makeDigitEightCenters,makeEmaeLogoCenters,makeRewardCenters} from '../src/components/entity/emaeaRewardSkeletons.js';

for(const count of [300,345,654,764,1087]){
  assert.equal(makeDigitOneCenters(count).length,count);
  assert.equal(makeDigitFourCenters(count).length,count);
  assert.equal(makeDigitEightCenters(count).length,count);
}
assert.equal(makeEmaeLogoCenters(300).length,300);
assert.equal(makeEmaeLogoCenters(654).length,654);
assert.throws(()=>makeEmaeLogoCenters(345),/branch count must be integer/);
assert.equal(makeRewardCenters({kind:'digit',value:4,body_count:764}).length,764);
assert.equal(makeRewardCenters({kind:'logo',value:'EMÆÄ',body_count:654}).length,654);
console.log('EMÆÄ reward skeleton runtime tests: OK');
