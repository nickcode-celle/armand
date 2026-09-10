const DEFAULT_TIME_ZONE='Europe/Paris';
const DAILY_HOUR=8;
const MAX_RESCHEDULE_MS=6*60*60*1000;

function partsAt(date,timeZone){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(date);
  const get=t=>Number(parts.find(p=>p.type===t)?.value);
  return{year:get('year'),month:get('month'),day:get('day'),hour:get('hour'),minute:get('minute'),second:get('second')};
}

function nextDailyDelay(timeZone){
  const now=new Date(),p=partsAt(now,timeZone);
  const localSeconds=p.hour*3600+p.minute*60+p.second;
  const targetSeconds=DAILY_HOUR*3600;
  const seconds=localSeconds<targetSeconds?targetSeconds-localSeconds:86400-localSeconds+targetSeconds;
  return Math.max(1000,seconds*1000);
}

/**
 * Déclenche la naissance quotidienne en live lorsqu'une session graphique reste ouverte à 08:00.
 * Si la session est fermée, le serveur rattrape l'échéance à la connexion suivante.
 */
export function attachEmaeaDailyBirthBridge({entityId,timeZone=DEFAULT_TIME_ZONE,requestDailyBirth}={}){
  if(!entityId)throw new Error('entityId EMÆÄ manquant pour la naissance quotidienne');
  if(typeof requestDailyBirth!=='function')throw new Error('Requête quotidienne EMÆÄ manquante');

  let disposed=false,timer=null;
  const schedule=()=>{
    if(disposed)return;
    const delay=nextDailyDelay(timeZone);
    if(delay>MAX_RESCHEDULE_MS){
      timer=setTimeout(schedule,MAX_RESCHEDULE_MS);
      return;
    }
    timer=setTimeout(async()=>{
      try{
        const data=await requestDailyBirth(entityId);
        if(disposed)return;
        if(data?.evolution)window.dispatchEvent(new CustomEvent('emaea:graphic-state',{detail:{entityId,evolution:data.evolution}}));
        if(Array.isArray(data?.render_queue)&&data.render_queue.length){
          window.dispatchEvent(new CustomEvent('emaea:birth-queue',{detail:{entityId,queue:data.render_queue}}));
        }
      }catch(error){
        if(!disposed)window.dispatchEvent(new CustomEvent('emaea:daily-birth-error',{detail:{entityId,error}}));
      }
      schedule();
    },delay);
  };
  schedule();
  return()=>{disposed=true;if(timer)clearTimeout(timer)};
}

export const EMAEA_DAILY_BIRTH_TIME_ZONE=DEFAULT_TIME_ZONE;
export const EMAEA_DAILY_BIRTH_HOUR=DAILY_HOUR;
