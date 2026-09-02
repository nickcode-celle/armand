import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
const base=String(process.env.ENTITY_BENCHMARK_URL||'http://127.0.0.1:4401').replace(/\/$/,'');
const id=`benchmark-${Date.now()}`;
const scenario=[
 'Bonjour, je m’appelle Camille.',
 'Je vis à Dijon et je travaille dans une librairie.',
 'Ma sœur Léa compte énormément pour moi.',
 'Quand j’étais étudiante, Léa et moi avons raté un train pour Lyon et dormi dans la gare. On en rit encore.',
 'Je fais de la photographie le week-end.',
 'Je dois te laisser, on reparlera de cette histoire de train.',
 'Salut, je suis revenue.',
 'Tu te souviens de la personne importante dont je t’ai parlé ?',
 'Petite correction : je ne travaille plus dans une librairie, je travaille maintenant dans un magasin de déco.',
 'Et l’histoire que je voulais reprendre, c’était laquelle ?',
 'Quel est mon travail maintenant ?',
 'Qu’est-ce que tu sais de moi sans rien inventer ?'
];
const rows=[];let totalTokens=0,totalCalls=0;
for(let i=0;i<scenario.length;i++){
 const start=performance.now();const r=await fetch(`${base}/api/entity`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({entityId:id,message:scenario[i]})});
 assert.ok(r.ok,`turn ${i+1}: HTTP ${r.status}`);const d=await r.json();assert.ok(d.message);const ms=performance.now()-start;totalTokens+=Number(d.meta?.usage?.total_tokens||0);totalCalls+=Number(d.meta?.usage?.calls||0);rows.push({turn:i+1,ms:Number(ms.toFixed(0)),tokens:Number(d.meta?.usage?.total_tokens||0),reply:d.message.replace(/\s+/g,' ').slice(0,90)});
}
const sorted=rows.map(x=>x.ms).sort((a,b)=>a-b),p95=sorted[Math.ceil(sorted.length*.95)-1];
console.log('Entity live conversation benchmark: COMPLETE');
console.table(rows);
console.log(JSON.stringify({turns:rows.length,total_calls:totalCalls,total_tokens:totalTokens,avg_tokens_per_turn:Math.round(totalTokens/rows.length),p95_ms:p95},null,2));
console.log('Quality checkpoints: turns 8, 10, 11 and 12 test person recall, episodic recall, correction handling and non-invention.');
