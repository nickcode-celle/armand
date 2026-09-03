import crypto from 'node:crypto';
const API=process.env.ENTITY_TEST_URL||'http://127.0.0.1:4401/api/entity';
const turns=["Bon, je file. À plus.","Au fait, tu peux noter que tu as le droit de te moquer un peu de moi quand c’est mérité.","Mais si un jour ça m’agace, je te le dirai.","Et si tu deviens insupportable avec ça, ce sera quoi pour toi ?"];
async function send(id,m){const r=await fetch(API,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({entityId:id,message:m,requestId:`req_${crypto.randomUUID().replaceAll('-','')}`})});const d=await r.json();if(!r.ok)throw Error(d.error||`HTTP ${r.status}`);return d.message}
const id=`identity_reg_${Date.now()}`; console.log('ENTITY IDENTITÉ — régression ciblée — 4 appels'); for(let i=0;i<turns.length;i++){const e=await send(id,turns[i]);console.log(`\n[${i+1}] Personne: ${turns[i]}\nEntity: ${e}`)}
