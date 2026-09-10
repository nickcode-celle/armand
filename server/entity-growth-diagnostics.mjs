import {MARBLE_DOMAIN_CATALOG} from './entity-marble-catalog.mjs';
import {MARBLE_GROWTH_THRESHOLDS} from './entity-growth-engine.mjs';

export const INITIAL_BODY_COUNT=200;
export const REWARD_POPULATION_GATES=Object.freeze([300,500,1000,2000]);

/**
 * Diagnostic pur : il n'ajoute aucune règle de croissance. Il expose seulement ce que
 * les règles validées permettent mathématiquement, afin qu'aucun palier ne soit déclaré
 * atteignable par erreur.
 */
export function growthCapacityReport({initialBodyCount=INITIAL_BODY_COUNT}={}){
  const subdomainCount=Object.values(MARBLE_DOMAIN_CATALOG).reduce((sum,list)=>sum+list.length,0);
  const birthsPerSubdomain=MARBLE_GROWTH_THRESHOLDS.length;
  const maximumBirths=subdomainCount*birthsPerSubdomain;
  const maximumBodyCount=Number(initialBodyCount)+maximumBirths;
  const gates=REWARD_POPULATION_GATES.map(population=>({population,reachable:maximumBodyCount>=population}));
  return{subdomain_count:subdomainCount,births_per_subdomain:birthsPerSubdomain,maximum_births:maximumBirths,maximum_body_count:maximumBodyCount,gates};
}
