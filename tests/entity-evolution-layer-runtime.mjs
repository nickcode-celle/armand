import assert from 'node:assert/strict';
import {createEvolutionLayer} from '../server/entity-evolution-layer.mjs';

process.env.OPENAI_API_KEY='test-key';
let snapshot={
  state:{
    revision:3,
    recent_messages:[{role:'user',content:'Je reviens sur ce sujet et je te fais confiance.'}],
    evolution:{
      durable_levels:{Relation:{Confiance:50}},
      history_events:[],
      marbles:[
        {id:'m1',domains:{Relation:{subdomain:'Confiance',value:40}}},
        {id:'m2',domains:{Relation:{subdomain:'Confiance',value:60}}},
        {id:'m3',domains:{Relation:{subdomain:'Familiarité',value:30}}}
      ]
    }
  },
  memory:{relation:{confiance:true}},
  committed_revision:3,
  updated_at:null
};
const runtime={
  async load(){return structuredClone(snapshot)},
  async commit(id,expected,next){assert.equal(id,'emae-test');assert.equal(expected,3);snapshot=structuredClone(next);return structuredClone(next)}
};
const base=async()=>({message:'réponse',meta:{revision:3}});
const aiFactory=()=>({response:async()=>JSON.stringify({
  evolutions_durables:[{domaine:'Relation',sous_domaine:'Confiance',evolution:2,preuve:'preuve claire',justification:'évolution claire'}],
  histoire:null,
  sentiments:null
})});
const handle=createEvolutionLayer({handleTurn:base,runtime,aiFactory});
const out=await handle({entityId:'emae-test',requestId:'turn-1',message:'x',messages:[{role:'user',content:'x'}]});
assert.equal(out.meta.evolution_ok,true);
assert.equal(out.meta.evolution_changes,1);
assert.equal(out.meta.marble_evolution_skipped,false);
assert.equal(out.evolution.changes[0].before,50);
assert.equal(out.evolution.changes[0].after,51);
assert.equal(snapshot.state.evolution.durable_levels.Relation.Confiance,51);
const confidence=snapshot.state.evolution.marbles.slice(0,2).map(x=>x.domains.Relation.value);
assert.ok(confidence[0]>=40&&confidence[1]>=60,'la progression globale ne doit faire baisser aucune bille concernée');
assert.ok(Math.abs((confidence[0]+confidence[1])/2-51)<1e-9,'la moyenne individuelle doit égaler exactement le niveau global');
assert.equal(snapshot.state.evolution.marbles[2].domains.Relation.value,30,'un autre sous-domaine doit rester inchangé');
assert.equal(snapshot.committed_revision,3);
console.log('Entity evolution layer runtime tests: OK');
