import jwt from 'jsonwebtoken';
import {
  findById,
  sanitizeUser,
  createUser,
  findByEmail,
  verifyPassword,
  seedSuperAdmin,
  initUserStore,
  isVipOrAbove,
  isAdminOrAbove,
  hasPermission,
  approveVip,
  revokeVip,
  promoteToAdmin,
  updateAdminPermissions,
  listUsers,
  listVipRequests,
  requestVipPromotion,
  rejectVipRequest,
  requestVipRevocation,
  listVipRevocationRequests,
  approveVipRevocation,
  rejectVipRevocationRequest,
  demoteAdmin,
  promoteToManager,
  demoteManager,
  recordLogin,
  touchLastSeen,
  getAccountStats,
  getStorageMode,
  ROLES,
} from './userStore.js';
import { isManagerOrAbove } from './roleHierarchy.js';

const JWT_SECRET = process.env.JWT_SECRET || 'bac-bo-bot-secret-change-in-production';
const JWT_EXPIRES = '7d';
let adminSeeded = false;

export async function initAuth() {
  await initUserStore();
  if (!process.env.VERCEL) {
    await seedSuperAdmin();
    adminSeeded = true;
  }
}

async function ensureAdminSeeded() {
  if (adminSeeded) return;
  await seedSuperAdmin();
  adminSeeded = true;
}

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: 'Não autenticado' });
    }
    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Sessão expirada' });
    }
    const user = sanitizeUser(await findById(payload.sub));
    if (!user) {
      return res.status(401).json({ error: 'Utilizador não encontrado' });
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireVip(req, res, next) {
  if (!isVipOrAbove(req.user)) {
    return res.status(403).json({ error: 'Acesso VIP necessário. Aguarda aprovação do admin.' });
  }
  next();
}

export function requireAdmin(req, res, next) {
  if (!isAdminOrAbove(req.user)) {
    return res.status(403).json({ error: 'Acesso admin necessário' });
  }
  next();
}

export function requireManagerOrAbove(req, res, next) {
  if (!isManagerOrAbove(req.user)) {
    return res.status(403).json({ error: 'Acesso Proprietário ou Gerente necessário' });
  }
  next();
}

export function requireSuperAdmin(req, res, next) {
  if (req.user.role !== ROLES.SUPER_ADMIN) {
    return res.status(403).json({ error: 'Acesso Proprietário necessário' });
  }
  next();
}

export function requirePermission(permission) {
  return (req, res, next) => {
    if (!hasPermission(req.user, permission)) {
      return res.status(403).json({ error: 'Sem permissão para esta ação' });
    }
    next();
  };
}

export function registerAuthRoutes(app) {
  app.post('/api/auth/register', async (req, res) => {
    try {
      await ensureAdminSeeded();
      const { email, password, name } = req.body;
      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, nome e password são obrigatórios' });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password mínimo 6 caracteres' });
      }
      const user = await createUser({ email, password, name });
      await recordLogin(user.id);
      const fresh = sanitizeUser(await findById(user.id));
      const token = signToken(fresh);
      res.json({
        token,
        user: fresh,
        message: 'Conta criada! Explora o site — os robôs ficam disponíveis após aprovação VIP.',
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      await ensureAdminSeeded();
      const { email, password } = req.body;
      const raw = await findByEmail(email);
      if (!raw || !(await verifyPassword(raw, password))) {
        return res.status(401).json({ error: 'Email ou password incorretos' });
      }
      const user = (await recordLogin(raw.id)) || sanitizeUser(raw);
      const token = signToken(user);
      res.json({ token, user });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/auth/me', authMiddleware, async (req, res) => {
    const user = (await touchLastSeen(req.user.id)) || req.user;
    res.json({ user });
  });

  app.post('/api/auth/presence', authMiddleware, async (req, res) => {
    const user = (await touchLastSeen(req.user.id)) || req.user;
    res.json({ ok: true, user });
  });
}

function enrichUsersWithActivity(users, activeSessions, onlineMs = 5 * 60 * 1000) {
  const iaByUser = new Map();
  for (const u of activeSessions.getActiveUsers()) {
    iaByUser.set(u.userId, u);
  }
  const now = Date.now();

  return users
    .filter((u) => u.role !== ROLES.SUPER_ADMIN)
    .map((u) => {
      const ia = iaByUser.get(u.id);
      const lastSeenMs = u.lastSeenAt ? new Date(u.lastSeenAt).getTime() : 0;
      const online = lastSeenMs > 0 && now - lastSeenMs <= onlineMs;
      return {
        ...u,
        activity: {
          online,
          usingIa: !!ia,
          iaConnections: ia?.connections || 0,
          iaLastSeen: ia?.lastSeen || null,
          lastLoginAt: u.lastLoginAt || null,
          lastSeenAt: u.lastSeenAt || null,
        },
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function registerAdminRoutes(app, activeSessions) {
  app.get('/api/admin/overview', authMiddleware, requireManagerOrAbove, async (_, res) => {
    try {
      const allUsers = (await listUsers()).map(sanitizeUser);
      const users = enrichUsersWithActivity(allUsers, activeSessions);
      const iaActive = activeSessions.getActiveUsers();
      const onlineNow = users.filter((u) => u.activity.online).length;

      res.json({
        stats: {
          ...(await getAccountStats()),
          onlineNow,
          iaActiveNow: iaActive.length,
          iaConnections: activeSessions.getConnectionCount(),
        },
        users,
        iaActive,
        storage: getStorageMode(),
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/admin/users', authMiddleware, requireManagerOrAbove, async (_, res) => {
    try {
      const allUsers = (await listUsers()).map(sanitizeUser);
      res.json({ users: enrichUsersWithActivity(allUsers, activeSessions) });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/users/:id/approve-vip', authMiddleware, requireManagerOrAbove, async (req, res) => {
    try {
      const user = await approveVip(req.params.id, req.user.id);
      res.json({ user, message: 'VIP aprovado com sucesso' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/admin/users/:id/revoke-vip', authMiddleware, requireManagerOrAbove, async (req, res) => {
    try {
      const user = await revokeVip(req.params.id, req.user);
      res.json({ user, message: 'VIP removido — utilizador voltou a membro normal' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/admin/vip-requests', authMiddleware, requireManagerOrAbove, async (_, res) => {
    try {
      res.json({ requests: await listVipRequests() });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post(
    '/api/admin/users/:id/request-vip',
    authMiddleware,
    requirePermission('can_request_vip'),
    async (req, res) => {
      try {
        const user = await requestVipPromotion(req.params.id, req.user.id);
        res.json({
          user,
          message: 'Pedido enviado ao Proprietário ou Gerente para aprovação VIP',
        });
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    },
  );

  app.post('/api/admin/users/:id/reject-vip-request', authMiddleware, requireManagerOrAbove, async (req, res) => {
    try {
      const user = await rejectVipRequest(req.params.id);
      res.json({ user, message: 'Pedido VIP rejeitado' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/admin/members', authMiddleware, requirePermission('can_request_vip'), async (_, res) => {
    try {
      const members = (await listUsers()).filter((u) => u.role === ROLES.MEMBER).map(sanitizeUser);
      res.json({ users: members });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/admin/vips', authMiddleware, requirePermission('can_request_vip'), async (_, res) => {
    try {
      const vips = (await listUsers()).filter((u) => u.role === ROLES.VIP).map(sanitizeUser);
      res.json({ users: vips });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post(
    '/api/admin/users/:id/request-vip-revocation',
    authMiddleware,
    requirePermission('can_request_vip'),
    async (req, res) => {
      try {
        const user = await requestVipRevocation(req.params.id, req.user.id, req.body?.reason);
        res.json({
          user,
          message: 'Pedido de exoneração VIP enviado ao Proprietário ou Gerente',
        });
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    },
  );

  app.get('/api/admin/vip-revocation-requests', authMiddleware, requireManagerOrAbove, async (_, res) => {
    try {
      res.json({ requests: await listVipRevocationRequests() });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post(
    '/api/admin/users/:id/approve-vip-revocation',
    authMiddleware,
    requireManagerOrAbove,
    async (req, res) => {
      try {
        const user = await approveVipRevocation(req.params.id, req.user.id);
        res.json({ user, message: 'Exoneração VIP aprovada — utilizador voltou a membro' });
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    },
  );

  app.post(
    '/api/admin/users/:id/reject-vip-revocation',
    authMiddleware,
    requireManagerOrAbove,
    async (req, res) => {
      try {
        const user = await rejectVipRevocationRequest(req.params.id);
        res.json({ user, message: 'Pedido de exoneração rejeitado' });
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    },
  );

  app.get('/api/admin/active-users', authMiddleware, requirePermission('can_view_active_users'), (_, res) => {
    const active = activeSessions.getActiveUsers();
    res.json({
      count: active.length,
      users: active,
      totalConnections: activeSessions.getConnectionCount(),
    });
  });

  app.post('/api/admin/promote-admin/:id', authMiddleware, requireManagerOrAbove, async (req, res) => {
    try {
      const { can_view_active_users = true, can_request_vip = true } = req.body;
      const user = await promoteToAdmin(
        req.params.id,
        { can_view_active_users, can_request_vip },
        req.user,
      );
      res.json({ user, message: 'Promovido a Admin' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/admin/users/:id/demote-admin', authMiddleware, requireManagerOrAbove, async (req, res) => {
    try {
      const user = await demoteAdmin(req.params.id, req.user);
      res.json({ user, message: 'Administrador removido — voltou a membro VIP' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch('/api/admin/permissions/:id', authMiddleware, requireManagerOrAbove, async (req, res) => {
    try {
      const user = await updateAdminPermissions(req.params.id, req.body, req.user);
      res.json({ user, message: 'Permissões atualizadas' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/admin/promote-manager/:id', authMiddleware, requireSuperAdmin, async (req, res) => {
    try {
      const user = await promoteToManager(req.params.id, req.user.id);
      res.json({ user, message: 'Promovido a Gerente — superior aos admins' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/admin/users/:id/demote-manager', authMiddleware, requireSuperAdmin, async (req, res) => {
    try {
      const user = await demoteManager(req.params.id, req.user);
      res.json({ user, message: 'Gerente rebaixado — voltou a membro VIP' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
}

export { isVipOrAbove, isAdminOrAbove, hasPermission, sanitizeUser, findById, getStorageMode, ROLES };
