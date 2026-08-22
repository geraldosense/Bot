import serverless from 'serverless-http';
import { createApp } from '../server/createApp.js';

export const config = {
  maxDuration: 30,
};

let handler;

export default async function vercelHandler(req, res) {
  try {
    if (!handler) {
      const { app } = await createApp({ vercel: true });
      handler = serverless(app, { binary: false });
    }
    return await handler(req, res);
  } catch (err) {
    console.error('[vercel] API error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message || 'Erro interno do servidor' }));
  }
}
