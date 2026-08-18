import jwt from 'jsonwebtoken';
import {
  findById,
  sanitizeUser,
  createUser,
  findByEmail,
  verifyPassword,
  seedSuperAdmin,
  isVipOrAbove,
  isAdminOrAbove,
  hasPermission,
  approveVip,
  revokeVip,
  promoteToAdmin,
  updateAdminPermissions,
  listUsers,
  ROLES,
} from './userStore.js';

const JWT_SECRET = process.env.JWT_SECRET || 'bac-bo-bot-secret-change-in-production';
const JWT_EXPIRES = '7d';

export async function initAuth() {
  await seedSuperAdmin();
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

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Sessão expirada' });
  }
  const user = sanitizeUser(findById(payload.sub));
  if (!user) {
    return res.status(401).json({ error: 'Utilizador não encontrado' });
  }
  req.user = user;
  next();
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

export function requireSuperAdmin(req, res, next) {
  if (req.user.role !== ROLES.SUPER_ADMIN) {
    return res.status(403).json({ error: 'Acesso Chef Máximo necessário' });
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
      const { email, password, name } = req.body;
      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, nome e password são obrigatórios' });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password mínimo 6 caracteres' });
      }
      const user = await createUser({ email, password, name });
      const token = signToken(user);
      res.json({
        token,
        user,
        message: 'Conta criada! Aguarda aprovação VIP pelo Chef Máximo para aceder aos sinais.',
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const raw = findByEmail(email);
      if (!raw || !(await verifyPassword(raw, password))) {
        return res.status(401).json({ error: 'Email ou password incorretos' });
      }
      const user = sanitizeUser(raw);
      const token = signToken(user);
      res.json({ token, user });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/auth/me', authMiddleware, (req, res) => {
    res.json({ user: req.user });
  });
}

export function registerAdminRoutes(app, activeSessions) {
  app.get('/api/admin/users', authMiddleware, requireSuperAdmin, (_, res) => {
    res.json({ users: listUsers() });
  });

  app.post('/api/admin/users/:id/approve-vip', authMiddleware, requireSuperAdmin, (req, res) => {
    try {
      const user = approveVip(req.params.id, req.user.id);
      res.json({ user, message: 'VIP aprovado com sucesso' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/admin/users/:id/revoke-vip', authMiddleware, requireSuperAdmin, (req, res) => {
    try {
      const user = revokeVip(req.params.id);
      res.json({ user, message: 'VIP revogado' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/admin/active-users', authMiddleware, requirePermission('can_view_active_users'), (_, res) => {
    const active = activeSessions.getActiveUsers();
    res.json({
      count: active.length,
      users: active,
      totalConnections: activeSessions.getConnectionCount(),
    });
  });

  app.post('/api/admin/promote-admin/:id', authMiddleware, requireSuperAdmin, (req, res) => {
    try {
      const { can_view_active_users = true } = req.body;
      const user = promoteToAdmin(req.params.id, { can_view_active_users }, req.user.id);
      res.json({ user, message: 'Promovido a Admin' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch('/api/admin/permissions/:id', authMiddleware, requireSuperAdmin, (req, res) => {
    try {
      const user = updateAdminPermissions(req.params.id, req.body);
      res.json({ user, message: 'Permissões atualizadas' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
}

export { isVipOrAbove, isAdminOrAbove, hasPermission, sanitizeUser, findById, ROLES };
