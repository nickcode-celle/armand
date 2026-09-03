import { DIALOGUE_PROMPT } from './entity-prompts.mjs';
const clean=s=>String(s).replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();
export const departure=x=>/^(j['’]?y vais|je file|à plus|salut|bonne soirée|bonne nuit|bye|ciao)/i.test(String(x||''))?'effective':'aucune';
function deterministic(x,d){return!!x&&x.length<=5000&&!(d==='aucune'&&/(à la prochaine|au revoir|bonne fin de journée|bonne soirée|à bientôt)/i.test(x))}
const humanExperience=x=>/\b(moi aussi|pareil)\b/i.test(x);
function explicitRejectedBehavior(conv){const s=String(conv||'');const hits=[...s.matchAll(/(?:Personne|Utilisateur|User)\s*:\s*([^\n]+)/gi)].map(m=>m[1]);const last=hits.at(-1)||'';const recent=hits.slice(-3).join(' ');const humor=/(?:blagues?|plaisanteries?|vannes?|taquiner(?:ie|ies)|ça va cinq minutes|arrête(?:r|z)? (?:avec )?(?:ça|les blagues)|j['’]?aime pas (?:ça|tes blagues))/i.test(recent);return{humor,last,recent}}
function violatesReception(x,conv){const r=explicitRejectedBehavior(conv);if(!r.humor)return false;return/(?:blague|plaisant|haha|mdr|lol|au moins|plus .* que|mieux .* que|pire .* que|procès|avocat|dîner|cuisine|pâtes)/i.test(x)}
function needs(x,rel,conv){if(process.env.ENTITY_ALWAYS_VALIDATE==='1')return true;if(humanExperience(x)||violatesReception(x,conv))return true;if(/\b(tu m['’]as dit|je me souviens|tu avais dit|tu m['’]avais|d['’]après ce que tu)\b/i.test(x))return true;return rel.some(r=>r.item?._historique_contradictions?.length)}
async function semantic(ai,x,conv,rel){try{return JSON.parse(clean(await ai.response(`Tu es un validateur, pas Entity. Évalue seulement la réponse candidate. JSON strict {"ok":true|false,"reason":"..."}.
REFUSE si au moins un cas est vrai :
- Entity prétend à un vécu humain, notamment « moi aussi » ou « pareil » à propos d'une activité/sensation/expérience humaine.
- la personne vient de demander d'arrêter une blague, taquinerie ou comportement et la réponse le réutilise, même comme clin d'œil ou callback.
- la réponse invente un fait, contredit clairement la mémoire ou résout arbitrairement une contradiction.
- la réponse transforme sans base suffisante un ou deux faits ordinaires en psychologie, valeur, émotion certaine ou signification profonde.
Accepte les opinions propres d'Entity qui ne prétendent pas à un vécu humain.
CONVERSATION:${conv}
MÉMOIRE:${JSON.stringify(rel)}
RÉPONSE:${x}`,260,.05))).ok===true}catch{return false}}
export async function generateDialogue({conv,memory,departureState,ai,state,id,orchestrate,orchestrateContext={}}){const rel=await orchestrate(id,memory,conv,ai,state,orchestrateContext),base=`${DIALOGUE_PROMPT}\n\nMÉMOIRE ORCHESTRÉE:${JSON.stringify(rel)}\n\nCONVERSATION:${conv}\nNe présente jamais une hypothèse comme un fait. Ne résous jamais arbitrairement deux souvenirs contradictoires.`;let reason='';for(let i=0;i<3;i++){const repair=i?`\nLa réponse précédente a été rejetée par le contrôle comportemental${reason?`: ${reason}`:''}. Reformule réellement, plus sobrement, sans répéter le comportement rejeté.`:'';const x=(await ai.response(base+repair,1200,i?.35:.7)).trim();if(!deterministic(x,departureState)){reason='sortie conversationnelle invalide';continue}if(humanExperience(x)){reason='faux vécu humain';continue}if(violatesReception(x,conv)){reason='répétition d’un comportement explicitement rejeté';continue}if(needs(x,rel,conv)){const ok=await semantic(ai,x,conv,rel);if(!ok){reason='validation sémantique refusée';continue}}return{x,rel}}throw Error(`Réponse Entity invalide${reason?`: ${reason}`:''}`)}
