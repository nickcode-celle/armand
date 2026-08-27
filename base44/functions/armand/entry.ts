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

const ANALYZE_PROMPT = `Tu es ARMAND. À partir de la conversation ci-dessous, tu produis deux choses, en français, sans jargon technique inutile :
1) une fiche d'outil proposé à l'utilisateur ;
2) une classification interne du problème (non affichée à l'utilisateur).

=== FICHE D'OUTIL (champs à produire) ===

- "nom_provisoire" : un nom descriptif simple pour l'outil (2 à 5 mots).
- "probleme_resolu" : le problème résolu, en une seule phrase.
- "fonctionnement" : le fonctionnement de l'outil, en 5 étapes maximum, numérotées "1." à "5.", une étape par ligne.
- "automatise" : ce qui serait automatisé par l'outil, en liste à puces courte (une puce par ligne, préfixée par "- ").
- "restant_a_faire" : ce qui resterait à faire par l'utilisateur, en liste à puces courte (préfixée par "- ").
- "temps_economise" : une estimation prudente du temps potentiel économisé, basée UNIQUEMENT sur les informations données par l'utilisateur (par ex. "environ 1 h 30 par semaine").
- "interfaces" : les interfaces nécessaires, en liste à puces (par ex. tableau de bord, liste des dossiers, fiche détaillée, rappels, statistiques).
- "donnees_necessaires" : les informations/données que l'application devra utiliser.
- "difficulte" : "Simple", "moyenne" ou "complexe" (un seul mot).
- "limites" : ce que tu ne sais pas encore ou qui dépend de services externes. Sois explicite.

=== FAISABILITÉ RÉELLE ===
Ne présente JAMAIS comme certaine une automatisation qui dépend d'un service externe. Pour chaque fonctionnalité, classe-la dans la bonne catégorie. Remplis les 4 champs suivants (si rien dans une catégorie, mets "—") :

- "faisable_directement" : ce qui est faisable directement, sans dépendance externe.
- "faisable_sous_conditions" : ce qui nécessite une API, un accès à un site tiers, du scraping, des données personnelles, une autorisation ou une intégration externe. Précise la condition à chaque fois.
- "a_verifier" : ce qui doit être vérifié avant de s'engager.
- "non_realisable" : ce qui n'est pas réalisable de manière fiable.
N'essaie jamais de contourner les protections d'un site ni de proposer un accès non autorisé.

=== SOLUTION EXISTANTE OU NOUVEL OUTIL ===
Avant de recommander la construction, détermine si le problème appartient à une catégorie pour laquelle des logiciels standards existent déjà.

- "conclusion_outil" : choisis EXACTEMENT l'une de ces trois conclusions (recopie le texte complet) :
  "A — Un outil existant pourrait probablement suffire"
  "B — Un outil existant pourrait convenir mais nécessiterait beaucoup d'adaptation"
  "C — Le besoin semble suffisamment spécifique pour justifier un outil personnalisé"
- "solution_existante" : explication par catégories génériques uniquement. N'invente JAMAIS le nom d'un logiciel existant si tu n'as pas de source fiable. En V0, tu ne peux pas effectuer de recherche fiable : indique-le clairement dans ce champ.

=== CLASSIFICATION INTERNE (non affichée à l'utilisateur) ===
Produis un objet "classification" avec :
- "categorie_principale" : catégorie principale du problème.
- "sous_categorie" : sous-catégorie.
- "secteur_activite" : secteur d'activité.
- "taches_principales" : tâches principales (texte).
- "entrees" : entrées (texte).
- "sorties" : sorties (texte).
- "outils_actuels" : outils actuels (texte).
- "frequence" : fréquence.
- "temps_consacre" : temps consacré.
- "difficultes" : difficultés (texte).
- "automatisations_recherchees" : automatisations recherchées (texte).
- "complexite" : complexité.
- "fonctionnalites_proposees" : fonctionnalités proposées (texte).
- "tags" : un tableau de 5 à 10 tags fonctionnels (chaînes courtes, par ex. "prospection", "collecte de données", "dédoublonnage", "suivi", "relance", "gestion de contacts", "immobilier"). Cette structure doit permettre de comparer plus tard deux problèmes et de détecter des besoins similaires.

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