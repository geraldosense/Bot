export default async function presenceHandler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  try {
    const { ensureAuthReady, verifyToken, sanitizeUser } = await import('../../server/auth/index.js');
    const { findById } = await import('../../server/auth/userStore.js');
    const { getBearerToken } = await import('../../server/vercelHttp.js');

    await ensureAuthReady();
    const token = getBearerToken(req);
    if (!token) {
      res.statusCode = 401;
      return res.end(JSON.stringify({ error: 'Não autenticado' }));
    }

    const payload = verifyToken(token);
    if (!payload) {
      res.statusCode = 401;
      return res.end(JSON.stringify({ error: 'Sessão expirada' }));
    }

    const user = sanitizeUser(await findById(payload.sub));
    if (!user) {
      res.statusCode = 401;
      return res.end(JSON.stringify({ error: 'Utilizador não encontrado' }));
    }

    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true, user }));
  } catch (err) {
    console.error('[vercel] presence error:', err);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: err.message || 'Erro interno' }));
  }
}

export const config = { maxDuration: 10 };
