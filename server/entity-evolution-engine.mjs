const RAW_MAGNITUDES=Object.freeze({1:1,2:2,3:3,'-1':1});

export const GAUGE_DOMAINS=Object.freeze([
  'Personnalité','Relation','Goûts','Opinions/Valeurs','Connaissances','Capacités','Monde propre'
]);

export function clampLevel(value){
  const n=Number(value);
  if(!Number.isFinite(n))return 0;
  return Math.max(0,Math.min(100,n));
}

export function applyQualifiedDelta(current,qualified){
  const level=clampLevel(current);
  const q=Number(qualified);
  if(![1,2,3,-1].includes(q))throw new Error(`Evolution qualifiée invalide: ${qualified}`);
  const magnitude=RAW_MAGNITUDES[String(q)];
  if(q>0)return clampLevel(level+magnitude*(1-level/100));
  return clampLevel(level-magnitude*(level/100));
}

function normalizeEvent(event){
  if(!event||typeof event!=='object')throw new Error('Événement d’évolution invalide');
  const domaine=String(event.domaine||'').trim();
  const sousDomaine=String(event.sous_domaine??event.sousDomaine??'').trim();
  const evolution=Number(event.evolution);
  if(!GAUGE_DOMAINS.includes(domaine))throw new Error(`Domaine non géré par une jauge: ${domaine}`);
  if(!sousDomaine)throw new Error('Sous-domaine manquant');
  if(![1,2,3,-1].includes(evolution))throw new Error(`Evolution qualifiée invalide: ${event.evolution}`);
  return{...event,domaine,sous_domaine:sousDomaine,evolution};
}

function cloneLevels(levels){
  return structuredClone(levels||{});
}

export function applyEvolutionEvents(levels,events=[]){
  const incoming=Array.isArray(events)?events:[];
  if(incoming.length>2)throw new Error('Maximum deux domaines de jauge par événement');
  const normalized=incoming.map(normalizeEvent);
  const distinctDomains=new Set(normalized.map(x=>x.domaine));
  if(distinctDomains.size>2)throw new Error('Maximum deux domaines de jauge par événement');

  const next=cloneLevels(levels);
  const changes=[];
  for(const event of normalized){
    next[event.domaine]??={};
    const before=clampLevel(next[event.domaine][event.sous_domaine]);
    const after=applyQualifiedDelta(before,event.evolution);
    next[event.domaine][event.sous_domaine]=after;
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
