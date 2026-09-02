import {createEntityAI} from './entity-ai.mjs';
import {generateDialogue,departure} from './entity-dialogue.mjs';
import {consolidateMemory} from './entity-consolidation.mjs';
import {ENTITY_SCHEMA_VERSION,migrateEntityState} from './entity-schema.mjs';
import {badRequest} from './entity-errors.mjs';
const tx=ms=>(ms||[]).map(m=>`${m.role==='assistant'?'Entity':'Personne'}: ${m.content||''}`).join('\n');
const iso=()=>new Date().toISOString();
export function defaultState(){return{schema_version:ENTITY_SCHEMA_VERSION,revision:0,user_turns:0,working_memory:[],recent_messages:[],updated_at:null,metrics:{},recall_version:2}}
const delta=(before,after,key)=>Number(after?.[key]||0)-Number(before?.[key]||0);
export function createEntityEngine({storage,runtime,orchestrate,recall}){
 return async function handleTurn(b){
  const key=process.env.OPENAI_API_KEY;if(!key)throw badRequest('OPENAI_API_KEY manquante','CONFIG_MISSING');if(!b.entityId)throw badRequest('Identité Entity manquante','ENTITY_ID_MISSING');
  const legacy=Array.isArray(b.messages)?b.messages:[],latest=String(b.message??legacy.filter(x=>x.role==='user').at(-1)?.content??'').trim();if(!latest)throw badRequest('Message vide','EMPTY_MESSAGE');
  const id=b.entityId,start=Date.now(),beforeStorage={...storage.metrics},beforeRecall={...recall.metrics},snapshot=await runtime.load(id,defaultState()),baseRevision=Number(snapshot.committed_revision??snapshot.state?.revision??0),ai=createEntityAI(key),st={...defaultState(),...migrateEntityState(snapshot.state||defaultState())},memory=snapshot.memory??null;
  const recentBase=st.recent_messages?.length?st.recent_messages:legacy.slice(-10),recent=[...recentBase,{role:'user',content:latest}].slice(-11),conv=tx(recent),generated=await generateDialogue({conv,memory,departureState:departure(latest),ai,state:st,id,orchestrate}),message=generated.x;
  let pending=[...(Array.isArray(snapshot.pending)?snapshot.pending:[]),{role:'user',content:latest},{role:'assistant',content:message}],nextMemory=memory;const now=iso();
  st.working_memory=[...(st.working_memory||[]),{at:now,user:latest,entity:message}].slice(-8);st.recent_messages=[...recent,{role:'assistant',content:message}].slice(-12);st.user_turns=Number(st.user_turns||0)+1;st.revision=baseRevision+1;st.updated_at=now;
  let consolidation_ok=true;if(st.user_turns%6===0){try{const merged=await consolidateMemory({memory,conversation:tx(pending),ai,relevant:generated.rel});if(merged){nextMemory=merged;pending=[]}}catch{consolidation_ok=false}}
  st.metrics={...st.metrics,calls:Number(st.metrics?.calls||0)+ai.metrics.calls,response_calls:Number(st.metrics?.response_calls||0)+ai.metrics.response_calls,embedding_calls:Number(st.metrics?.embedding_calls||0)+ai.metrics.embedding_calls,input_tokens:Number(st.metrics?.input_tokens||0)+ai.metrics.input_tokens,output_tokens:Number(st.metrics?.output_tokens||0)+ai.metrics.output_tokens,total_tokens:Number(st.metrics?.total_tokens||0)+ai.metrics.total_tokens,ai_retries:Number(st.metrics?.ai_retries||0)+ai.metrics.retries,ai_errors:Number(st.metrics?.ai_errors||0)+ai.metrics.errors,ai_timeouts:Number(st.metrics?.ai_timeouts||0)+ai.metrics.timeouts,recall_searches:Number(st.metrics?.recall_searches||0)+delta(beforeRecall,recall.metrics,'searches'),recall_hits:Number(st.metrics?.recall_hits||0)+delta(beforeRecall,recall.metrics,'hits'),recall_misses:Number(st.metrics?.recall_misses||0)+delta(beforeRecall,recall.metrics,'misses'),recall_remote_failures:Number(st.metrics?.recall_remote_failures||0)+delta(beforeRecall,recall.metrics,'remote_failures'),storage_conflicts:Number(st.metrics?.storage_conflicts||0)+delta(beforeStorage,storage.metrics,'conflicts'),consolidation_failures:Number(st.metrics?.consolidation_failures||0)+(consolidation_ok?0:1)};
  const nextSnapshot={state:st,memory:nextMemory,pending,committed_revision:st.revision,updated_at:now};await runtime.commit(id,baseRevision,nextSnapshot);
  if(nextMemory!==memory)await storage.del(id,'embedding-index');
  const storageUsage={reads:delta(beforeStorage,storage.metrics,'reads'),writes:delta(beforeStorage,storage.metrics,'writes'),conflicts:delta(beforeStorage,storage.metrics,'conflicts'),lease_renews:delta(beforeStorage,storage.metrics,'lease_renews')},recallUsage={searches:delta(beforeRecall,recall.metrics,'searches'),hits:delta(beforeRecall,recall.metrics,'hits'),misses:delta(beforeRecall,recall.metrics,'misses'),remote_failures:delta(beforeRecall,recall.metrics,'remote_failures')};
  return{message,meta:{memory_engine:'v8',schema_version:ENTITY_SCHEMA_VERSION,storage:storage.mode,recall:recall.mode,revision:st.revision,request_ms:Date.now()-start,usage:ai.metrics,storage_usage:storageUsage,recall_usage:recallUsage,consolidation_ok}};
 }
}
