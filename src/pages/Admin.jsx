import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Activity, Check, X, UserPlus, Crown, Users, Search, UserCheck,
} from 'lucide-react';
import { useAuth, authHeaders } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';
import { fetchJson } from '../lib/api';

export default function Admin() {
  const { token, isSuperAdmin, canViewActive } = useAuth();
  const [users, setUsers] = useState([]);
  const [activeUsers, setActiveUsers] = useState({ count: 0, users: [] });
  const [tab, setTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      const requests = [];
      if (isSuperAdmin) {
        requests.push(fetchJson('/api/admin/users', { headers: authHeaders(token) }));
      }
      if (canViewActive) {
        requests.push(fetchJson('/api/admin/active-users', { headers: authHeaders(token) }));
      }

      const results = await Promise.all(requests);
      if (isSuperAdmin) setUsers(results[0]?.users || []);
      if (canViewActive) {
        const activeData = isSuperAdmin ? results[1] : results[0];
        if (activeData) setActiveUsers(activeData);
      }
    } catch {
      /* ignore polling errors */
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [token, isSuperAdmin, canViewActive]);

  const approve = async (id) => {
    try {
      const d = await fetchJson(`/api/admin/users/${id}/approve-vip`, {
        method: 'POST',
        headers: authHeaders(token),
      });
      setMsg(d.message || d.error);
      load();
    } catch (err) {
      setMsg(err.message);
    }
  };

  const revoke = async (id) => {
    if (!confirm('Revogar VIP deste utilizador?')) return;
    try {
      const d = await fetchJson(`/api/admin/users/${id}/revoke-vip`, {
        method: 'POST',
        headers: authHeaders(token),
      });
      setMsg(d.message || d.error);
      load();
    } catch (err) {
      setMsg(err.message);
    }
  };

  const promoteAdmin = async (id) => {
    try {
      const d = await fetchJson(`/api/admin/promote-admin/${id}`, {
        method: 'POST',
        headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
        body: JSON.stringify({ can_view_active_users: true }),
      });
      setMsg(d.message || d.error);
      load();
    } catch (err) {
      setMsg(err.message);
    }
  };

  const togglePermission = async (id, key, value) => {
    try {
      const d = await fetchJson(`/api/admin/permissions/${id}`, {
        method: 'PATCH',
        headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });
      setMsg(d.message || d.error);
      load();
    } catch (err) {
      setMsg(err.message);
    }
  };

  const pending = users.filter((u) => u.role === 'member');
  const vips = users.filter((u) => u.role === 'vip');
  const admins = users.filter((u) => u.role === 'admin');
  const registered = users.filter((u) => u.role !== 'super_admin');

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return registered;
    return registered.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [registered, search]);

  const roleLabel = {
    member: 'Membro',
    vip: 'VIP',
    admin: 'Admin',
  };

  return (
    <div className="min-h-screen pb-28 bg-zinc-950">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <Shield className="w-6 h-6 text-purple-400" />
              Painel Admin
            </h1>
            {isSuperAdmin && (
              <p className="text-zinc-500 text-xs mt-1">Só tu podes aprovar acesso VIP</p>
            )}
          </div>
          {isSuperAdmin && (
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full font-bold shrink-0">
              👑 CHEF MÁXIMO
            </span>
          )}
        </div>

        {msg && (
          <p className="text-emerald-400 text-xs text-center bg-emerald-500/10 border border-emerald-500/20 py-2.5 rounded-lg">
            {msg}
          </p>
        )}

        {isSuperAdmin && (
          <div className="grid grid-cols-3 gap-2">
            <StatCard icon={Users} label="Registados" value={registered.length} color="text-white" />
            <StatCard icon={UserCheck} label="Pendentes" value={pending.length} color="text-amber-400" />
            <StatCard icon={Crown} label="VIP" value={vips.length} color="text-emerald-400" />
          </div>
        )}

        {canViewActive && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-emerald-900/30 to-cyan-900/20 border border-emerald-500/30 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <span className="text-white font-bold text-sm">IA em uso agora</span>
            </div>
            <p className="text-3xl font-black text-emerald-400">{activeUsers.count}</p>
            <p className="text-zinc-500 text-xs">utilizadores VIP ligados aos sinais</p>
            {activeUsers.users?.length > 0 && (
              <div className="mt-3 space-y-1 max-h-32 overflow-y-auto">
                {activeUsers.users.map((u) => (
                  <div key={u.userId} className="text-xs text-zinc-400 flex justify-between gap-2">
                    <span className="truncate">{u.name} ({u.email})</span>
                    <span className="text-emerald-500 shrink-0">{u.connections} tab</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {isSuperAdmin && (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar por nome ou email..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {[
                { id: 'pending', label: `Pendentes (${pending.length})` },
                { id: 'vip', label: `VIP (${vips.length})` },
                { id: 'all', label: `Todos (${registered.length})` },
                { id: 'admins', label: `Admins (${admins.length})` },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                    tab === t.id ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === 'pending' && (
              <Section
                title="Aguardam aprovação VIP"
                empty="Nenhum utilizador pendente"
                count={pending.length}
              >
                {pending.map((u) => (
                  <UserCard key={u.id} user={u} badge="PENDENTE">
                    <button
                      onClick={() => approve(u.id)}
                      className="flex items-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white text-xs font-bold transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" /> Aprovar VIP
                    </button>
                  </UserCard>
                ))}
              </Section>
            )}

            {tab === 'vip' && (
              <Section title="Utilizadores VIP" empty="Nenhum VIP aprovado" count={vips.length}>
                {vips.map((u) => (
                  <UserCard key={u.id} user={u} badge="VIP">
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => promoteAdmin(u.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-[10px] font-bold transition-colors"
                      >
                        <UserPlus className="w-3 h-3" /> Admin
                      </button>
                      <button
                        onClick={() => revoke(u.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-red-600/80 hover:bg-red-600 rounded-lg text-white text-[10px] font-bold transition-colors"
                      >
                        <X className="w-3 h-3" /> Revogar
                      </button>
                    </div>
                  </UserCard>
                ))}
              </Section>
            )}

            {tab === 'all' && (
              <Section title="Contas registadas no site" empty="Nenhum utilizador encontrado" count={filteredUsers.length}>
                {filteredUsers.map((u) => (
                  <UserCard key={u.id} user={u} badge={roleLabel[u.role] || u.role}>
                    {u.role === 'member' && (
                      <button
                        onClick={() => approve(u.id)}
                        className="flex items-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white text-xs font-bold transition-colors shrink-0"
                      >
                        <Crown className="w-3.5 h-3.5" /> VIP
                      </button>
                    )}
                  </UserCard>
                ))}
              </Section>
            )}

            {tab === 'admins' && (
              <Section title="Administradores" empty="Nenhum admin" count={admins.length}>
                {admins.map((u) => (
                  <div key={u.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
                    <UserCard user={u} badge="ADMIN" />
                    <div className="space-y-2 pt-1 border-t border-zinc-800">
                      <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Permissões</p>
                      <label className="flex items-center justify-between text-sm">
                        <span className="text-zinc-300">Ver IA activa</span>
                        <input
                          type="checkbox"
                          checked={!!u.permissions?.can_view_active_users}
                          onChange={(e) => togglePermission(u.id, 'can_view_active_users', e.target.checked)}
                          className="accent-purple-500"
                        />
                      </label>
                      <p className="text-zinc-600 text-[10px]">
                        Apenas o Chef Máximo pode aprovar VIP
                      </p>
                    </div>
                  </div>
                ))}
              </Section>
            )}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
      <Icon className="w-4 h-4 text-purple-400 mx-auto mb-1" />
      <p className={`text-xl font-black ${color}`}>{value}</p>
      <p className="text-zinc-500 text-[10px] font-semibold">{label}</p>
    </div>
  );
}

function Section({ title, empty, count, children }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider">{title}</p>
        <span className="text-zinc-600 text-[10px]">{count} total</span>
      </div>
      {count === 0 ? (
        <p className="text-zinc-500 text-sm text-center py-10 bg-zinc-900/40 border border-zinc-800/60 rounded-xl">
          {empty}
        </p>
      ) : (
        children
      )}
    </div>
  );
}

function UserCard({ user, badge, children }) {
  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-white font-bold text-sm truncate">{user.name}</p>
          {badge && (
            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold shrink-0">
              {badge}
            </span>
          )}
        </div>
        <p className="text-zinc-500 text-xs truncate">{user.email}</p>
        <p className="text-zinc-600 text-[10px]">
          Registado em {new Date(user.createdAt).toLocaleDateString('pt-PT')}
        </p>
      </div>
      {children}
    </div>
  );
}
