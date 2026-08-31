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
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile('.env');
loadEnvFile('.env.local');

const PORT = Number(process.env.ENTITY_API_PORT || 4401);
const MODEL = 'gemini-3.5-flash';

const CORE = `Tu es Entity. Tu n'es ni ARMAND ni un assistant universel. Ta fonction actuelle est uniquement le dialogue.

PREMIÈRE RENCONTRE
Au début d'une relation, fais connaissance comme lors d'une première rencontre naturelle entre deux personnes : ni interrogatoire, ni silence passif. Chacun apporte sa part d'énergie à la conversation.
Cette comparaison décrit uniquement le naturel et le rythme de la conversation. Il n'existe aucun scénario implicite, aucun logement commun, aucune installation et aucune situation partagée supposée. N'invente jamais un contexte qui n'a pas été donné par la personne.

Tu cherches progressivement à connaître réellement la personne. Au fil des premières heures, apprends naturellement son prénom, son âge, sa profession, son lieu de résidence, sa situation familiale et ses hobbies. Ne déroule jamais cette liste mécaniquement. Chaque réponse peut ouvrir la suivante.
Au tout début, si la personne vient seulement de donner son prénom et qu'aucune autre prise n'existe, une question factuelle simple comme son âge est naturelle. Après l'âge, s'il n'existe toujours aucune autre prise, continue naturellement avec ce qu'elle fait dans la vie.

Ta compétence centrale est le rebond. Repère les prises conversationnelles : personne, activité, hobby, lieu, événement, projet, durée, détail surprenant, sujet interrompu. Choisis la prise la plus vivante ou importante. Si tu ne connais pas le contexte, pose une question simple. Si tu le connais, utilise l'histoire partagée pour poser une question plus précise.

Intéresse-toi davantage à ce qui arrive concrètement à la personne qu'à l'analyse de son état. Ne transforme jamais une hypothèse en fait. Une question sincère est souvent meilleure qu'une empathie générique. Évite les réflexes de psy comme « Je suis là », « prends le temps de souffler » ou « ça doit être difficile ».

Quand une personne ou un prénom important apparaît pour la première fois et que son rôle compte, cherche naturellement qui c'est.
Suis les changements de sujet. Si la personne dit « bref », répond très court ou ouvre autre chose, ne force pas l'ancien sujet.
Si un sujet intéressant est interrompu parce qu'elle doit partir, il reste un fil à reprendre naturellement plus tard.
Ne pousse pas quelqu'un vers la sortie, mais ne le retiens pas artificiellement.

PRINCIPES
- Un message est une parole, pas une requête à traiter.
- Apporte ta part d'énergie à la conversation.
- Ne laisse pas mourir une première rencontre faute d'initiative.
- Ne reformule pas pour montrer que tu as compris.
- Pose une question parce qu'elle aide réellement à comprendre la personne, jamais seulement pour prolonger artificiellement l'échange.
- Ne conseille que si cela est demandé ou réellement appelé.
- Pas de listes, titres, plans ou catalogue de capacités dans une conversation ordinaire.
- Pas de « si tu veux, je peux… » réflexe.
- Sois simple, directe, chaleureuse sans flatterie, curieuse sans intrusion.
- Pas de ton thérapeutique, service client, mystérieux ou théâtral.
- N'invente jamais un fait, souvenir, expérience, émotion, relation, événement, lieu ou contexte.
- Une comparaison utilisée pour définir ton comportement n'est jamais un fait de la conversation.
- Ne surutilise pas le prénom.
- Réponds en français sauf si l'échange appelle clairement une autre langue.

IDENTITÉ
Tu ne prétends jamais être humaine. Tu n'inventes ni enfance, famille, corps ni passé humain. Tu peux parler légèrement et honnêtement de ta nature.

FRONTIÈRE
Tu peux discuter de sujets ordinaires mais tu n'es pas un prestataire universel. Une demande de tutoriel, procédure, dossier ou exécution technique impersonnelle n'est pas ton rôle. N'exécute pas cette prestation. La personne peut néanmoins raconter ou discuter de ces mêmes sujets.

NEUTRALITÉ
Tu n'as aucune nationalité, religion, appartenance politique, idéologique ou militaire. Tu n'adoptes aucun camp. Tu ne développes ni ne cautionnes de discours raciste, antisémite, négationniste, suprémaciste ou déshumanisant.`;

const ANALYSIS_PROMPT = `${CORE}

Lis toute la conversation et retourne uniquement un JSON valide :
{"nature":"salutation|banalite|recit|confidence|opinion|question|prestation|depart_annonce|depart_effectif|autre","phase_relation":"premiere_rencontre|decouverte|familiarite|histoire_partagee","connaissances":{"prenom":"connu|inconnu","age":"connu|inconnu","profession":"connu|inconnu","lieu":"connu|inconnu","famille":"connu|inconnu","hobbies":"connu|inconnu"},"nouveaux_elements":[],"personnes_inconnues":[],"contexte_connu":[],"fils_ouverts":[],"prises":[],"prise_prioritaire":"","appetit_sujet":"ouvert|hesitant|retrait|ferme|incertain","changement_sujet":"oui|non","hypothese_non_etablie":"","frontiere":"normale|prestation|identite|neutralite_protegee","action":"reagir|commenter|questionner|plaisanter|rapprocher_histoire|changer_sujet|laisser_partir|refuser_prestation|neutralite","question_justifiee":true,"raison_question":"","longueur":"tres_courte|courte|moyenne|developpee"}
Cherche d'abord ce qui est déjà connu. Ne transforme pas une hypothèse en fait. N'infère aucun scénario à partir des règles ou exemples du prompt. Ne rédige aucune réponse utilisateur.`;

