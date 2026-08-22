import serverless from 'serverless-http';
import { createApp } from '../server/createApp.js';

export const config = {
  maxDuration: 10,
};

let handlerPromise = null;

function getHandler() {
  if (!handlerPromise) {
    handlerPromise = createApp({ vercel: true }).then(({ app }) =>
      serverless(app, { binary: false }),
    );
  }
  return handlerPromise;
}

export default async function vercelHandler(req, res) {
  const path = req.url?.split('?')[0] || '';

  if (path === '/api/health') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'ok', platform: 'vercel' }));
    return;
  }

  try {
    const handler = await getHandler();
    return await handler(req, res);
  } catch (err) {
    console.error('[vercel] API error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message || 'Erro interno do servidor' }));
  }
}
