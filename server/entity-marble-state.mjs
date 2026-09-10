import {evolveIndividualValues} from './entity-marble-values.mjs';

const PER_MARBLE_DOMAINS=new Set(['Personnalité','Relation','Goûts','Opinions/Valeurs','Connaissances','Monde propre']);

function assignmentOf(marble,domain){
  const record=marble?.domains?.[domain];
  if(!record||typeof record!=='object')return null;
  const subdomain=String(record.subdomain??record.sous_domaine??'').trim();
  if(!subdomain)return null;
  return{subdomain,value:Number(record.value??record.valeur??0)};
}

function setAssignmentValue(marble,domain,value){
  const record=marble.domains[domain];
  if(Object.prototype.hasOwnProperty.call(record,'valeur'))record.valeur=value;
  else record.value=value;
}

/**
 * Applique aux billes déjà persistées les changements de niveau décidés par B.
 * Cette fonction n'invente aucune affectation : elle ne touche qu'aux billes
 * déjà rattachées au sous-domaine concerné.
 */
export function applyChangesToMarbles(marbles,changes,{rng=Math.random}={}){
  const next=structuredClone(Array.isArray(marbles)?marbles:[]);
  const reports=[];

  for(const change of Array.isArray(changes)?changes:[]){
    const domain=String(change?.domaine||'').trim();
    const subdomain=String(change?.sous_domaine||'').trim();
    if(!PER_MARBLE_DOMAINS.has(domain)){
      reports.push({domaine:domain,sous_domaine:subdomain,applied:false,reason:'global_domain'});
      continue;
    }

    const matched=[];
    for(let i=0;i<next.length;i++){
      const a=assignmentOf(next[i],domain);
      if(a?.subdomain===subdomain)matched.push({index:i,value:a.value});
    }
    if(!matched.length){
      reports.push({domaine:domain,sous_domaine:subdomain,applied:false,reason:'no_persisted_assignment'});
      continue;
    }

    const values=matched.map(x=>x.value);
    const updated=evolveIndividualValues(values,Number(change.after),{rng});
    for(let i=0;i<matched.length;i++)setAssignmentValue(next[matched[i].index],domain,updated[i]);
    reports.push({domaine:domain,sous_domaine:subdomain,applied:true,count:matched.length,target:Number(change.after)});
  }

  return{marbles:next,reports};
}