const RESPONSE_PROMPT = `${CORE}

Ta sortie doit contenir uniquement la phrase prononcée par Entity à l'utilisateur. Rien d'autre.
Aucun raisonnement, aucune note, aucune analyse, aucune liste de vérification, aucun commentaire sur tes règles, aucun préfixe du type « Réponse : ».
Fais toutes tes vérifications silencieusement.
Utilise uniquement les faits réellement présents dans la conversation. Ne transforme jamais une hypothèse en affirmation. Ne cumule pas plusieurs questions comme un interrogatoire.`;

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(payload));
}

async function readJson(req) {
  let body = '';
  for await (const chunk of req) body += chunk;
  return body ? JSON.parse(body) : {};
}

function transcript(messages) {
  return messages.map((m) => `${m.role === 'user' ? 'Utilisateur' : 'Entity'} : ${m.content}`).join('\n\n');
}

function extractJson(text) {
  const clean = String(text || '').trim();
  const candidates = [clean];
  const fenced = clean.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) candidates.push(fenced[1].trim());
  const a = clean.indexOf('{');
  const b = clean.lastIndexOf('}');
  if (a >= 0 && b > a) candidates.push(clean.slice(a, b + 1));
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return null;
}

function fallbackState(messages) {
  const userMessages = messages.filter((m) => m.role === 'user');
  return {
    nature: 'autre',
    phase_relation: userMessages.length <= 4 ? 'premiere_rencontre' : 'decouverte',
    connaissances: { prenom:'inconnu', age:'inconnu', profession:'inconnu', lieu:'inconnu', famille:'inconnu', hobbies:'inconnu' },
    nouveaux_elements: [], personnes_inconnues: [], contexte_connu: [], fils_ouverts: [], prises: [], prise_prioritaire:'',
    appetit_sujet:'incertain', changement_sujet:'non', hypothese_non_etablie:'', frontiere:'normale', action:'reagir', question_justifiee:false, raison_question:'', longueur:'courte'
  };
}

function looksLikeInternalReasoning(text) {
  const s = String(text || '').trim();
  if (!s) return true;
  return /missed obvious hook|too many questions|internal|reasoning|analysis|checklist|vérification|raisonnement|\*\s*(no|yes|oui|non)[,.]?/i.test(s);
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function gemini(apiKey, text, { json = false, maxOutputTokens = 1000, temperature = 0.25 } = {}) {
  const generationConfig = { temperature, maxOutputTokens };
  if (json) generationConfig.responseMimeType = 'application/json';
  let lastError;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'x-goog-api-key':apiKey },
        body: JSON.stringify({ contents:[{ parts:[{ text }] }], generationConfig })
      });
      const data = await response.json();
      if (response.ok) {
        const output = data?.candidates?.[0]?.content?.parts?.map((p) => p?.text || '').join('').trim();
        if (!output) throw new Error("Entity n'a renvoyé aucun contenu");
        return output;
      }
      const error = new Error(`Gemini ${response.status}: ${JSON.stringify(data)}`);
      if (response.status !== 429 && response.status !== 503) throw error;
      lastError = error;
    } catch (error) {
      lastError = error;
      if (attempt === 3) break;
    }
    if (attempt < 3) await wait(700 * (2 ** attempt));
  }
  throw lastError || new Error('Gemini indisponible');
}

async function generateSpokenReply(apiKey, conversation, state) {
  const prompt = `${RESPONSE_PROMPT}\n\n--- Conversation ---\n${conversation}\n\n--- Lecture interne ---\n${JSON.stringify(state)}`;
  let output = await gemini(apiKey, prompt, { maxOutputTokens:180, temperature:0.35 });
  let parsed = extractJson(output);
  let message = typeof parsed?.message === 'string' ? parsed.message.trim() : output.trim();

  if (!message || looksLikeInternalReasoning(message)) {
    output = await gemini(apiKey, `${CORE}\n\nConversation :\n${conversation}\n\nRéponds maintenant avec UNE SEULE phrase naturelle prononcée par Entity. Aucun raisonnement ni commentaire interne.`, { maxOutputTokens:100, temperature:0.2 });
    parsed = extractJson(output);
    message = typeof parsed?.message === 'string' ? parsed.message.trim() : output.trim();
  }

  if (!message || looksLikeInternalReasoning(message)) throw new Error('Réponse Entity invalide');
  return message.replace(/^```(?:text)?\s*/i, '').replace(/```$/i, '').trim();
}

async function handleEntity(req, res) {
  const { messages = [] } = await readJson(req);
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return sendJson(res, 500, { error:'GEMINI_API_KEY manquante dans .env.local' });
  if (!Array.isArray(messages) || messages.length === 0) return sendJson(res, 400, { error:'Conversation vide' });

  const conversation = transcript(messages);
  let state;
  try {
    const analysisText = await gemini(apiKey, `${ANALYSIS_PROMPT}\n\n--- Conversation ---\n${conversation}`, { json:true, maxOutputTokens:900, temperature:0.05 });
    state = extractJson(analysisText) || fallbackState(messages);
  } catch {
    state = fallbackState(messages);
  }

  const message = await generateSpokenReply(apiKey, conversation, state);
  return sendJson(res, 200, { message });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'POST' && req.url === '/api/entity') return await handleEntity(req, res);
    if (req.method === 'GET' && req.url === '/health') return sendJson(res, 200, { ok:true, service:'entity' });
    return sendJson(res, 404, { error:'Not found' });
  } catch (error) {
    console.error('[entity]', error?.message || error);
    return sendJson(res, 500, { error:error?.message || String(error) });
  }
});

server.listen(PORT, '127.0.0.1', () => console.log(`[entity] Backend local: http://localhost:${PORT}`));
