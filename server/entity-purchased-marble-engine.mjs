import {appendNeutralBornMarble} from './entity-marble-birth-state.mjs';

/**
 * Applique un achat déjà confirmé par une couche de paiement de confiance.
 * Ce module ne valide aucun paiement et ne doit jamais être exposé directement au client.
 * Un purchaseId ne peut être appliqué qu'une fois.
 */
export function applyConfirmedMarblePurchase(evolution={}, {purchaseId,quantity,confirmed=false,seed='emaea'}={}){
  if(confirmed!==true)throw new Error('Achat de billes non confirmé');
  const id=String(purchaseId||'').trim();
  const qty=Number(quantity);
  if(!id)throw new Error('Identifiant achat de billes manquant');
  if(!Number.isInteger(qty)||qty<1)throw new Error('Quantité de billes achetées invalide');

  const current=structuredClone(evolution||{});
  const applied=new Set(Array.isArray(current.applied_marble_purchases)?current.applied_marble_purchases.map(String):[]);
  if(applied.has(id))return{evolution:current,births:[],idempotent:true};
  if(!Array.isArray(current.marbles)||!current.marbles.length)throw new Error('Population EMÆÄ absente');
  if(!current.durable_levels||!Object.keys(current.durable_levels).length)throw new Error('Niveaux EMÆÄ absents');

  let marbles=current.marbles,births=[];
  for(let i=0;i<qty;i++){
    const out=appendNeutralBornMarble(marbles,{
      domainLevels:current.durable_levels,
      seed:`${seed}|purchase|${id}|${i+1}`,
      source:'purchase',
      metadata:{purchase_id:id,purchase_index:i+1,purchase_quantity:qty}
    });
    marbles=out.marbles;
    births.push({...out.born,body_count_after:marbles.length});
  }
  applied.add(id);
  return{
    evolution:{...current,marbles,applied_marble_purchases:[...applied]},
    births,
    idempotent:false
  };
}
