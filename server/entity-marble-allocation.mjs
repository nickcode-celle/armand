const BODY_COUNT=200;
const GROUP_SIZE=20;

/**
 * Règle validée par continuité avec l'ancien modèle 100 billes :
 * toutes les quantités d'affectation sont multipliées par deux.
 *
 * - domaines à 10 sous-domaines : 20 billes par sous-domaine = 200
 * - Opinions/Valeurs (9) : 20 par sous-domaine = 180, 20 non attribuées
 * - Monde propre (8) : 20 par sous-domaine = 160, 40 non attribuées
 *
 * Cette fonction calcule uniquement les quotas. Elle ne choisit aucun
 * sous-domaine et ne modifie aucune valeur individuelle.
 */
export function allocationPlan200(subdomainCount){
  const count=Number(subdomainCount);
  if(!Number.isInteger(count)||count<1||count>10)throw new Error('Nombre de sous-domaines invalide');
  const assigned=count*GROUP_SIZE;
  return{
    body_count:BODY_COUNT,
    subdomain_count:count,
    per_subdomain:GROUP_SIZE,
    assigned,
    unassigned:BODY_COUNT-assigned
  };
}

export function validateAllocationPlan200(plan){
  if(!plan||typeof plan!=='object')return false;
  return Number(plan.assigned)+Number(plan.unassigned)===BODY_COUNT
    && Number(plan.per_subdomain)===GROUP_SIZE;
}

export const EMAEA_BODY_COUNT=BODY_COUNT;
export const EMAEA_INITIAL_GROUP_SIZE=GROUP_SIZE;
