import assert from 'node:assert/strict';
import {createEvolutionLayer} from '../server/entity-evolution-layer.mjs';

process.env.OPENAI_API_KEY='test-key';
let snapshot={state:{revision:1,recent_messages:[{role:'user',content:'Bonjour'}],evolution:{durable_levels:{},marbles:[],history_events:[]},emotion:{active:[],last_changes:[],acquired_by_level:{}}},memory:null,committed_revision:1};
const runtime={
  async load(){return structuredClone(snapshot)},
  async commit(id,expected,next){assert.equal(expected,1);snapshot=structuredClone(next);return structuredClone(next)}
};
const aiFactory=()=>({response:async()=>JSON.stringify({evolutions_durables:[],histoire:null,sentiments:[]})});
const handle=createEvolutionLayer({handleTurn:async()=>({message:'ok',meta:{revision:1}}),runtime,aiFactory});
const out=await handle({entityId:'emae-init-test',requestId:'req-init-1',message:'Bonjour'});
assert.equal(out.meta.evolution_ok,true);
assert.equal(snapshot.state.evolution.marbles.length,200);
assert.equal(snapshot.state.evolution.durable_levels.Capacités,0);
assert.equal(snapshot.state.evolution.history_level,null);
assert.equal(snapshot.state.rewards.current_tier,'1');
assert.equal(snapshot.state.rewards.threshold_open,false);
assert.equal(out.rewards.render_queue.length,0);
console.log('Entity evolution layer initialization runtime tests: OK');
