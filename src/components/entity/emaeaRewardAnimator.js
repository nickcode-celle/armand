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

/**
 * Joue une récompense sur le moteur normal d'EMÆÄ : mêmes billes, mêmes matériaux,
 * seule la position des centres de squelette est interpolée. La couleur de palier est
 * temporaire et les couleurs individuelles sont restaurées au retour.
 */
export async function playEmaeaReward(runtime,command){
  validateRuntime(runtime,command);
  const centers=runtime.centers,marbles=runtime.marbles;
  const origin=centers.map(p=>p.clone());
  const target=makeRewardCenters(command);
  const originalColors=marbles.map(m=>m?.material?.color?.clone?.()??null);
  const tierColor=new THREE.Color(command.color);

  await interpolateCenters(centers,origin,target,command.timing.morph_ms,runtime.updateCells);
  for(const marble of marbles){if(marble?.material?.color){marble.material.color.copy(tierColor);marble.material.needsUpdate=true}}
  runtime.updateCells?.();
  await wait(command.timing.hold_ms);
  await interpolateCenters(centers,target,origin,command.timing.return_ms,runtime.updateCells);
  marbles.forEach((marble,i)=>{if(originalColors[i]&&marble?.material?.color){marble.material.color.copy(originalColors[i]);marble.material.needsUpdate=true}});
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
