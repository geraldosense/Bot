import { handleError, requireVipUser, sendJson } from '../../server/vercelHttp.js';
import { runVipSync, getVipRuntime } from '../../server/vercelVip.js';

export { config } from '../../server/vercelHttp.js';

export default async function analyzeHandler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }
  try {
    await requireVipUser(req);
    await runVipSync();
    const { engine } = await getVipRuntime();
    return sendJson(res, 200, { ok: true, snapshot: engine.getSnapshot() });
  } catch (err) {
    handleError(res, err);
  }
}
