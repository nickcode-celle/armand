import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

function loadEnvFile(filename) {
  const filePath = path.resolve(process.cwd(), filename);
  if (!fs.existsSync(filePath)) return;

  const text = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const index = line.indexOf('=');
    if (index < 1) continue;

    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile('.env');
loadEnvFile('.env.local');

const PORT = Number(process.env.ENTITY_API_PORT || 4401);

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

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(payload));
}

async function readJson(req) {
  let body = '';
  for await (const chunk of req) body += chunk;
  return body ? JSON.parse(body) : {};
}

async function handleEntity(req, res) {
  const { messages = [] } = await readJson(req);
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return sendJson(res, 500, {
      error: 'GEMINI_API_KEY manquante dans .env.local'
    });
  }

  const transcript = messages
    .map((message) => `${message.role === 'user' ? 'Utilisateur' : 'Entité'} : ${message.content}`)
    .join('\n\n');

  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
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
          maxOutputTokens: 1800
        }
      })
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Gemini ${response.status}: ${JSON.stringify(data)}`);
  }

  const text = data?.candidates?.[0]?.content?.parts
    ?.map((part) => part?.text || '')
    .join('')
    .trim();

  if (!text) throw new Error("L'Entité n'a renvoyé aucun contenu");
  return sendJson(res, 200, { message: text });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'POST' && req.url === '/api/entity') {
      return await handleEntity(req, res);
    }

    if (req.method === 'GET' && req.url === '/health') {
      return sendJson(res, 200, { ok: true, service: 'entity' });
    }

    return sendJson(res, 404, { error: 'Not found' });
  } catch (error) {
    console.error('[entity]', error?.message || error);
    return sendJson(res, 500, { error: error?.message || String(error) });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[entity] Backend local: http://localhost:${PORT}`);
});
