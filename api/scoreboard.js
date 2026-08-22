import { requireVipUser, sendJson, handleError } from '../server/vercelHttp.js';
import { getVipSnapshot } from '../server/vercelVip.js';

export { config } from '../server/vercelHttp.js';

export default async function scoreboardHandler(req, res) {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }
  try {
    await requireVipUser(req);
    const snap = await getVipSnapshot();
    return sendJson(res, 200, snap.scoreboard);
  } catch (err) {
    handleError(res, err);
  }
}
