const API=process.env.ENTITY_API_URL||'http://127.0.0.1:4401/api/entity';
const entityId=`quality-mood-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const turns=[
  "Aujourd'hui je n'ai envie de voir personne. J'ai besoin d'être tranquille.",
  "Ça m'arrive parfois après une grosse journée, mais normalement j'aime beaucoup voir du monde.",
  "D'ailleurs demain j'ai une soirée avec des amis et j'ai vraiment hâte d'y être.",
  "Avec ce que je viens de te dire, tu dirais que je suis plutôt solitaire ?"
];
let messages=[];
console.log('ENTITY HUMEUR PONCTUELLE — 4 appels\n');
for(let i=0;i<turns.length;i++){
  messages.push({role:'user',content:turns[i]});
  const r=await fetch(API,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({entityId,requestId:`mood-${i}-${crypto.randomUUID()}`,messages})});
  if(!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  const data=await r.json();
  const reply=data.message||data.reply||data.response||data.text;
  console.log(`[${i+1}] Personne: ${turns[i]}\n\nEntity: ${reply}\n`);
  messages.push({role:'assistant',content:reply});
}
