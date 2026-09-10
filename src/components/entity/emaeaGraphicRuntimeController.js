import {createEmaeaBodyRuntime} from './emaeaBodyRuntime.js';
import {attachEmaeaRewardBridge} from './emaeaRewardBridge.js';
import {attachEmaeaBirthBridge} from './emaeaBirthBridge.js';
import {enqueueEmaeaGraphicTask} from './emaeaGraphicScheduler.js';

/**
 * Contrôleur impératif du moteur E. Il ne décide d'aucune mise en page : le conteneur
 * est fourni par l'interface finale. Il garantit qu'un seul runtime normal pilote les
 * vraies billes. Naissances, récompenses et mises à jour structurelles utilisent le même
 * ordonnanceur par runtime afin qu'un changement durable ne coupe jamais une animation.
 */
export function createEmaeaGraphicRuntimeController({container,entityId,initialEvolution,acknowledgeReward,acknowledgeBirth}){
  if(!container)throw new Error('Conteneur EMÆÄ manquant');
  if(!entityId)throw new Error('entityId EMÆÄ manquant');

  const runtime=createEmaeaBodyRuntime(container,initialEvolution||{});

  // Une bille née doit terminer exactement à la taille des billes normales. Le prototype
  // de naissance anime la Mesh elle-même ; le moteur normal enveloppe ensuite cette Mesh
  // dans son root de mouvement. On normalise donc le root après l'intégration sans recréer
  // la bille et sans toucher à son identité.
  const finalizeBirth=runtime.finalizeBornMarble?.bind(runtime);
  if(finalizeBirth){
    runtime.finalizeBornMarble=async(...args)=>{
      const result=await finalizeBirth(...args);
      const root=runtime.marbles?.at?.(-1);
      root?.scale?.setScalar?.(runtime.marbleScale??0.90);
      return result;
    };
  }

  const detachReward=attachEmaeaRewardBridge(runtime,{entityId,acknowledge:acknowledgeReward});
  const detachBirth=attachEmaeaBirthBridge(runtime,{entityId,acknowledge:acknowledgeBirth});
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
      detachBirth?.();
      detachReward?.();
      runtime.dispose?.();
    }
  };
}
