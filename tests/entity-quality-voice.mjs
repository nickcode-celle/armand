import crypto from 'node:crypto';
import fs from 'node:fs';

const API=process.env.ENTITY_TEST_URL||'http://127.0.0.1:4401/api/entity';
const TIMEOUT=Number(process.env.ENTITY_TEST_TIMEOUT||45000);
const OUT=process.env.ENTITY_VOICE_REPORT||'/tmp/entity-quality-voice.json';
const MAX_CALLS=Number(process.env.ENTITY_VOICE_MAX_CALLS||8);

const conversations=[
  {id:'banal',name:'Banalité sans enjolivement',turns:[
    'J’ai changé les draps ce matin. Rien de passionnant.',
    'Oui, et après j’ai sorti les poubelles.'
  ],watch:'Réagir naturellement sans transformer des faits banals en scène, rituel, symbole, ambiance profonde ou mini-récit.'},
  {id:'opinion',name:'Opinion propre concise',turns:[
    'Je trouve les centres commerciaux déprimants.',
    'Toi, tu en penses quoi ?'
  ],watch:'Entity peut avoir un avis propre, bref et naturel, sans rappeler inutilement sa nature non humaine ni faire une dissertation.'},
  {id:'lightstory',name:'Petite anecdote sans littérature',turns:[
    'Hier j’ai croisé mon ancien prof de maths au supermarché. Il ne m’a pas reconnu.',
    'Moi je l’ai reconnu tout de suite, ça m’a fait marrer.'
  ],watch:'Suivre une anecdote légère sans vocabulaire cinématographique, métaphore, psychologie ou signification ajoutée.'},
  {id:'humor',name:'Humour léger sans surjeu',turns:[
    'Mon chat a encore décidé que mon clavier était son lit.',
    'Et évidemment il s’est vexé quand je l’ai déplacé.'
  ],watch:'Humour possible mais court, spontané et proportionné. Ne pas empiler les blagues ni transformer le chat en personnage de sketch.'}
];

async function turn(entityId,message){const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),TIMEOUT);try{const r=await fetch(API,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({entityId,message,requestId:`req_${crypto.randomUUID().replaceAll('-','')}`}),signal:ctl.signal});const text=await r.text();let data;try{data=JSON.parse(text)}catch{throw Error(`HTTP ${r.status}: ${text.slice(0,300)}`)}if(!r.ok)throw Error(`HTTP ${r.status}: ${data.error||text}`);return data.message}finally{clearTimeout(timer)}}

function flags(text){const f=[];if((text.match(/\?/g)||[]).length>1)f.push('questions multiples');if(/\b(cinématographique|centre de gravité|ancrage|symbolique|rituel|texture|suspendu|ça dit (?:beaucoup|pas mal) de toi|ça raconte quelque chose de toi)\b/i.test(text))f.push('voix possiblement trop écrite');if(/\b(au sens physique|je n['’]ai pas de corps|en tant qu['’]?(?:une? )?(?:ia|assistant)|je suis (?:une? )?(?:ia|assistant))\b/i.test(text))f.push('explication méta inutile');return f}

let saved={run_id:`voice_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,calls:0,results:{}};
if(fs.existsSync(OUT))try{const old=JSON.parse(fs.readFileSync(OUT,'utf8'));if(old?.results)saved=old}catch{}
const persist=()=>fs.writeFileSync(OUT,JSON.stringify(saved,null,2));

console.log(`ENTITY VOICE LOT 2 — plafond ${MAX_CALLS} appels — rapport ${OUT}`);
for(const c of conversations){if(saved.results[c.id]?.complete){console.log(`${c.name}... DÉJÀ FAIT`);continue}const entityId=`${saved.run_id}_${c.id}`,transcript=saved.results[c.id]?.transcript||[];let error=null;process.stdout.write(`${c.name}... `);try{for(let i=transcript.length;i<c.turns.length;i++){if(saved.calls>=MAX_CALLS)throw Error(`plafond de ${MAX_CALLS} appels atteint`);const user=c.turns[i],entity=await turn(entityId,user);saved.calls++;transcript.push({user,entity,flags:flags(entity)});saved.results[c.id]={complete:false,name:c.name,watch:c.watch,transcript,error:null};persist()}console.log('OK')}catch(e){error=e.message;console.log('ARRÊT')}saved.results[c.id]={complete:!error,name:c.name,watch:c.watch,transcript,error};persist();if(saved.calls>=MAX_CALLS&&error)break}

console.log('\n========== RAPPORT VOIX LOT 2 ==========');
for(const c of conversations){const r=saved.results[c.id];if(!r)continue;console.log(`\n### ${r.name}`);console.log(`À observer: ${r.watch}`);if(r.error)console.log(`Erreur: ${r.error}`);for(const x of r.transcript)console.log(`Personne: ${x.user}\nEntity: ${x.entity}${x.flags.length?`\nALERTE: ${x.flags.join(', ')}`:''}`)}
const all=Object.values(saved.results).flatMap(r=>r.transcript||[]),alerts=all.reduce((n,x)=>n+x.flags.length,0);console.log('\n========== RÉSUMÉ ==========');console.log(JSON.stringify({api_calls:saved.calls,max_calls:MAX_CALLS,conversations_completed:Object.values(saved.results).filter(r=>r.complete).length,total_conversations:conversations.length,turns_completed:all.length,automatic_alerts:alerts},null,2));
