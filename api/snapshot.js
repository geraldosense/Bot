export default async function snapshotHandler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  try {
    const { requireVipUser } = await import('../../server/vercelHttp.js');
    const { getVipSnapshot } = await import('../../server/vercelVip.js');

    await requireVipUser(req);
    const snapshot = await getVipSnapshot();
    res.statusCode = 200;
    res.end(JSON.stringify(snapshot));
  } catch (err) {
    console.error('[vercel] snapshot error:', err);
    res.statusCode = err.status || 500;
    res.end(JSON.stringify({ error: err.message || 'Erro interno' }));
  }
}

export const config = { maxDuration: 10 };
