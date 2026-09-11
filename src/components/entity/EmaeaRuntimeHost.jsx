import React,{useEffect,useRef} from 'react';
import * as THREE from 'three';
import {createEmaeaBodyRuntime} from './emaeaBodyRuntime.js';

async function readEvolution(entityId){
  const response=await fetch('/api/entity/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({entityId})});
  let data={};try{data=await response.json()}catch{}
  if(!response.ok)throw new Error(data?.error||'Etat EMÆÄ indisponible');
  return data?.evolution||{};
}

function dressStage(runtime){
  const{scene,camera,renderer,entityGroup}=runtime;
  renderer.domElement.style.width='100%';renderer.domElement.style.height='100%';renderer.domElement.style.display='block';
  renderer.setClearColor(0x0b1413,1);renderer.toneMappingExposure=1.32;
  camera.position.set(0,38,390);camera.lookAt(0,-12,0);camera.updateProjectionMatrix();
  entityGroup.scale.setScalar(.78);entityGroup.position.y=2;

  const ground=new THREE.Mesh(new THREE.PlaneGeometry(620,360,1,1),new THREE.MeshStandardMaterial({color:0x18251d,roughness:.92,metalness:.03}));
  ground.rotation.x=-Math.PI/2;ground.position.set(0,-94,-10);ground.receiveShadow=true;scene.add(ground);
  const glow=new THREE.Mesh(new THREE.CircleGeometry(118,64),new THREE.MeshBasicMaterial({color:0x214f32,transparent:true,opacity:.22,depthWrite:false}));
  glow.rotation.x=-Math.PI/2;glow.position.set(0,-93.5,5);scene.add(glow);
  const key=new THREE.PointLight(0xffe7a5,2.7,500,2);key.position.set(-105,85,145);scene.add(key);
  const green=new THREE.PointLight(0x73ff9d,2.1,380,2);green.position.set(110,-12,120);scene.add(green);
  const rim=new THREE.PointLight(0x8ed7ff,1.3,420,2);rim.position.set(0,115,-80);scene.add(rim);

  const rocks=new THREE.Group();
  for(let i=0;i<18;i++){
    const g=new THREE.DodecahedronGeometry(3+Math.random()*7,0),m=new THREE.MeshStandardMaterial({color:i%3===0?0x26382c:0x202722,roughness:1}),r=new THREE.Mesh(g,m);
    const side=i<9?-1:1;r.position.set(side*(95+Math.random()*190),-88+Math.random()*3,-35+Math.random()*90);r.scale.y=.45+.35*Math.random();r.rotation.set(Math.random(),Math.random(),Math.random());r.castShadow=r.receiveShadow=true;rocks.add(r);
  }
  scene.add(rocks);
  return()=>{scene.remove(ground,glow,key,green,rim,rocks);ground.geometry.dispose();ground.material.dispose();glow.geometry.dispose();glow.material.dispose();rocks.traverse(o=>{o.geometry?.dispose?.();o.material?.dispose?.()})};
}

export default function EmaeaRuntimeHost({entityId,className=''}){
  const hostRef=useRef(null);
  useEffect(()=>{
    if(!entityId||!hostRef.current)return;
    let cancelled=false,runtime=null,timer=null,busy=false,undress=null;
    const sync=async()=>{
      if(cancelled||busy)return;busy=true;
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
  return <div ref={hostRef} className={`${className} bg-[radial-gradient(circle_at_50%_48%,#173024_0%,#0b1514_42%,#081011_78%)]`}/>;
}
