import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchJson } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('bacbo_token'));
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async (t) => {
    try {
      const data = await fetchJson('/api/auth/me', {
        headers: { Authorization: `Bearer ${t}` },
      });
      setUser(data.user);
      return data.user;
    } catch {
      localStorage.removeItem('bacbo_token');
      setToken(null);
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    if (token) fetchMe(token).finally(() => setLoading(false));
    else setLoading(false);
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
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password) => {
    const data = await fetchJson('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    localStorage.setItem('bacbo_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('bacbo_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = () => token && fetchMe(token);

  const isVip = ['vip', 'admin', 'super_admin'].includes(user?.role);
  const isAdmin = ['admin', 'super_admin'].includes(user?.role);
  const isSuperAdmin = user?.role === 'super_admin';
  const isMember = user?.role === 'member';
  const canPromoteVip = isSuperAdmin;
  const canRequestVip = isSuperAdmin || user?.permissions?.can_request_vip;
  const canViewActive = isSuperAdmin || user?.permissions?.can_view_active_users;

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
        isSuperAdmin,
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
