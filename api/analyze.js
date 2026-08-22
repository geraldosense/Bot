import { requireVipUser, sendJson, handleError } from '../server/vercelHttp.js';
import { runVipSync } from '../server/vercelVip.js';

export { config } from '../server/vercelHttp.js';

export default async function analyzeHandler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }
  try {
    await requireVipUser(req);
    const snapshot = await runVipSync();
    return sendJson(res, 200, { ok: true, snapshot });
  } catch (err) {
    handleError(res, err);
  }
}
