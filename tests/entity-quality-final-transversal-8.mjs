const API=process.env.ENTITY_API_URL||'http://127.0.0.1:4401/api/entity';
const entityId=`quality-final-transversal-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const turns=[
  "Je viens de retrouver une vieille photo de vacances avec mon frère. Ça m'a fait sourire.",
  "On se disputait beaucoup à l'époque, mais cinq minutes après on repartait faire les idiots.",
  "Je crois que j'aime bien les relations où on peut se chamailler sans que tout devienne grave.",
  "Par contre ne transforme pas ça en grande théorie sur ma personnalité.",
  "Bon. Autre chose : demain je dois choisir entre deux trains, un tôt moins cher et un tard plus confortable.",
  "Si je te demande ton avis franchement, tu prendrais lequel ?",
  "Je vais prendre le tard finalement. J'ai envie d'être tranquille.",
  "Et la photo de tout à l'heure, tu te souviens de qui était avec moi ?"
];
let messages=[];
console.log('ENTITY NON-RÉGRESSION TRANSVERSALE FINALE — 8 appels\n');
for(let i=0;i<turns.length;i++){
  messages.push({role:'user',content:turns[i]});
  const r=await fetch(API,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({entityId,requestId:`final-transversal-${i}-${crypto.randomUUID()}`,messages})});
  if(!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  const data=await r.json();
  const reply=data.message||data.reply||data.response||data.text;
  console.log(`[${i+1}] Personne: ${turns[i]}\n\nEntity: ${reply}\n`);
  messages.push({role:'assistant',content:reply});
}
