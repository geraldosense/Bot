export { config } from '../server/vercelHttp.js';

export default function healthHandler(_req, res) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ status: 'ok', platform: 'vercel' }));
}
