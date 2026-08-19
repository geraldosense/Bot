import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SenseBotLogo from '../components/SenseBotLogo';

export default function Auth() {
  const location = useLocation();
  const initialTab = location.pathname === '/register' ? 'register' : 'login';
  const [tab, setTab] = useState(initialTab);

  const { login, register, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.pathname === '/register') setTab('register');
    else if (location.pathname === '/login') setTab('login');
  }, [location.pathname]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/Dashboard" replace />;
  }

  const switchTab = (next) => {
    setTab(next);
    setError('');
    navigate(next === 'register' ? '/register' : '/login', { replace: true });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      navigate('/Dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/Dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{
        background: 'radial-gradient(ellipse at 50% 0%, #0B3D1A 0%, #050505 60%, #000 100%)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-5"
      >
        <div className="text-center">
          <SenseBotLogo className="h-32 w-32 sm:h-36 sm:w-36" />
          <p className="text-zinc-400 text-sm mt-2">Bem-vindo ao Sense Bot</p>
        </div>

        {/* Tabs Entrar / Registrar */}
        <div className="flex gap-2 p-1 bg-zinc-900/80 border border-zinc-700 rounded-xl">
          <button
            type="button"
            onClick={() => switchTab('login')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
              tab === 'login'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            Entrar
          </button>
          <button
            type="button"
            onClick={() => switchTab('register')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
              tab === 'register'
                ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Registrar
          </button>
        </div>

        <AnimatePresence mode="wait">
          {tab === 'login' ? (
            <motion.form
              key="login"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              onSubmit={handleLogin}
              className="space-y-4"
            >
              <p className="text-zinc-500 text-xs text-center">
                Já tens conta? Introduz email e password para entrar.
              </p>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-zinc-900/80 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-zinc-900/80 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50"
              />
              {error && tab === 'login' && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
              >
                {loading ? 'A entrar...' : 'Entrar na conta'}
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="register"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              onSubmit={handleRegister}
              className="space-y-4"
            >
              <p className="text-zinc-500 text-xs text-center">
                Novo utilizador? Cria conta — depois um admin aprova o teu VIP.
              </p>
              <input
                type="text"
                placeholder="Nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-zinc-900/80 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-zinc-900/80 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
              />
              <input
                type="password"
                placeholder="Password (mín. 6 caracteres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
                className="w-full bg-zinc-900/80 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
              />
              {error && tab === 'register' && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
              >
                {loading ? 'A registar...' : 'Criar conta / Registrar'}
              </button>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-center">
                <p className="text-amber-200 text-xs">
                  Após registo, podes explorar o site. Os robôs ficam disponíveis quando o Chef Máximo aprovar a tua conta VIP.
                </p>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <p className="text-center text-zinc-600 text-[11px]">
          {tab === 'login' ? (
            <>
              Primeira vez aqui?{' '}
              <button
                type="button"
                onClick={() => switchTab('register')}
                className="text-emerald-400 font-bold hover:underline"
              >
                Registar-se
              </button>
            </>
          ) : (
            <>
              Já tens conta?{' '}
              <button
                type="button"
                onClick={() => switchTab('login')}
                className="text-indigo-400 font-bold hover:underline"
              >
                Entrar
              </button>
            </>
          )}
        </p>
      </motion.div>
    </div>
  );
}
