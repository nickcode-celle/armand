import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {createEntityStorage} from '../server/entity-storage.mjs';import {createRecallEngine} from '../server/entity-recall.mjs';import {createRecallOrchestrator} from '../server/entity-recall-orchestrator.mjs';
delete process.env.ENTITY_RECALL_URL;
const dims=96,vec=text=>{const v=Array(dims).fill(0),words=String(text).toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'').match(/[a-z0-9]+/g)||[];for(const w of words){let h=2166136261;for(const c of w)h=Math.imul(h^c.charCodeAt(0),16777619);v[(h>>>0)%dims]+=1}const n=Math.sqrt(v.reduce((s,x)=>s+x*x,0))||1;return v.map(x=>x/n)};
const ai={embedding:async text=>vec(text)};
const root=fs.mkdtempSync(path.join(os.tmpdir(),'entity-behavior-'));try{
 const storage=createEntityStorage({root}),recall=createRecallEngine(),orchestrate=createRecallOrchestrator({storage,recall,legacyCache:()=>null,legacyIndex:()=>null});
 const noise=Array.from({length:1000},(_,i)=>({id:`n${i}`,sujet:'personne',propriete:'detail',valeur:`souvenir banal numéro ${i}`,importance:.2,accessibilite:.5}));
 const memory={
  faits:[...noise,{id:'f-city',sujet:'Camille',propriete:'ville',valeur:'Dijon',importance:.8,structurel:true},{id:'f-work-old',sujet:'Camille',propriete:'travail',valeur:'librairie',statut:'ancien',importance:.6},{id:'f-work',sujet:'Camille',propriete:'travail',valeur:'magasin de décoration',statut:'actif',importance:.85,structurel:true}],
  histoires:[{id:'h-train',titre_interne:'train raté avec Léa',resume:'Camille et sa sœur Léa ont raté un train pour Lyon et dormi dans la gare.',personnes:['lea'],lieux:['lyon'],importance:.9,accessibilite:.9}],
  graphe:{noeuds:[{id:'lea',type:'personne',nom:'Léa',importance:.95},{id:'lyon',type:'lieu',nom:'Lyon',importance:.6},{id:'h-train',type:'histoire',nom:'train raté',importance:.9}],liens:[{source:'lea',relation:'participe_a',cible:'h-train'},{source:'h-train',relation:'lieu',cible:'lyon'}]},
  engagements:{fils_ouverts:[{id:'e-train',description:'reprendre plus tard l’histoire du train avec Léa',liens:['h-train'],importance:.9,statut:'ouvert'}]},
  entity_core:{temperament:{curiosite:{valeur:52}}}
 };
 const state={working_memory:[]},rel=await orchestrate('camille',memory,'Peux-tu reprendre l’histoire du train avec Léa à Lyon ?',ai,state);
 assert.ok(rel.some(x=>x.type==='histoires'&&x.item.id==='h-train'),'episodic story must be recalled');assert.ok(rel.some(x=>x.type==='engagements'),'open thread must be recalled');assert.ok(rel.some(x=>JSON.stringify(x.item).includes('Léa')||JSON.stringify(x.item).includes('lea')),'graph/person relation must expand');
 const work=await orchestrate('camille',memory,'Quel est le travail actuel de Camille dans la décoration ?',ai,state);assert.ok(work.some(x=>x.type==='faits'&&x.item.valeur==='magasin de décoration'),'corrected current fact must be recallable');
 const camilleBefore=structuredClone(await storage.get('camille','embedding-cache',{}));const other={faits:[{id:'secret',sujet:'Autre',propriete:'ville',valeur:'Bordeaux',importance:1,structurel:true}]};await orchestrate('other-entity',other,'Bordeaux',ai,state);const camilleAfter=await storage.get('camille','embedding-cache',{}),otherCache=await storage.get('other-entity','embedding-cache',{});assert.deepEqual(camilleAfter,camilleBefore,'another Entity must not mutate this Entity cache');assert.notDeepEqual(otherCache,camilleAfter,'different Entity caches must remain physically separate');
 console.log('Entity structured memory/graph/correction/isolation tests: OK');
}finally{fs.rmSync(root,{recursive:true,force:true})}
