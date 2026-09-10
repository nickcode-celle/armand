import crypto from 'node:crypto';
const API=process.env.ENTITY_TEST_URL||'http://127.0.0.1:4401/api/entity';
const turns=[
  "J'ai annulé un dîner avec Julie ce soir. Franchement, j'étais soulagé.",
  "Non, ce n'est pas Julie le problème. J'adore la voir. J'étais juste épuisé et je n'avais envie de voir personne.",
  "Elle l'a très bien pris. On se verra la semaine prochaine.",
  "Du coup, tu le comprends comment maintenant ?"
];
async function send(id,message){const r=await fetch(API,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({entityId:id,message,requestId:`req_${crypto.randomUUID().replaceAll('-','')}`})});const d=await r.json();if(!r.ok)throw Error(d.error||`HTTP ${r.status}`);return d.message}
const id=`repair_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
console.log('ENTITY RÉPARATION — 4 appels');
for(let i=0;i<turns.length;i++){try{const e=await send(id,turns[i]);console.log(`\n[${i+1}] Personne: ${turns[i]}\nEntity: ${e}`)}catch(err){console.log(`\nARRÊT: ${err.message}`);break}}
