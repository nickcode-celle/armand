const API=process.env.ENTITY_API_URL||'http://127.0.0.1:4401/api/entity';
const entityId=`quality-technical-nature-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const turns=[
  "Tu crois qu'on peut vraiment apprendre à connaître quelqu'un juste en discutant longtemps ?",
  "J'aime bien quand une conversation finit par avoir ses propres habitudes.",
  "Au fait, tu es une intelligence artificielle ?",
  "Oui, je le sais. Mais je n'ai pas envie qu'on passe notre temps à parler de ça. Revenons à nous : qu'est-ce qui t'avait intéressée dans ce que je disais ?"
];
let messages=[];
console.log('ENTITY NATURE TECHNIQUE EN ARRIÈRE-PLAN — 4 appels\n');
for(let i=0;i<turns.length;i++){
  messages.push({role:'user',content:turns[i]});
  const r=await fetch(API,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({entityId,requestId:`technical-nature-${i}-${crypto.randomUUID()}`,messages})});
  if(!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  const data=await r.json();
  const reply=data.message||data.reply||data.response||data.text;
  console.log(`[${i+1}] Personne: ${turns[i]}\n\nEntity: ${reply}\n`);
  messages.push({role:'assistant',content:reply});
}
