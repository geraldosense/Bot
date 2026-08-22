export const config = { maxDuration: 10 };

export function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export function parseBody(req) {
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

export function getBearerToken(req) {
  const header = req.headers.authorization || req.headers.Authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

export async function requireVipUser(req) {
  const { verifyToken, sanitizeUser, isVipOrAbove, ensureAuthReady } = await import('./auth/index.js');
  const { findById } = await import('./auth/userStore.js');

  await ensureAuthReady();
  const token = getBearerToken(req);
  if (!token) throw Object.assign(new Error('Não autenticado'), { status: 401 });

  const payload = verifyToken(token);
  if (!payload) throw Object.assign(new Error('Sessão expirada'), { status: 401 });

  const user = sanitizeUser(await findById(payload.sub));
  if (!user) throw Object.assign(new Error('Utilizador não encontrado'), { status: 401 });
  if (!isVipOrAbove(user)) {
    throw Object.assign(new Error('Acesso VIP necessário. Aguarda aprovação do admin.'), { status: 403 });
  }
  return user;
}

export function handleError(res, err) {
  console.error('[vercel]', err);
  sendJson(res, err.status || 500, { error: err.message || 'Erro interno do servidor' });
}
