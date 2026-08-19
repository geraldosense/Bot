import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import {
  pingUsersTable,
  sbFindByEmail,
  sbFindById,
  sbInsertUser,
  sbListUsers,
  sbUpdateUser,
  sbUpsertUsers,
} from './supabaseClient.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  VIP: 'vip',
  MEMBER: 'member',
};

const DEFAULT_PERMISSIONS = {
  can_request_vip: false,
  can_view_active_users: false,
  can_manage_admins: false,
};

/** @type {'supabase' | 'file'} */
let storageMode = 'file';
let storeReady = false;

function ensureFileStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify({ users: [] }, null, 2));
  }
}

function readFileStore() {
  ensureFileStore();
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}

function writeFileStore(data) {
  ensureFileStore();
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
}

function readFileUsers() {
  return readFileStore().users;
}

function writeFileUser(user) {
  const store = readFileStore();
  const idx = store.users.findIndex((u) => u.id === user.id);
  if (idx === -1) store.users.push(user);
  else store.users[idx] = user;
  writeFileStore(store);
  return user;
}

export function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}

export function getStorageMode() {
  return storageMode;
}

export async function initUserStore() {
  if (storeReady) return storageMode;

  const ping = await pingUsersTable();
  if (ping.ok) {
    storageMode = 'supabase';
    storeReady = true;
    await migrateFileUsersToSupabase();
    console.log('[auth] Base de dados Supabase activa — contas persistentes');
    return storageMode;
  }

  storageMode = 'file';
  storeReady = true;
  ensureFileStore();

  if (ping.reason === 'table_missing') {
    console.warn(
      '[auth] AVISO: Tabela sense_bot_users não existe no Supabase. A usar ficheiro local (dados perdem-se no Render).',
    );
    console.warn('[auth] Executa supabase/sense_bot_users.sql no SQL Editor do Supabase.');
    console.warn('[auth] Ou corre: npm run db:setup');
  } else if (ping.reason === 'missing_key' || ping.reason === 'invalid_key') {
    console.warn(
      '[auth] AVISO: SUPABASE_SERVICE_ROLE_KEY em falta ou inválida. A usar ficheiro local.',
    );
    console.warn('[auth] Define a chave service_role no Render → Environment.');
  } else {
    console.warn(`[auth] Supabase indisponível (${ping.reason}) — a usar ficheiro local`);
  }

  return storageMode;
}

async function migrateFileUsersToSupabase() {
  try {
    const existing = await sbListUsers();
    if (existing.length > 0) return;

    const fileUsers = readFileUsers();
    if (!fileUsers.length) return;

    await sbUpsertUsers(fileUsers);
    console.log(`[auth] Migrados ${fileUsers.length} utilizador(es) do ficheiro local → Supabase`);
  } catch (err) {
    console.error('[auth] Erro na migração para Supabase:', err.message);
  }
}

