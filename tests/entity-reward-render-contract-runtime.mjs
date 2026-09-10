import assert from 'node:assert/strict';
import {buildRewardRenderCommand,buildRewardRenderQueue} from '../server/entity-reward-render-contract.mjs';

const reward={id:'r1',color:'#28C95B',target:{type:'digit',value:4,color:'#28C95B'}};
const cmd=buildRewardRenderCommand(reward,764);
assert.equal(cmd.kind,'digit');
assert.equal(cmd.value,4);
assert.equal(cmd.body_count,764);
assert.deepEqual(cmd.timing,{morph_ms:5000,hold_ms:30000,return_ms:5000});
assert.equal(cmd.engine,'EMAEA_NORMAL');
assert.equal(cmd.obsolete_special_form_engine,false);
assert.equal(cmd.real_persistent_marbles,true);
assert.equal(cmd.skeleton_only,true);

const queue=buildRewardRenderQueue({pending_rewards:[reward,{id:'r2',color:'#7137C8',target:{type:'logo',value:'EMÆÄ',color:'#7137C8'}}]},654);
assert.equal(queue.length,2);
assert.equal(queue[1].kind,'logo');
assert.equal(queue[1].value,'EMÆÄ');

assert.throws(()=>buildRewardRenderCommand({target:{type:'digit',value:9,color:'#28C95B'}},300),/Chiffre/);
console.log('Entity reward render contract runtime tests: OK');
