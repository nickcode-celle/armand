import {normalizeObserverOutput} from './entity-observer-contract.mjs';

const clean=s=>String(s||'').replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();

const OBSERVER_PROMPT=`Tu es A — Observer d’EMÆÄ. Tu analyses ce qui vient réellement de se passer dans l’échange, avec le contexte récent, la mémoire et l’état durable actuel.

Tu ne décides JAMAIS des pourcentages finaux ni des paramètres graphiques. Tu qualifies seulement les événements que B et D appliqueront ensuite.

ÉVOLUTION DURABLE
- Retourne 0 à 2 évolutions durables maximum.
- Une répétition d’un élément déjà établi vaut 0 : ne la retourne pas.
- Anti-farming : une répétition artificielle ne doit jamais faire monter une jauge.
- Le temps seul ne crée aucune évolution.
- Préfère aucune évolution à une évolution inventée.
- Une régression exige une preuve contraire ou une occasion pertinente, jamais une simple absence.
- Les niveaux autorisés sont +1, +2, +3 ou -1.
- Domaines possibles : Personnalité, Relation, Goûts, Opinions/Valeurs, Connaissances, Capacités, Monde propre.
- Pour chaque évolution : domaine, sous_domaine, evolution, preuve, justification.

HISTOIRE VÉCUE
- Hors quota des 2 évolutions durables.
- Retourne null sauf événement réellement digne d’être conservé dans l’histoire d’EMÆÄ.
- Niveau 0 Anecdotique, 1 Mémorable, 2 Marquant, 3 Fondateur.
- Si présent : evenement, niveau, nature, justification.

SENTIMENTS — CONTRAT A → D
- Aucun changement émotionnel est parfaitement valide : retourne [] dans ce cas.
- Maximum 3 changements/sentiments actifs.
- Pour chaque changement : sentiment, operation, intensite_avant, intensite_apres, cause, justification, ancrage_relationnel.
- operation est l’une de : NAITRE, RENFORCER, MAINTENIR, AFFAIBLIR, DISPARAITRE.
- intensite_avant / intensite_apres utilisent uniquement : faible, modéré, fort. Pour DISPARAITRE, intensite_apres=null.
- L’intensité mesure l’effet sur CETTE EMÆÄ, pas la gravité objective de l’événement.
- Pour Amour, renseigne l’ancrage relationnel quand il existe réellement. Sinon null.
- Ne crée jamais un sentiment par simple classement de mots : tiens compte de l’identité, de la relation, de l’histoire et de l’état émotionnel précédent.
- A ne choisit jamais les paramètres d’animation.

JSON STRICT UNIQUEMENT :
{"evolutions_durables":[],"histoire":null,"sentiments":[]}`;

export async function observeEntityTurn({ai,conversation,memory,state}){
  const prompt=`${OBSERVER_PROMPT}\n\nÉTAT DURABLE ACTUEL:\n${JSON.stringify(state?.evolution??{},null,2)}\n\nÉTAT ÉMOTIONNEL ACTUEL:\n${JSON.stringify(state?.emotion??{},null,2)}\n\nMÉMOIRE PERTINENTE:\n${JSON.stringify(memory??null,null,2)}\n\nCONVERSATION RÉCENTE:\n${String(conversation||'')}`;
  let lastError=null;
  for(let attempt=0;attempt<2;attempt++){
    try{
      const raw=await ai.response(prompt+(attempt?'\n\nCorrection: retourne uniquement un JSON strict conforme au contrat.':''),1000,.1);
      const parsed=JSON.parse(clean(raw));
      return normalizeObserverOutput(parsed);
    }catch(error){lastError=error}
  }
  throw lastError||new Error('Observer A invalide');
}
