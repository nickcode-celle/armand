import * as THREE from 'three';

function assertCount(bodyCount){const n=Number(bodyCount);if(!Number.isInteger(n)||n<1)throw new Error('BODY_COUNT invalide');return n}
function halton(i,b){let f=1,r=0;while(i>0){f/=b;r+=f*(i%b);i=Math.floor(i/b)}return r}
function addCurve(pts,count,points,width,depth,offset){
  const seg=[];let total=0;
  for(let j=0;j<points.length-1;j++){const a=points[j],b=points[j+1],l=Math.hypot(b[0]-a[0],b[1]-a[1]);seg.push(l);total+=l}
  for(let i=0;i<count;i++){
    const k=i+1+offset,target=halton(k,2)*total,side=(halton(k,3)-.5)*width,z=(halton(k,5)-.5)*depth;
    let acc=0,j=0;while(j<seg.length-1&&acc+seg[j]<target){acc+=seg[j];j++}
    const a=points[j],b=points[j+1],u=(target-acc)/seg[j],dx=b[0]-a[0],dy=b[1]-a[1],len=seg[j],nx=-dy/len,ny=dx/len;
    pts.push(new THREE.Vector3(a[0]+dx*u+nx*side,a[1]+dy*u+ny*side,z));
  }
}
function addStroke(pts,count,ax,ay,bx,by,width,depth,offset){const dx=bx-ax,dy=by-ay,len=Math.hypot(dx,dy),nx=-dy/len,ny=dx/len;for(let i=0;i<count;i++){const k=i+1+offset,t=halton(k,2),side=(halton(k,3)-.5)*width,z=(halton(k,5)-.5)*depth;pts.push(new THREE.Vector3(ax+dx*t+nx*side,ay+dy*t+ny*side,z))}}

