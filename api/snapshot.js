import { handleError, requireVipUser, sendJson } from '../../server/vercelHttp.js';
import { runVipSync, getVipRuntime } from '../../server/vercelVip.js';

export { config } from '../../server/vercelHttp.js';

export default async function snapshotHandler(req, res) {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }
  try {
    await requireVipUser(req);
    await runVipSync();
    const { engine } = await getVipRuntime();
    return sendJson(res, 200, engine.getSnapshot());
  } catch (err) {
    handleError(res, err);
  }
}
