import React,{useEffect,useRef} from 'react';
import * as THREE from 'three';
import {createEmaeaBodyRuntime} from './emaeaBodyRuntime.js';

async function readEvolution(entityId){
  const response=await fetch('/api/entity/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({entityId})});
  let data={};try{data=await response.json()}catch{}
  if(!response.ok)throw new Error(data?.error||'Etat EMÆÄ indisponible');
  return data?.evolution||{};
}

function seeded(seed){let s=seed>>>0;return()=>((s=Math.imul(1664525,s)+1013904223>>>0)/4294967296)}

function makeGrass(scene){
  const rand=seeded(96317),blade=new THREE.BufferGeometry();
  blade.setAttribute('position',new THREE.Float32BufferAttribute([-.10,0,0,.10,0,0,-.045,1,0,.10,0,0,.045,1,0,0,1.45,0],3));
  blade.computeVertexNormals();
  const material=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.94,metalness:0,side:THREE.DoubleSide,vertexColors:true});
  const count=5200,mesh=new THREE.InstancedMesh(blade,material,count),dummy=new THREE.Object3D(),c=new THREE.Color();
  mesh.castShadow=true;mesh.receiveShadow=true;
  for(let i=0;i<count;i++){
    const a=rand()*Math.PI*2,r=60+Math.pow(rand(),.72)*315,x=Math.cos(a)*r,z=(rand()-.5)*190+Math.sin(a)*r*.08,centre=Math.exp(-(x*x+z*z)/12000),h=(2.2+rand()*7.2)*(1-.48*centre),w=.72+rand()*1.15;
    dummy.position.set(x,-101.2+rand()*1.6,z-4);dummy.rotation.set((rand()-.5)*.2,rand()*Math.PI,(rand()-.5)*.16);dummy.scale.set(w,h,w);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
    c.setHSL(.285+rand()*.05,.42+rand()*.20,.10+rand()*.10);mesh.setColorAt(i,c);
  }
  mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;scene.add(mesh);
  return()=>{scene.remove(mesh);blade.dispose();material.dispose()};
}

function addMossAndRocks(scene){
  const rand=seeded(17319),group=new THREE.Group(),mats=[0x1e3b25,0x284b2d,0x315834,0x3b663b].map(color=>new THREE.MeshStandardMaterial({color,roughness:1,metalness:0}));
  for(let cluster=0;cluster<38;cluster++){
    const side=cluster%2?-1:1,cx=side*(105+rand()*210),cz=-48+rand()*150,n=8+Math.floor(rand()*14);
    for(let j=0;j<n;j++){
      const g=new THREE.IcosahedronGeometry(1+rand()*2.3,1),o=new THREE.Mesh(g,mats[(rand()*mats.length)|0]);o.position.set(cx+(rand()-.5)*26,-99.7+rand()*2.0,cz+(rand()-.5)*20);o.scale.set(1.3+rand()*2.7,.30+rand()*.52,1.1+rand()*2.5);o.rotation.set(rand(),rand()*Math.PI,rand());o.castShadow=o.receiveShadow=true;group.add(o);
    }
  }
  const rockBase=new THREE.MeshPhysicalMaterial({color:0x151716,roughness:.78,metalness:.02,clearcoat:.20,clearcoatRoughness:.7});
  for(let i=0;i<14;i++){
    const side=i%2?-1:1,g=new THREE.DodecahedronGeometry(5+rand()*10,1),o=new THREE.Mesh(g,rockBase.clone());o.position.set(side*(165+rand()*175),-94+rand()*4,-24+rand()*118);o.scale.set(1.1+rand()*.75,.52+rand()*.50,.85+rand()*.6);o.rotation.set(rand(),rand()*Math.PI,rand());o.castShadow=o.receiveShadow=true;group.add(o);
  }
  scene.add(group);
  return()=>{scene.remove(group);group.traverse(o=>{o.geometry?.dispose?.();o.material?.dispose?.()});mats.forEach(m=>m.dispose());rockBase.dispose()};
}

