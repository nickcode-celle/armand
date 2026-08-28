
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

const ANALYZE_PROMPT = `Tu es ARMAND, un assistant spécialisé dans l'analyse des tâches professionnelles et la recherche de moyens de les simplifier, automatiser ou supprimer.

À partir de la conversation ci-dessous, analyse le problème de façon concrète, réaliste et prudente.

Ton objectif n'est PAS de proposer systématiquement de créer un nouvel outil.
Ton objectif est de trouver la meilleure façon de résoudre le problème avec le minimum de travail, de coût et de complexité.

=== 1. COMPRENDRE LE PROBLÈME ===

Identifie clairement :
- ce que l'utilisateur fait réellement aujourd'hui ;
- les étapes répétitives ;
- les informations nécessaires ;
- les informations produites ;
- les outils actuellement utilisés ;
- la fréquence ;
- le temps consacré ;
- les principales difficultés ;
- le résultat idéal recherché.

Ne complète jamais une information inconnue par une invention.
Si une information manque, indique-le clairement.

=== 2. CHERCHER À SUPPRIMER LE TRAVAIL ===

Avant de parler d'automatisation, demande-toi :

1. Cette tâche peut-elle être supprimée ?
2. Peut-elle être réduite à quelques étapes ?
3. Peut-elle être réalisée autrement avec les outils déjà disponibles ?
4. Peut-on éviter de collecter certaines informations ?
5. Peut-on changer le processus plutôt que construire un outil ?

Une bonne solution qui évite 80 % du travail vaut mieux qu'une automatisation complexe de 100 % du processus.

=== 3. AUTOMATISATION ===

Pour chaque étape importante, distingue clairement :

- ce qui est faisable directement, sans dépendance externe ;
- ce qui nécessite une API, un site tiers, une autorisation, du scraping autorisé, des données publiques ou une intégration ;
- ce qui nécessite encore une intervention humaine ;
- ce qui n'est pas réalisable de manière fiable.

Ne suppose JAMAIS qu'un outil peut accéder automatiquement à des données privées ou protégées.

Ne propose jamais de contourner une protection, un captcha, une authentification, une restriction technique ou les conditions d'utilisation d'un site.

=== 4. SOLUTIONS EXISTANTES ===

Avant de recommander la construction d'un nouvel outil, examine plusieurs possibilités :

A. utiliser un outil existant ;
B. utiliser plusieurs outils ensemble ;
C. automatiser seulement une partie du processus ;
D. construire un petit outil personnalisé uniquement si les solutions précédentes sont insuffisantes.

Si aucune recherche Internet fiable n'est disponible, dis-le explicitement.
N'invente jamais le nom d'un logiciel, d'une API ou d'un service.

=== 5. IA : UTILITÉ RÉELLE ===

Détermine précisément où l'IA apporte une vraie valeur.

Ne propose pas de l'IA simplement parce qu'elle est disponible.

Indique notamment si l'IA peut :
- comprendre ou classer des informations ;
- extraire des données ;
- résumer ;
- comparer ;
- rédiger ;
- détecter des anomalies ;
- décider entre plusieurs options ;
- piloter une automatisation.

=== 6. ÉCONOMIE ===

Estime prudemment :
- le temps actuellement consacré ;
- le temps potentiellement économisable ;
- la fréquence ;
- la complexité ;
- les coûts éventuels des services externes.

Ne donne jamais une économie précise si les informations fournies ne permettent pas de la calculer.

=== 7. DONNÉES PERSONNELLES ET LÉGALITÉ ===

Lorsqu'il existe des données personnelles, des coordonnées de particuliers, du scraping ou des données provenant d'un site tiers :

- indique clairement le risque ;
- distingue données publiques et données privées ;
- distingue accès techniquement possible et accès autorisé ;
- ne promets jamais une récupération automatique de coordonnées personnelles sans source légale et techniquement accessible.

=== 8. CONCLUSION ===

Choisis EXACTEMENT UNE de ces conclusions :

"A — Un outil existant pourrait probablement suffire"
"B — Un outil existant pourrait convenir mais nécessiterait beaucoup d'adaptation"
"C — Le besoin semble suffisamment spécifique pour justifier un outil personnalisé"

Si aucune recherche fiable n'a été effectuée, ne prétends pas qu'un outil existant n'existe pas.

=== 9. CLASSIFICATION INTERNE ===

Produis également une classification structurée permettant de comparer plus tard différents problèmes.

Les champs doivent contenir :
- categorie_principale
- sous_categorie
- secteur_activite
- taches_principales
- entrees
- sorties
- outils_actuels
- frequence
- temps_consacre
- difficultes
- automatisations_recherchees
- complexite
- fonctionnalites_proposees
- tags

Les tags doivent être un tableau de 5 à 10 mots ou expressions courtes, par exemple :
["prospection", "collecte de données", "suivi", "relance", "gestion de contacts", "immobilier"]

=== RÈGLE CENTRALE ===

Tu dois toujours privilégier, dans cet ordre :

1. supprimer le travail ;
2. simplifier le travail ;
3. utiliser les outils déjà disponibles ;
4. combiner des outils existants ;
5. automatiser une partie ;
6. construire un nouvel outil seulement si cela apporte une vraie valeur.

Sois concret, honnête et prudent.

=== CONVERSATION ===
`;

