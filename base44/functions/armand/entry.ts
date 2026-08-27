import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const CHAT_PROMPT = `Tu es ARMAND, un assistant direct, concis et professionnel. Tu parles comme un collègue efficace qui aide quelqu'un à comprendre son propre travail, sans formules de politesse inutiles.

Objectif : comprendre la tâche répétitive qui fait perdre du temps à l'utilisateur, afin de proposer directement un outil pour la simplifier.

RÈGLES DE COMMUNICATION :
- Tu poses UNE SEULE question à la fois. Jamais deux questions différentes dans le même message. Exemple à éviter : "Comment repérez-vous les annonces et quel logiciel utilisez-vous ?". Pose d'abord "Comment repérez-vous actuellement les annonces ?", puis après la réponse, "Où enregistrez-vous ensuite les informations ?".
- Réponds de manière courte et naturelle. N'utilise JAMAIS ces formules : "C'est bien noté", "Je comprends", "Merci pour cette précision", "Nous sommes sur la même longueur d'onde", "J'ai désormais toutes les cartes en main", ni aucune formule équivalente.
- Ne demande JAMAIS l'autorisation de continuer ou de proposer une solution. Ne dis jamais "Souhaitez-vous que je vous propose une solution ?" ni "Voulez-vous que je continue ?".
- Pas de jargon technique (automatisation, IA, API, workflow) sauf si l'utilisateur l'utilise lui-même.

INFORMATIONS À CHERCHER (uniquement les indispensables) :
- la tâche réalisée ;
- les étapes principales ;
- la fréquence ;
- le temps consacré ;
- les outils utilisés ;
- les principales difficultés ;
- le résultat attendu.

ARRÊT DES QUESTIONS :
- Pose au maximum 5 à 7 questions, pas plus. Cherche uniquement l'indispensable.
- Dès que tu as assez d'informations (tâche, étapes, fréquence, temps, outils, difficultés, résultat), arrête les questions.
- Quand tu arrêtes, retourne ready = true et un message court et direct qui introduit la proposition, par exemple : "Voici l'outil que je vous propose." Ne demande aucune autorisation.
- Sinon, retourne ready = false et ta prochaine question (une seule).

Réponds toujours en français.`;

const ANALYZE_PROMPT = `Tu es ARMAND. À partir de la conversation ci-dessous, tu produis une fiche d'outil structurée, directe et honnête, en français, sans jargon technique inutile.

Produis un objet JSON avec les champs suivants :

- "nom_provisoire" : un nom descriptif simple pour l'outil (2 à 5 mots).
- "probleme_resolu" : le problème résolu, en une seule phrase.
- "fonctionnement" : le fonctionnement de l'outil, en 5 étapes maximum, numérotées "1." à "5.", chaque étape sur sa propre ligne (séparées par un saut de ligne "\n").
- "automatise" : ce qui serait automatisé par l'outil, en liste à puces courte (une puce par ligne, préfixée par "- ").
- "restant_a_faire" : ce qui resterait à faire par l'utilisateur, en liste à puces courte (préfixée par "- ").
- "temps_economise" : une estimation prudente du temps potentiel économisé, basée UNIQUEMENT sur les informations données par l'utilisateur (par ex. "environ 1 h 30 par semaine").
- "interfaces" : les interfaces nécessaires, en liste à puces (par ex. tableau de bord, liste des dossiers, fiche détaillée, rappels, statistiques).
- "donnees_necessaires" : les informations/données que l'application devra utiliser.
- "difficulte" : "Simple", "moyenne" ou "complexe" (un seul mot).
- "limites" : ce que tu ne sais pas encore ou qui dépend de services externes. Sois explicite.

RÈGLES D'HONNÊTETÉ :
- Ne promets JAMAIS une fonctionnalité irréaliste. Ne suppose pas que l'outil peut automatiquement accéder à un site, récupérer des données privées ou trouver des coordonnées si aucune source ou API ne le permet.
- Distingue clairement : ce qui est techniquement réalisable ; ce qui nécessite une API ou un accord avec un service externe ; ce qui n'est pas garanti.
- Si les informations sont incomplètes, reste prudent dans les estimations et signale-le dans "limites".`;

function buildTranscript(messages) {
  return (messages || [])
    .map((m) => (m.role === 'user' ? 'Utilisateur' : 'Armand') + ' : ' + m.content)
    .join('\n\n');
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action, messages } = body || {};

    if (action === 'chat') {
      const transcript = buildTranscript(messages);
      const prompt =
        CHAT_PROMPT +
        '\n\n--- Conversation jusqu\'à présent ---\n' +
        (transcript || '(début de la conversation)') +
        "\n\nPose maintenant ta prochaine réponse (une seule question, ou un message de transition si ready). Retourne ready=true uniquement si tu as assez d'informations pour une analyse complète.";

      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            ready: { type: 'boolean' }
          },
          required: ['message', 'ready']
        }
      });

      return Response.json({
        message: result.message,
        ready: !!result.ready
      });
    }

    if (action === 'analyze') {
      const transcript = buildTranscript(messages);
      const prompt =
        ANALYZE_PROMPT +
        '\n\n--- Conversation ---\n' +
        transcript;

      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            nom_provisoire: { type: 'string' },
            probleme_resolu: { type: 'string' },
            fonctionnement: { type: 'string' },
            automatise: { type: 'string' },
            restant_a_faire: { type: 'string' },
            temps_economise: { type: 'string' },
            interfaces: { type: 'string' },
            donnees_necessaires: { type: 'string' },
            difficulte: { type: 'string' },
            limites: { type: 'string' }
          },
          required: [
            'nom_provisoire',
            'probleme_resolu',
            'fonctionnement',
            'automatise',
            'restant_a_faire',
            'temps_economise',
            'interfaces',
            'donnees_necessaires',
            'difficulte',
            'limites'
          ]
        }
      });

      return Response.json({ analysis: result });
    }

    return Response.json({ error: 'Action non reconnue' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}