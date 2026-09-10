const API=process.env.ENTITY_API_URL||'http://127.0.0.1:4401/api/entity';
const entityId=`quality-stories-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const turns=[
  "Il m'est arrivé un truc assez drôle hier avec mon frère.",
  "On s'est retrouvés coincés dehors parce qu'aucun de nous n'avait pris les clés.",
  "On a attendu presque une heure sur le palier en se rejetant la faute.",
  "Bref, rien de grave, mais ça m'a fait rire après coup."
];
let messages=[];
console.log('ENTITY HISTOIRES / INITIATIVE — 4 appels\n');
for(let i=0;i<turns.length;i++){
  messages.push({role:'user',content:turns[i]});
  const r=await fetch(API,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({entityId,requestId:`stories-${i}-${crypto.randomUUID()}`,messages})});
  if(!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  const data=await r.json();
  const reply=data.message||data.reply||data.response||data.text;
  console.log(`[${i+1}] Personne: ${turns[i]}\n\nEntity: ${reply}\n`);
  messages.push({role:'assistant',content:reply});
}
