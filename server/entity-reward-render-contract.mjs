const COLORS=new Set(['#28C95B','#2468D8','#7137C8','#E5231F','#FFC928']);
const LOGO_MINIMUM_BY_COLOR=Object.freeze({'#28C95B':300,'#2468D8':500,'#7137C8':1000,'#E5231F':2000,'#FFC928':2000});

/**
 * Transforme une récompense persistée en commande graphique pour E.
 * Référence figée : mêmes billes, squelette uniquement, 5 s morph, 30 s maintien, 5 s retour.
 * Un logo utilise toute la population réelle disponible, avec le minimum du palier correspondant.
 * Aucun ancien moteur REPOS/DONUT/DANSE/EXPLOSION n'intervient ici.
 */
export function buildRewardRenderCommand(reward,bodyCount){
  if(!reward||typeof reward!=='object')throw new Error('Récompense graphique manquante');
  const target=reward.target||{};
  const type=String(target.type||'');
  const value=target.value;
  const color=String(target.color??reward.color??'');
  const count=Number(bodyCount);
  if(!Number.isInteger(count)||count<1)throw new Error('Population graphique invalide');
  if(!COLORS.has(color))throw new Error(`Couleur de palier invalide: ${color}`);
  if(type==='digit'&&(!Number.isInteger(Number(value))||Number(value)<1||Number(value)>8))throw new Error(`Chiffre de récompense invalide: ${value}`);
  if(type==='logo'&&value!=='EMÆÄ')throw new Error('Logo de récompense invalide');
  if(!['digit','logo'].includes(type))throw new Error(`Type de récompense graphique invalide: ${type}`);
  if(type==='logo'){
    const minimum=LOGO_MINIMUM_BY_COLOR[color];
    if(count<minimum)throw new Error(`Population insuffisante pour le logo ${color}: ${count} / ${minimum}`);
  }
  const ultimate=reward.ultimate===true||target.gold===true;
  if(ultimate&&!(type==='logo'&&color==='#FFC928'))throw new Error('Récompense ultime invalide');
  return{
    reward_id:String(reward.id||''),
    kind:type,
    value:type==='digit'?Number(value):'EMÆÄ',
    color,
    body_count:count,
    real_persistent_marbles:true,
    skeleton_only:true,
    preserve_individual_effects:true,
    full_gold_logo:ultimate,
    gold_material:ultimate?{color:'#FFC928',metalness:0.92,roughness:0.20,envMapIntensity:1.55}:null,
    timing:{morph_ms:5000,hold_ms:30000,return_ms:5000},
    engine:'EMAEA_NORMAL',
    obsolete_special_form_engine:false
  };
}

export function buildRewardRenderQueue(rewardState={},bodyCount){
  return (Array.isArray(rewardState?.pending_rewards)?rewardState.pending_rewards:[]).map(x=>buildRewardRenderCommand(x,bodyCount));
}

export const REWARD_LOGO_MINIMUM_BY_COLOR=LOGO_MINIMUM_BY_COLOR;
