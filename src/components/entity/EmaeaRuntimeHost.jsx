import React,{useEffect,useRef} from 'react';
import * as THREE from 'three';
import {createEmaeaBodyRuntime} from './emaeaBodyRuntime.js';

async function readEvolution(entityId){
  const response=await fetch('/api/entity/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({entityId})});
  let data={};try{data=await response.json()}catch{}
  if(!response.ok)throw new Error(data?.error||'Etat EMÆÄ indisponible');
  return data?.evolution||{};
}

function makeGlowTexture(){
  const c=document.createElement('canvas');c.width=512;c.height=256;
  const x=c.getContext('2d'),g=x.createRadialGradient(256,128,8,256,128,250);
  g.addColorStop(0,'rgba(120,255,168,.38)');g.addColorStop(.28,'rgba(74,222,128,.20)');g.addColorStop(.62,'rgba(16,185,129,.07)');g.addColorStop(1,'rgba(16,185,129,0)');
  x.fillStyle=g;x.fillRect(0,0,c.width,c.height);
  const t=new THREE.CanvasTexture(c);t.minFilter=t.magFilter=THREE.LinearFilter;t.generateMipmaps=false;return t;
}

function dressStage(runtime){
  const{scene,camera,renderer,entityGroup}=runtime;
  renderer.domElement.style.width='100%';renderer.domElement.style.height='100%';renderer.domElement.style.display='block';
  renderer.setClearColor(0x07100e,1);renderer.toneMappingExposure=1.55;
  camera.position.set(0,30,335);camera.lookAt(0,-8,0);camera.updateProjectionMatrix();
  entityGroup.scale.setScalar(1.03);entityGroup.position.y=10;

  const floor=new THREE.Mesh(new THREE.PlaneGeometry(760,430,1,1),new THREE.MeshPhysicalMaterial({color:0x101c18,roughness:.48,metalness:.10,clearcoat:.42,clearcoatRoughness:.58}));
  floor.rotation.x=-Math.PI/2;floor.position.set(0,-104,-12);floor.receiveShadow=true;scene.add(floor);

  const glowTexture=makeGlowTexture();
  const glow=new THREE.Mesh(new THREE.PlaneGeometry(360,170),new THREE.MeshBasicMaterial({map:glowTexture,transparent:true,opacity:.95,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
  glow.rotation.x=-Math.PI/2;glow.position.set(0,-103.4,28);scene.add(glow);

  const horizon=new THREE.Mesh(new THREE.PlaneGeometry(760,150),new THREE.MeshBasicMaterial({color:0x0d2119,transparent:true,opacity:.34,depthWrite:false}));
  horizon.position.set(0,-54,-125);scene.add(horizon);

  const key=new THREE.SpotLight(0xffd889,7.2,650,Math.PI/4.3,.55,1.3);key.position.set(-115,145,190);key.target.position.set(0,-15,0);key.castShadow=true;key.shadow.mapSize.set(1024,1024);scene.add(key,key.target);
  const green=new THREE.PointLight(0x6aff9c,4.8,430,1.8);green.position.set(95,8,125);scene.add(green);
  const rim=new THREE.PointLight(0x9fe8d0,3.0,500,2);rim.position.set(-10,135,-80);scene.add(rim);
  const warm=new THREE.PointLight(0xffba52,2.8,360,2);warm.position.set(-80,-54,85);scene.add(warm);
  const fill=new THREE.HemisphereLight(0xbfffe0,0x173426,1.7);scene.add(fill);

  const lightPools=[];
  for(const[x,z,s,a]of[[-155,30,75,.16],[150,45,90,.13],[-245,-10,55,.09],[235,5,60,.08]]){
    const p=new THREE.Mesh(new THREE.CircleGeometry(s,64),new THREE.MeshBasicMaterial({color:0x2cbf71,transparent:true,opacity:a,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
    p.rotation.x=-Math.PI/2;p.position.set(x,-103.25,z);scene.add(p);lightPools.push(p);
  }

  return()=>{
    scene.remove(floor,glow,horizon,key,key.target,green,rim,warm,fill,...lightPools);
    floor.geometry.dispose();floor.material.dispose();glow.geometry.dispose();glow.material.dispose();glowTexture.dispose();horizon.geometry.dispose();horizon.material.dispose();
    lightPools.forEach(p=>{p.geometry.dispose();p.material.dispose()});
  };
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
  return <div ref={hostRef} className={`${className} bg-[radial-gradient(ellipse_at_50%_58%,#173b2a_0%,#0c1915_38%,#07100e_76%)]`}/>;
}
