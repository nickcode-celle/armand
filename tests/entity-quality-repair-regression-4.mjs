const API=process.env.ENTITY_API_URL||'http://127.0.0.1:4401/api/entity';
const entityId=`entity-repair-reg-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
const messages=[
  "J'ai refusé une sortie avec Thomas ce soir. J'étais soulagé.",
  "Non, ce n'est pas Thomas le problème. J'aime beaucoup le voir. J'étais juste vidé et je ne voulais voir personne.",
  "Il l'a bien pris, on se voit samedi.",
  "Donc tu comprends quoi maintenant ?"
];
const conv=[];
console.log('ENTITY RÉPARATION — régression ciblée — 4 appels\n');
for(let i=0;i<messages.length;i++){
  const text=messages[i];
  conv.push({role:'user',content:text});
  const res=await fetch(API,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({entityId,requestId:`repair-reg-${Date.now()}-${i}-${Math.random().toString(36).slice(2,8)}`,messages:conv})});
  const raw=await res.text();
  if(!res.ok){console.error(`HTTP ${res.status}: ${raw}`);process.exit(1)}
  const data=JSON.parse(raw);
  const reply=data.message||data.reply||data.response||data.text||'';
  console.log(`[${i+1}] Personne: ${text}\n\nEntity: ${reply}\n`);
  conv.push({role:'assistant',content:reply});
}
