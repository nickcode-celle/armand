import {normalizeEmotionChanges} from './entity-emotion-engine.mjs';

const EVOLUTIONS=new Set([1,2,3,-1]);

function text(value){return typeof value==='string'?value.trim():''}

function normalizeDurable(item){
  if(!item||typeof item!=='object')throw new Error('Évolution durable Observer invalide');
  const domaine=text(item.domaine);
  const rawSub=text(item.sous_domaine??item.sousDomaine);
  const evolution=Number(item.evolution);
  if(!domaine)throw new Error('Domaine Observer manquant');
  if(domaine!=='Capacités'&&!rawSub)throw new Error('Sous-domaine Observer manquant');
  if(!EVOLUTIONS.has(evolution))throw new Error(`Evolution Observer invalide: ${item.evolution}`);
  return{
    domaine,
    sous_domaine:domaine==='Capacités'?null:rawSub,
    evolution,
    preuve:text(item.preuve)||null,
    justification:text(item.justification)||null
  };
}

function normalizeHistory(history){
  if(history==null)return null;
  if(typeof history!=='object')throw new Error('Histoire Observer invalide');
  const niveau=Number(history.niveau);
  if(!Number.isInteger(niveau)||niveau<0||niveau>3)throw new Error('Niveau Histoire invalide');
  return{
    evenement:text(history.evenement)||null,
    niveau,
    nature:text(history.nature)||null,
    justification:text(history.justification)||null
  };
}

export function normalizeObserverOutput(raw={}){
  if(!raw||typeof raw!=='object')throw new Error('Sortie Observer invalide');
  const durableRaw=raw.evolutions_durables??raw.evolutionsDurables??[];
  if(!Array.isArray(durableRaw))throw new Error('evolutions_durables doit être un tableau');
  if(durableRaw.length>2)throw new Error('Observer: maximum deux évolutions durables par événement');
  return{
    evolutions_durables:durableRaw.map(normalizeDurable),
    histoire:normalizeHistory(raw.histoire??null),
    sentiments:normalizeEmotionChanges(raw.sentiments??null)
  };
}
