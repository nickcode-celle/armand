import {createEntityAI} from './entity-ai.mjs';
import {defaultState} from './entity-engine.mjs';
import {normalizeObserverOutput} from './entity-observer-contract.mjs';
const clean=s=>String(s||'').replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();
const OBSERVER_PROMPT=`Tu es A — Observer d’EMÆÄ. Tu analyses uniquement ce qui vient réellement de se passer dans l’échange. Tu n’influences jamais la réponse d’EMÆÄ et tu n’écris jamais dans son prompt.

ÉVOLUTION DURABLE
- Retourne 0 à 2 évolutions durables maximum.
- Une répétition d’un élément déjà établi vaut 0.
- Le temps seul ne crée aucune évolution.
- Préfère aucune évolution à une évolution inventée.
- Les niveaux autorisés sont +1, +2, +3 ou -1.
- Domaines possibles : Personnalité, Relation, Goûts, Opinions/Valeurs, Connaissances, Capacités, Monde propre.
- Capacités est globale : sous_domaine=null. Les autres domaines exigent un sous_domaine.

HISTOIRE VÉCUE
- Retourne null sauf événement réellement digne d’être conservé.
- Niveau 0 Anecdotique, 1 Mémorable, 2 Marquant, 3 Fondateur.

SENTIMENTS
- Sentiments autorisés : Joie, Tristesse, Colère, Peur, Surprise, Fierté, Tendresse, Confiance, Amour.
- Aucun changement est parfaitement valide : [] dans ce cas.
- Maximum 3 changements.
- operation : NAITRE, RENFORCER, MAINTENIR, AFFAIBLIR, DISPARAITRE.
- intensités : faible, modéré, fort. Pour DISPARAITRE, intensite_apres=null.
- Ne crée jamais un sentiment par simple classement de mots.

JSON STRICT UNIQUEMENT :
{"evolutions_durables":[],"histoire":null,"sentiments":[]}`;
export function createEntityObserver({storage,runtime,aiFactory=createEntityAI}){return async function observeAfterReply({entityId,userMessage,assistantMessage}){const key=process.env.OPENAI_API_KEY;if(!key)return null;const snapshot=await runtime.load(entityId,defaultState(),{withMemory:true});const ai=aiFactory(key);const conversation=`Personne: ${String(userMessage||'')}\nEMÆÄ: ${String(assistantMessage||'')}`;const prompt=`${OBSERVER_PROMPT}\n\nÉTAT DURABLE ACTUEL:\n${JSON.stringify(snapshot?.state??{},null,2)}\n\nMÉMOIRE DISPONIBLE:\n${JSON.stringify(snapshot?.memory??null,null,2)}\n\nÉCHANGE ÉMIS:\n${conversation}`;let lastError=null;for(let attempt=0;attempt<2;attempt++){try{const raw=await ai.response(prompt+(attempt?'\n\nCorrection: retourne uniquement un JSON strict conforme au contrat.':''),1000,.1);const output=normalizeObserverOutput(JSON.parse(clean(raw)));const record={at:new Date().toISOString(),revision:Number(snapshot?.committed_revision??snapshot?.state?.revision??0),conversation,output};await storage.mutate(entityId,'observer-events',[],events=>[...(Array.isArray(events)?events:[]),record].slice(-200));await storage.put(entityId,'observer-last',record);return record}catch(error){lastError=error}}throw lastError||new Error('Observer invalide')}}
