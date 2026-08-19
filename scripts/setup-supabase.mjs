#!/usr/bin/env node
/**
 * Configuração completa Supabase — executar uma vez no Mac:
 *   1. Cria .env com SUPABASE_SERVICE_ROLE_KEY
 *   2. npm run db:setup
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadEnv } from './load-env.mjs';
import { pingUsersTable, sbListUsers } from '../server/auth/supabaseClient.js';
import { initUserStore, getStorageMode } from '../server/auth/userStore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SQL_FILE = path.join(ROOT, 'supabase/sense_bot_users.sql');
const RENDER_URL = 'https://sense-bot-f2yw.onrender.com';

loadEnv();

const SUPABASE_URL =
  process.env.SUPABASE_URL || 'https://btyescbddoopbbuacyhd.supabase.co';
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_KEY ||
  '';

function step(n, title) {
  console.log(`\n${'─'.repeat(60)}\n${n}. ${title}\n${'─'.repeat(60)}`);
}

function fail(msg) {
  console.error(`\n✗ ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`✓ ${msg}`);
}

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║     Sense Bot — Configuração Supabase (uma vez)         ║');
console.log('╚══════════════════════════════════════════════════════════╝');

step(1, 'Verificar chave service_role');

if (!SERVICE_KEY) {
  console.log(`
Ainda não tens SUPABASE_SERVICE_ROLE_KEY.

Como obter:
  1. Abre https://supabase.com/dashboard
  2. Projecto → Settings → API
  3. Copia a chave "service_role" (secret — nunca no frontend)

Depois cria o ficheiro .env na raiz do projecto:

  SUPABASE_URL=${SUPABASE_URL}
  SUPABASE_SERVICE_ROLE_KEY=cola_a_chave_service_role_aqui

Corre outra vez: npm run db:setup
`);
  process.exit(1);
}

if (SERVICE_KEY.startsWith('sb_publishable_')) {
  fail(
    'Estás a usar a chave "publishable" (anon). Precisas da chave "service_role" (secret).',
  );
}

ok(`SUPABASE_URL: ${SUPABASE_URL}`);
ok('Chave service_role definida');

step(2, 'Verificar tabela sense_bot_users');

let ping = await pingUsersTable();

if (!ping.ok && ping.reason === 'table_missing') {
  console.log(`
A tabela ainda NÃO existe no Supabase. Cria-a agora:

  1. Abre https://supabase.com/dashboard/project/btyescbddoopbbuacyhd/sql/new
  2. Cola o SQL abaixo (ou copia de supabase/sense_bot_users.sql)
  3. Clica RUN

--- SQL (copiar) ---
${fs.readFileSync(SQL_FILE, 'utf8')}
--- fim SQL ---

Depois de clicar RUN, corre outra vez: npm run db:setup
`);
  process.exit(1);
}

if (!ping.ok) {
  fail(`Supabase respondeu: ${ping.reason}${ping.detail ? ` — ${ping.detail}` : ''}`);
}

ok('Tabela sense_bot_users encontrada');

step(3, 'Ligar base de dados');

await initUserStore();
const mode = getStorageMode();
if (mode !== 'supabase') fail(`Modo inesperado: ${mode}`);
ok('Modo supabase activo — contas persistentes');

const users = await sbListUsers();
console.log(`\nContas na base de dados: ${users.length}`);
users.forEach((u) => console.log(`  • ${u.email} (${u.role})`));

step(4, 'Render.com — variáveis de ambiente (obrigatório)');

console.log(`
No painel Render → sense-bot → Environment, confirma estas variáveis:

  SUPABASE_URL=${SUPABASE_URL}
  SUPABASE_SERVICE_ROLE_KEY=<a mesma chave service_role do .env>

Depois: Manual Deploy → Deploy latest commit.

Verificar online:
  curl ${RENDER_URL}/api/health

Deve aparecer: "storage":"supabase"  (não "file")
`);

step(5, 'Importar contas locais (opcional)');

const usersFile = path.join(ROOT, 'server/data/users.json');
if (fs.existsSync(usersFile)) {
  console.log('Encontrado server/data/users.json — corre: npm run db:import');
} else {
  console.log('Sem ficheiro local — contas novas ficam só no Supabase.');
}

console.log('\n✓ Setup local concluído. Falta só confirmar env no Render e fazer deploy.\n');
