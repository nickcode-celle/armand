import crypto from 'node:crypto';

const API=process.env.ENTITY_TEST_URL||'http://127.0.0.1:4401/api/entity';
const TIMEOUT=Number(process.env.ENTITY_TEST_TIMEOUT||45000);
const entityId=`continuity_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
const turns=[
  'Mon frère Marc passe demain. Il ramène toujours des pâtisseries, même quand je lui dis que ce n’est pas la peine.',
  'La dernière fois il avait pris une tarte au citron. C’est mon dessert préféré, donc je n’ai pas beaucoup protesté.',
  'On s’entend bien, même s’il parle beaucoup plus que moi.',
  'Bon, je te laisse. Je dois finir deux ou trois trucs.',
  'Salut. Nouvelle journée. Je viens de rentrer, j’ai passé l’après-midi à chercher une lampe pour le salon.',
  'J’en ai finalement trouvé une très simple, noire. Je déteste les objets qui essaient trop d’attirer l’attention.',
  'Ce soir je ne fais rien de spécial. Je vais probablement mettre un disque et rester tranquille.',
  'Ah, et j’ai quelque chose à manger avec. Devine ce que Marc a encore ramené.'
];
async function send(message){const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),TIMEOUT);try{const r=await fetch(API,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({entityId,message,requestId:`req_${crypto.randomUUID().replaceAll('-','')}`}),signal:ctl.signal});const text=await r.text();let data;try{data=JSON.parse(text)}catch{throw Error(`HTTP ${r.status}: ${text.slice(0,300)}`)}if(!r.ok)throw Error(`HTTP ${r.status}: ${data.error||text}`);return data.message}finally{clearTimeout(timer)}}
console.log('ENTITY CONTINUITÉ + MÉMOIRE — 8 appels exactement');
for(let i=0;i<turns.length;i++){const user=turns[i];try{const entity=await send(user);console.log(`\n[${i+1}] Personne: ${user}\nEntity: ${entity}`)}catch(e){console.log(`\n[${i+1}] ERREUR: ${e.message}`);break}}
