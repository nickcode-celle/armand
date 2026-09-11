import React,{useEffect,useRef} from 'react';
import * as THREE from 'three';
import {createEmaeaBodyRuntime} from './emaeaBodyRuntime.js';

const FOREST={
  color:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/forrest_ground_01/forrest_ground_01_diff_1k.jpg',
  normal:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/forrest_ground_01/forrest_ground_01_nor_gl_1k.jpg',
  rough:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/forrest_ground_01/forrest_ground_01_rough_1k.jpg'
};

async function readEvolution(entityId){
  const response=await fetch('/api/entity/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({entityId})});
  let data={};try{data=await response.json()}catch{}
  if(!response.ok)throw new Error(data?.error||'Etat EMÆÄ indisponible');
  return data?.evolution||{};
}

function seeded(seed){let s=seed>>>0;return()=>((s=Math.imul(1664525,s)+1013904223>>>0)/4294967296)}

function loadTexture(loader,url,{srgb=false,repeat=1}={}){
  return new Promise((resolve,reject)=>loader.load(url,t=>{t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(repeat,repeat);t.anisotropy=8;if(srgb)t.colorSpace=THREE.SRGBColorSpace;resolve(t)},undefined,reject));
}

function makeGrass(scene){
  const rand=seeded(96317);
  const blade=new THREE.BufferGeometry();
  blade.setAttribute('position',new THREE.Float32BufferAttribute([
    -.32,0,0,.32,0,0,-.20,.52,0,
    .32,0,0,.20,.52,0,-.09,1.00,0,
    .20,.52,0,.09,1.00,0,0,1.48,0
  ],3));
  blade.setIndex([0,1,2,1,3,2,2,3,4,3,5,4,4,5,6]);blade.computeVertexNormals();
  const material=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.88,metalness:0,side:THREE.DoubleSide,vertexColors:true,transparent:true,opacity:.98});
  const count=3600,mesh=new THREE.InstancedMesh(blade,material,count),dummy=new THREE.Object3D(),c=new THREE.Color();
  mesh.castShadow=true;mesh.receiveShadow=true;
  for(let i=0;i<count;i++){
    const side=rand()<.5?-1:1;
    const x=side*(82+Math.pow(rand(),.7)*270),z=-58+rand()*168;
    const centralFade=Math.min(1,Math.max(0,(Math.abs(x)-72)/90));
    const h=(5.5+rand()*9.5)*(.72+.28*centralFade),w=.58+rand()*.60;
    dummy.position.set(x,-99.2+rand()*1.7,z);dummy.rotation.set((rand()-.5)*.10,rand()*Math.PI,(rand()-.5)*.08);dummy.scale.set(w,h,w);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
    c.setHSL(.27+rand()*.055,.38+rand()*.26,.12+rand()*.13);mesh.setColorAt(i,c);
  }
  mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;scene.add(mesh);
  return()=>{scene.remove(mesh);blade.dispose();material.dispose()};
}

function makeMossCushions(scene){
  const rand=seeded(73129),group=new THREE.Group();
  const mats=[0x234229,0x2d5530,0x355f34,0x456f40].map(color=>new THREE.MeshStandardMaterial({color,roughness:.98,metalness:0}));
  for(let k=0;k<28;k++){
    const side=k%2?-1:1,cx=side*(125+rand()*185),cz=-46+rand()*145;
    for(let j=0;j<14;j++){
      const geo=new THREE.IcosahedronGeometry(1.2+rand()*2.2,2),m=mats[(rand()*mats.length)|0],o=new THREE.Mesh(geo,m);
      o.position.set(cx+(rand()-.5)*30,-98+rand()*2.2,cz+(rand()-.5)*22);o.scale.set(1.8+rand()*2.8,.28+rand()*.45,1.5+rand()*2.4);o.rotation.set(rand()*.3,rand()*Math.PI,rand()*.3);o.castShadow=o.receiveShadow=true;group.add(o);
    }
  }
  scene.add(group);
  return()=>{scene.remove(group);group.traverse(o=>o.geometry?.dispose?.());mats.forEach(m=>m.dispose())};
}

