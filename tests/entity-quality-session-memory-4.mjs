const API=process.env.ENTITY_API_URL||'http://127.0.0.1:4401/api/entity';
const entityId=`quality-session-memory-${Date.now()}-${Math.random().toString(36).slice(2)}`;
async function talk(turn,i,messages){messages.push({role:'user',content:turn});const r=await fetch(API,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({entityId,requestId:`session-memory-${i}-${crypto.randomUUID()}`,messages})});if(!r.ok)throw new Error(`${r.status} ${await r.text()}`);const data=await r.json();const reply=data.message||data.reply||data.response||data.text;console.log(`[${i+1}] Personne: ${turn}\n\nEntity: ${reply}\n`);messages.push({role:'assistant',content:reply});}
console.log('ENTITY MÉMOIRE / NOUVELLE SESSION — 4 appels\n');
let messages=[];
await talk("Je dîne avec ma sœur Claire ce soir. Elle choisit toujours les restaurants et ça me fait rire.",0,messages);
await talk("Cette fois j'ai choisi moi-même un petit italien. Elle va sûrement commenter le choix.",1,messages);
console.log('--- NOUVELLE SESSION SIMULÉE ---\n');
messages=[];
await talk("Bon, le dîner d'hier était drôle.",2,messages);
await talk("Tu te souviens de qui avait choisi le restaurant cette fois ?",3,messages);
