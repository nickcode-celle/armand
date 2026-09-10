const RAW_MAGNITUDES=Object.freeze({1:1,2:2,3:3,'-1':1});

export const GAUGE_DOMAINS=Object.freeze([
  'Personnalité','Relation','Goûts','Opinions/Valeurs','Connaissances','Capacités','Monde propre'
]);

export function clampLevel(value){
  const n=Number(value);
  if(!Number.isFinite(n))throw new Error(`Niveau de jauge non initialisé ou invalide: ${value}`);
  return Math.max(0,Math.min(100,n));
}

export function applyQualifiedDelta(current,qualified){
  const level=clampLevel(current);
  const q=Number(qualified);
  if(![1,2,3,-1].includes(q))throw new Error(`Evolution qualifiée invalide: ${qualified}`);
  const magnitude=RAW_MAGNITUDES[String(q)];
  if(q>0)return Math.max(0,Math.min(100,level+magnitude*(1-level/100)));
  return Math.max(0,Math.min(100,level-magnitude*(level/100)));
}

function normalizeEvent(event){
  if(!event||typeof event!=='object')throw new Error('Événement d’évolution invalide');
  const domaine=String(event.domaine||'').trim();
  const sousDomaine=String(event.sous_domaine??event.sousDomaine??'').trim();
  const evolution=Number(event.evolution);
  if(!GAUGE_DOMAINS.includes(domaine))throw new Error(`Domaine non géré par une jauge: ${domaine}`);
  if(domaine!=='Capacités'&&!sousDomaine)throw new Error('Sous-domaine manquant');
  if(![1,2,3,-1].includes(evolution))throw new Error(`Evolution qualifiée invalide: ${event.evolution}`);
  return{...event,domaine,sous_domaine:domaine==='Capacités'?null:sousDomaine,evolution};
}

function cloneLevels(levels){return structuredClone(levels||{})}

export function applyEvolutionEvents(levels,events=[]){
  const incoming=Array.isArray(events)?events:[];
  if(incoming.length>2)throw new Error('Maximum deux domaines de jauge par événement');
  const normalized=incoming.map(normalizeEvent);
  const distinctDomains=new Set(normalized.map(x=>x.domaine));
  if(distinctDomains.size>2)throw new Error('Maximum deux domaines de jauge par événement');

  const next=cloneLevels(levels);
  const changes=[];
  for(const event of normalized){
    if(event.domaine==='Capacités'){
      if(next.Capacités==null)throw new Error('Capacités non initialisées');
      const before=clampLevel(next.Capacités);
      const after=applyQualifiedDelta(before,event.evolution);
      next.Capacités=after;
      changes.push({domaine:event.domaine,sous_domaine:null,evolution:event.evolution,before,after,preuve:event.preuve??null,justification:event.justification??null});
      continue;
    }
    const bucket=next[event.domaine];
    if(!bucket||typeof bucket!=='object'||bucket[event.sous_domaine]==null)throw new Error(`Niveau non initialisé: ${event.domaine} / ${event.sous_domaine}`);
    const before=clampLevel(bucket[event.sous_domaine]);
    const after=applyQualifiedDelta(before,event.evolution);
    bucket[event.sous_domaine]=after;
    changes.push({
      domaine:event.domaine,
      sous_domaine:event.sous_domaine,
      evolution:event.evolution,
      before,
      after,
      preuve:event.preuve??null,
      justification:event.justification??null
    });
  }
  return{levels:next,changes};
}
