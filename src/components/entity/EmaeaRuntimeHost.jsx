import React,{useEffect,useRef} from 'react';
import * as THREE from 'three';
import {createEmaeaBodyRuntime} from './emaeaBodyRuntime.js';

async function readEvolution(entityId){
  const response=await fetch('/api/entity/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({entityId})});
  let data={};try{data=await response.json()}catch{}
  if(!response.ok)throw new Error(data?.error||'Etat EMÆÄ indisponible');
  return data?.evolution||{};
}

function makeGroundTexture(){
  const c=document.createElement('canvas');c.width=1024;c.height=512;const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,0,512);g.addColorStop(0,'#173026');g.addColorStop(.38,'#1a2b21');g.addColorStop(.68,'#171d17');g.addColorStop(1,'#0d120f');x.fillStyle=g;x.fillRect(0,0,1024,512);
  for(let i=0;i<9000;i++){const px=Math.random()*1024,py=Math.random()*512,r=Math.random()*1.8+.15,a=.025+Math.random()*.08;x.fillStyle=Math.random()>.58?`rgba(80,120,67,${a})`:`rgba(120,92,50,${a*.8})`;x.fillRect(px,py,r,r)}
  for(let i=0;i<150;i++){const px=Math.random()*1024,py=170+Math.random()*260,r=8+Math.random()*46,rg=x.createRadialGradient(px,py,0,px,py,r);rg.addColorStop(0,'rgba(67,115,55,.20)');rg.addColorStop(1,'rgba(20,45,28,0)');x.fillStyle=rg;x.beginPath();x.arc(px,py,r,0,Math.PI*2);x.fill()}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(1.7,1);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;
}

function makeSoftDisc(){
  const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.18,'rgba(255,255,255,.72)');g.addColorStop(.5,'rgba(255,255,255,.16)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128);const t=new THREE.CanvasTexture(c);t.minFilter=t.magFilter=THREE.LinearFilter;t.generateMipmaps=false;return t;
}

