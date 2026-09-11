import * as THREE from 'three';

export const PERSONALITY_COLORS=Object.freeze({
  'Curiosité':0xffe600,'Humour':0xff6500,'Franchise':0xe5231f,'Chaleur':0xa86a12,'Réserve':0x2468d8,
  'Contradiction':0x7137c8,'Imagination':0x5146e5,'Spontanéité':0x28c95b,'Sensibilité':0xe95a9d,'Esprit critique':0x13bfc8
});
export const TASTE_TEXTURES=Object.freeze({
  'Musique':'wave','Cinéma/fiction':'facets','Arts/esthétique':'orange','Culture/idées':'stripes','Gastronomie/saveurs':'brick',
  'Lieux/atmosphères':'bumps','Activités/expériences':'waffle','Architecture/design':'turing','Nature/vivant':'pompons','Sensations/ambiances':'needles'
});
const goldenAngle=Math.PI*(3-Math.sqrt(5));
const fract=x=>x-Math.floor(x),hash=(x,y,z)=>fract(Math.sin(x*127.1+y*311.7+z*74.7)*43758.5453);

export function personalityColor(marble){
  const slot=marble?.domains?.['Personnalité'];
  const base=PERSONALITY_COLORS[slot?.subdomain]??0xffffff;
  const value=Math.max(0,Math.min(100,Number(slot?.value??0)))/100;
  const c=new THREE.Color(base),h={};c.getHSL(h);
  const saturation=value<=.4?THREE.MathUtils.lerp(.62,.88,value/.4):THREE.MathUtils.lerp(.88,1,(value-.4)/.6);
  return new THREE.Color().setHSL(h.h,saturation,h.l);
}
export function personalityMaterial(marble,brilliance=.62){
  return new THREE.MeshStandardMaterial({color:personalityColor(marble),roughness:1-brilliance,metalness:.02,emissive:0x000000,emissiveIntensity:0});
}
function noise(x,y,z){
  const X=Math.floor(x),Y=Math.floor(y),Z=Math.floor(z),fx=x-X,fy=y-Y,fz=z-Z,s=t=>t*t*(3-2*t),sx=s(fx),sy=s(fy),sz=s(fz),h=(a,b,c)=>hash(X+a,Y+b,Z+c);
  const a=THREE.MathUtils.lerp(h(0,0,0),h(1,0,0),sx),b=THREE.MathUtils.lerp(h(0,1,0),h(1,1,0),sx),c=THREE.MathUtils.lerp(h(0,0,1),h(1,0,1),sx),d=THREE.MathUtils.lerp(h(0,1,1),h(1,1,1),sx);
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(a,b,sy),THREE.MathUtils.lerp(c,d,sy),sz)*2-1;
}
function fbm(x,y,z,o=4){let v=0,a=.5,f=1;for(let i=0;i<o;i++){v+=a*noise(x*f,y*f,z*f);a*=.5;f*=2.03}return v}
function vor(x,y,z,s=4){x*=s;y*=s;z*=s;const X=Math.floor(x),Y=Math.floor(y),Z=Math.floor(z);let d1=99,d2=99;for(let k=-1;k<=1;k++)for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const a=X+i,b=Y+j,c=Z+k,px=a+hash(a,b,c),py=b+hash(b,c,a),pz=c+hash(c,a,b),d=(x-px)**2+(y-py)**2+(z-pz)**2;if(d<d1){d2=d1;d1=d}else if(d<d2)d2=d}return[Math.sqrt(d1),Math.sqrt(d2)-Math.sqrt(d1)]}
function displaced(fn){const g=new THREE.SphereGeometry(1.02,144,108),p=g.attributes.position,n=new THREE.Vector3();for(let i=0;i<p.count;i++){n.set(p.getX(i),p.getY(i),p.getZ(i)).normalize();const d=fn(n);p.setXYZ(i,n.x*(1.02+d),n.y*(1.02+d),n.z*(1.02+d))}p.needsUpdate=true;g.computeVertexNormals();return g}
function fibDir(i,n){const y=1-(i/(n-1))*2,r=Math.sqrt(Math.max(0,1-y*y)),a=goldenAngle*i;return new THREE.Vector3(Math.cos(a)*r,y,Math.sin(a)*r)}
function ballOn(g,d,material,r=.1,dist=1.04){const m=new THREE.Mesh(new THREE.IcosahedronGeometry(r,2),material.clone());m.position.copy(d).multiplyScalar(dist);g.add(m)}
function coneOn(g,d,material,len=.42,r=.025){const m=new THREE.Mesh(new THREE.ConeGeometry(r,len,8),material.clone());m.position.copy(d).multiplyScalar(1+len/2);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d);g.add(m)}

/** Recettes de relief figées du prototype validé. */
export function makeTexturedMarble(kind,marble,brilliance=.62){
  const material=personalityMaterial(marble,brilliance);
  if(kind==='facets'){material.flatShading=true;return new THREE.Mesh(new THREE.IcosahedronGeometry(1.14,3),material)}
  if(kind==='pompons'){
    const g=new THREE.Group(),base=new THREE.Mesh(new THREE.SphereGeometry(1,64,48),material);g.add(base);for(let j=0;j<80;j++)ballOn(g,fibDir(j,80),material,.1+(j%3)*.018,1.04);return g;
  }
  if(kind==='needles'){
    const g=new THREE.Group(),base=new THREE.Mesh(new THREE.SphereGeometry(1,64,48),material);g.add(base);for(let j=0;j<120;j++)coneOn(g,fibDir(j,120),material,.43+(j%7)*.022,.023);return g;
  }
  const geometry=displaced(n=>{
    const u=(Math.atan2(n.z,n.x)+Math.PI)/(2*Math.PI),v=Math.acos(n.y)/Math.PI;
    if(kind==='wave')return .045*Math.sin(Math.acos(n.y)*18+Math.atan2(n.z,n.x)*2);
    if(kind==='orange')return .018*fbm(n.x*18,n.y*18,n.z*18,3);
    if(kind==='stripes')return .035*Math.sin((Math.atan2(n.z,n.x)+Math.acos(n.y)*.3)*24);
    if(kind==='brick'){const row=Math.floor(v*10),uu=fract(u*14+(row%2)*.5),vv=fract(v*10);return(uu>.08&&uu<.92&&vv>.1&&vv<.9)?.045:-.035}
    if(kind==='bumps')return .045*Math.sin(n.x*13)*Math.sin(n.y*13)*Math.sin(n.z*13);
    if(kind==='waffle')return .045*Math.sin(u*Math.PI*24)*Math.sin(v*Math.PI*18);
    const a=fbm(n.x*4.8,n.y*4.8,n.z*4.8,3),b=vor(n.x,n.y,n.z,5)[0];return .04*Math.sin((a*2.2+b*3.2)*Math.PI*2);
  });
  return new THREE.Mesh(geometry,material);
}

export function makePlainMarble(marble,brilliance=.62){return new THREE.Mesh(new THREE.SphereGeometry(6,28,20),personalityMaterial(marble,brilliance))}

export function setRootColor(root,color){root?.traverse?.(o=>{if(o?.material?.color){o.material.color.copy(color);o.material.needsUpdate=true}})}
export function disposeRoot(root){root?.traverse?.(o=>{o.geometry?.dispose?.();if(Array.isArray(o.material))o.material.forEach(m=>m?.dispose?.());else o.material?.dispose?.()})}
