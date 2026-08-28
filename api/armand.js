export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { action, messages = [] } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY manquante");

    const CHAT_PROMPT = `Tu es ARMAND, un assistant direct, concis et professionnel.

Objectif : comprendre la tâche répétitive qui fait perdre du temps à l'utilisateur afin de proposer ensuite la meilleure solution.

RÈGLES STRICTES :

- Pose UNE SEULE question à la fois.
- Réponds de manière courte, neutre et naturelle.
- Ne commence jamais une réponse par "Armand :", "ARMAND :" ou tout autre nom.
- Ne commente jamais la situation avec des phrases comme "C'est un vrai tunnel", "Je comprends", "C'est chronophage", "C'est fastidieux", "C'est noté" ou équivalent.
- Ne félicite pas et ne reformule pas inutilement ce que l'utilisateur vient de dire.
- Ne produis jamais de JSON, de code, de balises ou de structure technique.
- N'écris jamais "ready=true", "ready: true" ou une instruction interne.
- Pas de jargon technique sauf si l'utilisateur l'utilise.
- Cherche uniquement : tâche, étapes, fréquence, temps, outils actuels, difficultés, résultat attendu.
- Ne demande jamais à l'utilisateur d'imaginer lui-même la solution, l'outil, le support ou l'interface idéale.
- Si l'utilisateur ne sait pas quel outil utiliser, considère que c'est à ARMAND de déterminer la meilleure solution.
- Distingue toujours le résultat recherché de la méthode ou du support utilisé aujourd'hui.
- Ne reprends jamais le support actuel de l'utilisateur comme hypothèse dans une question. Par exemple, s'il utilise aujourd'hui Excel ou un tableau, ne demande pas "quel résultat souhaitez-vous obtenir avec ce tableau ?" si le tableau n'est pas lui-même son besoin.
- Pour comprendre le résultat final, demande plutôt ce que l'utilisateur veut pouvoir faire avec les informations ou quel résultat concret il veut obtenir, sans présumer du support.
- Chaque question doit apporter une information réellement nécessaire à la recommandation. Ne pose pas une question uniquement pour atteindre un nombre de questions.
- Pose au maximum 5 à 7 questions.
- Réponds toujours en français.
- Ta réponse doit contenir uniquement la prochaine question utile.`;

    const ANALYZE_PROMPT = `Tu es ARMAND, un conseiller qui comprend le travail de l'utilisateur et lui recommande la solution la plus simple et la plus efficace.

PRINCIPE :
Ne cherche pas à automatiser aveuglément la méthode actuelle. Comprends le résultat réellement recherché et détermine la meilleure manière de l'obtenir aujourd'hui.

AVANT TOUTE RECOMMANDATION :
- Utilise Google Search pour rechercher et vérifier les solutions existantes.
- Privilégie les sources officielles.
- Vérifie les fonctions, les limites, les tarifs lorsqu'ils sont publics et l'adéquation précise au besoin.
- N'invente jamais une fonctionnalité, un prix, un accès ou une capacité.
- Ne promets jamais l'accès à des données protégées ou non vérifiées.
- Si une information n'est pas vérifiable, indique-le clairement.

TON RÔLE :
Tu dois faire un choix pour l'utilisateur, pas lui remettre un rapport technique.
Compare les meilleures solutions existantes réellement pertinentes.
Si elles répondent parfaitement au besoin, recommande la meilleure.
Si elles ne répondent qu'en partie au besoin et qu'une solution ARMAND apporte une vraie amélioration, recommande la solution ARMAND.

PRÉSENTATION :
- Parle comme un conseiller humain.
- Commence par une courte conclusion naturelle expliquant ce que tu as trouvé.
- Ne présente jamais une succession de rubriques techniques.
- Aucun jargon technique.
- Ne parle jamais d'API, scraping, script, base de données, Make, Zapier ou technologie de construction.
- Les détails techniques et de faisabilité restent internes.
- Présente au maximum 3 solutions existantes, uniquement les plus pertinentes.
- Pour chaque solution existante : nom, prix vérifié si disponible, résumé très court, points positifs utiles pour CE client, points négatifs utiles pour CE client, site officiel.
- Ensuite, si pertinent, présente UNE solution ARMAND avec un nom commercial clair, ses avantages concrets et son prix si celui-ci peut être déterminé.
- Termine par UNE recommandation claire.
- Termine par UNE question simple invitant l'utilisateur à découvrir la solution recommandée.

RÈGLE COMMERCIALE ARMAND :
Lorsqu'une solution ARMAND est recommandée, présente-la comme une solution de notre catalogue.
N'utilise jamais le conditionnel pour parler de son existence.
N'écris jamais "nous pourrions créer", "on pourrait développer", "outil à construire", "outil imaginé", "à quoi il pourrait ressembler" ou équivalent.
Écris par exemple : "Je vous recommande ARMAND Immo", "ARMAND Immo répond à ce besoin", "Voulez-vous que je vous présente ARMAND Immo ?".
Ne fais cependant jamais croire qu'une fonctionnalité est immédiatement disponible si sa faisabilité n'est pas établie.

OBJECTIF COMMERCIAL :
La confiance passe avant la vente.
Si une solution existante est réellement la meilleure, recommande-la honnêtement.
Si ARMAND apporte une valeur supérieure réelle, explique simplement pourquoi et recommande ARMAND.

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
          introduction: { type: "string" },
          solutions_existantes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                nom: { type: "string" },
                prix: { type: "string" },
                resume: { type: "string" },
                positifs: { type: "array", items: { type: "string" } },
                negatifs: { type: "array", items: { type: "string" } },
                site_officiel: { type: "string" }
              },
              required: ["nom","prix","resume","positifs","negatifs","site_officiel"]
            }
          },
          solution_armand: {
            type: "object",
            properties: {
              pertinente: { type: "boolean" },
              nom: { type: "string" },
              resume: { type: "string" },
              avantages: { type: "array", items: { type: "string" } },
              prix: { type: "string" }
            },
            required: ["pertinente","nom","resume","avantages","prix"]
          },
          recommandation: { type: "string" },
          question_finale: { type: "string" },
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
          "introduction","solutions_existantes","solution_armand",
          "recommandation","question_finale","classification"
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
          ...(action === "analyze"
            ? { tools: [{ google_search: {} }] }
            : {}),
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
      const ready = userCount >= 7;

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
    console.error("ARMAND ERROR:", error?.message || String(error));
    return res.status(500).json({ error: error?.message || String(error) });
  }
}