function dressStage(runtime){
  const{scene,camera,renderer,entityGroup}=runtime;
  renderer.domElement.style.width='100%';renderer.domElement.style.height='100%';renderer.domElement.style.display='block';
  renderer.setClearColor(0x06100d,1);renderer.toneMappingExposure=1.8;
  camera.position.set(0,18,318);camera.lookAt(0,-8,0);camera.updateProjectionMatrix();
  entityGroup.scale.setScalar(1.28);entityGroup.position.set(0,18,0);

  scene.fog=new THREE.FogExp2(0x07110e,.00165);

  const groundTexture=makeGroundTexture();
  const groundGeo=new THREE.PlaneGeometry(720,300,72,30),pos=groundGeo.attributes.position;
  for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i),edge=Math.min(1,Math.abs(x)/360+.15);const n=(Math.sin(x*.045)+Math.cos(y*.062)+Math.sin((x+y)*.021))*1.25+(Math.random()-.5)*1.2;pos.setZ(i,n*(.55+.45*edge))}pos.needsUpdate=true;groundGeo.computeVertexNormals();
  const groundMat=new THREE.MeshPhysicalMaterial({map:groundTexture,color:0xdde7d8,roughness:.72,metalness:.03,clearcoat:.18,clearcoatRoughness:.78});
  const ground=new THREE.Mesh(groundGeo,groundMat);ground.rotation.x=-Math.PI/2;ground.position.set(0,-86,8);ground.receiveShadow=true;scene.add(ground);

  const wetMat=new THREE.MeshPhysicalMaterial({color:0x21372e,roughness:.24,metalness:.16,transparent:true,opacity:.54,clearcoat:1,clearcoatRoughness:.18});
  const wet=new THREE.Mesh(new THREE.CircleGeometry(120,96),wetMat);wet.rotation.x=-Math.PI/2;wet.scale.y=.36;wet.position.set(0,-84.7,20);wet.receiveShadow=true;scene.add(wet);

  const moss=new THREE.Group(),mossMaterials=[0x294e2e,0x335d34,0x1e3b25,0x42683b].map(color=>new THREE.MeshStandardMaterial({color,roughness:1,metalness:0}));
  const clumps=[[-240,-58],[-205,-20],[-172,54],[-128,-64],[-98,76],[128,72],[165,-62],[205,-18],[238,54],[276,-40]];
  for(const[cx,cz]of clumps){const pieces=8+Math.floor(Math.random()*9);for(let j=0;j<pieces;j++){const r=4+Math.random()*8,g=new THREE.SphereGeometry(r,12,8),m=mossMaterials[(Math.random()*mossMaterials.length)|0],o=new THREE.Mesh(g,m);o.scale.set(1+.8*Math.random(),.28+.32*Math.random(),1+.65*Math.random());o.position.set(cx+(Math.random()-.5)*34,-82+Math.random()*3,cz+(Math.random()-.5)*25);o.rotation.y=Math.random()*Math.PI;o.castShadow=o.receiveShadow=true;moss.add(o)}}scene.add(moss);

  const rockMat=new THREE.MeshStandardMaterial({color:0x171d1a,roughness:.78,metalness:.08});
  const rocks=new THREE.Group();for(const[cx,cz,s]of[[-285,25,22],[-255,60,13],[-220,-15,10],[270,30,24],[235,68,12],[205,-28,9]]){const o=new THREE.Mesh(new THREE.DodecahedronGeometry(s,1),rockMat);o.position.set(cx,-76,cz);o.scale.y=.62;o.rotation.set(Math.random()*.4,Math.random()*Math.PI,Math.random()*.25);o.castShadow=o.receiveShadow=true;rocks.add(o)}scene.add(rocks);

  const soft=makeSoftDisc(),bokeh=new THREE.Group();for(let i=0;i<34;i++){const mat=new THREE.SpriteMaterial({map:soft,color:i%3===0?0xffc35a:0x62d887,transparent:true,opacity:.10+Math.random()*.18,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}),sp=new THREE.Sprite(mat);sp.position.set((Math.random()-.5)*660,-18+Math.random()*190,-120-Math.random()*90);const s=9+Math.random()*30;sp.scale.set(s,s,1);bokeh.add(sp)}scene.add(bokeh);

  const key=new THREE.SpotLight(0xffd06a,11,650,Math.PI/4.2,.72,1.2);key.position.set(-80,115,170);key.target.position.set(0,-28,0);key.castShadow=true;key.shadow.mapSize.set(2048,2048);scene.add(key,key.target);
  const green=new THREE.SpotLight(0x55ff9d,7.5,540,Math.PI/3.8,.78,1.5);green.position.set(110,64,145);green.target.position.set(0,-45,0);scene.add(green,green.target);
  const rim=new THREE.PointLight(0x8fffd0,4.2,520,1.6);rim.position.set(-20,125,-55);scene.add(rim);
  const warmFloor=new THREE.PointLight(0xffb22e,6.5,300,1.75);warmFloor.position.set(0,-54,68);scene.add(warmFloor);
  const fill=new THREE.HemisphereLight(0xd8fff0,0x0d1d15,2.3);scene.add(fill);

  const glowMat=new THREE.MeshBasicMaterial({color:0x77ffab,transparent:true,opacity:.17,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});
  const glow=new THREE.Mesh(new THREE.CircleGeometry(95,96),glowMat);glow.rotation.x=-Math.PI/2;glow.scale.y=.34;glow.position.set(0,-84.2,18);scene.add(glow);

  return()=>{scene.fog=null;scene.remove(ground,wet,moss,rocks,bokeh,key,key.target,green,green.target,rim,warmFloor,fill,glow);groundGeo.dispose();groundMat.dispose();groundTexture.dispose();wet.geometry.dispose();wet.material.dispose();moss.traverse(o=>{o.geometry?.dispose?.()});mossMaterials.forEach(m=>m.dispose());rocks.traverse(o=>{o.geometry?.dispose?.()});rockMat.dispose();bokeh.traverse(o=>o.material?.dispose?.());soft.dispose();glow.geometry.dispose();glowMat.dispose()};
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
  return <div ref={hostRef} className={`${className} bg-[radial-gradient(ellipse_at_50%_70%,#193a26_0%,#0a1712_42%,#06100d_78%)]`}/>;
}
