import crypto from 'node:crypto';

const PER_MARBLE_DOMAINS=new Set([
  'Personnalité','Relation','Goûts','Opinions/Valeurs','Connaissances','Monde propre'
]);

const clamp=x=>Math.max(0,Math.min(100,Number(x)));
const hash01=s=>{
  const h=crypto.createHash('sha256').update(String(s)).digest();
  return h.readUInt32BE(0)/0xffffffff;
};

function getSlot(marble,domain){
  const domains=marble?.domains;
  if(!domains||typeof domains!=='object')return null;
  const slot=domains[domain];
  if(!slot||typeof slot!=='object')return null;
  return slot;
}

function slotSubdomain(slot){return String(slot.subdomain??slot.sous_domaine??slot.sousDomaine??'').trim()}
function slotValue(slot){
  const raw=slot.value??slot.valeur;
  if(raw==null||raw==='')throw new Error('Valeur individuelle non initialisée');
  const n=Number(raw);
  if(!Number.isFinite(n))throw new Error('Valeur individuelle invalide');
  return clamp(n);
}
function setSlotValue(slot,value){
  if(Object.prototype.hasOwnProperty.call(slot,'valeur')&&!Object.prototype.hasOwnProperty.call(slot,'value'))slot.valeur=value;
  else slot.value=value;
}

function distributeExact(values,targetTotal,direction,seed,ids){
  const next=values.slice();
  let remaining=targetTotal-values.reduce((a,b)=>a+b,0);
  if(Math.abs(remaining)<1e-10)return next;
  if(direction>0&&remaining<0)throw new Error('Distribution individuelle incohérente: baisse pendant une progression');
  if(direction<0&&remaining>0)throw new Error('Distribution individuelle incohérente: hausse pendant une régression');

  const sign=Math.sign(remaining);
  let active=next.map((v,i)=>({i,cap:sign>0?100-v:v,weight:.2+hash01(`${seed}|${ids[i]}|${i}`)})).filter(x=>x.cap>1e-12);
  let guard=0;
  while(Math.abs(remaining)>1e-9&&active.length&&guard++<200){
    const need=Math.abs(remaining),sumW=active.reduce((a,x)=>a+x.weight,0);
    let consumed=0;
    for(const x of active){
      const share=need*(x.weight/sumW),delta=Math.min(x.cap,share);
      next[x.i]+=sign*delta;x.cap-=delta;consumed+=delta;
    }
    remaining-=sign*consumed;
    active=active.filter(x=>x.cap>1e-10);
    if(consumed<1e-12)break;
  }
  if(Math.abs(remaining)>1e-7)throw new Error('Impossible d’atteindre la moyenne individuelle cible');

  const drift=targetTotal-next.reduce((a,b)=>a+b,0);
  if(Math.abs(drift)>1e-12){
    const i=next.findIndex(v=>drift>0?v<100:v>0);
    if(i>=0)next[i]=clamp(next[i]+drift);
  }
  return next;
}

export function applyChangesToMarbles(marbles,changes,{seed='emaea'}={}){
  if(!Array.isArray(marbles)||!marbles.length)return{marbles:Array.isArray(marbles)?structuredClone(marbles):[],changes:[],skipped:true,reason:'no_marbles'};
  const next=structuredClone(marbles),details=[];

  for(const change of changes||[]){
    const domain=String(change?.domaine||'').trim();
    if(!PER_MARBLE_DOMAINS.has(domain))continue;
    const subdomain=String(change?.sous_domaine??'').trim();
    const selected=[];
    for(let i=0;i<next.length;i++){
      const slot=getSlot(next[i],domain);
      if(slot&&slotSubdomain(slot)===subdomain)selected.push({i,slot,id:String(next[i]?.id??i)});
    }
    if(!selected.length){details.push({domaine:domain,sous_domaine:subdomain,skipped:true,reason:'no_assigned_marbles'});continue}

    const beforeValues=selected.map(x=>slotValue(x.slot));
    const targetMean=clamp(change.after);
    const direction=Number(change.evolution)>0?1:-1;
    const afterValues=distributeExact(beforeValues,targetMean*selected.length,direction,`${seed}|${domain}|${subdomain}|${change.before}|${change.after}`,selected.map(x=>x.id));
    selected.forEach((x,j)=>setSlotValue(x.slot,afterValues[j]));
    const mean=afterValues.reduce((a,b)=>a+b,0)/afterValues.length;
    details.push({domaine:domain,sous_domaine:subdomain,count:selected.length,before_mean:beforeValues.reduce((a,b)=>a+b,0)/beforeValues.length,after_mean:mean,target_mean:targetMean});
  }
  return{marbles:next,changes:details,skipped:false};
}
