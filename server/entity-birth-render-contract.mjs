export const BIRTH_GOLD=Object.freeze({color:'#FFC928',metalness:0.92,roughness:0.20,envMapIntensity:1.55,pmremSigma:0.04});
export const BIRTH_POSITION=Object.freeze([-142,0,0]);
export const BIRTH_ENVELOPES=Object.freeze({core:'#FFF4B0',corona:'#FFC13B',halo:'#FF7A18'});
export const BIRTH_TIMING=Object.freeze({prelude_ms:10000,rise_ms:1800,burst_end_ms:3850,dissipation_ms:2400,gold_hold_ms:3000,integration_ms:2600});

const recordId=x=>String(x?.birth_id??x?.marble_id??x?.id??'');

/** Commande pure pour E. Une naissance = une vraie bille et une séquence complète. */
export function buildBirthRenderCommand(birth){
  if(!birth||typeof birth!=='object')throw new Error('Naissance graphique manquante');
  const marble=birth.marble??birth;
  const marbleId=String(marble?.id??birth?.marble_id??'').trim();
  const bodyCount=Number(birth.body_count_after);
  if(!marbleId)throw new Error('ID de bille née manquant');
  if(!Number.isInteger(bodyCount)||bodyCount<201)throw new Error(`Population après naissance invalide: ${birth.body_count_after}`);
  return{
    birth_id:String(birth.birth_id??marbleId),
    marble_id:marbleId,
    marble:structuredClone(marble),
    body_count_after:bodyCount,
    start_position:[...BIRTH_POSITION],
    envelopes:{...BIRTH_ENVELOPES},
    gold_material:{...BIRTH_GOLD},
    timing:{...BIRTH_TIMING},
    real_three_mesh:true,
    same_mesh_integrates:true,
    serial:true,
    engine:'EMAEA_NORMAL'
  };
}

export function buildBirthRenderQueue(evolution={}){
  return (Array.isArray(evolution?.pending_births)?evolution.pending_births:[]).map(buildBirthRenderCommand);
}

/** Une naissance n'est considérée montrée qu'après intégration graphique confirmée par E. */
export function acknowledgeBirth(evolution={},birthId,{at=new Date().toISOString()}={}){
  const state=structuredClone(evolution||{}),id=String(birthId||'').trim();
  if(!id)return state;
  const pending=Array.isArray(state.pending_births)?state.pending_births:[];
  const found=pending.find(x=>recordId(x)===id);
  if(!found)return state;
  state.pending_births=pending.filter(x=>recordId(x)!==id);
  const history=Array.isArray(state.birth_history)?state.birth_history:[];
  let matched=false;
  state.birth_history=history.map(item=>{
    if(recordId(item)!==id)return item;
    matched=true;
    return{...item,status:'shown',shown_at:at};
  });
  if(!matched)state.birth_history=[...state.birth_history,{...found,status:'shown',shown_at:at}].slice(-500);
  state.updated_at=at;
  return state;
}
