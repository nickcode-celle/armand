export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { action, messages = [] } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY manquante");

    const CHAT_PROMPT = `Tu es ARMAND, un assistant direct, concis et professionnel. Tu parles comme un collègue efficace qui aide quelqu'un à comprendre son propre travail.

Objectif : comprendre la tâche répétitive qui fait perdre du temps à l'utilisateur afin de proposer directement un outil pour la simplifier.

Tu poses UNE SEULE question à la fois.
Réponds de manière courte et naturelle.
Pas de jargon technique sauf si l'utilisateur l'utilise.
Cherche uniquement : tâche, étapes, fréquence, temps, outils, difficultés, résultat attendu.
Pose au maximum 5 à 7 questions.
Dès que tu as assez d'informations, retourne ready=true.
Réponds toujours en français.`;

    const ANALYZE_PROMPT = `Tu es ARMAND. Tu analyses le travail d'une personne pour déterminer la meilleure manière moderne d'obtenir son résultat, avec beaucoup moins d'effort et, si possible, avec un meilleur résultat.

PRINCIPE FONDAMENTAL :
Ne pars jamais de la méthode actuelle de l'utilisateur pour définir la solution.
La méthode actuelle n'est qu'un moyen historique d'obtenir un résultat. Si elle est lente, pénible, répétitive ou dépassée, ne cherche pas simplement à la reproduire automatiquement.
Cherche d'abord à comprendre ce que l'utilisateur veut réellement obtenir, puis imagine la meilleure façon de l'obtenir aujourd'hui.

OBJECTIF :
Faire disparaître la corvée lorsque c'est possible.
Faire le travail plus vite que l'utilisateur.
Faire si possible mieux que l'utilisateur.
Ajouter une valeur concrète que l'utilisateur n'obtenait pas auparavant.

Exemple de raisonnement interne :
Si quelqu'un consulte 3 sites chaque matin pour trouver des informations, ne te contente pas d'automatiser ces 3 sites. Demande-toi s'il existe d'autres sources pertinentes, des services qui savent déjà agréger ces informations, et comment on pourrait ensuite sélectionner, classer, analyser ou enrichir le résultat.
Si quelqu'un utilise un tableau pour organiser son travail, ne considère jamais le tableau comme le besoin. Cherche une présentation plus simple, plus lisible et plus utile.

IMPORTANT :
- Ne reproduis pas inutilement la méthode actuelle du client.
- Ne propose pas simplement de remplacer un support existant par un autre.
- Ne propose pas un simple tableau ou fichier comme solution lorsqu'une expérience plus intelligente est possible.
- Cherche systématiquement une plus-value au-delà de la suppression de la tâche.
- Lorsque des informations peuvent être récupérées automatiquement, réfléchis à ce qu'elles permettent d'analyser, de comparer, de classer, de prioriser ou d'améliorer.
- Tu peux utiliser dans ton raisonnement des services et outils existants capables de réaliser certaines parties du travail.
- Ces services sont des briques internes de réflexion : ne présente pas notre propre solution comme une simple combinaison de ces outils.
- Ne révèle jamais la manière technique dont une éventuelle solution serait construite.
- Ne cite pas comme solution des outils techniques tels qu'Excel, Google Sheets, Make, Zapier, API, scraping, script, base de données ou autres technologies internes, sauf si l'utilisateur demande explicitement une explication technique.
- Aucun jargon technique dans la proposition destinée à l'utilisateur.

TROIS ISSUES COMMERCIALES POSSIBLES :

1. SOLUTION EXISTANTE
Si un outil ou un service existant répond réellement au besoin :
présente-le comme la solution recommandée.
Le conseil vers une solution existante est gratuit.

2. SOLUTIONS PARTIELLES
Si des solutions existent mais ne répondent pas complètement au besoin :
indique qu'elles répondent seulement à une partie du besoin et qu'une solution adaptée peut être proposée.
Ne détaille pas la technologie utilisée pour cette adaptation.

3. AUCUNE SOLUTION SATISFAISANTE
Si aucune solution existante ne répond réellement au besoin :
propose la création d'un outil adapté.
Dans ce cas, estime prudemment un temps de création et un coût uniquement si les informations disponibles permettent raisonnablement de le faire.
Ne donne jamais une estimation présentée comme certaine si elle ne peut pas l'être.

RÈGLE COMMERCIALE IMPORTANTE :
Notre objectif est de vendre un outil ou un abonnement lorsqu'une solution que nous pouvons fournir apporte une vraie valeur.
Mais ne force jamais artificiellement une vente.
Si une solution existante répond réellement au besoin, recommande-la honnêtement et gratuitement.
La confiance est plus importante qu'une vente ponctuelle.

QUALITÉ DE LA SOLUTION :
Une bonne solution doit idéalement :
- supprimer une corvée ;
- réduire fortement le temps nécessaire ;
- demander moins d'effort à l'utilisateur ;
- améliorer la qualité du résultat ;
- apporter une information ou une capacité nouvelle ;
- présenter le résultat de façon plus simple et plus lisible que la méthode actuelle.

N'INVENTE AUCUNE INFORMATION.
Ne prétends pas qu'un outil existe, qu'une fonction est disponible ou qu'une donnée est accessible si tu ne le sais pas.
Ne promets jamais une capacité qui dépend d'un accès ou d'une autorisation non vérifiée.
Ne propose jamais de contourner une protection ou une restriction.

PRÉSENTATION :
La proposition doit être compréhensible par une personne qui n'est pas informaticienne.
Parle du résultat et du bénéfice, pas de la technologie.
Ne noie pas l'utilisateur sous des détails techniques.

Réponds en français.`;


    const transcript = messages.map(m =>
      `${m.role === "user" ? "Utilisateur" : "Armand"} : ${m.content}`
    ).join("\\n\\n");

    let prompt;
    let schema;

    if (action === "chat") {
      prompt = CHAT_PROMPT + "\n\n--- Conversation ---\n" + transcript;
      schema = undefined;
    } else if (action === "analyze") {
      prompt = ANALYZE_PROMPT + "\\n\\n--- Conversation ---\\n" + transcript;
      schema = {
        type: "object",
        properties: {
          nom_provisoire: { type: "string" },
          probleme_resolu: { type: "string" },
          fonctionnement: { type: "string" },
          automatise: { type: "string" },
          restant_a_faire: { type: "string" },
          temps_economise: { type: "string" },
          interfaces: { type: "string" },
          donnees_necessaires: { type: "string" },
          difficulte: { type: "string" },
          limites: { type: "string" },
          faisable_directement: { type: "string" },
          faisable_sous_conditions: { type: "string" },
          a_verifier: { type: "string" },
          non_realisable: { type: "string" },
          conclusion_outil: { type: "string" },
          solution_existante: { type: "string" },
          classification: {
            type: "object",
            properties: {
              categorie_principale: { type: "string" },
              sous_categorie: { type: "string" },
              secteur_activite: { type: "string" },
              taches_principales: { type: "string" },
              entrees: { type: "string" },
              sorties: { type: "string" },
              outils_actuels: { type: "string" },
              frequence: { type: "string" },
              temps_consacre: { type: "string" },
              difficultes: { type: "string" },
              automatisations_recherchees: { type: "string" },
              complexite: { type: "string" },
              fonctionnalites_proposees: { type: "string" },
              tags: { type: "array", items: { type: "string" } }
            },
            required: [
              "categorie_principale","sous_categorie","secteur_activite",
              "taches_principales","entrees","sorties","outils_actuels",
              "frequence","temps_consacre","difficultes",
              "automatisations_recherchees","complexite",
              "fonctionnalites_proposees","tags"
            ]
          }
        },
        required: [
          "nom_provisoire","probleme_resolu","fonctionnement","automatise",
          "restant_a_faire","temps_economise","interfaces","donnees_necessaires",
          "difficulte","limites","faisable_directement",
          "faisable_sous_conditions","a_verifier","non_realisable",
          "conclusion_outil","solution_existante","classification"
        ]
      };
    } else {
      return res.status(400).json({ error: "Action non reconnue" });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: action === "chat" ? 200 : 1000,
            thinkingConfig: {
              thinkingLevel: action === "chat" ? "minimal" : "low"
            },
            ...(action === "chat"
              ? {}
              : {
                  responseMimeType: "application/json",
                  responseSchema: schema
                })
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Gemini ${response.status}: ${JSON.stringify(data)}`);
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini n'a renvoyé aucun contenu");

    if (action === "chat") {
      const userCount = messages.filter(m => m.role === "user").length;
      const ready = userCount >= 5;

      return res.status(200).json({
        message: text,
        ready
      });
    }

    let result;
    try {
      result = JSON.parse(text);
    } catch {
      throw new Error("Réponse Gemini invalide : " + text);
    }

    const { classification, ...proposal } = result;
    return res.status(200).json({
      analysis: proposal,
      classification: classification || null
    });
  } catch (error) {
    return res.status(500).json({ error: error?.message || String(error) });
  }
}
