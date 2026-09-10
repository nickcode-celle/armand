import crypto from 'node:crypto';
import {MARBLE_DOMAIN_CATALOG,PER_MARBLE_DOMAINS} from './entity-marble-catalog.mjs';

const clamp=v=>Math.max(0,Math.min(100,Number(v)||0));
const hash01=s=>{const h=crypto.createHash('sha256').update(String(s)).digest();return h.readUInt32BE(0)/0x100000000};
const pick=(items,key)=>items[Math.floor(hash01(key)*items.length)];

function nextMarbleId(existing=[]){
  const used=new Set(existing.map(x=>String(x?.id||'')));let n=existing.length+1;
  while(used.has(`bille-${String(n).padStart(3,'0')}`))n++;
  return`bille-${String(n).padStart(3,'0')}`;
}
function levelFor(domainLevels,domain,subdomain){
  const raw=domainLevels?.[domain]?.[subdomain];
  if(raw==null||raw==='')throw new Error(`Niveau global absent pour la nouvelle bille: ${domain} / ${subdomain}`);
  const n=Number(raw);if(!Number.isFinite(n))throw new Error(`Niveau global invalide: ${domain} / ${subdomain}`);return clamp(n);
}
function randomDomainSlots(id,domainLevels,seed){
  const domains={};
  for(const domain of PER_MARBLE_DOMAINS){
    const subdomain=pick(MARBLE_DOMAIN_CATALOG[domain],`${seed}|${id}|${domain}`);
    domains[domain]={subdomain,value:levelFor(domainLevels,domain,subdomain)};
  }
  return domains;
}

/**
 * Construit les données persistantes d'une vraie nouvelle bille déclenchée par un sous-domaine.
 * Le domaine déclencheur reçoit le niveau courant du sous-domaine déclencheur.
 * Pour les autres domaines par-bille, le sous-domaine est tiré aléatoirement et
 * la valeur initiale prend sa moyenne globale courante : ajouter la bille ne
 * déplace donc pas artificiellement le niveau global du sous-domaine choisi.
 */
export function createBornMarble(existingMarbles,{triggerDomain,triggerSubdomain,triggerLevel,domainLevels={},seed='emaea'}={}){
  const domain=String(triggerDomain||'').trim(),subdomain=String(triggerSubdomain||'').trim();
  if(!PER_MARBLE_DOMAINS.includes(domain))throw new Error(`Domaine déclencheur invalide: ${domain}`);
  if(!MARBLE_DOMAIN_CATALOG[domain].includes(subdomain))throw new Error(`Sous-domaine déclencheur invalide: ${subdomain}`);

  const id=nextMarbleId(existingMarbles||[]),marble={id,domains:{},birth:{source:'threshold',trigger_domain:domain,trigger_subdomain:subdomain}};
  for(const d of PER_MARBLE_DOMAINS){
    if(d===domain){marble.domains[d]={subdomain,value:clamp(triggerLevel)};continue}
    const assigned=pick(MARBLE_DOMAIN_CATALOG[d],`${seed}|${id}|${d}`);
    marble.domains[d]={subdomain:assigned,value:levelFor(domainLevels,d,assigned)};
  }
  return marble;
}

/**
 * Bille sans sous-domaine déclencheur (naissance quotidienne ou achat confirmé).
 * Tous ses sous-domaines sont tirés de façon stable et sa valeur initiale reprend
 * la moyenne globale courante du sous-domaine choisi. La naissance reste donc neutre
 * sur les niveaux d'EMÆÄ.
 */
export function createNeutralBornMarble(existingMarbles,{domainLevels={},seed='emaea',source='daily',metadata=null}={}){
  const id=nextMarbleId(existingMarbles||[]);
  return{id,domains:randomDomainSlots(id,domainLevels,seed),birth:{source:String(source||'neutral'),...(metadata&&typeof metadata==='object'?metadata:{})}};
}

export function appendBornMarble(existingMarbles,options){
  const current=Array.isArray(existingMarbles)?structuredClone(existingMarbles):[];
  const marble=createBornMarble(current,options);current.push(marble);return{marbles:current,born:marble};
}
export function appendNeutralBornMarble(existingMarbles,options){
  const current=Array.isArray(existingMarbles)?structuredClone(existingMarbles):[];
  const marble=createNeutralBornMarble(current,options);current.push(marble);return{marbles:current,born:marble};
}
