const SUPABASE_URL = process.env.SUPABASE_URL || 'https://btyescbddoopbbuacyhd.supabase.co';
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_KEY ||
  'sb_publishable_eqZiBte_sQPi_YQQpGpl0w_7aMhJjgr';

const TABLE = 'sense_bot_users';

function headers(extra = {}) {
  return {
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY);
}

export async function pingUsersTable() {
  if (!isSupabaseConfigured()) return { ok: false, reason: 'missing_config' };

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${TABLE}?select=id&limit=1`,
      { headers: headers(), signal: AbortSignal.timeout(10000) },
    );

    if (res.status === 404 || res.status === 406) {
      return { ok: false, reason: 'table_missing' };
    }
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, reason: 'error', detail: text.slice(0, 200) };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: 'network', detail: err.message };
  }
}

function rowToUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.password_hash,
    role: row.role,
    permissions: row.permissions || {},
    vipApprovedAt: row.vip_approved_at,
    vipApprovedBy: row.vip_approved_by,
    vipRequest: row.vip_request,
    lastLoginAt: row.last_login_at,
    lastSeenAt: row.last_seen_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function userToRow(user) {
  return {
    id: user.id,
    email: user.email?.toLowerCase(),
    name: user.name,
    password_hash: user.passwordHash,
    role: user.role,
    permissions: user.permissions || {},
    vip_approved_at: user.vipApprovedAt || null,
    vip_approved_by: user.vipApprovedBy || null,
    vip_request: user.vipRequest || null,
    last_login_at: user.lastLoginAt || null,
    last_seen_at: user.lastSeenAt || null,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  };
}

export async function sbListUsers() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${TABLE}?select=*&order=created_at.desc`,
    { headers: headers(), signal: AbortSignal.timeout(15000) },
  );
  if (!res.ok) throw new Error(`Supabase list users: ${res.status}`);
  const rows = await res.json();
  return rows.map(rowToUser);
}

export async function sbFindByEmail(email) {
  const q = encodeURIComponent(email.toLowerCase());
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${TABLE}?email=eq.${q}&select=*&limit=1`,
    { headers: headers(), signal: AbortSignal.timeout(10000) },
  );
  if (!res.ok) throw new Error(`Supabase find email: ${res.status}`);
  const rows = await res.json();
  return rowToUser(rows[0]) || null;
}

export async function sbFindById(id) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${id}&select=*&limit=1`,
    { headers: headers(), signal: AbortSignal.timeout(10000) },
  );
  if (!res.ok) throw new Error(`Supabase find id: ${res.status}`);
  const rows = await res.json();
  return rowToUser(rows[0]) || null;
}

export async function sbInsertUser(user) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
    method: 'POST',
    headers: headers({ Prefer: 'return=representation' }),
    body: JSON.stringify(userToRow(user)),
    signal: AbortSignal.timeout(10000),
  });

  if (res.status === 409) throw new Error('Email já registado');
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase insert user: ${res.status} ${text.slice(0, 120)}`);
  }

  const rows = await res.json();
  return rowToUser(Array.isArray(rows) ? rows[0] : rows);
}

export async function sbUpdateUser(id, patch) {
  const rowPatch = {};
  if (patch.email !== undefined) rowPatch.email = patch.email?.toLowerCase();
  if (patch.name !== undefined) rowPatch.name = patch.name;
  if (patch.passwordHash !== undefined) rowPatch.password_hash = patch.passwordHash;
  if (patch.role !== undefined) rowPatch.role = patch.role;
  if (patch.permissions !== undefined) rowPatch.permissions = patch.permissions;
  if (patch.vipApprovedAt !== undefined) rowPatch.vip_approved_at = patch.vipApprovedAt;
  if (patch.vipApprovedBy !== undefined) rowPatch.vip_approved_by = patch.vipApprovedBy;
  if (patch.vipRequest !== undefined) rowPatch.vip_request = patch.vipRequest;
  if (patch.lastLoginAt !== undefined) rowPatch.last_login_at = patch.lastLoginAt;
  if (patch.lastSeenAt !== undefined) rowPatch.last_seen_at = patch.lastSeenAt;
  rowPatch.updated_at = new Date().toISOString();

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${id}`, {
    method: 'PATCH',
    headers: headers({ Prefer: 'return=representation' }),
    body: JSON.stringify(rowPatch),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase update user: ${res.status} ${text.slice(0, 120)}`);
  }

  const rows = await res.json();
  const user = rowToUser(Array.isArray(rows) ? rows[0] : rows);
  if (!user) throw new Error('Utilizador não encontrado');
  return user;
}

export async function sbUpsertUsers(users) {
  if (!users.length) return 0;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?on_conflict=id`, {
    method: 'POST',
    headers: headers({
      Prefer: 'resolution=merge-duplicates,return=minimal',
    }),
    body: JSON.stringify(users.map(userToRow)),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase upsert users: ${res.status} ${text.slice(0, 200)}`);
  }

  return users.length;
}
