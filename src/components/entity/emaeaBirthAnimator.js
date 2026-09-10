import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

const smooth=t=>t*t*(3-2*t);
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const frame=()=>new Promise(resolve=>requestAnimationFrame(resolve));

async function tween(duration,fn){
  const start=performance.now();
  while(true){
    const t=Math.min(1,(performance.now()-start)/duration);
    fn(t,smooth(t));
    if(t>=1)break;
    await frame();
  }
}
function required(runtime,key){if(!runtime?.[key])throw new Error(`Runtime EMÆÄ: ${key} requis pour la naissance`);return runtime[key]}
function setMaterialGold(material,gold,env){
  if(!material)throw new Error('Matériau de la bille de naissance absent');
  if(material.color)material.color.set(gold.color);
  if('metalness'in material)material.metalness=gold.metalness;
  if('roughness'in material)material.roughness=gold.roughness;
  if('envMap'in material)material.envMap=env;
  if('envMapIntensity'in material)material.envMapIntensity=gold.envMapIntensity;
  if(material.emissive)material.emissive.set(0x000000);
  if('emissiveIntensity'in material)material.emissiveIntensity=0;
  material.needsUpdate=true;
}
function createEnvelope(color){
  return new THREE.Mesh(new THREE.SphereGeometry(1,32,24),new THREE.MeshBasicMaterial({color,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));
}

/**
 * Séquence validée du 09/09 : point fixe, trois enveloppes, vraie Mesh dorée,
 * exposition 3 s, puis cette même Mesh rejoint le moteur normal en 2,6 s.
 * Le runtime graphique reste propriétaire de la création/finalisation de la bille.
 */
export async function playEmaeaBirth(runtime,command){
  const scene=required(runtime,'scene');
  const entityGroup=required(runtime,'entityGroup');
  const renderer=required(runtime,'renderer');
  const createBirthMarble=required(runtime,'createBirthMarble');
  const finalizeBornMarble=required(runtime,'finalizeBornMarble');
  const targetForBirth=required(runtime,'targetForBirth');
  const getEcart=required(runtime,'getEcart');
  const setEcart=required(runtime,'setEcart');
  const updateCells=runtime.updateCells??(()=>{});
  const start=new THREE.Vector3(...command.start_position);
  const group=new THREE.Group();scene.add(group);
  const pointMat=new THREE.MeshBasicMaterial({color:command.envelopes.core,transparent:true,opacity:1});
  const point=new THREE.Mesh(new THREE.SphereGeometry(.18,20,20),pointMat);point.position.copy(start);point.visible=false;group.add(point);
  const light=new THREE.PointLight(0xffd75b,0,90,2);light.position.copy(start);scene.add(light);
  const core=createEnvelope(command.envelopes.core),corona=createEnvelope(command.envelopes.corona),halo=createEnvelope(command.envelopes.halo);
  for(const x of [core,corona,halo]){x.position.copy(start);x.scale.setScalar(.001);group.add(x)}

  const pmrem=new THREE.PMREMGenerator(renderer);
  const goldEnv=pmrem.fromScene(new RoomEnvironment(),command.gold_material.pmremSigma).texture;
  pmrem.dispose();
  const marble=createBirthMarble(command.marble,command);
  if(!marble?.isMesh)throw new Error('La naissance doit créer une vraie THREE.Mesh');
  marble.position.copy(start);marble.scale.setScalar(.001);marble.visible=false;marble.castShadow=true;marble.receiveShadow=true;
  setMaterialGold(marble.material,command.gold_material,goldEnv);
  group.add(marble);

  try{
    await sleep(command.timing.prelude_ms);
    point.visible=true;marble.visible=false;
    await tween(command.timing.rise_ms,(t,s)=>{
      point.scale.setScalar(.8+s*5.2);light.intensity=30+420*s;
      core.material.opacity=.15+.62*s;corona.material.opacity=.08+.34*s;halo.material.opacity=.03+.16*s;
      core.scale.setScalar(.35+1.75*s);corona.scale.setScalar(.9+2.7*s);halo.scale.setScalar(1.8+4.4*s);
    });

    marble.visible=true;
    const burstMs=command.timing.burst_end_ms-command.timing.rise_ms;
    await tween(burstMs,(t)=>{
      const e=1-Math.pow(1-t,3);point.visible=t<.16;light.intensity=620*(1-.55*t)+160;
      marble.scale.setScalar(Math.max(.001,THREE.MathUtils.smoothstep(t,.04,.52)*(runtime.marbleScale??.90)));
      core.material.opacity=.95*(1-t)+.12;corona.material.opacity=.62*(1-t)+.10;halo.material.opacity=.38*(1-t)+.05;
      core.scale.setScalar(2.1+e*2.8);corona.scale.setScalar(3.8+e*6.4);halo.scale.setScalar(6.3+e*10.5);
    });

    const dissipate=async()=>tween(command.timing.dissipation_ms,t=>{
      const fade=1-t;point.visible=false;core.material.opacity=.12*fade;corona.material.opacity=.10*fade;halo.material.opacity=.05*fade;
      core.scale.setScalar(4.9+2.2*t);corona.scale.setScalar(10.2+4.2*t);halo.scale.setScalar(16.8+6.2*t);light.intensity=160*fade;
    });
    await Promise.all([dissipate(),sleep(command.timing.gold_hold_ms)]);
    core.material.opacity=corona.material.opacity=halo.material.opacity=0;light.intensity=0;

    const startWorld=new THREE.Vector3();marble.getWorldPosition(startWorld);
    const baseEcart=Number(getEcart());if(!Number.isFinite(baseEcart))throw new Error('ECART graphique invalide');
    const previousCount=command.body_count_after-1;
    const finalEcart=baseEcart*Math.cbrt(command.body_count_after/previousCount);
    const normal=await runtime.normalMaterialForBirth?.(command.marble,command);
    const goldColor=new THREE.Color(command.gold_material.color);
    const normalColor=normal?.color?new THREE.Color(normal.color):null;
    const targetWorld=new THREE.Vector3();
    await tween(command.timing.integration_ms,(t,s)=>{
      const currentEcart=THREE.MathUtils.lerp(baseEcart,finalEcart,s);
      setEcart(currentEcart);
      const target=targetForBirth(command.marble_id,command.body_count_after,command);
      if(!target?.isVector3)throw new Error('Centre cible de naissance invalide');
      // targetForBirth renvoie un centre de squelette normalisé : appliquer l'ECART courant,
      // comme dans le prototype validé, avant conversion en coordonnées monde.
      targetWorld.copy(target).multiplyScalar(currentEcart);entityGroup.updateMatrixWorld(true);entityGroup.localToWorld(targetWorld);
      marble.position.copy(startWorld).lerp(targetWorld,s);
      if(normalColor&&marble.material?.color)marble.material.color.copy(goldColor).lerp(normalColor,s);
      if(normal){
        if(normal.metalness!=null&&'metalness'in marble.material)marble.material.metalness=THREE.MathUtils.lerp(command.gold_material.metalness,normal.metalness,s);
        if(normal.roughness!=null&&'roughness'in marble.material)marble.material.roughness=THREE.MathUtils.lerp(command.gold_material.roughness,normal.roughness,s);
        if(normal.envMapIntensity!=null&&'envMapIntensity'in marble.material)marble.material.envMapIntensity=THREE.MathUtils.lerp(command.gold_material.envMapIntensity,normal.envMapIntensity,s);
      }
      marble.material.needsUpdate=true;updateCells();
    });

    entityGroup.attach(marble);
    const localTarget=targetForBirth(command.marble_id,command.body_count_after,command);
    marble.position.copy(localTarget).multiplyScalar(Number(getEcart()));marble.scale.setScalar(runtime.marbleScale??.90);
    await finalizeBornMarble(marble,command.marble,command);
    updateCells();
    return command.birth_id;
  }finally{
    scene.remove(group);scene.remove(light);
    for(const x of [point,core,corona,halo]){x.geometry?.dispose?.();x.material?.dispose?.()}
    goldEnv.dispose?.();
  }
}

export async function playEmaeaBirthQueue(runtime,queue,{acknowledge}={}){
  const completed=[];
  for(const command of Array.isArray(queue)?queue:[]){
    const id=await playEmaeaBirth(runtime,command);
    if(typeof acknowledge==='function')await acknowledge(id);
    completed.push(id);
  }
  return completed;
}
