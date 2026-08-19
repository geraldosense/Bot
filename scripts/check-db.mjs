#!/usr/bin/env node
/** Verifica ligação à tabela sense_bot_users no Supabase */
import { pingUsersTable, sbListUsers } from '../server/auth/supabaseClient.js';
import { initUserStore, getStorageMode } from '../server/auth/userStore.js';

const ping = await pingUsersTable();
console.log('Ping Supabase:', ping);

if (ping.ok) {
  await initUserStore();
  const users = await sbListUsers();
  console.log(`Modo: ${getStorageMode()}`);
  console.log(`Utilizadores na base de dados: ${users.length}`);
  users.forEach((u) => console.log(`  - ${u.email} (${u.role})`));
} else if (ping.reason === 'table_missing') {
  console.log('\n⚠️  Executa o SQL em supabase/sense_bot_users.sql no Supabase Dashboard.');
}

process.exit(ping.ok ? 0 : 1);
