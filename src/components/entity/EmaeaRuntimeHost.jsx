import React,{useEffect,useRef} from 'react';
import * as THREE from 'three';
import {createEmaeaBodyRuntime} from './emaeaBodyRuntime.js';

const PEDESTAL_ART='/assets/emaea/emaea-stage-final.jpg';
const ENTITY_SCALE=1.08;
const ENTITY_Y=20;

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
      if('envMapIntensity'in m)m.envMapIntensity=Math.min(.72,Number(m.envMapIntensity??.55));
      if('roughness'in m)m.roughness=Math.max(.28,Math.min(.76,Number(m.roughness??.52)));
      if('metalness'in m)m.metalness=Math.min(.12,Number(m.metalness??.02));
      m.needsUpdate=true;
    }
  });
}

function makeExactPlane(texture,camera,z){
  const image=texture.image;
  const imageAspect=(image?.naturalWidth||image?.width||1)/(image?.naturalHeight||image?.height||1);
  const distance=Math.abs(camera.position.z-z);
  const vFov=THREE.MathUtils.degToRad(camera.fov);
  const visibleHeight=2*Math.tan(vFov/2)*distance;
  const visibleWidth=visibleHeight*camera.aspect;
  let width=visibleWidth;
  let height=width/imageAspect;
  if(height>visibleHeight){height=visibleHeight;width=height*imageAspect}
  const plane=new THREE.Mesh(
    new THREE.PlaneGeometry(width,height),
    new THREE.MeshBasicMaterial({map:texture,toneMapped:false,depthWrite:false,depthTest:false})
  );
  plane.position.set(0,0,z);
  plane.renderOrder=-100;
  return plane;
}

function findSatelliteGroup(scene,entityGroup){
  return scene.children.find(o=>o?.isGroup&&o!==entityGroup&&o.children?.length===5)||null;
}

async function dressStage(runtime,initialControls){
  const{scene,camera,renderer,entityGroup}=runtime;
  renderer.domElement.style.width='100%';
  renderer.domElement.style.height='100%';
  renderer.domElement.style.display='block';
  renderer.setClearColor(0x000000,1);
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=.96;
  scene.background=new THREE.Color(0x000000);
  scene.fog=null;

  camera.position.set(0,5,300);
  camera.lookAt(0,-4,0);
  camera.updateProjectionMatrix();

  const baseAmbient=scene.children.find(o=>o?.isHemisphereLight)||null;
  const baseSpot=scene.children.find(o=>o?.isSpotLight)||null;
  const satelliteGroup=findSatelliteGroup(scene,entityGroup);

  let pedestalTexture=null;
  let pedestalPlane=null;
  try{
    pedestalTexture=await loadTexture(renderer,PEDESTAL_ART);
    pedestalPlane=makeExactPlane(pedestalTexture,camera,-135);
    scene.add(pedestalPlane);
  }catch(error){
    console.error('[EMÆÄ decor] Le visuel final du socle est absent. Attendu:',PEDESTAL_ART,error);
  }

  entityGroup.scale.setScalar(ENTITY_SCALE);
  entityGroup.position.set(0,ENTITY_Y,4);
  tuneEntityMaterial(entityGroup);

  const warm=new THREE.PointLight(0xffc46a,1,250,2);
  warm.position.set(0,-58,84);
  scene.add(warm);
  const soft=new THREE.DirectionalLight(0xffead0,1);
  soft.position.set(-1.4,2.2,2.6);
  scene.add(soft);
  const cool=new THREE.DirectionalLight(0x9fc7ff,1);
  cool.position.set(2.4,1.2,1.2);
  scene.add(cool);

  const applyControls=({ambient=.12,lighting=.58,satellites=.72}={})=>{
    const a=Math.max(0,Math.min(1,Number(ambient)));
    const l=Math.max(0,Math.min(1,Number(lighting)));
    const s=Math.max(.35,Math.min(1,Number(satellites)));
    if(baseAmbient)baseAmbient.intensity=a;
    if(baseSpot)baseSpot.intensity=2.25*l;
    warm.intensity=3.7*l;
    soft.intensity=.56*l;
    cool.intensity=.20*l;
    if(satelliteGroup){
      satelliteGroup.position.copy(entityGroup.position);
      satelliteGroup.scale.setScalar(ENTITY_SCALE*s);
    }
  };
  applyControls(initialControls);

  return{
    applyControls,
    dispose(){
      scene.remove(warm,soft,cool);
      if(pedestalPlane){scene.remove(pedestalPlane);pedestalPlane.geometry.dispose();pedestalPlane.material.dispose()}
      pedestalTexture?.dispose?.();
      scene.background=new THREE.Color(0x000000);
    }
  };
}

export default function EmaeaRuntimeHost({entityId,className='',controls}){
  const hostRef=useRef(null);
  const runtimeRef=useRef(null);
  const stageRef=useRef(null);
  const controlsRef=useRef(controls);
  controlsRef.current=controls;

  useEffect(()=>{
    stageRef.current?.applyControls?.(controls);
  },[controls]);

  useEffect(()=>{
    if(!entityId||!hostRef.current)return;
    let cancelled=false,timer=null,busy=false;
    const sync=async()=>{
      if(cancelled||busy)return;
      busy=true;
      try{
        const evolution=await readEvolution(entityId);
        if(cancelled)return;
        if(!runtimeRef.current){
          runtimeRef.current=createEmaeaBodyRuntime(hostRef.current,evolution);
          stageRef.current=await dressStage(runtimeRef.current,controlsRef.current);
        }else await runtimeRef.current.applyState?.(evolution);
      }catch(error){if(!cancelled)console.error('[EMÆÄ graphic]',error)}finally{busy=false}
    };
    sync().then(()=>{if(!cancelled)timer=setInterval(sync,1500)});
    return()=>{
      cancelled=true;
      if(timer)clearInterval(timer);
      stageRef.current?.dispose?.();
      stageRef.current=null;
      runtimeRef.current?.dispose?.();
      runtimeRef.current=null;
    };
  },[entityId]);

  return <div ref={hostRef} className={`${className} overflow-hidden bg-black`}/>;
}
