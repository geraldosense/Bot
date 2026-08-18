/** Rastreia utilizadores VIP activos na IA (WebSocket) */
export class ActiveSessions {
  constructor() {
    /** @type {Map<string, { userId, email, name, role, connectedAt, lastSeen, ws }>} */
    this.sessions = new Map();
  }

  register(ws, user) {
    const id = `${user.id}_${Date.now()}`;
    this.sessions.set(id, {
      sessionId: id,
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      connectedAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      ws,
    });
    ws._sessionId = id;
    ws._userId = user.id;
    return id;
  }

  touch(ws) {
    const s = this.sessions.get(ws._sessionId);
    if (s) s.lastSeen = new Date().toISOString();
  }

  remove(ws) {
    if (ws._sessionId) this.sessions.delete(ws._sessionId);
  }

  getConnectionCount() {
    return this.sessions.size;
  }

  getActiveUsers() {
    const byUser = new Map();
    const cutoff = Date.now() - 60000;

    for (const s of this.sessions.values()) {
      if (new Date(s.lastSeen).getTime() < cutoff) continue;
      if (!byUser.has(s.userId)) {
        byUser.set(s.userId, {
          userId: s.userId,
          email: s.email,
          name: s.name,
          role: s.role,
          connections: 1,
          connectedAt: s.connectedAt,
          lastSeen: s.lastSeen,
        });
      } else {
        const u = byUser.get(s.userId);
        u.connections++;
        if (s.lastSeen > u.lastSeen) u.lastSeen = s.lastSeen;
      }
    }
    return [...byUser.values()];
  }
}
