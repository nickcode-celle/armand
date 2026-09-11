import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const env = {
  ...process.env,
  VITE_BASE44_APP_BASE_URL: process.env.VITE_BASE44_APP_BASE_URL || 'http://localhost:4401'
};

// Keep the recovered V1 source and its conversational prompt untouched.
// For local execution only, remove the obsolete Gemini-key gate that remained
// after the dialogue/memory calls had already moved to OPENAI_API_KEY.
const sourcePath = path.resolve('server/entity-server.mjs');
const runtimePath = path.join(os.tmpdir(), `entity-server-v1-restored-${process.pid}.mjs`);
const source = fs.readFileSync(sourcePath, 'utf8');

const obsoleteGate = `  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;\n\n  if (!apiKey) return sendJson(res, 500, { error: 'GEMINI_API_KEY manquante dans .env.local' });`;
const restoredGate = `  const apiKey = null;\n\n  if (!process.env.OPENAI_API_KEY) return sendJson(res, 500, { error: 'OPENAI_API_KEY manquante dans .env.local' });`;

if (!source.includes(obsoleteGate)) {
  throw new Error('Entity V1: verrou Gemini historique introuvable; arrêt pour éviter toute modification imprévue.');
}

fs.writeFileSync(runtimePath, source.replace(obsoleteGate, restoredGate), 'utf8');

const backend = spawn(process.execPath, [runtimePath], {
  stdio: 'inherit',
  env
});

const frontend = spawn('vite', [], {
  stdio: 'inherit',
  env,
  shell: process.platform === 'win32'
});

let shuttingDown = false;

function cleanupRuntime() {
  try {
    fs.unlinkSync(runtimePath);
  } catch {
    // Already removed or never created.
  }
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  if (!backend.killed) backend.kill('SIGTERM');
  if (!frontend.killed) frontend.kill('SIGTERM');

  cleanupRuntime();
  setTimeout(() => process.exit(code), 100).unref();
}

backend.on('exit', (code) => {
  if (!shuttingDown && code !== 0) shutdown(code || 1);
});

frontend.on('exit', (code) => {
  if (!shuttingDown) shutdown(code || 0);
});

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
process.on('exit', cleanupRuntime);
