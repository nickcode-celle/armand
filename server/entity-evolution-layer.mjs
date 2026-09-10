import {createEntityAI} from './entity-ai.mjs';
import {observeEntityTurn} from './entity-observer.mjs';
import {applyEvolutionEvents} from './entity-evolution-engine.mjs';
import {applyChangesToMarbles} from './entity-marble-evolution.mjs';
import {applyEmotionChanges} from './entity-emotion-engine.mjs';

const transcript=messages=>(messages||[]).map(m=>`${m.role==='assistant'?'EMÆÄ':'Personne'}: ${String(m.content||'')}`).join('\n');
const now=()=>new Date().toISOString();

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
    const recent=Array.isArray(state.recent_messages)&&state.recent_messages.length
      ? state.recent_messages
      : (Array.isArray(body?.messages)?body.messages.slice(-12):[]);
    const ai=aiFactory(key);

    let observer;
    try{
      observer=await observeEntityTurn({ai,conversation:transcript(recent),memory,state});
    }catch(error){
      return{...result,meta:{...(result.meta||{}),evolution_ok:false,evolution_error:String(error?.message||error)}};
    }

    let applied;
    try{
      applied=applyEvolutionEvents(state.evolution?.durable_levels||{},observer.evolutions_durables||[]);
    }catch(error){
      return{...result,meta:{...(result.meta||{}),evolution_ok:false,evolution_error:String(error?.message||error),observer}};
    }

    let marbleApplied;
    try{
      const currentMarbles=state.evolution?.marbles??state.marbles??[];
      marbleApplied=applyChangesToMarbles(currentMarbles,applied.changes,{seed:String(body?.requestId||`${id}|${state.revision||0}`)});
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

    const history=[...(state.evolution?.history_events||[])];
    if(observer.histoire)history.push({...observer.histoire,at});
    const evolution={
      ...(state.evolution||{}),
      durable_levels:applied.levels,
      marbles:marbleApplied.marbles,
      history_events:history.slice(-200),
      observer_last:observer,
      last_changes:applied.changes,
      last_marble_changes:marbleApplied.changes,
      updated_at:at
    };
    const nextState={...state,evolution,emotion};
    const expected=Number(snapshot.committed_revision??state.revision??0);
    const nextSnapshot={...snapshot,state:nextState,committed_revision:expected,updated_at:at};
    delete nextSnapshot.memory;
    await runtime.commit(id,expected,{...nextSnapshot,memory});

    return{
      ...result,
      evolution:{observer,changes:applied.changes,marble_changes:marbleApplied.changes,state:evolution},
      emotion,
      meta:{
        ...(result.meta||{}),
        evolution_ok:true,
        evolution_changes:applied.changes.length,
        emotion_changes:emotion.last_changes.length,
        marble_evolution_skipped:marbleApplied.skipped,
        marble_evolution_reason:marbleApplied.reason||null
      }
    };
  };
}
