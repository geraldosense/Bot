import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { fetchJson } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('bacbo_token'));
  const [loading, setLoading] = useState(true);
  const skipMeRef = useRef(false);

  const fetchMe = useCallback(async (t) => {
    try {
      const data = await fetchJson('/api/auth/me', {
        headers: { Authorization: `Bearer ${t}` },
      });
      setUser(data.user);
      return data.user;
    } catch (err) {
      const msg = String(err?.message || '').toLowerCase();
      const authError =
        msg.includes('não autenticado') ||
        msg.includes('nao autenticado') ||
        msg.includes('sessão expirada') ||
        msg.includes('sessao expirada') ||
        msg.includes('utilizador não encontrado') ||
        msg.includes('utilizador nao encontrado');

      if (authError) {
        localStorage.removeItem('bacbo_token');
        setToken(null);
        setUser(null);
      }
      return null;
    }
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    if (skipMeRef.current) {
      skipMeRef.current = false;
      setLoading(false);
      return;
    }
    fetchMe(token).finally(() => setLoading(false));
  }, [token, fetchMe]);

  useEffect(() => {
    if (!token || !user) return undefined;
    const ping = () => {
      fetchJson('/api/auth/presence', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    };
    ping();
    const t = setInterval(ping, 60000);
    return () => clearInterval(t);
  }, [token, user?.id]);

  const login = async (email, password) => {
    const data = await fetchJson('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('bacbo_token', data.token);
    skipMeRef.current = true;
    setToken(data.token);
    setUser(data.user);
    setLoading(false);
    return data;
  };

  const register = async (name, email, password) => {
    const data = await fetchJson('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    localStorage.setItem('bacbo_token', data.token);
    skipMeRef.current = true;
    setToken(data.token);
    setUser(data.user);
    setLoading(false);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('bacbo_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = () => token && fetchMe(token);

  const isVip = ['vip', 'admin', 'manager', 'super_admin'].includes(user?.role);
  const isAdmin = ['admin', 'manager', 'super_admin'].includes(user?.role);
  const isOwner = user?.role === 'super_admin';
  const isManager = user?.role === 'manager';
  const isSuperAdmin = isOwner;
  const isMember = user?.role === 'member';
  const canManageAccounts = isOwner || isManager;
  const canManageManagers = isOwner;
  const canPromoteVip = canManageAccounts;
  const canRequestVip = canManageAccounts || user?.permissions?.can_request_vip;
  const canViewActive = canManageAccounts || user?.permissions?.can_view_active_users;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        refreshUser,
        isVip,
        isAdmin,
        isOwner,
        isManager,
        isSuperAdmin,
        canManageAccounts,
        canManageManagers,
        isMember,
        canPromoteVip,
        canRequestVip,
        canViewActive,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
