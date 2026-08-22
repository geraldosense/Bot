import { ensureAuthReady } from '../../server/auth/index.js';
import { findById, touchLastSeen, sanitizeUser } from '../../server/auth/userStore.js';
import { verifyToken } from '../../server/auth/index.js';
import { sendJson, getBearerToken, handleError } from '../../server/vercelHttp.js';

export { config } from '../../server/vercelHttp.js';

export default async function presenceHandler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    await ensureAuthReady();
    const token = getBearerToken(req);
    if (!token) return sendJson(res, 401, { error: 'Não autenticado' });

    const payload = verifyToken(token);
    if (!payload) return sendJson(res, 401, { error: 'Sessão expirada' });

    const user = sanitizeUser(await findById(payload.sub));
    if (!user) return sendJson(res, 401, { error: 'Utilizador não encontrado' });

    const fresh = (await touchLastSeen(user.id)) || user;
    return sendJson(res, 200, { ok: true, user: sanitizeUser(fresh) });
  } catch (err) {
    handleError(res, err);
  }
}