export function makeDigitOneCenters(bodyCount){const BODY_COUNT=assertCount(bodyCount),pts=[];function addBox(count,cx,cy,cz,sx,sy,sz,offset){for(let i=0;i<count;i++){const k=i+1+offset;pts.push(new THREE.Vector3(cx+(halton(k,2)-.5)*sx,cy+(halton(k,3)-.5)*sy,cz+(halton(k,5)-.5)*sz))}}function addSlanted(count,ax,ay,bx,by,width,depth,offset){const dx=bx-ax,dy=by-ay,len=Math.hypot(dx,dy),nx=-dy/len,ny=dx/len;for(let i=0;i<count;i++){const k=i+1+offset,t=halton(k,2),side=(halton(k,3)-.5)*width,z=(halton(k,5)-.5)*depth;pts.push(new THREE.Vector3(ax+dx*t+nx*side,ay+dy*t+ny*side,z))}}const stem=Math.round(BODY_COUNT*.59),base=Math.round(BODY_COUNT*.12),cap=BODY_COUNT-stem-base;addBox(stem,0,.02,0,.78,4.55,.92,0);addBox(base,0,-2.28,0,1.28,.46,.92,10000);addSlanted(cap,-1.55,1.55,-.05,2.78,.52,.92,20000);if(pts.length!==BODY_COUNT)throw new Error('Digit 1 skeleton count mismatch: '+pts.length+' / '+BODY_COUNT);return pts}
export function makeDigitTwoCenters(bodyCount){const BODY_COUNT=assertCount(bodyCount),pts=[];const top=Math.round(BODY_COUNT*.36),diag=Math.round(BODY_COUNT*.34),base=BODY_COUNT-top-diag;addCurve(pts,top,[[-1.35,1.58],[-1.48,1.95],[-1.22,2.30],[-.62,2.52],[.18,2.55],[.82,2.34],[1.12,1.92]],.66,.92,0);addCurve(pts,diag,[[1.12,1.92],[1.02,1.48],[.62,.82],[.08,.12],[-.52,-.62],[-1.18,-1.58]],.68,.92,10000);addCurve(pts,base,[[-1.28,-1.98],[1.34,-1.98]],.62,.92,20000);if(pts.length!==BODY_COUNT)throw new Error('Digit 2 skeleton count mismatch: '+pts.length+' / '+BODY_COUNT);return pts}
export function makeDigitThreeCenters(bodyCount){const BODY_COUNT=assertCount(bodyCount),pts=[];const upper=Math.round(BODY_COUNT*.49),lower=BODY_COUNT-upper;addCurve(pts,upper,[[-1.18,2.10],[-.62,2.43],[.20,2.48],[.88,2.24],[1.18,1.78],[1.12,1.25],[.78,.72],[.18,.38],[-.52,.30]],.66,.92,0);addCurve(pts,lower,[[-.42,.28],[.24,.20],[.84,-.08],[1.16,-.58],[1.20,-1.15],[.98,-1.72],[.50,-2.10],[-.18,-2.28],[-.88,-2.12],[-1.28,-1.82]],.68,.92,10000);if(pts.length!==BODY_COUNT)throw new Error('Digit 3 skeleton count mismatch: '+pts.length+' / '+BODY_COUNT);return pts}
export function makeDigitFourCenters(bodyCount){const BODY_COUNT=assertCount(bodyCount),pts=[];const diag=Math.round(BODY_COUNT*.32),bar=Math.round(BODY_COUNT*.28),stem=BODY_COUNT-diag-bar;addStroke(pts,diag,-1.28,.18,.42,2.48,.64,.92,0);addStroke(pts,bar,-1.30,.05,1.34,.05,.62,.92,10000);addStroke(pts,stem,.48,2.48,.48,-2.28,.66,.92,20000);if(pts.length!==BODY_COUNT)throw new Error('Digit 4 skeleton count mismatch: '+pts.length+' / '+BODY_COUNT);return pts}
export function makeDigitFiveCenters(bodyCount){const BODY_COUNT=assertCount(bodyCount),pts=[];const top=Math.round(BODY_COUNT*.24),down=Math.round(BODY_COUNT*.23),curve=BODY_COUNT-top-down;addCurve(pts,top,[[1.20,2.35],[-1.08,2.35]],.62,.92,0);addCurve(pts,down,[[-1.08,2.35],[-1.18,.28]],.64,.92,10000);addCurve(pts,curve,[[-1.15,.32],[-.45,.55],[.42,.48],[1.02,.08],[1.25,-.55],[1.18,-1.22],[.82,-1.78],[.20,-2.12],[-.52,-2.18],[-1.12,-1.88]],.68,.92,20000);if(pts.length!==BODY_COUNT)throw new Error('Digit 5 skeleton count mismatch: '+pts.length+' / '+BODY_COUNT);return pts}
export function makeDigitSixCenters(bodyCount){const BODY_COUNT=assertCount(bodyCount),pts=[];const lead=Math.round(BODY_COUNT*.43),loop=BODY_COUNT-lead;addCurve(pts,lead,[[1.05,2.20],[.48,2.48],[-.18,2.42],[-.78,2.05],[-1.12,1.42],[-1.28,.62],[-1.25,-.28]],.66,.92,0);addCurve(pts,loop,[[-1.24,-.25],[-1.02,.20],[-.48,.50],[.20,.55],[.82,.30],[1.18,-.20],[1.28,-.85],[1.08,-1.48],[.58,-1.94],[-.08,-2.14],[-.72,-1.98],[-1.16,-1.52],[-1.34,-.88],[-1.24,-.25]],.68,.92,10000);if(pts.length!==BODY_COUNT)throw new Error('Digit 6 skeleton count mismatch: '+pts.length+' / '+BODY_COUNT);return pts}
export function makeDigitSevenCenters(bodyCount){const BODY_COUNT=assertCount(bodyCount),pts=[];const top=Math.round(BODY_COUNT*.34),diag=BODY_COUNT-top;addStroke(pts,top,-1.34,2.30,1.34,2.30,.64,.92,0);addStroke(pts,diag,1.30,2.28,-.42,-2.30,.68,.92,10000);if(pts.length!==BODY_COUNT)throw new Error('Digit 7 skeleton count mismatch: '+pts.length+' / '+BODY_COUNT);return pts}
export function makeDigitEightCenters(bodyCount){const BODY_COUNT=assertCount(bodyCount),pts=[];function addLoop(count,cx,cy,rx,ry,width,depth,offset){for(let i=0;i<count;i++){const k=i+1+offset,a=halton(k,2)*Math.PI*2,side=(halton(k,3)-.5)*width,z=(halton(k,5)-.5)*depth,ca=Math.cos(a),sa=Math.sin(a),nx=ca/rx,ny=sa/ry,nl=Math.hypot(nx,ny);pts.push(new THREE.Vector3(cx+rx*ca+(nx/nl)*side,cy+ry*sa+(ny/nl)*side,z))}}const upper=Math.round(BODY_COUNT*.46),lower=BODY_COUNT-upper;addLoop(upper,0,1.22,1.02,1.22,.58,.92,0);addLoop(lower,0,-1.12,1.18,1.38,.62,.92,10000);if(pts.length!==BODY_COUNT)throw new Error('Digit 8 skeleton count mismatch: '+pts.length+' / '+BODY_COUNT);return pts}

