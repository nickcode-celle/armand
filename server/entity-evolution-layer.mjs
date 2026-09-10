import {createEntityAI} from './entity-ai.mjs';
import {observeEntityTurn} from './entity-observer.mjs';
import {applyEvolutionEvents} from './entity-evolution-engine.mjs';
import {applyChangesToMarbles} from './entity-marble-evolution.mjs';
import {createInitialMarbleAssignments} from './entity-marble-allocation.mjs';
import {initializeMarbleValues} from './entity-initializer.mjs';
import {applyEmotionChanges} from './entity-emotion-engine.mjs';
import {processRewardProgression} from './entity-reward-progression.mjs';
import {buildRewardRenderQueue} from './entity-reward-render-contract.mjs';

const transcript=messages=>(messages||[]).map(m=>`${m.role==='assistant'?'EMÆÄ':'Personne'}: ${String(m.content||'')}`).join('\n');
const now=()=>new Date().toISOString();

function ensureInitialEvolution(state,id){
  const current=state.evolution||{};
  if(Array.isArray(current.marbles)&&current.marbles.length&&current.durable_levels&&Object.keys(current.durable_levels).length)return current;
  const assigned=createInitialMarbleAssignments({seed:`${id}|allocation`});
  const initialized=initializeMarbleValues(assigned,{seed:`${id}|initial-values`});
  return{
    ...current,
    marbles:initialized.marbles,
    durable_levels:{...initialized.durable_levels,'Capacités':initialized.capacities_level},
    history_level:current.history_level??null,
    history_events:Array.isArray(current.history_events)?current.history_events:[],
    initialized_at:now(),
    updated_at:now()
  };
}

export function createEvolutionLayer({handleTurn,runtime,aiFactory=createEntityAI}){
  return async function handleTurnWithEvolution(body){
    const result=await handleTurn(body);
    if(result?.meta?.idempotent_replay)return result;
    const key=process.env.OPENAI_API_KEY;
    if(!key)return result;

    const id=String(body?.entityId||'').trim();
    const snapshot=await runtime.load(id,{}, {withMemory:true});
    const state=snapshot.state||{};
    const memory=snapshot.memory??null;
    const baseEvolution=ensureInitialEvolution(state,id);
    const recent=Array.isArray(state.recent_messages)&&state.recent_messages.length
      ? state.recent_messages
      : (Array.isArray(body?.messages)?body.messages.slice(-12):[]);
    const ai=aiFactory(key);

    let observer;
    try{
      observer=await observeEntityTurn({ai,conversation:transcript(recent),memory,state:{...state,evolution:baseEvolution}});
    }catch(error){
      return{...result,meta:{...(result.meta||{}),evolution_ok:false,evolution_error:String(error?.message||error)}};
    }

    let applied;
    try{
      applied=applyEvolutionEvents(baseEvolution.durable_levels||{},observer.evolutions_durables||[]);
    }catch(error){
      return{...result,meta:{...(result.meta||{}),evolution_ok:false,evolution_error:String(error?.message||error),observer}};
    }

    let marbleApplied;
    try{
      marbleApplied=applyChangesToMarbles(baseEvolution.marbles||[],applied.changes,{seed:String(body?.requestId||`${id}|${state.revision||0}`)});
    }catch(error){
      return{...result,meta:{...(result.meta||{}),evolution_ok:false,evolution_error:`billes: ${String(error?.message||error)}`,observer}};
    }

    const at=now();
    let emotion;
    try{
      emotion=applyEmotionChanges(state.emotion||{},observer.sentiments||[],{at});
    }catch(error){
      return{...result,meta:{...(result.meta||{}),evolution_ok:false,evolution_error:`émotion: ${String(error?.message||error)}`,observer}};
    }

    const history=[...(baseEvolution.history_events||[])];
    if(observer.histoire)history.push({...observer.histoire,at});
    const evolution={
      ...baseEvolution,
      durable_levels:applied.levels,
      marbles:marbleApplied.marbles,
      history_events:history.slice(-200),
      observer_last:observer,
      last_changes:applied.changes,
      last_marble_changes:marbleApplied.changes,
      updated_at:at
    };

    let progression;
    try{
      progression=processRewardProgression({rewardState:state.rewards||{},emotionState:emotion,evolution,observerChanges:emotion.last_changes||[],at});
      emotion=progression.emotionState;
    }catch(error){
      return{...result,meta:{...(result.meta||{}),evolution_ok:false,evolution_error:`récompenses: ${String(error?.message||error)}`,observer}};
    }

    const renderQueue=buildRewardRenderQueue(progression.rewardState,evolution.marbles.length);
    const nextState={...state,evolution,emotion,rewards:progression.rewardState};
    const expected=Number(snapshot.committed_revision??state.revision??0);
    const nextSnapshot={...snapshot,state:nextState,committed_revision:expected,updated_at:at};
    delete nextSnapshot.memory;
    await runtime.commit(id,expected,{...nextSnapshot,memory});

    return{
      ...result,
      evolution:{observer,changes:applied.changes,marble_changes:marbleApplied.changes,state:evolution},
      emotion,
      rewards:{state:progression.rewardState,new_rewards:progression.rewards,threshold:progression.threshold,status:progression.status,render_queue:renderQueue},
      meta:{
        ...(result.meta||{}),
        evolution_ok:true,
        evolution_changes:applied.changes.length,
        emotion_changes:emotion.last_changes.length,
        reward_events:progression.rewards.length,
        reward_render_queue:renderQueue.length,
        marble_evolution_skipped:marbleApplied.skipped,
        marble_evolution_reason:marbleApplied.reason||null
      }
    };
  };
}
