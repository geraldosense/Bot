#!/usr/bin/env node
/**
 * Go Live Dev — API :3001 + Vite :5173 + abrir browser
 * URL: http://localhost:5173/login
 */
import { spawn } from 'node:child_process';
import { execSync } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const VITE_URL = 'http://localhost:5173/login';
const VITE_HEALTH = 'http://localhost:5173/';
const API_HEALTH = 'http://localhost:3001/api/health';

function log(msg) {
  console.log(`[go-live:dev] ${msg}`);
}

function ping(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function waitForBoth() {
  return new Promise((resolve, reject) => {
    let n = 0;
    const tick = async () => {
      const [api, vite] = await Promise.all([ping(API_HEALTH), ping(VITE_HEALTH)]);
      if (api && vite) return resolve();
      n++;
      if (n >= 90) return reject(new Error('Timeout — API ou Vite não arrancou'));
      setTimeout(tick, 500);
    };
    tick();
  });
}

function openBrowser(target) {
  const platform = process.platform;
  try {
    if (platform === 'darwin') execSync(`open "${target}"`, { stdio: 'ignore' });
    else if (platform === 'win32') execSync(`start "" "${target}"`, { stdio: 'ignore', shell: true });
    else execSync(`xdg-open "${target}"`, { stdio: 'ignore' });
    log(`Browser: ${target}`);
  } catch {
    log(`Abre manualmente: ${target}`);
  }
}

async function main() {
  if ((await ping(API_HEALTH)) && (await ping(VITE_HEALTH))) {
    log('Dev já activo');
    openBrowser(VITE_URL);
    return;
  }

  log('A iniciar API + Vite…');

  const api = spawn('node', ['server/index.js'], { cwd: ROOT, stdio: 'inherit' });
  const vite = spawn('./node_modules/.bin/vite', ['--host', '--strictPort'], {
    cwd: ROOT,
    stdio: 'inherit',
  });

  const cleanup = (code = 0) => {
    api.kill('SIGINT');
    vite.kill('SIGINT');
    process.exit(code);
  };

  api.on('error', (e) => {
    console.error(e);
    cleanup(1);
  });
  vite.on('error', (e) => {
    console.error(e);
    cleanup(1);
  });

  process.on('SIGINT', () => cleanup(0));

  try {
    await waitForBoth();
    log('Dev pronto.');
    openBrowser(VITE_URL);
  } catch (err) {
    console.error('[go-live:dev]', err.message);
    cleanup(1);
  }
}

main();
