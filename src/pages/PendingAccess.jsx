import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Mail, LogOut } from 'lucide-react';
import SenseBotLogo from '../components/SenseBotLogo';
import { useAuth } from '../context/AuthContext';

export default function PendingAccess() {
  const { user, logout, refreshUser, isVip } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isVip) navigate('/Dashboard', { replace: true });
  }, [isVip, navigate]);

  const handleRefresh = async () => {
    await refreshUser();
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{
        background: 'radial-gradient(ellipse at 50% 0%, #0B3D1A 0%, #050505 60%, #000 100%)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md text-center space-y-6"
      >
        <SenseBotLogo className="h-24 w-24 opacity-90" />

        <div className="bg-zinc-900/80 border border-zinc-700 rounded-2xl p-6 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center">
            <Clock className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-xl font-black text-white">Aguarda Aprovação VIP</h1>
          <p className="text-zinc-400 text-sm">
            A tua conta foi criada com sucesso. O Chef Máximo irá verificar o teu email e
            aprovar o acesso ao grupo VIP para usares a IA de sinais.
          </p>

          <div className="flex items-center justify-center gap-2 bg-zinc-800/50 rounded-lg py-2 px-3">
            <Mail className="w-4 h-4 text-zinc-400" />
            <span className="text-white text-sm font-medium">{user?.email}</span>
          </div>

          <button
            onClick={handleRefresh}
            className="w-full py-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 text-sm font-bold hover:bg-emerald-600/30"
          >
            Verificar se já fui aprovado
          </button>
        </div>

        <button
          onClick={logout}
          className="inline-flex items-center gap-2 text-zinc-500 text-sm hover:text-red-400 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Terminar sessão
        </button>
      </motion.div>
    </div>
  );
}
