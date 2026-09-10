import {createEntityAI} from './entity-ai.mjs';
import {observeEntityTurn} from './entity-observer.mjs';
import {applyEvolutionEvents} from './entity-evolution-engine.mjs';
import {applyChangesToMarbles} from './entity-marble-evolution.mjs';
import {ensureInitialEvolutionState,extractExplicitInterlocutorAge} from './entity-initial-state.mjs';
import {applyHistoryEvent} from './entity-history-evolution.mjs';
import {applyGrowthFromChanges} from './entity-growth-engine.mjs';
import {applyDailyBirths} from './entity-daily-birth-engine.mjs';
import {applyEmotionChanges} from './entity-emotion-engine.mjs';
import {processRewardProgression} from './entity-reward-progression.mjs';
import {buildRewardRenderQueue} from './entity-reward-render-contract.mjs';
import {buildBirthRenderQueue} from './entity-birth-render-contract.mjs';

const transcript=messages=>(messages||[]).map(m=>`${m.role==='assistant'?'EMÆÄ':'Personne'}: ${String(m.content||'')}`).join('\n');
const now=()=>new Date().toISOString();

function birthRecord(birth,at){
  return{birth_id:String(birth.id),marble_id:String(birth.id),marble:structuredClone(birth),source:birth?.birth?.source??'threshold',threshold:birth.threshold??null,trigger_level:birth.trigger_level??null,daily_date:birth.daily_date??birth?.birth?.daily_date??null,body_count_after:birth.body_count_after,created_at:at,status:'pending'};
}

