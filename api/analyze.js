export default async function analyzeHandler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }
  try {
    const { requireVipUser } = await import('../../server/vercelHttp.js');
    const { runVipSync } = await import('../../server/vercelVip.js');
    await requireVipUser(req);
    const snapshot = await runVipSync();
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true, snapshot }));
  } catch (err) {
    res.statusCode = err.status || 500;
    res.end(JSON.stringify({ error: err.message || 'Erro interno' }));
  }
}

export const config = { maxDuration: 10 };
