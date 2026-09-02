import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../server/entity-server-v2.mjs',import.meta.url),'utf8');
for(const token of ['memory_engine:\'v4\'','schema_version:4','working_memory','orchestrate(','expand(','CONSOLIDATION SÉLECTIVE','contradictoires','engagements','entity_core','revision'])assert.ok(source.includes(token),`missing ${token}`);
assert.ok(!source.includes('@google/genai'),'Gemini dependency leaked into Entity server');
assert.ok(!source.includes('VITE_BASE44_APP_BASE_URL'),'Base44 runtime leaked into Entity server');
console.log('Entity memory smoke tests: OK');
