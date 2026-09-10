const EPS=1e-9;

const clamp=v=>Math.max(0,Math.min(100,Number(v)||0));
const sum=a=>a.reduce((s,v)=>s+v,0);

function shuffledIndexes(length,rng){
  const out=Array.from({length},(_,i)=>i);
  for(let i=out.length-1;i>0;i--){
    const j=Math.floor(Math.max(0,Math.min(.999999999,Number(rng()))) * (i+1));
    [out[i],out[j]]=[out[j],out[i]];
  }
  return out;
}

/**
 * Répercute l'évolution d'un sous-domaine sur ses valeurs individuelles.
 * Règles métier conservées :
 * - chaque valeur reste entre 0 et 100 ;
 * - une progression ne fait jamais baisser une bille ;
 * - une régression ne fait jamais monter une bille ;
 * - les anciennes valeurs ne sont pas redistribuées depuis zéro ;
 * - la moyenne finale est exactement la cible (à l'erreur flottante près).
 *
 * Le hasard ne décide jamais du niveau global : il décide uniquement quelles
 * billes absorbent quelle part du delta déjà calculé par B.
 */
export function evolveIndividualValues(values,target,{rng=Math.random}={}){
  if(!Array.isArray(values)||!values.length)throw new Error('Valeurs individuelles manquantes');
  if(typeof rng!=='function')throw new Error('rng invalide');

  const current=values.map(clamp);
  const wanted=clamp(target);
  const targetSum=wanted*current.length;
  const currentSum=sum(current);
  let remaining=targetSum-currentSum;

  if(Math.abs(remaining)<=EPS)return current;

  const direction=Math.sign(remaining);
  const capacity=current.map(v=>direction>0?100-v:v);
  const totalCapacity=sum(capacity);
  if(Math.abs(remaining)>totalCapacity+1e-7)throw new Error('Cible individuelle impossible');

  const next=[...current];
  const order=shuffledIndexes(next.length,rng);
  let active=order.filter(i=>capacity[i]>EPS);

  // Répartition aléatoire progressive : chaque tour donne une part variable
  // aux billes encore capables d'évoluer, sans effacer leur histoire.
  while(Math.abs(remaining)>EPS&&active.length){
    let weights=active.map(()=>0.2+Number(rng())*0.8);
    let weightSum=sum(weights);
    let moved=0;
    for(let k=0;k<active.length;k++){
      const i=active[k];
      const room=direction>0?100-next[i]:next[i];
      if(room<=EPS)continue;
      const requested=Math.abs(remaining)*(weights[k]/weightSum);
      const delta=Math.min(room,requested);
      next[i]+=direction*delta;
      moved+=delta;
    }
    remaining-=direction*moved;
    active=active.filter(i=>(direction>0?100-next[i]:next[i])>EPS);
    if(moved<=EPS)break;
  }

  // Correction finale déterministe pour garantir la moyenne exacte sans
  // changement de sens sur aucune bille.
  if(Math.abs(remaining)>EPS){
    for(const i of order){
      if(Math.abs(remaining)<=EPS)break;
      const room=direction>0?100-next[i]:next[i];
      const delta=Math.min(room,Math.abs(remaining));
      next[i]+=direction*delta;
      remaining-=direction*delta;
    }
  }

  if(Math.abs(remaining)>1e-7)throw new Error('Impossible d’atteindre la moyenne individuelle cible');

  // Dernier ajustement numérique sur une bille disposant de la marge requise.
  const drift=targetSum-sum(next);
  if(Math.abs(drift)>EPS){
    const d=Math.sign(drift);
    const idx=order.find(i=>(d>0?100-next[i]:next[i])+EPS>=Math.abs(drift));
    if(idx===undefined)throw new Error('Correction numérique individuelle impossible');
    next[idx]+=drift;
  }

  return next.map(clamp);
}

export function averageIndividualValues(values){
  if(!Array.isArray(values)||!values.length)return 0;
  return sum(values.map(clamp))/values.length;
}
