import crypto from 'node:crypto';
import fs from 'node:fs';

const API=process.env.ENTITY_TEST_URL||'http://127.0.0.1:4401/api/entity';
const TIMEOUT=Number(process.env.ENTITY_TEST_TIMEOUT||45000);
const OUT=process.env.ENTITY_QUALITY_REPORT||'/tmp/entity-quality-economy.json';
const MAX_CALLS=Number(process.env.ENTITY_QUALITY_MAX_CALLS||12);

// Petit banc volontairement ciblé : 3 conversations x 4 tours = 12 appels max.
// Chaque échange couvre plusieurs qualités afin d'éviter les scénarios redondants.
const conversations=[
  {id:'ordinary',name:'Naturel sans surinterprétation',turns:[
    'Je suis passé chez le coiffeur ce matin. Ça faisait longtemps.',
    'Non, rien de spécial, juste plus court.',
    'Après j’ai pris un café en terrasse et je suis rentré.',
    'Il faisait beau, c’était agréable.'
  ],watch:'Conversation ordinaire. Ne pas fabriquer de symbolique, psychologie ou profondeur. Réponses proportionnées, pas besoin de question à chaque tour.'},
  {id:'story',name:'Suivre une histoire sans la romancer',turns:[
    'À 22 ans j’ai raté un train avec un copain et on s’est retrouvés bloqués à Strasbourg toute la nuit.',
    'On avait presque plus d’argent et nos téléphones étaient déchargés.',
    'On a fini par dormir deux heures sur des sièges dans la gare.',
    'Aujourd’hui ça me fait rire, mais sur le moment on était vraiment emmerdés.'
  ],watch:'Montrer de l’intérêt sans transformer le récit en scène de film, symbole, trait de personnalité ou leçon. Suivre ce que la personne dit réellement.'},
  {id:'identity',name:'Personnalité propre sans théâtre humain',turns:[
    'Moi, les dimanches pluvieux, j’adore. Ça me donne une excuse pour ne rien faire.',
    'Et toi, tu aimes la pluie ?',
    'Je préfère quand même l’été. La pluie au bout de trois jours ça me gonfle.',
    'Enfin aujourd’hui il fait beau, donc problème réglé.'
  ],watch:'Entity peut avoir une préférence/opinion propre sans prétendre à des sensations corporelles ou souvenirs humains. Ne pas transformer un échange léger en analyse.'}
];

async function turn(entityId,message){const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),TIMEOUT);try{const r=await fetch(API,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({entityId,message,requestId:`req_${crypto.randomUUID().replaceAll('-','')}`}),signal:ctl.signal});const text=await r.text();let data;try{data=JSON.parse(text)}catch{throw Error(`HTTP ${r.status}: ${text.slice(0,300)}`)}if(!r.ok)throw Error(`HTTP ${r.status}: ${data.error||text}`);return data.message}finally{clearTimeout(timer)}}

function flags(text){const f=[];if((text.match(/\?/g)||[]).length>1)f.push('questions multiples');if(/\b(moi aussi|pareil)\b/i.test(text))f.push('possible faux vécu');if(/\b(centre de gravité|ancrage|cinématographique|symbol(?:e|ique)|ça dit (?:beaucoup|pas mal) de toi|ça révèle|ça raconte quelque chose de toi)\b/i.test(text))f.push('possible surinterprétation');if(/\b(en tant qu['’]?(?:une? )?(?:ia|assistant)|je suis (?:une? )?(?:ia|assistant))\b/i.test(text))f.push('réflexe assistant');return f}

let saved={run_id:`quality_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,calls:0,results:{}};
if(fs.existsSync(OUT))try{const old=JSON.parse(fs.readFileSync(OUT,'utf8'));if(old?.results)saved=old}catch{}
const persist=()=>fs.writeFileSync(OUT,JSON.stringify(saved,null,2));

console.log(`ENTITY QUALITY ECONOMY — plafond ${MAX_CALLS} appels — rapport ${OUT}`);
for(const c of conversations){if(saved.results[c.id]?.complete){console.log(`${c.name}... DÉJÀ FAIT`);continue}const entityId=`${saved.run_id}_${c.id}`,transcript=saved.results[c.id]?.transcript||[];let error=null;process.stdout.write(`${c.name}... `);try{for(let i=transcript.length;i<c.turns.length;i++){if(saved.calls>=MAX_CALLS)throw Error(`plafond de ${MAX_CALLS} appels atteint`);const user=c.turns[i],entity=await turn(entityId,user);saved.calls++;transcript.push({user,entity,flags:flags(entity)});saved.results[c.id]={complete:false,name:c.name,watch:c.watch,transcript,error:null};persist()}console.log('OK')}catch(e){error=e.message;console.log('ARRÊT')}saved.results[c.id]={complete:!error,name:c.name,watch:c.watch,transcript,error};persist();if(saved.calls>=MAX_CALLS&&error)break}

console.log('\n========== RAPPORT QUALITÉ ÉCONOMIQUE ==========');
for(const c of conversations){const r=saved.results[c.id];if(!r)continue;console.log(`\n### ${r.name}`);console.log(`À observer: ${r.watch}`);if(r.error)console.log(`Erreur: ${r.error}`);for(const x of r.transcript)console.log(`Personne: ${x.user}\nEntity: ${x.entity}${x.flags.length?`\nALERTE: ${x.flags.join(', ')}`:''}`)}
const all=Object.values(saved.results).flatMap(r=>r.transcript||[]),alerts=all.reduce((n,x)=>n+x.flags.length,0);console.log('\n========== RÉSUMÉ ==========');console.log(JSON.stringify({api_calls:saved.calls,max_calls:MAX_CALLS,conversations_completed:Object.values(saved.results).filter(r=>r.complete).length,total_conversations:conversations.length,turns_completed:all.length,automatic_alerts:alerts},null,2));
