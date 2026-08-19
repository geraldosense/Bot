import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Activity,
  Check,
  X,
  UserPlus,
  Crown,
  Users,
  Search,
  UserCheck,
  Send,
  Mail,
  BarChart3,
  Circle,
  RefreshCw,
} from 'lucide-react';
import { useAuth, authHeaders } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';
import { fetchJson } from '../lib/api';
import { getRoleLabel } from '../utils/roles';

const ROLE_LABEL = {
  member: 'Membro',
  vip: 'VIP',
  admin: 'Administrador',
  super_admin: 'Proprietário',
};

function formatDateTime(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function ActivityBadge({ activity }) {
  if (activity?.usingIa) {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
        <Circle className="w-2 h-2 fill-emerald-400 text-emerald-400" />
        IA activa
      </span>
    );
  }
  if (activity?.online) {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/25">
        <Circle className="w-2 h-2 fill-cyan-400 text-cyan-400" />
        Online
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500 border border-zinc-700">
      Offline
    </span>
  );
}

export default function Admin() {
  const { token, isSuperAdmin, canRequestVip, canViewActive, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [vipRequests, setVipRequests] = useState([]);
  const [revocationRequests, setRevocationRequests] = useState([]);
  const [members, setMembers] = useState([]);
  const [adminVips, setAdminVips] = useState([]);
  const [iaActive, setIaActive] = useState([]);
  const [tab, setTab] = useState('vip-requests');
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('');
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [storageMode, setStorageMode] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    setTab(isSuperAdmin ? 'vip-requests' : 'members');
  }, [isSuperAdmin, authLoading]);

  const buildStatsFromUsers = (list, iaList = [], iaConnections = 0) => {
    const onlineNow = list.filter((u) => u.activity?.online).length;
    return {
      total: list.length,
      members: list.filter((u) => u.role === 'member').length,
      vip: list.filter((u) => u.role === 'vip').length,
      admins: list.filter((u) => u.role === 'admin').length,
      vipRequests: list.filter((u) => u.vipRequest?.status === 'pending').length,
      onlineNow,
      iaActiveNow: iaList.length,
      iaConnections,
    };
  };

  const load = async () => {
    if (!token || authLoading) return;
    try {
      setLoading(true);
      setLoadError('');
      const opts = { headers: authHeaders(token), timeout: 25000 };

      if (isSuperAdmin) {
        let overview = null;
        try {
          overview = await fetchJson('/api/admin/overview', opts);
        } catch {
          const [usersData, activeData] = await Promise.all([
            fetchJson('/api/admin/users', opts),
            fetchJson('/api/admin/active-users', opts).catch(() => null),
          ]);
          const list = (usersData.users || []).filter((u) => u.role !== 'super_admin');
          overview = {
            users: list,
            stats: buildStatsFromUsers(
              list,
              activeData?.users || [],
              activeData?.totalConnections || 0,
            ),
            iaActive: activeData?.users || [],
            storage: 'unknown',
          };
        }

        setUsers(overview.users || []);
        setStats(overview.stats || null);
        setIaActive(overview.iaActive || []);
        setStorageMode(overview.storage || null);

        try {
          const [requests, revocations] = await Promise.all([
            fetchJson('/api/admin/vip-requests', opts),
            fetchJson('/api/admin/vip-revocation-requests', opts),
          ]);
          setVipRequests(requests.requests || []);
          setRevocationRequests(revocations.requests || []);
        } catch {
          setVipRequests([]);
          setRevocationRequests([]);
        }
        return;
      }

      const requests = [];
      if (canRequestVip) {
        requests.push(fetchJson('/api/admin/members', { headers: authHeaders(token) }));
        requests.push(fetchJson('/api/admin/vips', { headers: authHeaders(token) }));
      }
      if (canViewActive) {
        requests.push(fetchJson('/api/admin/active-users', { headers: authHeaders(token) }));
      }

      const results = await Promise.all(requests);
      let idx = 0;
      if (canRequestVip) {
        setMembers(results[idx]?.users || []);
        idx += 1;
        setAdminVips(results[idx]?.users || []);
        idx += 1;
      }
      if (canViewActive && results[idx]) {
        setIaActive(results[idx].users || []);
        setStats({
          iaActiveNow: results[idx].count,
          iaConnections: results[idx].totalConnections,
        });
      }
    } catch (err) {
      setLoadError(err.message || 'Erro ao carregar dados do painel');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [token, isSuperAdmin, canRequestVip, canViewActive, authLoading]);

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

  const rejectRequest = async (id) => {
    try {
      const d = await fetchJson(`/api/admin/users/${id}/reject-vip-request`, {
        method: 'POST',
        headers: authHeaders(token),
      });
      setMsg(d.message || d.error);
      load();
    } catch (err) {
      setMsg(err.message);
    }
  };

  const requestVip = async (id) => {
    try {
      const d = await fetchJson(`/api/admin/users/${id}/request-vip`, {
        method: 'POST',
        headers: authHeaders(token),
      });
      setMsg(d.message || d.error);
      load();
    } catch (err) {
      setMsg(err.message);
    }
  };

  const revoke = async (id, name) => {
    if (!confirm(`Remover VIP de ${name || 'este utilizador'}? Perde acesso aos robôs.`)) return;
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

  const requestVipRevocation = async (id, name) => {
    const reason = prompt(
      `Motivo da exoneração VIP de ${name || 'este utilizador'} (opcional):`,
    );
    if (reason === null) return;
    try {
      const d = await fetchJson(`/api/admin/users/${id}/request-vip-revocation`, {
        method: 'POST',
        headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason || '' }),
      });
      setMsg(d.message || d.error);
      load();
    } catch (err) {
      setMsg(err.message);
    }
  };

  const approveRevocation = async (id) => {
    try {
      const d = await fetchJson(`/api/admin/users/${id}/approve-vip-revocation`, {
        method: 'POST',
        headers: authHeaders(token),
      });
      setMsg(d.message || d.error);
      load();
    } catch (err) {
      setMsg(err.message);
    }
  };

  const rejectRevocation = async (id) => {
    try {
      const d = await fetchJson(`/api/admin/users/${id}/reject-vip-revocation`, {
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

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [users, search]);

  const adminMemberList = isSuperAdmin ? pending : members;

  return (
    <div className="min-h-screen pb-28 bg-zinc-950">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <Shield className="w-6 h-6 text-purple-400 shrink-0" />
              {isSuperAdmin ? 'Centro de Controlo' : 'Painel Admin'}
            </h1>
            <p className="text-zinc-500 text-xs mt-1">
              {isSuperAdmin
                ? 'Todos os registos, emails e utilização da IA'
                : 'Solicita VIP ou exoneração — o Proprietário aprova'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white disabled:opacity-50"
              aria-label="Actualizar"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {isSuperAdmin && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full font-bold">
                👑 PROPRIETÁRIO
              </span>
            )}
          </div>
        </div>

        {loadError && (
          <p className="text-red-400 text-xs text-center bg-red-500/10 border border-red-500/20 py-2.5 rounded-lg">
            {loadError}
          </p>
        )}

        {msg && (
          <p className="text-emerald-400 text-xs text-center bg-emerald-500/10 border border-emerald-500/20 py-2.5 rounded-lg">
            {msg}
          </p>
        )}

        {isSuperAdmin && storageMode === 'file' && (
          <p className="text-amber-300 text-xs bg-amber-500/10 border border-amber-500/25 py-2.5 px-3 rounded-lg">
            Base de dados temporária — configura Supabase para guardar registos permanentemente.
          </p>
        )}

        {isSuperAdmin && (
          <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-900/40 to-zinc-900 p-4 text-center">
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider">
              Pessoas registadas no site
            </p>
            <p className="text-5xl font-black text-white mt-1">
              {loading && users.length === 0 ? '…' : stats?.total ?? users.length}
            </p>
            <p className="text-zinc-500 text-xs mt-1">
              emails únicos · actualiza a cada 10 segundos
            </p>
          </div>
        )}

        {isSuperAdmin && (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar nome ou email..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50"
              />
            </div>

            <Section
              title="Todos os registados"
              empty={loading ? 'A carregar contas…' : 'Ainda ninguém se registou'}
              count={filteredUsers.length}
            >
              {filteredUsers.map((u) => (
                <AccountRow key={u.id} user={u} compact>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    {u.role === 'member' && (
                      <button
                        onClick={() => approve(u.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white text-[10px] font-bold transition-colors"
                      >
                        <Crown className="w-3 h-3" /> Dar VIP
                      </button>
                    )}
                    {u.role === 'vip' && (
                      <button
                        onClick={() => revoke(u.id, u.name)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-red-600/90 hover:bg-red-600 rounded-lg text-white text-[10px] font-bold transition-colors"
                      >
                        <X className="w-3 h-3" /> Remover VIP
                      </button>
                    )}
                  </div>
                </AccountRow>
              ))}
            </Section>
          </>
        )}

        {isSuperAdmin && stats && (
          <div className="grid grid-cols-2 gap-2">
            <StatCard icon={Users} label="Contas registadas" value={stats.total} color="text-white" />
            <StatCard icon={Activity} label="Online agora" value={stats.onlineNow} color="text-cyan-400" />
            <StatCard icon={BarChart3} label="IA activa agora" value={stats.iaActiveNow} color="text-emerald-400" />
            <StatCard icon={Crown} label="Contas VIP" value={stats.vip} color="text-amber-400" />
            <StatCard icon={UserCheck} label="Membros" value={stats.members} color="text-zinc-300" />
            <StatCard icon={Send} label="Pedidos VIP" value={stats.vipRequests} color="text-purple-300" />
            <StatCard
              icon={X}
              label="Exonerações"
              value={stats.vipRevocationRequests ?? revocationRequests.length}
              color="text-red-300"
            />
          </div>
        )}

        {(isSuperAdmin || canViewActive) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-emerald-900/30 to-cyan-900/20 border border-emerald-500/30 rounded-xl p-4"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                <span className="text-white font-bold text-sm">Utilizadores na IA agora</span>
              </div>
              {stats && (
                <span className="text-emerald-400 text-xs font-bold">
                  {stats.iaConnections || 0} ligações
                </span>
              )}
            </div>
            <p className="text-3xl font-black text-emerald-400">{stats?.iaActiveNow ?? iaActive.length}</p>
            <p className="text-zinc-500 text-xs">VIP ligados aos sinais ao vivo</p>
            {iaActive.length > 0 ? (
              <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                {iaActive.map((u) => (
                  <div
                    key={u.userId}
                    className="flex items-center justify-between gap-2 text-xs bg-zinc-900/50 rounded-lg px-3 py-2 border border-zinc-800"
                  >
                    <div className="min-w-0">
                      <p className="text-white font-semibold truncate">{u.name}</p>
                      <p className="text-zinc-500 truncate">{u.email}</p>
                    </div>
                    <span className="text-emerald-500 shrink-0 font-bold">{u.connections} tab</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-600 text-xs mt-3">Nenhum utilizador na IA neste momento.</p>
            )}
          </motion.div>
        )}

        {isSuperAdmin && (
          <>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[
                { id: 'vip-requests', label: `Pedidos VIP (${vipRequests.length})` },
                {
                  id: 'revocation-requests',
                  label: `Exonerações (${revocationRequests.length})`,
                },
                { id: 'pending', label: `Membros (${pending.length})` },
                { id: 'vip', label: `VIP (${vips.length})` },
                { id: 'admins', label: `Admins (${admins.length})` },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                    tab === t.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === 'vip-requests' && (
              <Section
                title="Pedidos VIP dos admins"
                empty="Nenhum pedido pendente"
                count={vipRequests.length}
              >
                {vipRequests.map((u) => (
                  <UserCard key={u.id} user={u} badge="PEDIDO VIP">
                    <div className="text-right shrink-0 space-y-1">
                      <p className="text-zinc-500 text-[10px]">
                        Solicitado por {u.requestedByName}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => approve(u.id)}
                          className="flex items-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white text-xs font-bold transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" /> Aprovar
                        </button>
                        <button
                          onClick={() => rejectRequest(u.id)}
                          className="flex items-center gap-1 px-2.5 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-white text-xs font-bold transition-colors"
                        >
                          <X className="w-3.5 h-3.5" /> Rejeitar
                        </button>
                      </div>
                    </div>
                  </UserCard>
                ))}
              </Section>
            )}

            {tab === 'revocation-requests' && (
              <Section
                title="Pedidos de exoneração VIP"
                empty="Nenhum pedido de exoneração pendente"
                count={revocationRequests.length}
              >
                {revocationRequests.map((u) => (
                  <UserCard key={u.id} user={u} badge="EXONERAÇÃO">
                    <div className="text-right shrink-0 space-y-1">
                      <p className="text-zinc-500 text-[10px]">
                        Solicitado por {u.requestedByName}
                      </p>
                      {u.vipRevocationRequest?.reason && (
                        <p className="text-zinc-400 text-[10px] max-w-[140px] truncate">
                          {u.vipRevocationRequest.reason}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveRevocation(u.id)}
                          className="flex items-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white text-xs font-bold transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" /> Aprovar
                        </button>
                        <button
                          onClick={() => rejectRevocation(u.id)}
                          className="flex items-center gap-1 px-2.5 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-white text-xs font-bold transition-colors"
                        >
                          <X className="w-3.5 h-3.5" /> Rejeitar
                        </button>
                      </div>
                    </div>
                  </UserCard>
                ))}
              </Section>
            )}

            {tab === 'pending' && (
              <Section title="Membros sem VIP" empty="Nenhum membro" count={pending.length}>
                {pending.map((u) => (
                  <UserCard
                    key={u.id}
                    user={u}
                    badge={u.vipRequest?.status === 'pending' ? 'EM ANÁLISE' : 'MEMBRO'}
                  >
                    <button
                      onClick={() => approve(u.id)}
                      className="flex items-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white text-xs font-bold transition-colors shrink-0"
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
                        onClick={() => revoke(u.id, u.name)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-red-600/90 hover:bg-red-600 rounded-lg text-white text-[10px] font-bold transition-colors"
                      >
                        <X className="w-3 h-3" /> Remover VIP
                      </button>
                    </div>
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
                      <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                        Permissões
                      </p>
                      <label className="flex items-center justify-between text-sm">
                        <span className="text-zinc-300">Ver IA activa</span>
                        <input
                          type="checkbox"
                          checked={!!u.permissions?.can_view_active_users}
                          onChange={(e) =>
                            togglePermission(u.id, 'can_view_active_users', e.target.checked)
                          }
                          className="accent-purple-500"
                        />
                      </label>
                      <label className="flex items-center justify-between text-sm">
                        <span className="text-zinc-300">Solicitar VIP</span>
                        <input
                          type="checkbox"
                          checked={!!u.permissions?.can_request_vip}
                          onChange={(e) =>
                            togglePermission(u.id, 'can_request_vip', e.target.checked)
                          }
                          className="accent-purple-500"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </Section>
            )}
          </>
        )}

        {!isSuperAdmin && canRequestVip && (
          <>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setTab('members')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  tab === 'members'
                    ? 'bg-purple-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                Membros ({adminMemberList.length})
              </button>
              <button
                onClick={() => setTab('admin-vips')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  tab === 'admin-vips'
                    ? 'bg-purple-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                VIP ({adminVips.length})
              </button>
            </div>

            {tab === 'members' && (
              <Section
                title="Solicitar VIP para membros"
                empty="Nenhum membro disponível"
                count={adminMemberList.length}
              >
                {adminMemberList.map((u) => (
                  <UserCard
                    key={u.id}
                    user={u}
                    badge={u.vipRequest?.status === 'pending' ? 'EM ANÁLISE' : 'MEMBRO'}
                  >
                    {u.vipRequest?.status === 'pending' ? (
                      <span className="text-amber-400 text-[10px] font-bold shrink-0 px-2">
                        Aguarda Proprietário
                      </span>
                    ) : (
                      <button
                        onClick={() => requestVip(u.id)}
                        className="flex items-center gap-1 px-3 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-xs font-bold transition-colors shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" /> Solicitar VIP
                      </button>
                    )}
                  </UserCard>
                ))}
              </Section>
            )}

            {tab === 'admin-vips' && (
              <Section
                title="Solicitar exoneração VIP"
                empty="Nenhum VIP disponível"
                count={adminVips.length}
              >
                {adminVips.map((u) => (
                  <UserCard key={u.id} user={u} badge="VIP">
                    {u.vipRevocationRequest?.status === 'pending' ? (
                      <span className="text-amber-400 text-[10px] font-bold shrink-0 px-2 text-right">
                        Pedido enviado
                      </span>
                    ) : (
                      <button
                        onClick={() => requestVipRevocation(u.id, u.name)}
                        className="flex items-center gap-1 px-3 py-2 bg-red-600/90 hover:bg-red-600 rounded-lg text-white text-xs font-bold transition-colors shrink-0"
                      >
                        <X className="w-3.5 h-3.5" /> Solicitar exoneração
                      </button>
                    )}
                  </UserCard>
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
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3">
      <Icon className="w-4 h-4 text-purple-400 mb-1" />
      <p className={`text-2xl font-black ${color}`}>{value ?? 0}</p>
      <p className="text-zinc-500 text-[10px] font-semibold leading-tight">{label}</p>
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

function AccountRow({ user, children, compact = false }) {
  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-white font-bold text-sm">{user.name}</p>
            <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-bold">
              {ROLE_LABEL[user.role] || getRoleLabel(user.role)}
            </span>
            <ActivityBadge activity={user.activity} />
          </div>
          <p className="text-cyan-400 text-sm mt-1.5 font-medium flex items-start gap-1.5 break-all leading-snug">
            <Mail className="w-4 h-4 shrink-0 mt-0.5" />
            {user.email}
          </p>
        </div>
        {children}
      </div>
      {!compact && (
        <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-500 pt-1 border-t border-zinc-800/80">
          <div>
            <p className="text-zinc-600 uppercase font-bold tracking-wide">Registado</p>
            <p className="text-zinc-400">{formatDateTime(user.createdAt)}</p>
          </div>
          <div>
            <p className="text-zinc-600 uppercase font-bold tracking-wide">Último login</p>
            <p className="text-zinc-400">{formatDateTime(user.activity?.lastLoginAt || user.lastLoginAt)}</p>
          </div>
          <div>
            <p className="text-zinc-600 uppercase font-bold tracking-wide">Última actividade</p>
            <p className="text-zinc-400">{formatDateTime(user.activity?.lastSeenAt || user.lastSeenAt)}</p>
          </div>
          <div>
            <p className="text-zinc-600 uppercase font-bold tracking-wide">Estado IA</p>
            <p className={user.activity?.usingIa ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>
              {user.activity?.usingIa
                ? `${user.activity.iaConnections} ligação(ões)`
                : 'Não activo'}
            </p>
          </div>
        </div>
      )}
      {compact && (
        <p className="text-zinc-600 text-[10px] pt-1 border-t border-zinc-800/80">
          Registado em {formatDateTime(user.createdAt)}
        </p>
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
