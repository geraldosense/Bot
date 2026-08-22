import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { SignalEngine } from './signalEngine.js';
import { CasinoDataProvider } from './casinoDataProvider.js';
import { senseSpotStore } from './senseSpotStore.js';
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
export const IS_VERCEL = !!process.env.VERCEL;

let sharedRuntime = null;

async function syncCasinoData(casino) {
  await casino.sync();
}

export async function createApp(options = {}) {
  const vercel = options.vercel ?? IS_VERCEL;

  if (sharedRuntime && vercel) {
    return sharedRuntime;
  }

  const app = express();
  app.set('trust proxy', 1);
  app.use(cors());
  app.use(express.json());

  const activeSessions = new ActiveSessions();
  const vipClients = new Set();

  function broadcast(message) {
    if (vercel) return;
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

  let vercelDataReady = null;
  function ensureVercelDataReady() {
    if (!vercelDataReady) {
      vercelDataReady = (async () => {
        await senseSpotStore.init();
        await engine.bootstrapHistory();
      })();
    }
    return vercelDataReady;
  }

  const syncBeforeVipData = async (_req, _res, next) => {
    try {
      if (vercel) await ensureVercelDataReady();
      await syncCasinoData(casino);
      next();
    } catch (err) {
      next(err);
    }
  };

  let httpServer = null;
  let wss = null;

  if (!vercel) {
    const { createServer } = await import('http');
    const { WebSocketServer } = await import('ws');
    httpServer = createServer(app);
    wss = new WebSocketServer({ server: httpServer });

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
  }

  app.get('/api/health', async (_, res) => {
    res.json({
      status: 'ok',
      platform: vercel ? 'vercel' : 'node',
      storage: getStorageMode(),
      state: engine.state,
      rounds: engine.rounds.length,
      casinoConnected: engine.casinoConnected,
      activeIaUsers: activeSessions.getActiveUsers().length,
    });
  });

  app.get('/api/snapshot', authMiddleware, requireVip, syncBeforeVipData, (_, res) => {
    res.json(engine.getSnapshot());
  });

  app.get('/api/scoreboard', authMiddleware, requireVip, syncBeforeVipData, (_, res) => {
    res.json(engine.getScoreboard());
  });

  app.get('/api/rounds', authMiddleware, requireVip, syncBeforeVipData, (_, res) => {
    res.json(engine.rounds.slice(0, 200));
  });

  app.get('/api/signals', authMiddleware, requireVip, syncBeforeVipData, (_, res) => {
    const snap = engine.getSnapshot();
    res.json({
      current: snap.signal,
      history: snap.history,
      scoreboard: snap.scoreboard,
      monitoring: snap.monitoring,
    });
  });

  app.post('/api/analyze', authMiddleware, requireVip, async (_, res) => {
    await syncCasinoData(casino);
    res.json({ ok: true, snapshot: engine.getSnapshot() });
  });

  if (!vercel) {
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
  }

  if (!vercel) {
    await senseSpotStore.init();
    await engine.bootstrapHistory();
  }

  const runtime = {
    app,
    httpServer,
    engine,
    casino,
    activeSessions,
    vercel,
    async start() {
      if (vercel) return;
      await casino.start();
    },
    stop() {
      casino.stop();
    },
  };

  if (vercel) {
    sharedRuntime = runtime;
  }

  return runtime;
}
