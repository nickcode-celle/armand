const clampPercent=value=>Math.max(0,Math.min(100,Number(value)||0));

/**
 * Règle validée 10/09/2026 : V1 = 1 + Relation / 100.
 * Le niveau Relation transmis ici est le niveau global du domaine (moyenne des sous-domaines).
 */
export function relationGlobalSpeed(relationLevel){
  return 1+clampPercent(relationLevel)/100;
}

function hash01(text){
  let h=2166136261;
  for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}
  return (h>>>0)/4294967296;
}

/**
 * Variation individuelle historique ±20 %, recentrée afin que le multiplicateur moyen soit exactement 1.
 * Elle est déterministe par identité de bille : une reconnexion ne change pas sa variation.
 */
export function relationIndividualMultipliers(marbles=[]){
  const raw=(Array.isArray(marbles)?marbles:[]).map(m=>0.8+0.4*hash01(`relation-speed|${m?.id??''}`));
  if(!raw.length)return[];
  const mean=raw.reduce((a,b)=>a+b,0)/raw.length;
  return raw.map(v=>v/mean);
}

export function relationSpeedForMarble(relationLevel,multiplier=1){
  return relationGlobalSpeed(relationLevel)*Number(multiplier||1);
}
