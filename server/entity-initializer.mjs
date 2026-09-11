import crypto from 'node:crypto';
import {MARBLE_DOMAIN_CATALOG,PER_MARBLE_DOMAINS} from './entity-marble-catalog.mjs';

export const INITIAL_DOMAIN_RANGES=Object.freeze({
  'Personnalité':Object.freeze([15,35]),
  'Relation':Object.freeze([0,0]),
  'Goûts':Object.freeze([15,30]),
  'Opinions/Valeurs':Object.freeze([15,30]),
  'Connaissances':Object.freeze([15,30]),
  'Monde propre':Object.freeze([5,20])
});

function random01(seed,counter){const b=crypto.createHash('sha256').update(`${seed}|${counter}`).digest();return b.readUInt32BE(0)/0x100000000}
function round6(n){return Math.round(Number(n)*1e6)/1e6}
function clamp(n,min=0,max=100){return Math.max(min,Math.min(max,n))}

export function recenterExactMean(values,target){
  if(!Array.isArray(values)||!values.length)throw new Error('Valeurs individuelles absentes');
  const wanted=clamp(Number(target)),out=values.map(v=>clamp(Number(v))),wantedSum=wanted*out.length;
  for(let guard=0;guard<200;guard++){const sum=out.reduce((a,b)=>a+b,0),diff=wantedSum-sum;if(Math.abs(diff)<1e-9)break;const direction=diff>0?1:-1,eligible=[];for(let i=0;i<out.length;i++){if(direction>0&&out[i]<100-1e-12)eligible.push(i);if(direction<0&&out[i]>1e-12)eligible.push(i)}if(!eligible.length)break;const share=diff/eligible.length;let moved=0;for(const i of eligible){const before=out[i];out[i]=clamp(before+share);moved+=out[i]-before}if(Math.abs(moved)<1e-12)break}
  let residual=wantedSum-out.reduce((a,b)=>a+b,0);if(Math.abs(residual)>1e-8){const i=out.findIndex(v=>residual>0?v+residual<=100+1e-8:v+residual>=-1e-8);if(i<0)throw new Error('Impossible de garantir la moyenne exacte');out[i]=clamp(out[i]+residual)}
  return out.map(round6);
}

export function generateIndividualValues({count,target,seed}){const n=Number(count);if(!Number.isInteger(n)||n<1)throw new Error('Nombre de billes invalide');const t=clamp(Number(target));if(t===0||t===100)return Array(n).fill(t);const raw=[];for(let i=0;i<n;i++){const u1=random01(seed,i*3),u2=random01(seed,i*3+1),u3=random01(seed,i*3+2),triangular=(u1+u2)-1,rare=u3<0.12?(random01(seed,10000+i)*2-1):0,spread=u3<0.12?70:34;raw.push(clamp(t+triangular*spread+rare*18))}return recenterExactMean(raw,t)}

export function chooseInitialGlobalLevel(domain,subdomain,{seed='emaea'}={}){const range=INITIAL_DOMAIN_RANGES[domain];if(!range)throw new Error(`Domaine initial inconnu: ${domain}`);const[min,max]=range;if(min===max)return min;const u=random01(`${seed}|${domain}|${subdomain}`,0);return round6(min+u*(max-min))}

export function initializeMarbleValues(marbles,{seed='emaea'}={}){if(!Array.isArray(marbles)||!marbles.length)throw new Error('Billes initiales absentes');const next=structuredClone(marbles),durable_levels={};for(const domain of PER_MARBLE_DOMAINS){durable_levels[domain]={};for(const subdomain of MARBLE_DOMAIN_CATALOG[domain]){const indexes=[];for(let i=0;i<next.length;i++){if(next[i]?.domains?.[domain]?.subdomain===subdomain)indexes.push(i)}if(!indexes.length)continue;const target=chooseInitialGlobalLevel(domain,subdomain,{seed}),values=generateIndividualValues({count:indexes.length,target,seed:`${seed}|${domain}|${subdomain}|values`});indexes.forEach((idx,j)=>{next[idx].domains[domain].value=values[j]});durable_levels[domain][subdomain]=round6(values.reduce((a,b)=>a+b,0)/values.length)}}return{marbles:next,durable_levels,capacities_level:0}}

export function initialHistoryLevel(interlocutorAge){if(interlocutorAge==null||interlocutorAge==='')return null;const age=Number(interlocutorAge);if(!Number.isFinite(age)||age<0)throw new Error('Âge interlocuteur invalide');return clamp(round6(age*.5))}
