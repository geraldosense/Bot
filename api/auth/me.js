import { ensureAuthReady, verifyToken, sanitizeUser } from '../../server/auth/index.js';
import { findById } from '../../server/auth/userStore.js';
import { getBearerToken, sendJson, handleError } from '../../server/vercelHttp.js';

export { config } from '../../server/vercelHttp.js';

export default async function meHandler(req, res) {
  if (req.method !== 'GET') {
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

    return sendJson(res, 200, { user });
  } catch (err) {
    handleError(res, err);
  }
}
