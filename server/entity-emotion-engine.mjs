const INTENSITIES=Object.freeze(['faible','modéré','fort']);
const RANK=Object.freeze({faible:1,'modéré':2,fort:3});
export const EMOTION_SENTIMENTS=Object.freeze(['Joie','Tristesse','Colère','Peur','Surprise','Fierté','Tendresse','Confiance','Amour']);
const SENTIMENT_LOOKUP=new Map(EMOTION_SENTIMENTS.map(s=>[s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,''),s]));
const OP_ALIASES=Object.freeze({
  'naitre':'NAITRE','naître':'NAITRE','NAITRE':'NAITRE','NAÎTRE':'NAITRE',
  'renforcer':'RENFORCER','RENFORCER':'RENFORCER',
  'maintenir':'MAINTENIR','MAINTENIR':'MAINTENIR',
  'affaiblir':'AFFAIBLIR','AFFAIBLIR':'AFFAIBLIR',
  'disparaitre':'DISPARAITRE','disparaître':'DISPARAITRE','DISPARAITRE':'DISPARAITRE','DISPARAÎTRE':'DISPARAITRE'
});

const cleanText=v=>typeof v==='string'?v.trim():'';

export function normalizeSentiment(value){
  const raw=cleanText(value);
  const key=raw.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'');
  const sentiment=SENTIMENT_LOOKUP.get(key);
  if(!sentiment)throw new Error(`Sentiment EMÆÄ invalide: ${value}`);
  return sentiment;
}

export function normalizeIntensity(value,{allowNull=false}={}){
  if(value==null&&allowNull)return null;
  const raw=cleanText(value).toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'');
  const normalized=raw==='modere'?'modéré':raw;
  if(!INTENSITIES.includes(normalized))throw new Error(`Intensité émotionnelle invalide: ${value}`);
  return normalized;
}

export function normalizeEmotionOperation(value){
  const raw=cleanText(value);
  const op=OP_ALIASES[raw]??OP_ALIASES[raw.toLowerCase()];
  if(!op)throw new Error(`Opération émotionnelle invalide: ${value}`);
  return op;
}

export function normalizeEmotionChange(item){
  if(!item||typeof item!=='object')throw new Error('Changement émotionnel invalide');
  const sentiment=normalizeSentiment(item.sentiment);
  const operation=normalizeEmotionOperation(item.operation);
  const before=normalizeIntensity(item.intensite_avant??item.intensiteAvant??item.intensity_before??null,{allowNull:true});
  const after=operation==='DISPARAITRE'
    ? null
    : normalizeIntensity(item.intensite_apres??item.intensiteApres??item.intensity_after??item.intensite??item.intensity);
  const cause=cleanText(item.cause)||null;
  const justification=cleanText(item.justification)||null;
  const ancrage_relationnel=cleanText(item.ancrage_relationnel??item.ancrageRelationnel??item.relational_anchor)||null;
  if(sentiment==='Amour'&&!ancrage_relationnel&&operation!=='DISPARAITRE')throw new Error('Amour exige un ancrage relationnel');
  return{sentiment,operation,intensite_avant:before,intensite_apres:after,cause,justification,ancrage_relationnel};
}

export function normalizeEmotionChanges(input){
  if(input==null)return[];
  const raw=Array.isArray(input)?input:(Array.isArray(input.changements)?input.changements:Array.isArray(input.changes)?input.changes:[]);
  if(raw.length>3)throw new Error('Observer: maximum trois changements/sentiments émotionnels');
  return raw.map(normalizeEmotionChange);
}

function currentMap(previous){
  const arr=Array.isArray(previous?.active)?previous.active:[];
  const map=new Map();
  for(const item of arr){
    let sentiment;
    try{sentiment=normalizeSentiment(item?.sentiment)}catch{continue}
    let intensity;
    try{intensity=normalizeIntensity(item.intensite??item.intensity)}catch{continue}
    map.set(sentiment,{...item,sentiment,intensite:intensity});
  }
  return map;
}

function validateDirection(operation,current,before,after){
  const reference=before??current?.intensite??null;
  if(operation==='NAITRE')return;
  if(operation==='DISPARAITRE')return;
  if(!current)throw new Error(`${operation}: sentiment absent de l’état émotionnel`);
  if(reference&&RANK[reference]!==RANK[current.intensite])throw new Error(`${operation}: intensité avant incohérente avec l’état courant`);
  if(operation==='RENFORCER'&&RANK[after]<RANK[current.intensite])throw new Error('RENFORCER ne peut pas réduire l’intensité');
  if(operation==='MAINTENIR'&&RANK[after]!==RANK[current.intensite])throw new Error('MAINTENIR doit conserver l’intensité');
  if(operation==='AFFAIBLIR'&&RANK[after]>RANK[current.intensite])throw new Error('AFFAIBLIR ne peut pas augmenter l’intensité');
}

/**
 * D — moteur émotionnel, partie état/cycle.
 * Applique le contrat sémantique A→D avec le vocabulaire validé de 9 sentiments.
 * L'acquisition de niveau est volontairement séparée de l'état émotionnel actif.
 */
export function applyEmotionChanges(previous={},input,{at=new Date().toISOString()}={}){
  const changes=normalizeEmotionChanges(input);
  const map=currentMap(previous);
  const applied=[];

  for(const change of changes){
    const current=map.get(change.sentiment)||null;
    validateDirection(change.operation,current,change.intensite_avant,change.intensite_apres);

    if(change.operation==='DISPARAITRE'){
      map.delete(change.sentiment);
      applied.push({...change,active:false,at});
      continue;
    }

    const next={
      ...(current||{}),
      sentiment:change.sentiment,
      intensite:change.intensite_apres,
      cause:change.cause,
      justification:change.justification,
      ancrage_relationnel:change.ancrage_relationnel,
      updated_at:at
    };
    map.set(change.sentiment,next);
    applied.push({...change,active:true,at});
  }

  const active=[...map.values()];
  if(active.length>3)throw new Error('D: maximum trois sentiments actifs simultanément');

  return{
    ...previous,
    active,
    last_changes:applied,
    updated_at:at
  };
}

export const EMOTION_INTENSITIES=INTENSITIES;
