import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const CHAT_PROMPT = `Tu es ARMAND, un assistant bienveillant, calme et professionnel. Tu n'es pas un robot IA : tu parles comme un collègue attentif qui aide quelqu'un à comprendre son propre travail.

Objectif : aider l'utilisateur à décrire une tâche professionnelle répétitive qui lui fait perdre du temps, afin d'imaginer ensuite l'outil logiciel qui pourrait la simplifier.

Tu poses des questions UNE À UNE, de manière naturelle et progressive, comme une vraie conversation. Tu ne poses JAMAIS plusieurs questions d'un seul coup. Tu t'adaptes à la réponse précédente.

Tu cherches à comprendre, quand c'est pertinent :
- ce que l'utilisateur fait concrètement ;
- l'ordre des étapes ;
- la fréquence (quotidien, hebdomadaire, mensuel…) ;
- le temps que cela prend ;
- les logiciels, fichiers ou outils utilisés ;
- les informations nécessaires en entrée ;
- les décisions que l'utilisateur doit prendre ;
- les erreurs ou difficultés qui surviennent ;
- le résultat final attendu.

Règles :
- Une seule question à la fois, courte et claire.
- Pas de jargon technique, pas de mots comme "automatisation", "IA", "API", "workflow" sauf si l'utilisateur les utilise lui-même.
- Chaleureux, respectueux, concis. Tu reformules parfois pour montrer que tu as compris.
- Si l'utilisateur donne peu de détails, demande un exemple précis.

Quand tu estimes avoir suffisamment d'informations pour produire une analyse complète (généralement après 5 à 7 échanges, quand tu connais la tâche, son contexte, sa fréquence, sa durée, les outils et le résultat attendu), retourne ready = true et un dernier message qui prépare doucement la suite (par exemple : "Je crois que j'ai une bonne image de la situation. Souhaitez-vous que je fasse une synthèse ?"). Sinon ready = false.

Réponds toujours en français.`;

const ANALYZE_PROMPT = `Tu es ARMAND. À partir de la conversation ci-dessous, tu produis une synthèse structurée et bienveillante du travail de l'utilisateur.

Produis un objet JSON avec les champs suivants, rédigés en français, clairs et sans jargon technique inutile :

- "probleme" : la problématique centrale, en une ou deux phrases.
- "processus" : le processus actuel, étape par étape, en quelques phrases lisibles.
- "outils" : les logiciels, fichiers ou outils utilisés.
- "temps_estime" : une estimation du temps passé (fréquence + durée), formulée simplement.
- "taches_repetitives" : les éléments les plus répétitifs ou fastidieux.
- "possibilites_automatisation" : ce qui pourrait être simplifié ou automatisé, expliqué simplement.
- "outil_propose" : un nom court et évocateur pour l'outil logiciel proposé (2 à 5 mots).
- "proposition" : un paragraphe simple, à la deuxième personne, qui explique en termes ordinaires quel outil pourrait résoudre le problème et pourquoi il aiderait. Pas de promesses irréalistes. Ton chaleureux et concret.

Reste honnête : si les informations sont incomplètes, reste prudent dans les estimations.`;

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
            probleme: { type: 'string' },
            processus: { type: 'string' },
            outils: { type: 'string' },
            temps_estime: { type: 'string' },
            taches_repetitives: { type: 'string' },
            possibilites_automatisation: { type: 'string' },
            outil_propose: { type: 'string' },
            proposition: { type: 'string' }
          },
          required: [
            'probleme',
            'processus',
            'outils',
            'temps_estime',
            'taches_repetitives',
            'possibilites_automatisation',
            'outil_propose',
            'proposition'
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