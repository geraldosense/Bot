import express from 'express';
import cors from 'cors';
import {
  ensureAuthReady,
  registerAuthRoutes,
  registerAdminRoutes,
  authMiddleware,
  requireVip,
} from './auth/index.js';
import { ActiveSessions } from './auth/activeSessions.js';
import { getVipRuntime, runVipSync } from './vercelVip.js';

let sharedRuntime = null;

export async function createVercelApp() {
  if (sharedRuntime) return sharedRuntime;

  const app = express();
  app.set('trust proxy', 1);
  app.use(cors());
  app.use(express.json());

  const activeSessions = new ActiveSessions();

  app.use(async (req, res, next) => {
    try {
      await ensureAuthReady();
      next();
    } catch (err) {
      next(err);
    }
  });

  registerAuthRoutes(app);
  registerAdminRoutes(app, activeSessions);

  app.get('/api/snapshot', authMiddleware, requireVip, async (_, res, next) => {
    try {
      await runVipSync();
      const { engine } = await getVipRuntime();
      res.json(engine.getSnapshot());
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/scoreboard', authMiddleware, requireVip, async (_, res, next) => {
    try {
      await runVipSync();
      const { engine } = await getVipRuntime();
      res.json(engine.getScoreboard());
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/rounds', authMiddleware, requireVip, async (_, res, next) => {
    try {
      await runVipSync();
      const { engine } = await getVipRuntime();
      res.json(engine.rounds.slice(0, 200));
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/signals', authMiddleware, requireVip, async (_, res, next) => {
    try {
      await runVipSync();
      const { engine } = await getVipRuntime();
      const snap = engine.getSnapshot();
      res.json({
        current: snap.signal,
        history: snap.history,
        scoreboard: snap.scoreboard,
        monitoring: snap.monitoring,
      });
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/analyze', authMiddleware, requireVip, async (_, res, next) => {
    try {
      await runVipSync();
      const { engine } = await getVipRuntime();
      res.json({ ok: true, snapshot: engine.getSnapshot() });
    } catch (err) {
      next(err);
    }
  });

  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: 'Rota API não encontrada' });
  });

  sharedRuntime = {
    app,
    vercel: true,
    activeSessions,
    async start() {},
    stop() {},
  };

  return sharedRuntime;
}