export async function seedSuperAdmin() {
  await initUserStore();

  const email = (process.env.SUPER_ADMIN_EMAIL || 'senseoliveira6@gmail.com').toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD || '12sense12';
  const name = process.env.SUPER_ADMIN_NAME || 'Sense Oliveira';

  const existing = await findByEmail(email);
  if (existing) {
    if (existing.role !== ROLES.SUPER_ADMIN) {
      await updateUserRecord(existing.id, {
        role: ROLES.SUPER_ADMIN,
        permissions: {
          can_request_vip: true,
          can_view_active_users: true,
          can_manage_admins: true,
        },
      });
    }
    return sanitizeUser(await findById(existing.id));
  }

  const anySuper = (await listUsers()).find((u) => u.role === ROLES.SUPER_ADMIN);
  if (anySuper) return null;

  const user = {
    id: randomUUID(),
    email,
    name,
    passwordHash: await bcrypt.hash(password, 10),
    role: ROLES.SUPER_ADMIN,
    permissions: {
      can_request_vip: true,
      can_view_active_users: true,
      can_manage_admins: true,
    },
    vipApprovedAt: new Date().toISOString(),
    vipApprovedBy: 'system',
    vipRequest: null,
    lastLoginAt: null,
    lastSeenAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await persistUser(user);
  console.log(`[auth] Super Admin criado: ${email}`);
  return sanitizeUser(user);
}

async function persistUser(user) {
  if (storageMode === 'supabase') {
    const found = await sbFindById(user.id);
    if (found) return sbUpdateUser(user.id, user);
    return sbInsertUser(user);
  }
  writeFileUser(user);
  return user;
}

async function updateUserRecord(id, patch) {
  if (storageMode === 'supabase') {
    return sbUpdateUser(id, { ...patch, updatedAt: new Date().toISOString() });
  }

  const store = readFileStore();
  const idx = store.users.findIndex((u) => u.id === id);
  if (idx === -1) throw new Error('Utilizador não encontrado');
  store.users[idx] = {
    ...store.users[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  writeFileStore(store);
  return store.users[idx];
}

export async function findByEmail(email) {
  await initUserStore();
  if (storageMode === 'supabase') return sbFindByEmail(email);
  return readFileUsers().find((u) => u.email === email.toLowerCase()) || null;
}

export async function findById(id) {
  await initUserStore();
  if (storageMode === 'supabase') return sbFindById(id);
  return readFileUsers().find((u) => u.id === id) || null;
}

export async function listUsers() {
  await initUserStore();
  if (storageMode === 'supabase') return sbListUsers();
  return readFileUsers();
}

export async function createUser({ email, password, name }) {
  await initUserStore();
  if (await findByEmail(email)) throw new Error('Email já registado');

  const user = {
    id: randomUUID(),
    email: email.toLowerCase(),
    name: name.trim(),
    passwordHash: await bcrypt.hash(password, 10),
    role: ROLES.MEMBER,
    permissions: { ...DEFAULT_PERMISSIONS },
    vipApprovedAt: null,
    vipApprovedBy: null,
    vipRequest: null,
    lastLoginAt: null,
    lastSeenAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await persistUser(user);
  return sanitizeUser(user);
}

export async function recordLogin(userId) {
  const now = new Date().toISOString();
  const user = await updateUserRecord(userId, { lastLoginAt: now, lastSeenAt: now });
  return sanitizeUser(user);
}

export async function touchLastSeen(userId) {
  const now = new Date().toISOString();
  const user = await updateUserRecord(userId, { lastSeenAt: now });
  return sanitizeUser(user);
}

export async function getAccountStats() {
  const users = (await listUsers()).map(sanitizeUser);
  const registered = users.filter((u) => u.role !== ROLES.SUPER_ADMIN);
  return {
    total: registered.length,
    members: registered.filter((u) => u.role === ROLES.MEMBER).length,
    vip: registered.filter((u) => u.role === ROLES.VIP).length,
    admins: registered.filter((u) => u.role === ROLES.ADMIN).length,
    vipRequests: registered.filter((u) => u.vipRequest?.status === 'pending').length,
  };
}

export async function verifyPassword(user, password) {
  return bcrypt.compare(password, user.passwordHash);
}

export async function approveVip(userId, adminId) {
  const user = await updateUserRecord(userId, {
    role: ROLES.VIP,
    vipApprovedAt: new Date().toISOString(),
    vipApprovedBy: adminId,
    vipRequest: null,
  });
  return sanitizeUser(user);
}

export async function revokeVip(userId) {
  const user = await findById(userId);
  if (!user) throw new Error('Utilizador não encontrado');
  if (user.role === ROLES.SUPER_ADMIN) {
    throw new Error('Não é possível revogar o Chef Máximo');
  }
  if (user.role !== ROLES.VIP) {
    throw new Error('Só contas VIP podem ser removidas da área VIP');
  }

  const updated = await updateUserRecord(userId, {
    role: ROLES.MEMBER,
    vipApprovedAt: null,
    vipApprovedBy: null,
    vipRequest: null,
  });
  return sanitizeUser(updated);
}

export async function promoteToAdmin(userId, permissions, superAdminId) {
  const user = await findById(userId);
  if (!user) throw new Error('Utilizador não encontrado');

  const updated = await updateUserRecord(userId, {
    role: ROLES.ADMIN,
    permissions: {
      ...DEFAULT_PERMISSIONS,
      ...permissions,
      can_request_vip: true,
      can_manage_admins: false,
    },
    vipApprovedAt: user.vipApprovedAt || new Date().toISOString(),
    vipApprovedBy: user.vipApprovedBy || superAdminId,
  });
  return sanitizeUser(updated);
}

export async function updateAdminPermissions(userId, permissions) {
  const user = await findById(userId);
  if (!user) throw new Error('Utilizador não encontrado');
  if (user.role !== ROLES.ADMIN) throw new Error('Utilizador não é admin');

  const updated = await updateUserRecord(userId, {
    permissions: {
      ...user.permissions,
      ...permissions,
      can_manage_admins: false,
    },
  });
  return sanitizeUser(updated);
}

export async function requestVipPromotion(userId, adminId) {
  const user = await findById(userId);
  if (!user) throw new Error('Utilizador não encontrado');
  if (user.role !== ROLES.MEMBER) {
    throw new Error('Só membros sem VIP podem ser submetidos para aprovação');
  }
  if (user.vipRequest?.status === 'pending') {
    throw new Error('Já existe um pedido VIP pendente para este utilizador');
  }

  const updated = await updateUserRecord(userId, {
    vipRequest: {
      status: 'pending',
      requestedBy: adminId,
      requestedAt: new Date().toISOString(),
    },
  });
  return sanitizeUser(updated);
}

export async function rejectVipRequest(userId) {
  const updated = await updateUserRecord(userId, { vipRequest: null });
  return sanitizeUser(updated);
}

export async function listVipRequests() {
  const users = await listUsers();
  const requests = [];

  for (const u of users) {
    if (u.role !== ROLES.MEMBER || u.vipRequest?.status !== 'pending') continue;
    const requester = await findById(u.vipRequest.requestedBy);
    requests.push({
      ...sanitizeUser(u),
      requestedByName: requester?.name || 'Admin',
      requestedByEmail: requester?.email || '',
    });
  }

  return requests;
}

export function hasPermission(user, permission) {
  if (!user) return false;
  if (user.role === ROLES.SUPER_ADMIN) return true;
  if (user.role === ROLES.ADMIN) return !!user.permissions?.[permission];
  return false;
}

export function isVipOrAbove(user) {
  return [ROLES.VIP, ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(user?.role);
}

export function isAdminOrAbove(user) {
  return [ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(user?.role);
}
