import {
  ensureAuthReady,
  ensureAdminSeeded,
  signToken,
} from '../../server/auth/index.js';
import {
  findByEmail,
  verifyPassword,
  recordLogin,
  sanitizeUser,
} from '../../server/auth/userStore.js';

export const config = {
  maxDuration: 10,
};

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

export default async function loginHandler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    await ensureAuthReady();
    await ensureAdminSeeded();

    const { email, password } = parseBody(req);
    const raw = await findByEmail(email);
    if (!raw || !(await verifyPassword(raw, password))) {
      return sendJson(res, 401, { error: 'Email ou password incorretos' });
    }

    const user = (await recordLogin(raw.id)) || sanitizeUser(raw);
    const token = signToken(user);
    return sendJson(res, 200, { token, user });
  } catch (err) {
    console.error('[vercel] login error:', err);
    return sendJson(res, 400, { error: err.message || 'Erro no login' });
  }
}
