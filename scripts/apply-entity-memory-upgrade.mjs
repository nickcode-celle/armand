import fs from 'node:fs';

const file='server/entity-server.mjs';
let s=fs.readFileSync(file,'utf8');

function replaceFunction(source,name,replacement){
  const marker=`async function ${name}`;
  const start=source.indexOf(marker);
  if(start<0) throw new Error(`Fonction absente: ${name}`);
  const brace=source.indexOf('{',start);
  let depth=0,inStr=null,esc=false;
  for(let i=brace;i<source.length;i++){
    const ch=source[i];
    if(inStr){if(esc)esc=false;else if(ch==='\\')esc=true;else if(ch===inStr)inStr=null;continue;}
    if(ch==='"'||ch==="'"||ch==='`'){inStr=ch;continue;}
    if(ch==='{')depth++; else if(ch==='}'&&--depth===0)return source.slice(0,start)+replacement+source.slice(i+1);
  }
  throw new Error(`Bloc non fermé: ${name}`);
}

if(!s.includes("./entity-memory-engine.mjs")) s=s.replace("import path from 'node:path';", "import path from 'node:path';\nimport * as memoryEngine from './entity-memory-engine.mjs';");

const recallFn=`async function selectRelevantMemory(apiKey, entityId, memory, conversation) {
  return memoryEngine.recall({
    entityId,
    memory,
    conversation,
    embedFn: (text) => getEmbedding(apiKey, text),
  });
}`;
s=replaceFunction(s,'selectRelevantMemory',recallFn);

const consolidateFn=`async function buildEntityMemory(apiKey, previousMemory, newConversation) {
  return memoryEngine.consolidate({
    apiKey,
    previousMemory,
    newConversation,
    recallFn: (memory, conversation) => selectRelevantMemory(apiKey, 'consolidation', memory, conversation),
    openaiFn: openai,
    memoryPrompt: MEMORY_PROMPT,
  });
}`;
s=replaceFunction(s,'buildEntityMemory',consolidateFn);

s=s.replace("const RECENT_MESSAGE_LIMIT = 12;", "const RECENT_MESSAGE_LIMIT = Math.max(8, Math.min(20, Number(process.env.ENTITY_RECENT_MESSAGE_LIMIT || 12)));\n  const REQUEST_STARTED_AT = Date.now();");
s=s.replace("return sendJson(res, 200, { message, memory });", "return sendJson(res, 200, { message, memory, meta: { request_ms: Date.now() - REQUEST_STARTED_AT, memory_engine: 'v2' } });");

if(!s.includes('function invalidateMemoryIndexes')){
  const anchor='const ENTITY_MEMORY_TYPES = [';
  const pos=s.indexOf(anchor);
  const helper=`function invalidateMemoryIndexes(entityId) {\n  const safe = safeEntityId(entityId);\n  if (!safe) return;\n  try {\n    const file = path.join(ENTITY_EMBEDDING_DIR, `${safe}.index.json`);\n    if (fs.existsSync(file)) fs.unlinkSync(file);\n  } catch {}\n}\n\n`;
  s=s.slice(0,pos)+helper+s.slice(pos);
}

s=s.replace("saveEntityMemory(entityId, memory);\n      clearPendingMemory(entityId);", "saveEntityMemory(entityId, memory);\n      invalidateMemoryIndexes(entityId);\n      clearPendingMemory(entityId);");

fs.writeFileSync(file,s,'utf8');
console.log('Entity memory architecture upgraded');
