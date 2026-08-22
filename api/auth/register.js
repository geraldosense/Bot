import { ensureAuthReady, ensureAdminSeeded, signToken } from '../../server/auth/index.js';
import { createUser, recordLogin, sanitizeUser } from '../../server/auth/userStore.js';
import { sendJson, parseBody, handleError } from '../../server/vercelHttp.js';

export { config } from '../../server/vercelHttp.js';

export default async function registerHandler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    await ensureAuthReady();
    await ensureAdminSeeded();

    const { email, password, name } = parseBody(req);
    if (!email || !password || !name) {
      return sendJson(res, 400, { error: 'Email, nome e password são obrigatórios' });
    }
    if (password.length < 6) {
      return sendJson(res, 400, { error: 'Password mínimo 6 caracteres' });
    }

    const user = await createUser({ email, password, name });
    await recordLogin(user.id);
    const fresh = sanitizeUser(user);
    const token = signToken(fresh);
    return sendJson(res, 200, {
      token,
      user: fresh,
      message: 'Conta criada! Explora o site — os robôs ficam disponíveis após aprovação VIP.',
    });
  } catch (err) {
    handleError(res, err);
  }
}
