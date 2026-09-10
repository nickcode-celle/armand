import {createEmaeaBodyRuntime} from './emaeaBodyRuntime.js';
import {attachEmaeaRewardBridge} from './emaeaRewardBridge.js';
import {attachEmaeaBirthBridge} from './emaeaBirthBridge.js';
import {attachEmaeaDailyBirthBridge} from './emaeaDailyBirthBridge.js';
import {enqueueEmaeaGraphicTask} from './emaeaGraphicScheduler.js';

function initialVisibleEvolution(evolution={}){
  const pending=new Set((Array.isArray(evolution?.pending_births)?evolution.pending_births:[]).map(x=>String(x?.marble_id??x?.birth_id??'')));
  if(!pending.size)return evolution;
  return{
    ...evolution,
    marbles:(Array.isArray(evolution?.marbles)?evolution.marbles:[]).filter(m=>!pending.has(String(m?.id)))
  };
}

/**
 * Contrôleur impératif du moteur E. Il ne décide d'aucune mise en page : le conteneur
 * est fourni par l'interface finale. Il garantit qu'un seul runtime normal pilote les
 * vraies billes. Naissances, récompenses et mises à jour structurelles utilisent le même
 * ordonnanceur par runtime afin qu'un changement durable ne coupe jamais une animation.
 */
export function createEmaeaGraphicRuntimeController({container,entityId,initialEvolution,acknowledgeReward,acknowledgeBirth,requestDailyBirth}){
  if(!container)throw new Error('Conteneur EMÆÄ manquant');
  if(!entityId)throw new Error('entityId EMÆÄ manquant');

  const runtime=createEmaeaBodyRuntime(container,initialVisibleEvolution(initialEvolution||{}));

  const finalizeBirth=runtime.finalizeBornMarble?.bind(runtime);
  if(finalizeBirth){
    runtime.finalizeBornMarble=async(...args)=>{
      const result=await finalizeBirth(...args);
      const root=runtime.marbles?.at?.(-1);
      const unit=Number(root?.userData?.textureUnitScale??1);
      root?.scale?.setScalar?.((runtime.marbleScale??0.90)*(Number.isFinite(unit)&&unit>0?unit:1));
      return result;
    };
  }

  const detachReward=attachEmaeaRewardBridge(runtime,{entityId,acknowledge:acknowledgeReward});
  const detachBirth=attachEmaeaBirthBridge(runtime,{entityId,acknowledge:acknowledgeBirth});
  const detachDaily=typeof requestDailyBirth==='function'
    ? attachEmaeaDailyBirthBridge({entityId,requestDailyBirth})
    : null;
  let disposed=false,lastQueuedState=null;

  const queueState=evolution=>{
    if(disposed||!evolution)return Promise.resolve();
    lastQueuedState=evolution;
    return enqueueEmaeaGraphicTask(runtime,()=>{
      if(disposed)return;
      const next=lastQueuedState;lastQueuedState=null;
      if(next)runtime.applyState?.(next);
    });
  };

  const onState=event=>{
    const detail=event?.detail||{};
    if(detail.entityId!==entityId||!detail.evolution||disposed)return;
    queueState(detail.evolution).catch(error=>window.dispatchEvent(new CustomEvent('emaea:graphic-error',{detail:{entityId,error}})));
  };
  window.addEventListener('emaea:graphic-state',onState);

  return{
    runtime,
    applyState(evolution){return queueState(evolution)},
    dispose(){
      if(disposed)return;
      disposed=true;lastQueuedState=null;
      window.removeEventListener('emaea:graphic-state',onState);
      detachDaily?.();
      detachBirth?.();
      detachReward?.();
      runtime.dispose?.();
    }
  };
}
