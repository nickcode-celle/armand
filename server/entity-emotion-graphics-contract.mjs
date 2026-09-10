import {normalizeSentiment} from './entity-emotion-engine.mjs';

/**
 * Pont D → Récompenses → E.
 * Les sentiments n'ont AUCUN comportement graphique propre.
 * Ils servent uniquement de condition de déclenchement d'une récompense lorsque
 * toutes les autres contraintes de cette récompense sont déjà validées ailleurs.
 *
 * Cette couche ne choisit ni la récompense, ni sa forme, ni sa couleur, ni son animation.
 * Elle vérifie seulement que le sentiment requis est actuellement actif.
 */
export function buildRewardTriggerSignals(emotion={},rewardCandidates=[]){
  const active=Array.isArray(emotion?.active)?emotion.active:[];
  const activeSentiments=new Set(active.map(item=>normalizeSentiment(item?.sentiment)));
  const candidates=Array.isArray(rewardCandidates)?rewardCandidates:[];

  return candidates.flatMap(candidate=>{
    if(!candidate||typeof candidate!=='object')return[];
    if(candidate.constraints_valid!==true)return[];

    const rewardId=String(candidate.reward_id??candidate.rewardId??'').trim();
    if(!rewardId)throw new Error('Récompense: reward_id manquant');

    const required=normalizeSentiment(candidate.required_sentiment??candidate.requiredSentiment);
    if(!activeSentiments.has(required))return[];

    return [{
      reward_id:rewardId,
      trigger_sentiment:required,
      ready:true,
      source:'D',
      graphic_behavior:null
    }];
  });
}
