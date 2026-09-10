import crypto from 'node:crypto';
import {MARBLE_DOMAIN_CATALOG,PER_MARBLE_DOMAINS} from './entity-marble-catalog.mjs';

const clamp=v=>Math.max(0,Math.min(100,Number(v)||0));
const hash01=s=>{
  const h=crypto.createHash('sha256').update(String(s)).digest();
  return h.readUInt32BE(0)/0x100000000;
};
const pick=(items,key)=>items[Math.floor(hash01(key)*items.length)];

function nextMarbleId(existing=[]){
  const used=new Set(existing.map(x=>String(x?.id||'')));
  let n=existing.length+1;
  while(used.has(`bille-${String(n).padStart(3,'0')}`))n++;
  return`bille-${String(n).padStart(3,'0')}`;
}

/**
 * Construit les données persistantes d'une vraie nouvelle bille.
 * Règles déjà validées uniquement :
 * - domaine déclencheur = sous-domaine déclencheur ;
 * - valeur de ce domaine = niveau global actuel du sous-domaine ;
 * - autres domaines par-bille = sous-domaines attribués aléatoirement ;
 * - aucune valeur numérique n'est inventée pour ces autres domaines tant que
 *   leur règle d'initialisation lors d'une naissance n'est pas figée.
 *
 * Le déclenchement (seuil/quantité) reste volontairement hors de cette fonction,
 * car ces seuils n'ont pas encore été figés.
 */
export function createBornMarble(existingMarbles,{triggerDomain,triggerSubdomain,triggerLevel,seed='emaea'}={}){
  const domain=String(triggerDomain||'').trim();
  const subdomain=String(triggerSubdomain||'').trim();
  if(!PER_MARBLE_DOMAINS.includes(domain))throw new Error(`Domaine déclencheur invalide: ${domain}`);
  if(!MARBLE_DOMAIN_CATALOG[domain].includes(subdomain))throw new Error(`Sous-domaine déclencheur invalide: ${subdomain}`);

  const id=nextMarbleId(existingMarbles||[]);
  const marble={id,domains:{},birth:{trigger_domain:domain,trigger_subdomain:subdomain}};

  for(const d of PER_MARBLE_DOMAINS){
    if(d===domain){
      marble.domains[d]={subdomain,value:clamp(triggerLevel)};
      continue;
    }
    const assigned=pick(MARBLE_DOMAIN_CATALOG[d],`${seed}|${id}|${d}`);
    marble.domains[d]={subdomain:assigned,value:null};
  }
  return marble;
}

export function appendBornMarble(existingMarbles,options){
  const current=Array.isArray(existingMarbles)?structuredClone(existingMarbles):[];
  const marble=createBornMarble(current,options);
  current.push(marble);
  return{marbles:current,born:marble};
}
