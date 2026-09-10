import {EMOTION_SENTIMENTS,normalizeIntensity} from './entity-emotion-engine.mjs';

const ALLOWED=new Set(EMOTION_SENTIMENTS);

/**
 * Contrat D → E.
 * Transporte uniquement l'état émotionnel validé vers le moteur graphique.
 * Aucun comportement visuel, amplitude, vitesse, durée ou nombre de billes n'est
 * inventé ici : ces mappings appartiennent à E et doivent rester ceux validés.
 */
export function buildEmotionRenderIntents(emotion={}){
  const active=Array.isArray(emotion?.active)?emotion.active:[];
  if(active.length>3)throw new Error('D→E: maximum trois sentiments actifs');
  return active.map(item=>{
    const sentiment=String(item?.sentiment||'').trim();
    if(!ALLOWED.has(sentiment))throw new Error(`D→E: sentiment invalide: ${sentiment}`);
    const intensite=normalizeIntensity(item?.intensite??item?.intensity);
    const ancrage_relationnel=sentiment==='Amour'
      ? (String(item?.ancrage_relationnel||'').trim()||null)
      : null;
    if(sentiment==='Amour'&&!ancrage_relationnel)throw new Error('D→E: Amour sans ancrage relationnel');
    return{
      sentiment,
      intensite,
      ancrage_relationnel,
      source:'D',
      temporary:true
    };
  });
}
