import crypto from 'node:crypto';

const API=process.env.ENTITY_TEST_URL||'http://127.0.0.1:4401/api/entity';
const TIMEOUT=Number(process.env.ENTITY_TEST_TIMEOUT||45000);
const anecdotes=[
  'Ce matin j’ai pris la mauvaise sortie sur l’autoroute et j’ai perdu vingt minutes.',
  'Hier mon voisin m’a rendu un tournevis que je lui avais prêté il y a presque un an. J’avais complètement oublié.',
  'À midi j’ai renversé mon verre d’eau juste après que le serveur l’avait posé. Tout le monde à table s’est foutu de moi.'
];
async function turn(message,i){const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),TIMEOUT);try{const r=await fetch(API,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({entityId:`anecdote_probe_${Date.now()}_${i}_${crypto.randomBytes(3).toString('hex')}`,message,requestId:`req_${crypto.randomUUID().replaceAll('-','')}`}),signal:ctl.signal});const text=await r.text();let data;try{data=JSON.parse(text)}catch{throw Error(`HTTP ${r.status}: ${text.slice(0,300)}`)}if(!r.ok)throw Error(`HTTP ${r.status}: ${data.error||text}`);return data.message}finally{clearTimeout(timer)}}
console.log('ENTITY ANECDOTES — 3 appels exactement');
for(let i=0;i<anecdotes.length;i++){const user=anecdotes[i];try{const entity=await turn(user,i);console.log(`\n### Anecdote ${i+1}\nPersonne: ${user}\nEntity: ${entity}`)}catch(e){console.log(`\n### Anecdote ${i+1}\nERREUR: ${e.message}`)}}