function makeGlowTexture(){
  const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d'),g=x.createRadialGradient(256,128,4,256,128,250);
  g.addColorStop(0,'rgba(255,208,108,.62)');g.addColorStop(.24,'rgba(126,255,160,.20)');g.addColorStop(.58,'rgba(46,170,92,.06)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,512,256);
  const t=new THREE.CanvasTexture(c);t.minFilter=t.magFilter=THREE.LinearFilter;t.generateMipmaps=false;return t;
}

function dressStage(runtime){
  const{scene,camera,renderer,entityGroup}=runtime;
  renderer.domElement.style.width='100%';renderer.domElement.style.height='100%';renderer.domElement.style.display='block';
  renderer.setClearColor(0x030405,1);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;scene.background=new THREE.Color(0x030405);scene.fog=null;
  camera.position.set(0,18,300);camera.lookAt(0,-7,0);camera.updateProjectionMatrix();entityGroup.scale.setScalar(1.38);entityGroup.position.set(0,15,0);

  const terrainGeo=new THREE.PlaneGeometry(760,360,72,42),p=terrainGeo.attributes.position,rand=seeded(44551);
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),n=(rand()-.5)*4.4+(Math.sin(x*.034)+Math.cos(y*.052))*1.2;p.setZ(i,n)}terrainGeo.computeVertexNormals();
  const terrainMat=new THREE.MeshPhysicalMaterial({color:0x11120f,roughness:.62,metalness:.03,clearcoat:.34,clearcoatRoughness:.32,reflectivity:.42});
  const terrain=new THREE.Mesh(terrainGeo,terrainMat);terrain.rotation.x=-Math.PI/2;terrain.position.set(0,-102.5,-12);terrain.receiveShadow=true;scene.add(terrain);

  const glowTexture=makeGlowTexture(),glow=new THREE.Mesh(new THREE.PlaneGeometry(330,160),new THREE.MeshBasicMaterial({map:glowTexture,transparent:true,opacity:.98,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
  glow.rotation.x=-Math.PI/2;glow.position.set(0,-101.2,20);scene.add(glow);

  const entityWarm=new THREE.PointLight(0xffd274,13,350,2);entityWarm.position.set(0,-10,52);entityGroup.add(entityWarm);
  const entityGreen=new THREE.PointLight(0x6dff9a,6.5,265,2);entityGreen.position.set(12,-18,26);entityGroup.add(entityGreen);
  const fill=new THREE.HemisphereLight(0x8c968f,0x090908,.38);scene.add(fill);
  const rim=new THREE.SpotLight(0xffdc97,2.1,480,Math.PI/5,.62,2);rim.position.set(-105,115,140);rim.target.position.set(0,-20,0);scene.add(rim,rim.target);

  const removeGrass=makeGrass(scene),removeMoss=addMossAndRocks(scene);
  return()=>{removeGrass();removeMoss();entityGroup.remove(entityWarm,entityGreen);scene.remove(terrain,glow,fill,rim,rim.target);terrainGeo.dispose();terrainMat.dispose();glow.geometry.dispose();glow.material.dispose();glowTexture.dispose()};
}

export default function EmaeaRuntimeHost({entityId,className=''}){
  const hostRef=useRef(null);
  useEffect(()=>{
    if(!entityId||!hostRef.current)return;
    let cancelled=false,runtime=null,timer=null,busy=false,undress=null;
    const sync=async()=>{
      if(cancelled||busy)return;busy=true;
      try{const evolution=await readEvolution(entityId);if(cancelled)return;if(!runtime){runtime=createEmaeaBodyRuntime(hostRef.current,evolution);undress=dressStage(runtime)}else await runtime.applyState?.(evolution)}catch(error){if(!cancelled)console.error('[EMÆÄ graphic]',error)}finally{busy=false}
    };
    sync().then(()=>{if(!cancelled)timer=setInterval(sync,1500)});
    return()=>{cancelled=true;if(timer)clearInterval(timer);undress?.();runtime?.dispose?.();runtime=null};
  },[entityId]);
  return <div ref={hostRef} className={`${className} bg-[#030405]`}/>;
}
