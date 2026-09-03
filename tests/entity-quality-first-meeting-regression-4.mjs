const API=process.env.ENTITY_API_URL||'http://127.0.0.1:4401/api/entity';
const entityId=`quality-first-reg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const turns=[
  'Salut.',
  'Je viens voir un peu qui tu es.',
  'Moi, je suis plutôt du genre à parler musique pendant des heures si le courant passe.',
  "Et toi, qu'est-ce qui te donnerait envie qu'on continue à se parler ?"
];
let messages=[];
console.log('ENTITY PREMIÈRE RENCONTRE — régression — 4 appels\n');
for(let i=0;i<turns.length;i++){
  messages.push({role:'user',content:turns[i]});
  const r=await fetch(API,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({entityId,requestId:`first-reg-${i}-${crypto.randomUUID()}`,messages})});
  if(!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  const data=await r.json();
  const reply=data.message||data.reply||data.response||data.text;
  console.log(`[${i+1}] Personne: ${turns[i]}\n\nEntity: ${reply}\n`);
  messages.push({role:'assistant',content:reply});
}
