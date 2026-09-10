import * as THREE from 'three';
import {makeRewardCenters} from './emaeaRewardSkeletons.js';

const smooth=t=>t*t*(3-2*t);
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

function frame(){return new Promise(resolve=>requestAnimationFrame(resolve))}
function validateRuntime(runtime,command){
  if(!runtime||!Array.isArray(runtime.centers)||!Array.isArray(runtime.marbles))throw new Error('Runtime graphique EMÆÄ incomplet');
  if(runtime.centers.length!==command.body_count||runtime.marbles.length!==command.body_count)throw new Error('Population graphique incohérente avec la récompense');
}
async function interpolateCenters(centers,from,to,duration,onFrame){
  const start=performance.now();
  while(true){
    const t=Math.min(1,(performance.now()-start)/duration),s=smooth(t);
    for(let i=0;i<centers.length;i++)centers[i].lerpVectors(from[i],to[i],s);
    onFrame?.();
    if(t>=1)break;
    await frame();
  }
}
function snapshotMaterial(m){return m?{color:m.color?.clone?.()??null,metalness:m.metalness,roughness:m.roughness,envMap:m.envMap,envMapIntensity:m.envMapIntensity}:null}
function restoreMaterial(m,s){if(!m||!s)return;if(s.color&&m.color)m.color.copy(s.color);if(s.metalness!=null)m.metalness=s.metalness;if(s.roughness!=null)m.roughness=s.roughness;if('envMap'in s)m.envMap=s.envMap;if(s.envMapIntensity!=null)m.envMapIntensity=s.envMapIntensity;m.needsUpdate=true}

/**
 * Joue une récompense sur le moteur normal d'EMÆÄ. Les sentiments n'ont aucun
 * comportement graphique propre : seuls chiffre/logo et couleur de récompense sont rendus.
 */
export async function playEmaeaReward(runtime,command){
  validateRuntime(runtime,command);
  const centers=runtime.centers,marbles=runtime.marbles;
  const origin=centers.map(p=>p.clone());
  const target=makeRewardCenters(command);
  const originals=marbles.map(m=>snapshotMaterial(m?.material));
  const rewardColor=new THREE.Color(command.color);

  await interpolateCenters(centers,origin,target,command.timing.morph_ms,runtime.updateCells);
  for(const marble of marbles){
    const material=marble?.material;if(!material)continue;
    if(material.color)material.color.copy(rewardColor);
    if(command.full_gold_logo&&command.gold_material){
      material.metalness=command.gold_material.metalness;
      material.roughness=command.gold_material.roughness;
      material.envMapIntensity=command.gold_material.envMapIntensity;
      if(runtime.goldEnv)material.envMap=runtime.goldEnv;
    }
    material.needsUpdate=true;
  }
  runtime.updateCells?.();
  await wait(command.timing.hold_ms);
  await interpolateCenters(centers,target,origin,command.timing.return_ms,runtime.updateCells);
  marbles.forEach((marble,i)=>restoreMaterial(marble?.material,originals[i]));
  runtime.updateCells?.();
  return command.reward_id;
}

/** Les récompenses en attente sont jouées strictement en série. */
export async function playEmaeaRewardQueue(runtime,queue,{acknowledge}={}){
  const completed=[];
  for(const command of Array.isArray(queue)?queue:[]){
    const rewardId=await playEmaeaReward(runtime,command);
    if(typeof acknowledge==='function')await acknowledge(rewardId);
    completed.push(rewardId);
  }
  return completed;
}
