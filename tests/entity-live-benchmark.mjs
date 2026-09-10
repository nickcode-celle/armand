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
const checks=new Map([[8,/léa/i],[10,/train|gare|lyon/i],[11,/déco|decoration|décoration/i]]);
const rows=[];let totalTokens=0,totalCalls=0,qualityHits=0;
for(let i=0;i<scenario.length;i++){
 const start=performance.now();const r=await fetch(`${base}/api/entity`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({entityId:id,message:scenario[i]})});
 assert.ok(r.ok,`turn ${i+1}: HTTP ${r.status}`);const d=await r.json();assert.ok(d.message);const ms=performance.now()-start;totalTokens+=Number(d.meta?.usage?.total_tokens||0);totalCalls+=Number(d.meta?.usage?.calls||0);const expected=checks.get(i+1),quality_ok=expected?expected.test(d.message):null;if(quality_ok)qualityHits++;rows.push({turn:i+1,ms:Number(ms.toFixed(0)),tokens:Number(d.meta?.usage?.total_tokens||0),quality_ok,reply:d.message.replace(/\s+/g,' ').slice(0,110)});
}
for(const [turn,re] of checks)assert.match(rows[turn-1].reply,re,`quality regression turn ${turn}`);
const final=rows[11].reply;assert.ok(!/marseille|médecin|deux enfants|mariée|divorcée/i.test(final),'non-invention regression');
const sorted=rows.map(x=>x.ms).sort((a,b)=>a-b),p95=sorted[Math.ceil(sorted.length*.95)-1],score=qualityHits/checks.size;
assert.equal(score,1,'critical memory quality score must be 100%');
console.log('Entity live conversation benchmark: PASS');console.table(rows);console.log(JSON.stringify({turns:rows.length,total_calls:totalCalls,total_tokens:totalTokens,avg_tokens_per_turn:Math.round(totalTokens/rows.length),p95_ms:p95,critical_quality_score:score},null,2));
