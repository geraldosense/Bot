#!/usr/bin/env node
/**
 * Go Live — build fresco + servidor + browser (sempre sincronizado com o código)
 */
import { spawn } from 'node:child_process';
import { execSync } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT) || 3001;

function log(msg) {
  console.log(`[go-live] ${msg}`);
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

function waitFor(url, attempts = 60) {
  return new Promise((resolve, reject) => {
    let n = 0;
    const tick = async () => {
      if (await ping(url)) return resolve();
      n++;
      if (n >= attempts) return reject(new Error(`Timeout à espera de ${url}`));
      setTimeout(tick, 500);
    };
    tick();
  });
}

function killPort(port) {
  try {
    execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null`, { stdio: 'ignore' });
  } catch {
    /* porta livre */
  }
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

function runBuild() {
  log('Build de produção…');
  execSync('./node_modules/.bin/vite build', { cwd: ROOT, stdio: 'inherit' });
}

async function main() {
  runBuild();

  killPort(PORT);
  await new Promise((r) => setTimeout(r, 800));

  log(`A iniciar servidor :${PORT}…`);
  const child = spawn('node', ['server/index.js'], {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, PORT: String(PORT) },
  });

  child.on('error', (err) => {
    console.error('[go-live]', err.message);
    process.exit(1);
  });

  process.on('SIGINT', () => {
    child.kill('SIGINT');
    process.exit(0);
  });

  const loginUrl = `http://localhost:${PORT}/login?t=${Date.now()}`;

  try {
    await waitFor(`http://localhost:${PORT}/api/health`);
    log('Pronto — igual ao localhost, em modo produção.');
    openBrowser(loginUrl);
  } catch (err) {
    console.error('[go-live]', err.message);
    child.kill();
    process.exit(1);
  }
}

main();