function makeSoftGlow(){
  const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d'),g=x.createRadialGradient(256,128,4,256,128,250);
  g.addColorStop(0,'rgba(255,210,110,.72)');g.addColorStop(.22,'rgba(255,190,70,.24)');g.addColorStop(.48,'rgba(97,255,146,.10)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,512,256);
  const t=new THREE.CanvasTexture(c);t.minFilter=t.magFilter=THREE.LinearFilter;t.generateMipmaps=false;return t;
}

function enrichEntity(entityGroup){
  entityGroup.traverse(o=>{
    const list=Array.isArray(o.material)?o.material:[o.material];
    for(const m of list){if(!m?.color)continue;const col=m.color.clone();col.offsetHSL(0,.08,.025);m.color.copy(col);if('emissive'in m){m.emissive.copy(col).multiplyScalar(.16);m.emissiveIntensity=.65}if('envMapIntensity'in m)m.envMapIntensity=Math.max(Number(m.envMapIntensity)||0,1.15);m.needsUpdate=true}
  });
}

async function dressStage(runtime){
  const{scene,camera,renderer,entityGroup}=runtime;
  renderer.domElement.style.width='100%';renderer.domElement.style.height='100%';renderer.domElement.style.display='block';
  renderer.setClearColor(0x020304,1);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;scene.background=new THREE.Color(0x020304);scene.fog=null;
  camera.position.set(0,14,292);camera.lookAt(0,-10,0);camera.updateProjectionMatrix();entityGroup.scale.setScalar(1.58);entityGroup.position.set(0,18,0);enrichEntity(entityGroup);

  const terrainGeo=new THREE.PlaneGeometry(790,360,96,42),p=terrainGeo.attributes.position,rand=seeded(44551);
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),n=(rand()-.5)*3.2+(Math.sin(x*.028)+Math.cos(y*.044))*1.15;p.setZ(i,n)}terrainGeo.computeVertexNormals();
  const loader=new THREE.TextureLoader();loader.setCrossOrigin('anonymous');
  let colorMap=null,normalMap=null,roughMap=null;
  try{[colorMap,normalMap,roughMap]=await Promise.all([
    loadTexture(loader,FOREST.color,{srgb:true,repeat:2.25}),
    loadTexture(loader,FOREST.normal,{repeat:2.25}),
    loadTexture(loader,FOREST.rough,{repeat:2.25})
  ])}catch(error){console.error('[EMÆÄ decor] Les textures PBR de sous-bois n’ont pas pu être chargées.',error)}
  const terrainMat=new THREE.MeshPhysicalMaterial({color:0xffffff,map:colorMap,normalMap,roughnessMap:roughMap,roughness:.68,metalness:.015,clearcoat:.16,clearcoatRoughness:.58});
  const terrain=new THREE.Mesh(terrainGeo,terrainMat);terrain.rotation.x=-Math.PI/2;terrain.position.set(0,-101,-5);terrain.receiveShadow=true;scene.add(terrain);

  const soft=makeSoftGlow(),glow=new THREE.Mesh(new THREE.PlaneGeometry(355,150),new THREE.MeshBasicMaterial({map:soft,transparent:true,opacity:.92,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
  glow.rotation.x=-Math.PI/2;glow.position.set(0,-99.7,20);scene.add(glow);

  const entityGold=new THREE.PointLight(0xffc85b,15.5,340,2);entityGold.position.set(0,-12,48);entityGroup.add(entityGold);
  const entityGreen=new THREE.PointLight(0x69ff9c,5.2,240,2);entityGreen.position.set(8,-24,24);entityGroup.add(entityGreen);
  const fill=new THREE.HemisphereLight(0x7c8580,0x050505,.28);scene.add(fill);
  const rim=new THREE.SpotLight(0xffd98c,2.6,480,Math.PI/5,.65,2);rim.position.set(-115,130,155);rim.target.position.set(0,-18,0);scene.add(rim,rim.target);

  const removeGrass=makeGrass(scene),removeMoss=makeMossCushions(scene);
  return()=>{
    removeGrass();removeMoss();entityGroup.remove(entityGold,entityGreen);scene.remove(terrain,glow,fill,rim,rim.target);
    terrainGeo.dispose();terrainMat.dispose();for(const t of[colorMap,normalMap,roughMap])t?.dispose?.();glow.geometry.dispose();glow.material.dispose();soft.dispose();
  };
}

export default function EmaeaRuntimeHost({entityId,className=''}){
  const hostRef=useRef(null);
  useEffect(()=>{
    if(!entityId||!hostRef.current)return;
    let cancelled=false,runtime=null,timer=null,busy=false,undress=null;
    const sync=async()=>{
      if(cancelled||busy)return;busy=true;
      try{const evolution=await readEvolution(entityId);if(cancelled)return;if(!runtime){runtime=createEmaeaBodyRuntime(hostRef.current,evolution);undress=await dressStage(runtime)}else await runtime.applyState?.(evolution)}catch(error){if(!cancelled)console.error('[EMÆÄ graphic]',error)}finally{busy=false}
    };
    sync().then(()=>{if(!cancelled)timer=setInterval(sync,1500)});
    return()=>{cancelled=true;if(timer)clearInterval(timer);undress?.();runtime?.dispose?.();runtime=null};
  },[entityId]);
  return <div ref={hostRef} className={`${className} bg-[#020304]`}/>;
}
