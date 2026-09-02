import { spawn } from 'node:child_process';

const env = {
  ...process.env,
  VITE_BASE44_APP_BASE_URL: process.env.VITE_BASE44_APP_BASE_URL || 'http://localhost:4401'
};

const backend = spawn(process.execPath, ['server/entity-server-v2.mjs'], {
  stdio: 'inherit',
  env
});

const frontend = spawn('vite', [], {
  stdio: 'inherit',
  env,
  shell: process.platform === 'win32'
});

let shuttingDown = false;
function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  if (!backend.killed) backend.kill('SIGTERM');
  if (!frontend.killed) frontend.kill('SIGTERM');
  setTimeout(() => process.exit(code), 100).unref();
}
backend.on('exit', (code) => { if (!shuttingDown && code !== 0) shutdown(code || 1); });
frontend.on('exit', (code) => { if (!shuttingDown) shutdown(code || 0); });
process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
