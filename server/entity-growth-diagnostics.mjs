import {MARBLE_DOMAIN_CATALOG} from './entity-marble-catalog.mjs';
import {MARBLE_GROWTH_THRESHOLDS} from './entity-growth-engine.mjs';
import {DAILY_BIRTH_HOUR,DAILY_BIRTH_CATCHUP_LIMIT} from './entity-daily-birth-engine.mjs';

export const INITIAL_BODY_COUNT=200;
export const REWARD_POPULATION_GATES=Object.freeze([300,500,1000,2000]);

/**
 * Diagnostic pur. Les naissances de seuil ont un plafond mathématique; les naissances
 * quotidiennes et les billes achetées ajoutent ensuite des sources de population sans
 * plafond global fixé par les règles actuelles.
 */
export function growthCapacityReport({initialBodyCount=INITIAL_BODY_COUNT}={}){
  const subdomainCount=Object.values(MARBLE_DOMAIN_CATALOG).reduce((sum,list)=>sum+list.length,0);
  const birthsPerSubdomain=MARBLE_GROWTH_THRESHOLDS.length;
  const thresholdMaximumBirths=subdomainCount*birthsPerSubdomain;
  const thresholdMaximumBodyCount=Number(initialBodyCount)+thresholdMaximumBirths;
  const gates=REWARD_POPULATION_GATES.map(population=>({
    population,
    reachable_by_thresholds_alone:thresholdMaximumBodyCount>=population,
    reachable_with_daily_or_purchased_births:true,
    additional_balls_beyond_threshold_maximum:Math.max(0,population-thresholdMaximumBodyCount)
  }));
  return{subdomain_count:subdomainCount,births_per_subdomain:birthsPerSubdomain,threshold_maximum_births:thresholdMaximumBirths,threshold_maximum_body_count:thresholdMaximumBodyCount,daily_birth_hour:DAILY_BIRTH_HOUR,daily_catchup_limit:DAILY_BIRTH_CATCHUP_LIMIT,purchased_births_enabled_by_design:true,gates};
}
