import serverless from 'serverless-http';
import { createVercelApp } from '../server/createVercelApp.js';
import { sendJson } from '../server/vercelHttp.js';

export const config = { maxDuration: 10 };

let handlerPromise = null;

function getHandler() {
  if (!handlerPromise) {
    handlerPromise = createVercelApp().then(({ app }) => serverless(app, { binary: false }));
  }
  return handlerPromise;
}

/** Rotas /api/admin/* — resto da API tem ficheiros dedicados */
export default async function adminHandler(req, res) {
  const path = req.url?.split('?')[0] || '';
  if (!path.startsWith('/api/admin')) {
    return sendJson(res, 404, { error: 'Rota API não encontrada' });
  }

  try {
    const handler = await getHandler();
    return await handler(req, res);
  } catch (err) {
    console.error('[vercel] admin error:', err);
    sendJson(res, 500, { error: err.message || 'Erro interno' });
  }
}
