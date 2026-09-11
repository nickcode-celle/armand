import React,{useEffect,useRef} from 'react';
import * as THREE from 'three';
import {createEmaeaBodyRuntime} from './emaeaBodyRuntime.js';

const FOREST_PHOTO='https://images.unsplash.com/photo-1776720056861-110c78f902ec?auto=format&fit=crop&fm=jpg&q=88&w=2400';

async function readEvolution(entityId){
  const response=await fetch('/api/entity/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({entityId})});
  let data={};try{data=await response.json()}catch{}
  if(!response.ok)throw new Error(data?.error||'Etat EMÆÄ indisponible');
  return data?.evolution||{};
}

function tuneEntityMaterial(root){
  root.traverse(o=>{
    const mats=Array.isArray(o.material)?o.material:[o.material];
    for(const m of mats){
      if(!m?.color)continue;
      if('envMapIntensity'in m)m.envMapIntensity=Math.max(Number(m.envMapIntensity)||0,1.35);
      if('roughness'in m)m.roughness=Math.max(.2,Math.min(.72,Number(m.roughness??.48)));
      if('metalness'in m)m.metalness=Math.min(.18,Number(m.metalness??.02));
      m.needsUpdate=true;
    }
  });
}

function dressStage(runtime){
  const{scene,camera,renderer,entityGroup}=runtime;
  renderer.domElement.style.width='100%';
  renderer.domElement.style.height='100%';
  renderer.domElement.style.display='block';
  renderer.setClearColor(0x000000,0);
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.14;
  scene.background=null;
  scene.fog=null;

  camera.position.set(0,12,305);
  camera.lookAt(0,-9,0);
  camera.updateProjectionMatrix();
  entityGroup.scale.setScalar(1.46);
  entityGroup.position.set(0,10,0);
  tuneEntityMaterial(entityGroup);

  const warm=new THREE.PointLight(0xffc85f,8.5,330,2);
  warm.position.set(-30,-5,80);
  entityGroup.add(warm);
  const green=new THREE.PointLight(0x5cff91,3.1,230,2);
  green.position.set(36,-20,42);
  entityGroup.add(green);
  const rim=new THREE.DirectionalLight(0xffe2a8,1.15);
  rim.position.set(-1.4,2.2,2.8);
  scene.add(rim);
  const neutral=new THREE.HemisphereLight(0xffffff,0x111111,.42);
  scene.add(neutral);

  return()=>{
    entityGroup.remove(warm,green);
    scene.remove(rim,neutral);
  };
}

export default function EmaeaRuntimeHost({entityId,className=''}){
  const hostRef=useRef(null);
  useEffect(()=>{
    if(!entityId||!hostRef.current)return;
    let cancelled=false,runtime=null,timer=null,busy=false,undress=null;
    const sync=async()=>{
      if(cancelled||busy)return;
      busy=true;
      try{
        const evolution=await readEvolution(entityId);
        if(cancelled)return;
        if(!runtime){runtime=createEmaeaBodyRuntime(hostRef.current,evolution);undress=dressStage(runtime)}
        else await runtime.applyState?.(evolution);
      }catch(error){if(!cancelled)console.error('[EMÆÄ graphic]',error)}finally{busy=false}
    };
    sync().then(()=>{if(!cancelled)timer=setInterval(sync,1500)});
    return()=>{cancelled=true;if(timer)clearInterval(timer);undress?.();runtime?.dispose?.();runtime=null};
  },[entityId]);

  return <div className={`${className} overflow-hidden bg-black`}>
    <img src={FOREST_PHOTO} alt="" className="absolute inset-0 h-full w-full object-cover object-[50%_63%] brightness-[.58] saturate-[.82] contrast-[1.04]"/>
    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,.62)_0%,rgba(0,0,0,.28)_36%,rgba(0,0,0,.08)_62%,rgba(0,0,0,.20)_100%)]"/>
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_78%,rgba(255,201,92,.48)_0%,rgba(255,179,47,.20)_17%,rgba(84,255,142,.10)_31%,rgba(0,0,0,0)_55%)] mix-blend-screen"/>
    <div className="pointer-events-none absolute left-1/2 top-[70%] h-[22%] w-[46%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse,rgba(255,220,135,.28)_0%,rgba(255,190,70,.11)_42%,transparent_72%)] blur-xl"/>
    <div ref={hostRef} className="absolute inset-0"/>
  </div>;
}
