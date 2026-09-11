import crypto from 'node:crypto';
import {MARBLE_DOMAIN_CATALOG,PER_MARBLE_DOMAINS} from './entity-marble-catalog.mjs';

const BODY_COUNT=200;
const GROUP_SIZE=20;

export function allocationPlan200(subdomainCount){
  const count=Number(subdomainCount);
  if(!Number.isInteger(count)||count<1||count>10)throw new Error('Nombre de sous-domaines invalide');
  const assigned=count*GROUP_SIZE;
  return{body_count:BODY_COUNT,subdomain_count:count,per_subdomain:GROUP_SIZE,assigned,unassigned:BODY_COUNT-assigned};
}

export function validateAllocationPlan200(plan){
  if(!plan||typeof plan!=='object')return false;
  return Number(plan.assigned)+Number(plan.unassigned)===BODY_COUNT&&Number(plan.per_subdomain)===GROUP_SIZE;
}

function random01(seed,counter){const b=crypto.createHash('sha256').update(`${seed}|${counter}`).digest();return b.readUInt32BE(0)/0x100000000}
function shuffledIndexes(seed){const a=Array.from({length:BODY_COUNT},(_,i)=>i);let c=0;for(let i=a.length-1;i>0;i--){const j=Math.floor(random01(seed,c++)*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}

export function createInitialMarbleAssignments({seed='emaea'}={}){
  const marbles=Array.from({length:BODY_COUNT},(_,i)=>({id:`bille-${String(i+1).padStart(3,'0')}`,domains:{}}));
  for(const domain of PER_MARBLE_DOMAINS){const subdomains=MARBLE_DOMAIN_CATALOG[domain],order=shuffledIndexes(`${seed}|${domain}`);let cursor=0;for(const subdomain of subdomains){for(let n=0;n<GROUP_SIZE;n++){const marble=marbles[order[cursor++]];marble.domains[domain]={subdomain,value:null}}}}
  return marbles;
}

export function allocationReport(marbles){
  const report={body_count:Array.isArray(marbles)?marbles.length:0,domains:{}};
  for(const domain of PER_MARBLE_DOMAINS){const counts=Object.fromEntries(MARBLE_DOMAIN_CATALOG[domain].map(x=>[x,0]));let unassigned=0;for(const marble of marbles||[]){const slot=marble?.domains?.[domain];if(!slot){unassigned++;continue}if(!(slot.subdomain in counts))throw new Error(`Sous-domaine inattendu pour ${domain}: ${slot.subdomain}`);counts[slot.subdomain]++}report.domains[domain]={counts,unassigned}}
  return report;
}

export function validateInitialMarbleAssignments(marbles){
  if(!Array.isArray(marbles)||marbles.length!==BODY_COUNT)return false;
  if(new Set(marbles.map(x=>x?.id)).size!==BODY_COUNT)return false;
  const report=allocationReport(marbles);
  for(const domain of PER_MARBLE_DOMAINS){const expected=allocationPlan200(MARBLE_DOMAIN_CATALOG[domain].length),actual=report.domains[domain];if(actual.unassigned!==expected.unassigned)return false;if(Object.values(actual.counts).some(n=>n!==GROUP_SIZE))return false}
  return true;
}

export const EMAEA_BODY_COUNT=BODY_COUNT;
export const EMAEA_INITIAL_GROUP_SIZE=GROUP_SIZE;