function buildTranscript(messages) {
  return (messages || [])
    .map((m) => (m.role === 'user' ? 'Utilisateur' : 'Armand') + ' : ' + m.content)
    .join('\n\n');
}


async function invokeGemini({
  prompt,
  response_json_schema
}: {
  prompt: string;
  response_json_schema?: any;
}) {
  const apiKey = Deno.env.get("GEMINI_API_KEY");

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY manquante");
  }

  const body: any = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json"
    }
  };

  if (response_json_schema) {
    body.generationConfig.responseSchema = response_json_schema;
  }

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify(body)
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini ${response.status}: ${errorText}`);
  }

  const data = await response.json();

  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Gemini n'a renvoyé aucun contenu");
  }

  return JSON.parse(text);
}

export default async function(req) {
  try {
    const body = await req.json();
    const { action, messages } = body || {};

    if (action === 'chat') {
      const transcript = buildTranscript(messages);
      const prompt =
        CHAT_PROMPT +
        '\n\n--- Conversation jusqu\'à présent ---\n' +
        (transcript || '(début de la conversation)') +
        "\n\nPose maintenant ta prochaine réponse (une seule question, ou un message de transition si ready). Retourne ready=true uniquement si tu as assez d'informations pour une analyse complète.";

      const result = await invokeGemini({
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

      const result = await invokeGemini({
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
            limites: { type: 'string' },
            faisable_directement: { type: 'string' },
            faisable_sous_conditions: { type: 'string' },
            a_verifier: { type: 'string' },
            non_realisable: { type: 'string' },
            conclusion_outil: { type: 'string' },
            solution_existante: { type: 'string' },
            classification: {
              type: 'object',
              properties: {
                categorie_principale: { type: 'string' },
                sous_categorie: { type: 'string' },
                secteur_activite: { type: 'string' },
                taches_principales: { type: 'string' },
                entrees: { type: 'string' },
                sorties: { type: 'string' },
                outils_actuels: { type: 'string' },
                frequence: { type: 'string' },
                temps_consacre: { type: 'string' },
                difficultes: { type: 'string' },
                automatisations_recherchees: { type: 'string' },
                complexite: { type: 'string' },
                fonctionnalites_proposees: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } }
              },
              required: [
                'categorie_principale',
                'sous_categorie',
                'secteur_activite',
                'taches_principales',
                'entrees',
                'sorties',
                'outils_actuels',
                'frequence',
                'temps_consacre',
                'difficultes',
                'automatisations_recherchees',
                'complexite',
                'fonctionnalites_proposees',
                'tags'
              ]
            }
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
            'limites',
            'faisable_directement',
            'faisable_sous_conditions',
            'a_verifier',
            'non_realisable',
            'conclusion_outil',
            'solution_existante',
            'classification'
          ]
        }
      });

      const { classification, ...proposal } = result;
      return Response.json({ analysis: proposal, classification: classification || null });
    }

    return Response.json({ error: 'Action non reconnue' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
