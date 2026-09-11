import {createInitialMarbleAssignments} from './entity-marble-allocation.mjs';
import {initializeMarbleValues,initialHistoryLevel} from './entity-initializer.mjs';
import {applyHistoryEvent} from './entity-history-evolution.mjs';

const normalize=s=>String(s??'').trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'');
function parseAge(value){if(typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=130)return value;if(typeof value==='string'){const m=value.trim().match(/^(\d{1,3})(?:\s*ans?)?$/i);if(m){const n=Number(m[1]);if(n>=0&&n<=130)return n}}return null}
function findAge(node,depth=0){if(node==null||depth>8)return null;if(Array.isArray(node)){for(const item of node){const found=findAge(item,depth+1);if(found!=null)return found}return null}if(typeof node!=='object')return null;const property=normalize(node.propriete??node.property??node.champ??node.field);if(property==='age'){const found=parseAge(node.valeur??node.value??node.contenu??node.content);if(found!=null)return found}for(const [key,value] of Object.entries(node)){const k=normalize(key);if(k==='age'||k==='interlocuteur_age'||k==='interlocutor_age'){const found=parseAge(value);if(found!=null)return found}}for(const value of Object.values(node)){const found=findAge(value,depth+1);if(found!=null)return found}return null}

export function extractExplicitInterlocutorAge(memory){return findAge(memory?.faits??null)}
function isDeferredHistoryRecord(item){return item?.history_deferred===true||(item?.before==null&&item?.after==null&&[0,1,2,3].includes(Number(item?.niveau??item?.level)))}
export function replayDeferredHistoryEvents(baseLevel,events=[],{at=new Date().toISOString()}={}){let level=baseLevel;const history=[];for(const item of Array.isArray(events)?events:[]){if(!isDeferredHistoryRecord(item)){history.push(item);continue}const out=applyHistoryEvent(level,item);level=out.level;history.push({...item,before:out.change?.before??level,after:out.change?.after??level,history_deferred:false,history_replayed_at:at})}return{level,events:history}}

export function ensureInitialEvolutionState(state={},entityId,{age=null,at=new Date().toISOString()}={}){
  const current=state.evolution||{};
  const hasBody=Array.isArray(current.marbles)&&current.marbles.length&&current.durable_levels&&Object.keys(current.durable_levels).length;
  if(hasBody){if(current.history_level==null&&age!=null){const base=initialHistoryLevel(age),replayed=replayDeferredHistoryEvents(base,current.history_events||[],{at});return{...current,history_level:replayed.level,history_events:replayed.events,updated_at:at}}return current}
  const id=String(entityId||'').trim();if(!id)throw new Error('entityId requis pour initialiser EMÆÄ');
  const assigned=createInitialMarbleAssignments({seed:`${id}|allocation`}),initialized=initializeMarbleValues(assigned,{seed:`${id}|initial-values`}),ageHistory=age==null?null:initialHistoryLevel(age),replayed=ageHistory==null?{level:null,events:Array.isArray(current.history_events)?current.history_events:[]}:replayDeferredHistoryEvents(ageHistory,current.history_events||[],{at});
  return{...current,marbles:initialized.marbles,durable_levels:{...initialized.durable_levels,'Capacités':initialized.capacities_level},history_level:current.history_level??replayed.level,history_events:replayed.events,initialized_at:current.initialized_at??at,updated_at:at};
}

export function hasInitialEvolutionState(state={}){return Array.isArray(state?.evolution?.marbles)&&state.evolution.marbles.length>0&&!!state.evolution?.durable_levels&&Object.keys(state.evolution.durable_levels).length>0}