export function makeEmaeLogoCenters(bodyCount){
  const BODY_COUNT=assertCount(bodyCount),pts=[];
  function insidePolygon(x,y,poly){let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if(((a[1]>y)!==(b[1]>y))&&(x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]))c=!c}return c}
  function fillPolygon(count,poly,offset){let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;for(const p of poly){minX=Math.min(minX,p[0]);maxX=Math.max(maxX,p[0]);minY=Math.min(minY,p[1]);maxY=Math.max(maxY,p[1])}let k=1+offset;while(pts.length<count+offset){const x=minX+(maxX-minX)*halton(k,2),y=minY+(maxY-minY)*halton(k,3);if(insidePolygon(x,y,poly))pts.push(new THREE.Vector3(x,y,0));k++}}
  function addDot(count,cx,cy,offset){for(let i=0;i<count;i++){const k=i+1+offset,a=halton(k,2)*Math.PI*2,r=.34*Math.sqrt(halton(k,3));pts.push(new THREE.Vector3(cx+Math.cos(a)*r,cy+Math.sin(a)*r,0))}}
  const left=[[-1.95,-1.78],[-2.08,-1.42],[-2.03,-.98],[-1.85,-.50],[-1.64,.02],[-1.38,.54],[-1.08,1.02],[-.82,1.47],[-.62,1.78],[-.48,1.88],[-.38,1.78],[-.39,1.54],[-.52,1.20],[-.72,.82],[-.91,.42],[-1.06,.03],[-1.12,-.36],[-1.08,-.76],[-1.02,-1.13],[-1.08,-1.48],[-1.27,-1.78],[-1.58,-1.94],[-1.82,-1.91]];
  const right=left.map(([x,y])=>[-x,y]);
  const dotEach=12,branchEach=(BODY_COUNT-dotEach*2)/2;
  if(!Number.isInteger(branchEach)||branchEach<0)throw new Error('EMAE branch count must be integer');
  fillPolygon(branchEach,left,0);
  const leftCount=pts.length;if(leftCount!==branchEach)throw new Error('EMAE left branch count mismatch: '+leftCount);
  const rightStart=pts.length;let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  for(const q of right){minX=Math.min(minX,q[0]);maxX=Math.max(maxX,q[0]);minY=Math.min(minY,q[1]);maxY=Math.max(maxY,q[1])}
  let k=10001;while(pts.length<rightStart+branchEach){const x=minX+(maxX-minX)*halton(k,2),y=minY+(maxY-minY)*halton(k,3);if(insidePolygon(x,y,right))pts.push(new THREE.Vector3(x,y,0));k++}
  addDot(dotEach,-.58,2.64,20000);addDot(dotEach,.58,2.64,30000);
  if(pts.length!==BODY_COUNT)throw new Error('EMAE symbol skeleton count mismatch: '+pts.length+' / '+BODY_COUNT);
  return pts;
}

export function makeRewardCenters(command){
  const count=assertCount(command?.body_count);
  if(command?.kind==='logo')return makeEmaeLogoCenters(count);
  const digit=Number(command?.value);
  const generators=[null,makeDigitOneCenters,makeDigitTwoCenters,makeDigitThreeCenters,makeDigitFourCenters,makeDigitFiveCenters,makeDigitSixCenters,makeDigitSevenCenters,makeDigitEightCenters];
  if(!generators[digit])throw new Error(`Chiffre de récompense invalide: ${command?.value}`);
  return generators[digit](count);
}
