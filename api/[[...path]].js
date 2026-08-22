import serverless from 'serverless-http';
import { createApp } from '../server/createApp.js';

let handler;

export default async function vercelHandler(req, res) {
  if (!handler) {
    const { app } = await createApp({ vercel: true });
    handler = serverless(app, { binary: false });
  }
  return handler(req, res);
}
