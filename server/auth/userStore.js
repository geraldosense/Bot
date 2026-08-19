import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

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

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify({ users: [] }, null, 2));
  }
}

function readStore() {
  ensureStore();
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}

function writeStore(data) {
  ensureStore();
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
}

export function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}

export async function seedSuperAdmin() {
  const store = readStore();
  if (store.users.some((u) => u.role === ROLES.SUPER_ADMIN)) return null;

  const email = process.env.SUPER_ADMIN_EMAIL || 'senseoliveira6@gmail.com';
  const password = process.env.SUPER_ADMIN_PASSWORD || '12sense12';
  const name = process.env.SUPER_ADMIN_NAME || 'Sense Oliveira';

  const user = {
    id: randomUUID(),
    email: email.toLowerCase(),
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.users.push(user);
  writeStore(store);
  console.log(`[auth] Super Admin criado: ${email}`);
  return sanitizeUser(user);
}

export function findByEmail(email) {
  const store = readStore();
  return store.users.find((u) => u.email === email.toLowerCase()) || null;
}

export function findById(id) {
  const store = readStore();
  return store.users.find((u) => u.id === id) || null;
}

export function listUsers() {
  return readStore().users.map(sanitizeUser);
}

export async function createUser({ email, password, name }) {
  const store = readStore();
  if (findByEmail(email)) {
    throw new Error('Email já registado');
  }

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

  store.users.push(user);
  writeStore(store);
  return sanitizeUser(user);
}

export function recordLogin(userId) {
  const store = readStore();
  const idx = store.users.findIndex((u) => u.id === userId);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  store.users[idx].lastLoginAt = now;
  store.users[idx].lastSeenAt = now;
  store.users[idx].updatedAt = now;
  writeStore(store);
  return sanitizeUser(store.users[idx]);
}

export function touchLastSeen(userId) {
  const store = readStore();
  const idx = store.users.findIndex((u) => u.id === userId);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  store.users[idx].lastSeenAt = now;
  store.users[idx].updatedAt = now;
  writeStore(store);
  return sanitizeUser(store.users[idx]);
}

export function getAccountStats() {
  const users = listUsers();
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

export function approveVip(userId, adminId) {
  const store = readStore();
  const idx = store.users.findIndex((u) => u.id === userId);
  if (idx === -1) throw new Error('Utilizador não encontrado');

  store.users[idx].role = ROLES.VIP;
  store.users[idx].vipApprovedAt = new Date().toISOString();
  store.users[idx].vipApprovedBy = adminId;
  store.users[idx].vipRequest = null;
  store.users[idx].updatedAt = new Date().toISOString();
  writeStore(store);
  return sanitizeUser(store.users[idx]);
}

export function revokeVip(userId) {
  const store = readStore();
  const idx = store.users.findIndex((u) => u.id === userId);
  if (idx === -1) throw new Error('Utilizador não encontrado');
  if (store.users[idx].role === ROLES.SUPER_ADMIN) {
    throw new Error('Não é possível revogar o Chef Máximo');
  }

  store.users[idx].role = ROLES.MEMBER;
  store.users[idx].vipApprovedAt = null;
  store.users[idx].vipApprovedBy = null;
  store.users[idx].vipRequest = null;
  store.users[idx].updatedAt = new Date().toISOString();
  writeStore(store);
  return sanitizeUser(store.users[idx]);
}

export function promoteToAdmin(userId, permissions, superAdminId) {
  const store = readStore();
  const idx = store.users.findIndex((u) => u.id === userId);
  if (idx === -1) throw new Error('Utilizador não encontrado');

  store.users[idx].role = ROLES.ADMIN;
  store.users[idx].permissions = {
    ...DEFAULT_PERMISSIONS,
    ...permissions,
    can_request_vip: true,
    can_manage_admins: false,
  };
  store.users[idx].vipApprovedAt = store.users[idx].vipApprovedAt || new Date().toISOString();
  store.users[idx].vipApprovedBy = store.users[idx].vipApprovedBy || superAdminId;
  store.users[idx].updatedAt = new Date().toISOString();
  writeStore(store);
  return sanitizeUser(store.users[idx]);
}

export function updateAdminPermissions(userId, permissions) {
  const store = readStore();
  const idx = store.users.findIndex((u) => u.id === userId);
  if (idx === -1) throw new Error('Utilizador não encontrado');
  if (store.users[idx].role !== ROLES.ADMIN) {
    throw new Error('Utilizador não é admin');
  }

  store.users[idx].permissions = {
    ...store.users[idx].permissions,
    ...permissions,
    can_manage_admins: false,
  };
  store.users[idx].updatedAt = new Date().toISOString();
  writeStore(store);
  return sanitizeUser(store.users[idx]);
}

export function requestVipPromotion(userId, adminId) {
  const store = readStore();
  const idx = store.users.findIndex((u) => u.id === userId);
  if (idx === -1) throw new Error('Utilizador não encontrado');

  const user = store.users[idx];
  if (user.role !== ROLES.MEMBER) {
    throw new Error('Só membros sem VIP podem ser submetidos para aprovação');
  }

  if (user.vipRequest?.status === 'pending') {
    throw new Error('Já existe um pedido VIP pendente para este utilizador');
  }

  store.users[idx].vipRequest = {
    status: 'pending',
    requestedBy: adminId,
    requestedAt: new Date().toISOString(),
  };
  store.users[idx].updatedAt = new Date().toISOString();
  writeStore(store);
  return sanitizeUser(store.users[idx]);
}

export function rejectVipRequest(userId) {
  const store = readStore();
  const idx = store.users.findIndex((u) => u.id === userId);
  if (idx === -1) throw new Error('Utilizador não encontrado');

  store.users[idx].vipRequest = null;
  store.users[idx].updatedAt = new Date().toISOString();
  writeStore(store);
  return sanitizeUser(store.users[idx]);
}

export function listVipRequests() {
  return readStore()
    .users.filter((u) => u.role === ROLES.MEMBER && u.vipRequest?.status === 'pending')
    .map((u) => {
      const requester = findById(u.vipRequest.requestedBy);
      return {
        ...sanitizeUser(u),
        requestedByName: requester?.name || 'Admin',
        requestedByEmail: requester?.email || '',
      };
    });
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
