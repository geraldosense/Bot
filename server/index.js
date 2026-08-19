import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { SignalEngine } from './signalEngine.js';
import { CasinoDataProvider } from './casinoDataProvider.js';
import {
  initAuth,
  registerAuthRoutes,
  registerAdminRoutes,
  authMiddleware,
  requireVip,
  verifyToken,
  sanitizeUser,
  findById,
  isVipOrAbove,
  getStorageMode,
} from './auth/index.js';
import { ActiveSessions } from './auth/activeSessions.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const app = express();

app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });
const vipClients = new Set();
const activeSessions = new ActiveSessions();

function broadcast(message) {
  const payload = JSON.stringify(message);
  for (const ws of vipClients) {
    if (ws.readyState === 1) ws.send(payload);
  }
}

const engine = new SignalEngine(broadcast);

const casino = new CasinoDataProvider({
  onRounds: (rounds, meta) => engine.setCasinoRounds(rounds, meta),
  onSignal: (signal) => engine.setCasinoSignal(signal),
  onStatus: (status) => engine.setCasinoStatus(status),
  onSyncScoreboard: (data) => engine.syncScoreboardData(data),
});

await initAuth();
registerAuthRoutes(app);
registerAdminRoutes(app, activeSessions);

wss.on('connection', async (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get('token');
  const payload = token ? verifyToken(token) : null;
  const rawUser = payload ? await findById(payload.sub) : null;
  const user = sanitizeUser(rawUser);

  if (!user || !isVipOrAbove(user)) {
    ws.send(JSON.stringify({ type: 'auth_error', error: 'Acesso VIP necessário' }));
    ws.close(4403, 'VIP required');
    return;
  }

  activeSessions.register(ws, user);
  vipClients.add(ws);
  ws.send(JSON.stringify({ type: 'snapshot', data: engine.getSnapshot() }));

  ws.on('message', (raw) => {
    try {
      activeSessions.touch(ws);
      const msg = JSON.parse(raw);
      if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
        return;
      }
      if (msg.type === 'force_analyze') casino.sync();
      if (msg.type === 'get_snapshot') {
        ws.send(JSON.stringify({ type: 'snapshot', data: engine.getSnapshot() }));
      }
    } catch {
      /* ignore */
    }
  });

  ws.on('close', () => {
    vipClients.delete(ws);
    activeSessions.remove(ws);
  });
});

app.get('/api/health', (_, res) => {
  res.json({
    status: 'ok',
    storage: getStorageMode(),
    state: engine.state,
    rounds: engine.rounds.length,
    casinoConnected: engine.casinoConnected,
    activeIaUsers: activeSessions.getActiveUsers().length,
  });
});

app.get('/api/snapshot', authMiddleware, requireVip, (_, res) => {
  res.json(engine.getSnapshot());
});

app.get('/api/scoreboard', authMiddleware, requireVip, (_, res) => {
  res.json(engine.getScoreboard());
});

app.get('/api/rounds', authMiddleware, requireVip, (_, res) => {
  res.json(engine.rounds.slice(0, 200));
});

app.get('/api/signals', authMiddleware, requireVip, (_, res) => {
  const snap = engine.getSnapshot();
  res.json({
    current: snap.signal,
    history: snap.history,
    scoreboard: snap.scoreboard,
    monitoring: snap.monitoring,
  });
});

app.post('/api/analyze', authMiddleware, requireVip, async (_, res) => {
  await casino.sync();
  res.json({ ok: true, snapshot: engine.getSnapshot() });
});

const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Rota API não encontrada' });
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) res.status(404).json({ error: 'Build frontend first: npm run build' });
  });
});

httpServer.listen(PORT, '0.0.0.0', async () => {
  await casino.start();
  const base = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  console.log(`🎰 Sense Bot — Evolution Casino LIVE`);
  console.log(`   ${base}`);
  console.log(`   Auth: login → registo → aprovação VIP`);
});

process.on('SIGINT', () => {
  casino.stop();
  process.exit(0);
});
