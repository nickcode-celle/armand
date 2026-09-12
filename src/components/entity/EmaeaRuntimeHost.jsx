import React,{useEffect,useRef} from 'react';
import * as THREE from 'three';
import {createEmaeaBodyRuntime} from './emaeaBodyRuntime.js';

const PEDESTAL_ART='/assets/emaea/emaea-pedestal.png';

async function readEvolution(entityId){
  const response=await fetch('/api/entity/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({entityId})});
  let data={};try{data=await response.json()}catch{}
  if(!response.ok)throw new Error(data?.error||'Etat EMÆÄ indisponible');
  return data?.evolution||{};
}

function loadTexture(renderer,url){
  return new Promise((resolve,reject)=>{
    new THREE.TextureLoader().load(url,texture=>{
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
      if('envMapIntensity'in m)m.envMapIntensity=Math.max(Number(m.envMapIntensity)||0,1.15);
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
  renderer.toneMappingExposure=1.03;
  scene.background=new THREE.Color(0x000000);
  scene.fog=null;

  camera.position.set(0,5,300);
  camera.lookAt(0,-4,0);
  camera.updateProjectionMatrix();

  let pedestalTexture=null;
  let pedestalPlane=null;
  try{
    pedestalTexture=await loadTexture(renderer,PEDESTAL_ART);
    pedestalPlane=new THREE.Mesh(
      new THREE.PlaneGeometry(330,330),
      new THREE.MeshBasicMaterial({map:pedestalTexture,toneMapped:false,depthWrite:false,depthTest:false})
    );
    pedestalPlane.position.set(0,0,-135);
    pedestalPlane.renderOrder=-100;
    scene.add(pedestalPlane);
  }catch(error){
    console.error('[EMÆÄ decor] Le visuel du socle est absent. Attendu:',PEDESTAL_ART,error);
  }

  entityGroup.scale.setScalar(1.28);
  entityGroup.position.set(0,36,4);
  tuneEntityMaterial(entityGroup);

  const warm=new THREE.PointLight(0xffc46a,5.4,260,2);
  warm.position.set(0,-48,84);
  scene.add(warm);
  const soft=new THREE.DirectionalLight(0xffead0,.72);
  soft.position.set(-1.4,2.2,2.6);
  scene.add(soft);
  const cool=new THREE.DirectionalLight(0x9fc7ff,.30);
  cool.position.set(2.4,1.2,1.2);
  scene.add(cool);
  const neutral=new THREE.HemisphereLight(0xffffff,0x080808,.22);
  scene.add(neutral);

  return()=>{
    scene.remove(warm,soft,cool,neutral);
    if(pedestalPlane){
      scene.remove(pedestalPlane);
      pedestalPlane.geometry.dispose();
      pedestalPlane.material.dispose();
    }
    pedestalTexture?.dispose?.();
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
