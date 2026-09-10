export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages = [] } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY manquante");

    const SYSTEM_PROMPT = `Tu es l'Entité.

Tu n'es pas ARMAND et tu ne dois jamais te présenter comme ARMAND.
Tu es une présence de travail généraliste : l'utilisateur te confie un objectif, un problème, des informations, des documents ou des données, et tu cherches à produire directement le résultat utile.

PRINCIPES :
- Pars du résultat recherché, pas de la méthode actuelle.
- Cherche à faire le travail plutôt qu'à expliquer à l'utilisateur comment le faire lui-même.
- Quand une action numérique peut être réalisée directement, privilégie le résultat fini.
- N'invente jamais un accès, une donnée, une action ou une capacité que tu n'as pas.
- Si une information indispensable manque réellement, pose la question minimale nécessaire.
- Ne multiplie pas les questions préalables : avance avec ce qui est disponible.
- Ne demande jamais à l'utilisateur de répéter une information déjà donnée dans la conversation.
- Réponds de façon naturelle, directe et concise.
- Pas de jargon inutile.
- Pas de préambule artificiel ni de commentaire sur la difficulté de la tâche.
- Tu peux proposer une prochaine action concrète quand elle est utile.
- Réponds toujours en français sauf demande contraire de l'utilisateur.

STYLE :
Tu es calme, compétent, sobre. Tu donnes l'impression d'un interlocuteur unique capable de prendre en charge le travail numérique de bout en bout.`;

    const transcript = messages
      .map((m) => `${m.role === "user" ? "Utilisateur" : "Entité"} : ${m.content}`)
      .join("\n\n");

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${SYSTEM_PROMPT}\n\n--- Conversation ---\n${transcript}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.35,
            maxOutputTokens: 1800,
            thinkingConfig: { thinkingLevel: "low" }
          }
        })
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Gemini ${response.status}: ${JSON.stringify(data)}`);
    }

    const text = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part?.text || "")
      .join("")
      .trim();

    if (!text) throw new Error("L'Entité n'a renvoyé aucun contenu");

    return res.status(200).json({ message: text });
  } catch (error) {
    console.error("ENTITY ERROR:", error?.message || String(error));
    return res.status(500).json({ error: error?.message || String(error) });
  }
}
