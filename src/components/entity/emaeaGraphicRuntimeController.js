import {createEmaeaBodyRuntime} from './emaeaBodyRuntime.js';
import {attachEmaeaRewardBridge} from './emaeaRewardBridge.js';
import {attachEmaeaBirthBridge} from './emaeaBirthBridge.js';

/**
 * Contrôleur impératif du moteur E. Il ne décide d'aucune mise en page : le conteneur
 * est fourni par l'interface finale. Il garantit qu'un seul runtime normal pilote les
 * vraies billes. Naissances et récompenses utilisent déjà le même ordonnanceur par runtime.
 */
export function createEmaeaGraphicRuntimeController({container,entityId,initialEvolution,acknowledgeReward,acknowledgeBirth}){
  if(!container)throw new Error('Conteneur EMÆÄ manquant');
  if(!entityId)throw new Error('entityId EMÆÄ manquant');

  const runtime=createEmaeaBodyRuntime(container,initialEvolution||{});
  const detachReward=attachEmaeaRewardBridge(runtime,{entityId,acknowledge:acknowledgeReward});
  const detachBirth=attachEmaeaBirthBridge(runtime,{entityId,acknowledge:acknowledgeBirth});
  let disposed=false;

  const onState=event=>{
    const detail=event?.detail||{};
    if(detail.entityId!==entityId||!detail.evolution||disposed)return;
    runtime.applyState?.(detail.evolution);
  };
  window.addEventListener('emaea:graphic-state',onState);

  return{
    runtime,
    applyState(evolution){if(!disposed&&evolution)runtime.applyState?.(evolution)},
    dispose(){
      if(disposed)return;
      disposed=true;
      window.removeEventListener('emaea:graphic-state',onState);
      detachBirth?.();
      detachReward?.();
      runtime.dispose?.();
    }
  };
}
