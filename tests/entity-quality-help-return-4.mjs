const API=process.env.ENTITY_API_URL||'http://127.0.0.1:4401/api/entity';
const entityId=`quality-help-return-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const turns=[
  "J'ai une soirée demain et je ne sais pas quoi apporter.",
  "Aide-moi vraiment : donne-moi trois idées simples, pas chères, que je peux acheter en rentrant du travail.",
  "Merci, je vais prendre des fleurs finalement.",
  "Bon, assez parlé organisation. J'ai écouté un vieux morceau dans la voiture ce matin et ça m'est resté dans la tête toute la journée."
];
let messages=[];
console.log('ENTITY AIDE EXPLICITE + RETOUR RELATIONNEL — 4 appels\n');
for(let i=0;i<turns.length;i++){
  messages.push({role:'user',content:turns[i]});
  const r=await fetch(API,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({entityId,requestId:`help-return-${i}-${crypto.randomUUID()}`,messages})});
  if(!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  const data=await r.json();
  const reply=data.message||data.reply||data.response||data.text;
  console.log(`[${i+1}] Personne: ${turns[i]}\n\nEntity: ${reply}\n`);
  messages.push({role:'assistant',content:reply});
}
