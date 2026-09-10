import {appendBornMarble} from './entity-marble-birth-state.mjs';

export const MARBLE_GROWTH_THRESHOLDS=Object.freeze([40,60,80,100]);

function key(domain,subdomain,threshold){return `${domain}|${subdomain}|${threshold}`}

/**
 * Une nouvelle bille est créée lors du premier franchissement de chaque seuil
 * 40, 60, 80, 100 d'un sous-domaine porté individuellement par les billes.
 * Chaque seuil ne peut produire qu'une naissance pour ce sous-domaine.
 */
export function applyGrowthFromChanges(evolution={},changes=[],{seed='emaea'}={}){
  let marbles=Array.isArray(evolution.marbles)?structuredClone(evolution.marbles):[];
  const crossed={...(evolution.birth_thresholds||{})};
  const births=[];

  for(const change of Array.isArray(changes)?changes:[]){
    const domain=String(change?.domaine||'');
    const subdomain=String(change?.sous_domaine||'');
    if(!subdomain)continue;
    const before=Number(change?.before),after=Number(change?.after);
    if(!Number.isFinite(before)||!Number.isFinite(after)||after<=before)continue;

    for(const threshold of MARBLE_GROWTH_THRESHOLDS){
      const token=key(domain,subdomain,threshold);
      if(crossed[token])continue;
      if(before<threshold&&after>=threshold){
        const out=appendBornMarble(marbles,{triggerDomain:domain,triggerSubdomain:subdomain,triggerLevel:after,seed:`${seed}|${token}`});
        marbles=out.marbles;
        crossed[token]=true;
        births.push({...out.born,threshold,trigger_level:after});
      }
    }
  }

  return{marbles,birth_thresholds:crossed,births};
}
