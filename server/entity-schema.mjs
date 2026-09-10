export const ENTITY_SCHEMA_VERSION=16;
const metricDefaults={calls:0,response_calls:0,embedding_calls:0,input_tokens:0,output_tokens:0,total_tokens:0,ai_retries:0,ai_errors:0,ai_timeouts:0,recall_searches:0,recall_hits:0,recall_misses:0,recall_remote_failures:0,storage_conflicts:0,consolidation_failures:0};
const evolutionDefaults=()=>({durable_levels:{},marbles:[],history_events:[],history_level:null,birth_thresholds:{},birth_history:[],pending_births:[],daily_birth_last_date:null,daily_birth_time_zone:'Europe/Paris',daily_birth_missed_discarded:0,applied_marble_purchases:[],observer_last:null,last_changes:[],last_marble_changes:[],updated_at:null});
const emotionDefaults=()=>({active:[],last_changes:[],acquired_by_level:{},updated_at:null});
const rewardDefaults=()=>({current_tier:'1',completed_tiers:[],threshold_open:false,acquisition_order_by_level:{},pending_rewards:[],reward_history:[],final_red_complete:false,ultimate_pending:false,ultimate_complete:false,updated_at:null});
const migrations={
  6:s=>({...s,schema_version:6,metrics:s.metrics||{}}),
  7:s=>({...s,schema_version:7,metrics:s.metrics||{},recall_version:Number(s.recall_version||1)}),
  8:s=>({...s,schema_version:8,runtime_version:1,metrics:{...metricDefaults,...(s.metrics||{})},recall_version:Math.max(2,Number(s.recall_version||1))}),
  9:s=>({...s,schema_version:9,evolution:{...evolutionDefaults(),...(s.evolution||{})}}),
  10:s=>({...s,schema_version:10,emotion:{...emotionDefaults(),...(s.emotion||{})}}),
  11:s=>({...s,schema_version:11,emotion:{...emotionDefaults(),...(s.emotion||{}),acquired_by_level:{...(s.emotion?.acquired_by_level||{})}}}),
  12:s=>({...s,schema_version:12,evolution:{...evolutionDefaults(),...(s.evolution||{})},rewards:{...rewardDefaults(),...(s.rewards||{})}}),
  13:s=>({...s,schema_version:13,evolution:{...evolutionDefaults(),...(s.evolution||{}),birth_thresholds:{...(s.evolution?.birth_thresholds||{})},birth_history:[...(s.evolution?.birth_history||[])]},rewards:{...rewardDefaults(),...(s.rewards||{}),ultimate_complete:s.rewards?.ultimate_complete===true}}),
  14:s=>({...s,schema_version:14,evolution:{...evolutionDefaults(),...(s.evolution||{}),birth_thresholds:{...(s.evolution?.birth_thresholds||{})},birth_history:[...(s.evolution?.birth_history||[])],pending_births:[...(s.evolution?.pending_births||[])]}}),
  15:s=>({...s,schema_version:15,evolution:{...evolutionDefaults(),...(s.evolution||{}),daily_birth_last_date:s.evolution?.daily_birth_last_date??null,daily_birth_time_zone:s.evolution?.daily_birth_time_zone||'Europe/Paris',daily_birth_missed_discarded:Number(s.evolution?.daily_birth_missed_discarded||0)}}),
  16:s=>({...s,schema_version:16,evolution:{...evolutionDefaults(),...(s.evolution||{}),applied_marble_purchases:[...(s.evolution?.applied_marble_purchases||[])]}})
};
export const ENTITY_MIGRATIONS=Object.freeze(Object.keys(migrations).map(Number).sort((a,b)=>a-b));
export function migrateEntityState(input={}){
  let s={...input},v=Math.max(5,Number(s.schema_version||5));
  if(v>ENTITY_SCHEMA_VERSION)throw Error(`Schéma Entity futur non supporté: v${v}`);
  while(v<ENTITY_SCHEMA_VERSION){v++;const fn=migrations[v];if(!fn)throw Error(`Migration Entity manquante vers v${v}`);s=fn(s)}
  return{...s,schema_version:ENTITY_SCHEMA_VERSION,metrics:{...metricDefaults,...(s.metrics||{})},evolution:{...evolutionDefaults(),...(s.evolution||{}),birth_thresholds:{...(s.evolution?.birth_thresholds||{})},birth_history:[...(s.evolution?.birth_history||[])],pending_births:[...(s.evolution?.pending_births||[])],applied_marble_purchases:[...(s.evolution?.applied_marble_purchases||[])]},emotion:{...emotionDefaults(),...(s.emotion||{}),acquired_by_level:{...(s.emotion?.acquired_by_level||{})}},rewards:{...rewardDefaults(),...(s.rewards||{})}};
}
