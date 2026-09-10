import {applyConfirmedMarblePurchase} from './entity-purchased-marble-engine.mjs';
import {buildBirthRenderQueue} from './entity-birth-render-contract.mjs';

function purchaseBirthRecord(birth,at,purchaseId){
  return{
    birth_id:String(birth.id),
    marble_id:String(birth.id),
    marble:structuredClone(birth),
    source:'purchase',
    purchase_id:String(purchaseId),
    threshold:null,
    trigger_level:null,
    body_count_after:birth.body_count_after,
    created_at:at,
    status:'pending'
  };
}

/**
 * Couche pure à appeler uniquement après confirmation fiable d'un paiement.
 * Elle met à jour l'état persistant et prépare les mêmes commandes graphiques de naissance
 * que les naissances naturelles et quotidiennes.
 */
export function applyConfirmedPurchaseToEntityState(state={}, {purchaseId,quantity,confirmed=false,at=new Date().toISOString(),seed='emaea'}={}){
  const current=structuredClone(state||{});
  const result=applyConfirmedMarblePurchase(current.evolution||{}, {purchaseId,quantity,confirmed,seed});
  if(result.idempotent)return{state:current,births:[],render_queue:[],idempotent:true};

  const records=result.births.map(b=>purchaseBirthRecord(b,at,purchaseId));
  const oldPending=Array.isArray(result.evolution.pending_births)?result.evolution.pending_births:[];
  const pendingIds=new Set(oldPending.map(x=>String(x?.birth_id||'')));
  const pending=[...oldPending,...records.filter(x=>!pendingIds.has(String(x.birth_id)))];
  const history=[...(result.evolution.birth_history||[]),...records].slice(-500);
  const evolution={...result.evolution,pending_births:pending,birth_history:history,last_births:result.births,updated_at:at};
  const nextState={...current,evolution};
  return{state:nextState,births:records,render_queue:buildBirthRenderQueue({pending_births:records}),idempotent:false};
}
