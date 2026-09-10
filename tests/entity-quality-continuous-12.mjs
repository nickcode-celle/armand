import crypto from 'node:crypto';
import fs from 'node:fs';

const API=process.env.ENTITY_TEST_URL||'http://127.0.0.1:4401/api/entity';
const TIMEOUT=Number(process.env.ENTITY_TEST_TIMEOUT||45000);
const OUT=process.env.ENTITY_CONTINUOUS_REPORT||'/tmp/entity-continuous-12.json';
const turns=[
  'Journée assez tranquille aujourd’hui. J’ai surtout bossé ce matin.',
  'Je vends des meubles, donc il y a des jours où les clients sont plus intéressants que les meubles.',
  'Ce matin justement un type a passé vingt minutes à hésiter entre deux chaises quasiment identiques.',
  'Ça m’a surtout fait marrer. À la fin il a pris les deux.',
  'Moi je suis plutôt du genre à choisir vite. Trop réfléchir à ce genre de trucs m’agace.',
  'Par contre pour la musique c’est l’inverse. Je peux passer une heure sur un son de basse.',
  'Je joue dans un petit groupe avec deux amis. On fait surtout du rock.',
  'Le guitariste veut toujours rajouter des trucs. Moi j’aime bien quand ça reste assez brut.',
  'On n’est pas toujours d’accord là-dessus, mais ça fait partie du jeu.',
  'Tiens, ça me rappelle un concert qu’on avait fait dans un bar minuscule. On était quasiment collés au public.',
  'À un moment quelqu’un a posé sa bière juste à côté de ma pédale. J’ai cru qu’elle allait finir dedans.',
  'Bref, elle a survécu. Et toi, dans tout ce que je viens de raconter, qu’est-ce qui t’a le plus accroché ?'
];
async function send(entityId,message){const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),TIMEOUT);try{const r=await fetch(API,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({entityId,message,requestId:`req_${crypto.randomUUID().replaceAll('-','')}`}),signal:ctl.signal});const text=await r.text();let data;try{data=JSON.parse(text)}catch{throw Error(`HTTP ${r.status}: ${text.slice(0,300)}`)}if(!r.ok)throw Error(`HTTP ${r.status}: ${data.error||text}`);return data.message}finally{clearTimeout(timer)}}
let state={run_id:`continuous_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,transcript:[]};
if(fs.existsSync(OUT))try{const old=JSON.parse(fs.readFileSync(OUT,'utf8'));if(old?.run_id&&Array.isArray(old.transcript))state=old}catch{}
const save=()=>fs.writeFileSync(OUT,JSON.stringify(state,null,2));
console.log(`ENTITY CONVERSATION CONTINUE — 12 échanges max — rapport ${OUT}`);
for(let i=state.transcript.length;i<turns.length;i++){const user=turns[i];process.stdout.write(`Tour ${i+1}/12... `);try{const entity=await send(state.run_id,user);state.transcript.push({turn:i+1,user,entity});save();console.log('OK')}catch(e){console.log(`ARRÊT: ${e.message}`);break}}
console.log('\n========== CONVERSATION ==========');
for(const x of state.transcript)console.log(`\n[${x.turn}] Personne: ${x.user}\nEntity: ${x.entity}`);
console.log(`\n========== RÉSUMÉ ==========\n${state.transcript.length}/12 échanges terminés.`);
