import React,{useEffect,useRef} from 'react';
import * as THREE from 'three';
import {createEmaeaBodyRuntime} from './emaeaBodyRuntime.js';

const FOREST_PHOTO='https://thumb.wikimedia.org/wikipedia/commons/thumb/9/93/Mossy_Forest_Floor_%2860670374%29.jpeg/1280px-Mossy_Forest_Floor_%2860670374%29.jpeg';

async function readEvolution(entityId){
  const response=await fetch('/api/entity/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({entityId})});
  let data={};try{data=await response.json()}catch{}
  if(!response.ok)throw new Error(data?.error||'Etat EMÆÄ indisponible');
  return data?.evolution||{};
}

function loadBackgroundTexture(renderer){
  return new Promise((resolve,reject)=>{
    const loader=new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(FOREST_PHOTO,texture=>{
      texture.colorSpace=THREE.SRGBColorSpace;
      texture.minFilter=THREE.LinearFilter;
      texture.magFilter=THREE.LinearFilter;
      texture.generateMipmaps=false;
      texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
      resolve(texture);
    },undefined,reject);
  });
}

function tuneEntityMaterial(root){
  root.traverse(o=>{
    const mats=Array.isArray(o.material)?o.material:[o.material];
    for(const m of mats){
      if(!m?.color)continue;
      if('envMapIntensity'in m)m.envMapIntensity=Math.max(Number(m.envMapIntensity)||0,1.25);
      if('roughness'in m)m.roughness=Math.max(.2,Math.min(.70,Number(m.roughness??.48)));
      if('metalness'in m)m.metalness=Math.min(.16,Number(m.metalness??.02));
      m.needsUpdate=true;
    }
  });
}

async function dressStage(runtime){
  const{scene,camera,renderer,entityGroup}=runtime;
  renderer.domElement.style.width='100%';
  renderer.domElement.style.height='100%';
  renderer.domElement.style.display='block';
  renderer.setClearColor(0x000000,1);
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.06;
  scene.fog=null;

  let backgroundTexture=null;
  try{
    backgroundTexture=await loadBackgroundTexture(renderer);
    scene.background=backgroundTexture;
    scene.backgroundBlurriness=.10;
    scene.backgroundIntensity=.48;
  }catch(error){
    scene.background=new THREE.Color(0x000000);
    console.error('[EMÆÄ decor] La photo locale de référence Wikimedia ne charge pas.',error);
  }

  camera.position.set(0,10,300);
  camera.lookAt(0,-10,0);
  camera.updateProjectionMatrix();
  entityGroup.scale.setScalar(1.52);
  entityGroup.position.set(0,8,0);
  tuneEntityMaterial(entityGroup);

  const warm=new THREE.PointLight(0xffc85f,7.3,325,2);
  warm.position.set(-26,-6,76);
  entityGroup.add(warm);
  const green=new THREE.PointLight(0x5cff91,2.35,215,2);
  green.position.set(30,-20,38);
  entityGroup.add(green);
  const rim=new THREE.DirectionalLight(0xffe0aa,.92);
  rim.position.set(-1.2,2.1,2.6);
  scene.add(rim);
  const neutral=new THREE.HemisphereLight(0xffffff,0x080808,.30);
  scene.add(neutral);

  const glowCanvas=document.createElement('canvas');
  glowCanvas.width=512;glowCanvas.height=256;
  const ctx=glowCanvas.getContext('2d');
  const grad=ctx.createRadialGradient(256,128,0,256,128,250);
  grad.addColorStop(0,'rgba(255,205,105,.88)');
  grad.addColorStop(.16,'rgba(255,177,58,.42)');
  grad.addColorStop(.36,'rgba(95,255,145,.13)');
  grad.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=grad;ctx.fillRect(0,0,512,256);
  const glowTexture=new THREE.CanvasTexture(glowCanvas);
  const glow=new THREE.Mesh(new THREE.PlaneGeometry(300,128),new THREE.MeshBasicMaterial({map:glowTexture,transparent:true,opacity:.82,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
  glow.position.set(0,-70,-35);
  scene.add(glow);

  return()=>{
    entityGroup.remove(warm,green);
    scene.remove(rim,neutral,glow);
    glow.geometry.dispose();glow.material.dispose();glowTexture.dispose();
    backgroundTexture?.dispose?.();
    scene.background=new THREE.Color(0x000000);
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
        if(!runtime){runtime=createEmaeaBodyRuntime(hostRef.current,evolution);undress=await dressStage(runtime)}
        else await runtime.applyState?.(evolution);
      }catch(error){if(!cancelled)console.error('[EMÆÄ graphic]',error)}finally{busy=false}
    };
    sync().then(()=>{if(!cancelled)timer=setInterval(sync,1500)});
    return()=>{cancelled=true;if(timer)clearInterval(timer);undress?.();runtime?.dispose?.();runtime=null};
  },[entityId]);

  return <div ref={hostRef} className={`${className} overflow-hidden bg-black`}/>;
}