export function createEvolutionLayer({handleTurn,runtime,aiFactory=createEntityAI}){
  return async function handleTurnWithEvolution(body){
    const result=await handleTurn(body);
    if(result?.meta?.idempotent_replay)return result;

    const id=String(body?.entityId||'').trim();
    const snapshot=await runtime.load(id,{}, {withMemory:true});
    const state=snapshot.state||{};
    const memory=snapshot.memory??null;
    const explicitAge=body?.interlocutorAge??extractExplicitInterlocutorAge(memory);
    const initializedEvolution=ensureInitialEvolutionState(state,id,{age:explicitAge??null});
    const at=now();
    const daily=applyDailyBirths(initializedEvolution,{now:new Date(at),seed:id});
    const baseEvolution=daily.evolution;
    const dailyBirthRecords=daily.births.map(b=>birthRecord(b,at));

    const key=process.env.OPENAI_API_KEY;
    if(!key){
      const oldPending=Array.isArray(baseEvolution.pending_births)?baseEvolution.pending_births:[];
      const pendingIds=new Set(oldPending.map(x=>String(x.birth_id)));
      const pendingBirths=[...oldPending,...dailyBirthRecords.filter(x=>!pendingIds.has(x.birth_id))];
      const birthHistory=[...(baseEvolution.birth_history||[]),...dailyBirthRecords].slice(-500);
      const evolution={...baseEvolution,pending_births:pendingBirths,birth_history:birthHistory,last_births:daily.births,updated_at:at};
      const expected=Number(snapshot.committed_revision??state.revision??0);
      const nextState={...state,evolution};
      const nextSnapshot={...snapshot,state:nextState,committed_revision:expected,updated_at:at};delete nextSnapshot.memory;
      await runtime.commit(id,expected,{...nextSnapshot,memory});
      return{...result,evolution:{state:evolution},births:{new_births:dailyBirthRecords,render_queue:buildBirthRenderQueue({pending_births:dailyBirthRecords})},meta:{...(result.meta||{}),evolution_ok:false,evolution_error:'OPENAI_API_KEY absente',daily_marble_births:daily.births.length}};
    }

    const recent=Array.isArray(state.recent_messages)&&state.recent_messages.length
      ? state.recent_messages
      : (Array.isArray(body?.messages)?body.messages.slice(-12):[]);
    const ai=aiFactory(key);

    let observer;
    try{observer=await observeEntityTurn({ai,conversation:transcript(recent),memory,state:{...state,evolution:baseEvolution}})}
    catch(error){return{...result,meta:{...(result.meta||{}),evolution_ok:false,evolution_error:String(error?.message||error)}}}

    let applied;
    try{applied=applyEvolutionEvents(baseEvolution.durable_levels||{},observer.evolutions_durables||[])}
    catch(error){return{...result,meta:{...(result.meta||{}),evolution_ok:false,evolution_error:String(error?.message||error),observer}}}

    let marbleApplied;
    try{marbleApplied=applyChangesToMarbles(baseEvolution.marbles||[],applied.changes,{seed:String(body?.requestId||`${id}|${state.revision||0}`)})}
    catch(error){return{...result,meta:{...(result.meta||{}),evolution_ok:false,evolution_error:`billes: ${String(error?.message||error)}`,observer}}}

    let grown;
    try{grown=applyGrowthFromChanges({...baseEvolution,durable_levels:applied.levels,marbles:marbleApplied.marbles},applied.changes,{seed:String(body?.requestId||id)})}
    catch(error){return{...result,meta:{...(result.meta||{}),evolution_ok:false,evolution_error:`croissance: ${String(error?.message||error)}`,observer}}}

    let emotion;
    try{emotion=applyEmotionChanges(state.emotion||{},observer.sentiments||[],{at})}
    catch(error){return{...result,meta:{...(result.meta||{}),evolution_ok:false,evolution_error:`émotion: ${String(error?.message||error)}`,observer}}}

    const historyEvents=[...(baseEvolution.history_events||[])];
    let historyLevel=baseEvolution.history_level??null,historyChange=null,historyDeferred=false;
    if(observer.histoire){
      const out=applyHistoryEvent(historyLevel,observer.histoire);
      historyLevel=out.level;
      historyChange=out.change;
      historyDeferred=out.deferred===true;
      historyEvents.push({...observer.histoire,before:out.change?.before??historyLevel,after:out.change?.after??historyLevel,history_deferred:historyDeferred,at});
    }

    const thresholdBirthRecords=grown.births.map(b=>birthRecord(b,at));
    const newBirthRecords=[...dailyBirthRecords,...thresholdBirthRecords];
    const oldPending=Array.isArray(baseEvolution.pending_births)?baseEvolution.pending_births:[];
    const pendingIds=new Set(oldPending.map(x=>String(x.birth_id)));
    const pendingBirths=[...oldPending,...newBirthRecords.filter(x=>!pendingIds.has(x.birth_id))];
    const birthHistory=[...(baseEvolution.birth_history||[]),...newBirthRecords].slice(-500);
    const allNewBirths=[...daily.births,...grown.births];
    const evolution={...baseEvolution,durable_levels:applied.levels,marbles:grown.marbles,history_level:historyLevel,history_events:historyEvents.slice(-200),history_last_change:historyChange,birth_thresholds:grown.birth_thresholds,birth_history:birthHistory,pending_births:pendingBirths,observer_last:observer,last_changes:applied.changes,last_marble_changes:marbleApplied.changes,last_births:allNewBirths,updated_at:at};

    let progression;
    try{progression=processRewardProgression({rewardState:state.rewards||{},emotionState:emotion,evolution,observerChanges:emotion.last_changes||[],at});emotion=progression.emotionState}
    catch(error){return{...result,meta:{...(result.meta||{}),evolution_ok:false,evolution_error:`récompenses: ${String(error?.message||error)}`,observer}}}

    const renderQueue=buildRewardRenderQueue({pending_rewards:progression.rewards},evolution.marbles.length);
    const birthRenderQueue=buildBirthRenderQueue({pending_births:newBirthRecords});
    const nextState={...state,evolution,emotion,rewards:progression.rewardState};
    const expected=Number(snapshot.committed_revision??state.revision??0);
    const nextSnapshot={...snapshot,state:nextState,committed_revision:expected,updated_at:at};delete nextSnapshot.memory;
    await runtime.commit(id,expected,{...nextSnapshot,memory});

    return{...result,evolution:{observer,changes:applied.changes,marble_changes:marbleApplied.changes,births:allNewBirths,history_change:historyChange,state:evolution},emotion,rewards:{state:progression.rewardState,new_rewards:progression.rewards,threshold:progression.threshold,status:progression.status,render_queue:renderQueue},births:{new_births:newBirthRecords,render_queue:birthRenderQueue},meta:{...(result.meta||{}),evolution_ok:true,evolution_changes:applied.changes.length,emotion_changes:emotion.last_changes.length,reward_events:progression.rewards.length,reward_render_queue:renderQueue.length,new_marble_births:allNewBirths.length,daily_marble_births:daily.births.length,threshold_marble_births:grown.births.length,birth_render_queue:birthRenderQueue.length,history_changed:!!historyChange,history_deferred:historyDeferred,marble_evolution_skipped:marbleApplied.skipped,marble_evolution_reason:marbleApplied.reason||null}};
  };
}
