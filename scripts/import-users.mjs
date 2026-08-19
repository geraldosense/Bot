#!/usr/bin/env node
/**
 * Importa contas de server/data/users.json → Supabase (executar uma vez)
 * Requer SUPABASE_SERVICE_ROLE_KEY no ambiente ou .env
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadEnv } from './load-env.mjs';
import { pingUsersTable, sbListUsers, sbUpsertUsers } from '../server/auth/supabaseClient.js';

loadEnv();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const USERS_FILE = path.join(__dirname, '../server/data/users.json');

const ping = await pingUsersTable();
if (!ping.ok) {
  console.error('Supabase não disponível:', ping);
  console.error('1. Executa supabase/sense_bot_users.sql no Supabase');
  console.error('2. Define SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!fs.existsSync(USERS_FILE)) {
  console.error('Ficheiro não encontrado:', USERS_FILE);
  process.exit(1);
}

const { users } = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
if (!users?.length) {
  console.log('Nenhum utilizador no ficheiro local.');
  process.exit(0);
}

const before = await sbListUsers();
await sbUpsertUsers(users);
const after = await sbListUsers();

console.log(`Importados ${users.length} utilizador(es).`);
console.log(`Base de dados: ${before.length} → ${after.length} contas`);
after.forEach((u) => console.log(`  ✓ ${u.email} (${u.role})`));
