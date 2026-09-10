import {createEntityAI} from './entity-ai.mjs';
import {observeEntityTurn} from './entity-observer.mjs';
import {applyEvolutionEvents} from './entity-evolution-engine.mjs';
import {applyChangesToMarbles} from './entity-marble-evolution.mjs';
import {ensureInitialEvolutionState,extractExplicitInterlocutorAge} from './entity-initial-state.mjs';
import {applyHistoryEvent} from './entity-history-evolution.mjs';
import {applyGrowthFromChanges} from './entity-growth-engine.mjs';
import {applyEmotionChanges} from './entity-emotion-engine.mjs';
import {processRewardProgression} from './entity-reward-progression.mjs';
import {buildRewardRenderQueue} from './entity-reward-render-contract.mjs';

const transcript=messages=>(messages||[]).map(m=>`${m.role==='assistant'?'EMÆÄ':'Personne'}: ${String(m.content||'')}`).join('\n');
const now=()=>new Date().toISOString();

export function createEvolutionLayer({handleTurn,runtime,aiFactory=createEntityAI}){
  return async function handleTurnWithEvolution(body){
    const result=await handleTurn(body);
    if(result?.meta?.idempotent_replay)return result;

    const id=String(body?.entityId||'').trim();
    const snapshot=await runtime.load(id,{}, {withMemory:true});
    const state=snapshot.state||{};
    const memory=snapshot.memory??null;
    const explicitAge=body?.interlocutorAge??extractExplicitInterlocutorAge(memory);
    const baseEvolution=ensureInitialEvolutionState(state,id,{age:explicitAge??null});
    const key=process.env.OPENAI_API_KEY;
    if(!key){
      const expected=Number(snapshot.committed_revision??state.revision??0),at=now();
      const nextState={...state,evolution:baseEvolution};
      const nextSnapshot={...snapshot,state:nextState,committed_revision:expected,updated_at:at};delete nextSnapshot.memory;
      await runtime.commit(id,expected,{...nextSnapshot,memory});
      return{...result,evolution:{state:baseEvolution},meta:{...(result.meta||{}),evolution_ok:false,evolution_error:'OPENAI_API_KEY absente'}};
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

    const at=now();
    let emotion;
    try{emotion=applyEmotionChanges(state.emotion||{},observer.sentiments||[],{at})}
    catch(error){return{...result,meta:{...(result.meta||{}),evolution_ok:false,evolution_error:`émotion: ${String(error?.message||error)}`,observer}}}

    const historyEvents=[...(baseEvolution.history_events||[])];
    let historyLevel=baseEvolution.history_level??null,historyChange=null;
    if(observer.histoire){
      const out=applyHistoryEvent(historyLevel,observer.histoire);
      historyLevel=out.level;
      historyChange=out.change;
      historyEvents.push({...observer.histoire,before:out.change?.before??historyLevel,after:out.change?.after??historyLevel,at});
    }

    const birthHistory=[...(baseEvolution.birth_history||[]),...grown.births.map(b=>({...b,at}))].slice(-500);
    const evolution={...baseEvolution,durable_levels:applied.levels,marbles:grown.marbles,history_level:historyLevel,history_events:historyEvents.slice(-200),history_last_change:historyChange,birth_thresholds:grown.birth_thresholds,birth_history:birthHistory,observer_last:observer,last_changes:applied.changes,last_marble_changes:marbleApplied.changes,last_births:grown.births,updated_at:at};

    let progression;
    try{progression=processRewardProgression({rewardState:state.rewards||{},emotionState:emotion,evolution,observerChanges:emotion.last_changes||[],at});emotion=progression.emotionState}
    catch(error){return{...result,meta:{...(result.meta||{}),evolution_ok:false,evolution_error:`récompenses: ${String(error?.message||error)}`,observer}}}

    const renderQueue=buildRewardRenderQueue({pending_rewards:progression.rewards},evolution.marbles.length);
    const nextState={...state,evolution,emotion,rewards:progression.rewardState};
    const expected=Number(snapshot.committed_revision??state.revision??0);
    const nextSnapshot={...snapshot,state:nextState,committed_revision:expected,updated_at:at};delete nextSnapshot.memory;
    await runtime.commit(id,expected,{...nextSnapshot,memory});

    return{...result,evolution:{observer,changes:applied.changes,marble_changes:marbleApplied.changes,births:grown.births,history_change:historyChange,state:evolution},emotion,rewards:{state:progression.rewardState,new_rewards:progression.rewards,threshold:progression.threshold,status:progression.status,render_queue:renderQueue},meta:{...(result.meta||{}),evolution_ok:true,evolution_changes:applied.changes.length,emotion_changes:emotion.last_changes.length,reward_events:progression.rewards.length,reward_render_queue:renderQueue.length,new_marble_births:grown.births.length,history_changed:!!historyChange,marble_evolution_skipped:marbleApplied.skipped,marble_evolution_reason:marbleApplied.reason||null}};
  };
}
