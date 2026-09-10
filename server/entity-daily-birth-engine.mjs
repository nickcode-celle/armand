import {appendNeutralBornMarble} from './entity-marble-birth-state.mjs';

export const DAILY_BIRTH_HOUR=8;
export const DAILY_BIRTH_CATCHUP_LIMIT=2;
export const DEFAULT_DAILY_BIRTH_TIME_ZONE='Europe/Paris';

const pad=n=>String(n).padStart(2,'0');
function partsAt(date,timeZone){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date);
  const get=t=>Number(parts.find(p=>p.type===t)?.value);
  return{year:get('year'),month:get('month'),day:get('day'),hour:get('hour'),minute:get('minute')};
}
function dateKey(parts){return`${parts.year}-${pad(parts.month)}-${pad(parts.day)}`}
function addDays(key,amount){const [y,m,d]=key.split('-').map(Number),x=new Date(Date.UTC(y,m-1,d+amount));return`${x.getUTCFullYear()}-${pad(x.getUTCMonth()+1)}-${pad(x.getUTCDate())}`}
function compareDateKey(a,b){return a===b?0:(a<b?-1:1)}
function datesAfter(startExclusive,endInclusive){const out=[];for(let d=addDays(startExclusive,1);compareDateKey(d,endInclusive)<=0;d=addDays(d,1))out.push(d);return out}

/**
 * Réconcilie la naissance gratuite quotidienne d'EMÆÄ.
 * Une échéance existe chaque jour à 08:00 dans le fuseau configuré.
 * En cas d'absence prolongée, seules les deux échéances les plus récentes sont matérialisées;
 * les plus anciennes sont considérées perdues afin que le rattrapage ne dépasse jamais 2 billes.
 */
export function applyDailyBirths(evolution={}, {now=new Date(),timeZone=DEFAULT_DAILY_BIRTH_TIME_ZONE,seed='emaea'}={}){
  const current=structuredClone(evolution||{}),marbles=Array.isArray(current.marbles)?current.marbles:[];
  if(!marbles.length||!current.durable_levels||!Object.keys(current.durable_levels).length)return{evolution:current,births:[]};

  const nowDate=now instanceof Date?now:new Date(now);
  if(Number.isNaN(nowDate.getTime()))throw new Error('Date quotidienne EMÆÄ invalide');
  const nowLocal=partsAt(nowDate,timeZone),today=dateKey(nowLocal);
  const initializedAt=current.initialized_at?new Date(current.initialized_at):nowDate;
  const initLocal=partsAt(Number.isNaN(initializedAt.getTime())?nowDate:initializedAt,timeZone),initDate=dateKey(initLocal);
  const lastDate=String(current.daily_birth_last_date||'').trim()||null;

  let firstEligibleDate;
  if(lastDate)firstEligibleDate=addDays(lastDate,1);
  else firstEligibleDate=initLocal.hour<DAILY_BIRTH_HOUR?initDate:addDays(initDate,1);

  const latestDueDate=nowLocal.hour>=DAILY_BIRTH_HOUR?today:addDays(today,-1);
  if(compareDateKey(firstEligibleDate,latestDueDate)>0){
    return{evolution:{...current,daily_birth_time_zone:timeZone},births:[]};
  }

  const beforeFirst=addDays(firstEligibleDate,-1),allDue=datesAfter(beforeFirst,latestDueDate);
  const selected=allDue.slice(-DAILY_BIRTH_CATCHUP_LIMIT);
  let nextMarbles=marbles,births=[];
  for(const dailyDate of selected){
    const out=appendNeutralBornMarble(nextMarbles,{domainLevels:current.durable_levels,seed:`${seed}|daily|${dailyDate}`,source:'daily',metadata:{daily_date:dailyDate,daily_hour:DAILY_BIRTH_HOUR,time_zone:timeZone}});
    nextMarbles=out.marbles;
    births.push({...out.born,daily_date:dailyDate,body_count_after:nextMarbles.length});
  }

  return{
    evolution:{...current,marbles:nextMarbles,daily_birth_last_date:latestDueDate,daily_birth_time_zone:timeZone,daily_birth_missed_discarded:Math.max(0,allDue.length-selected.length)},
    births
  };
}
