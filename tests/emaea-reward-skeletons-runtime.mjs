import assert from 'node:assert/strict';
import {makeDigitOneCenters,makeDigitFourCenters,makeDigitEightCenters,makeEmaeLogoCenters,makeRewardCenters} from '../src/components/entity/emaeaRewardSkeletons.js';

for(const count of [300,345,654,764,1087]){
  assert.equal(makeDigitOneCenters(count).length,count);
  assert.equal(makeDigitFourCenters(count).length,count);
  assert.equal(makeDigitEightCenters(count).length,count);
}
for(const count of [300,301,345,501,654,1001,2001])assert.equal(makeEmaeLogoCenters(count).length,count);
assert.equal(makeRewardCenters({kind:'digit',value:4,body_count:764}).length,764);
assert.equal(makeRewardCenters({kind:'logo',value:'EMÆÄ',body_count:345}).length,345);
console.log('EMÆÄ reward skeleton runtime tests: OK');
