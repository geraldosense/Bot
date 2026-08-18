import { motion } from 'framer-motion';
import { Crown, Calendar, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';

export default function Profile() {
  const { user, logout, isVip, isAdmin, isSuperAdmin } = useAuth();

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('pt-PT')
    : '—';

  const roleLabel = {
    super_admin: 'Chef Máximo',
    admin: 'Administrador',
    vip: 'Membro VIP',
    member: 'Membro',
  };

  return (
    <div
      className="min-h-screen pb-28"
      style={{
        background: 'radial-gradient(ellipse at 50% 0%, #0a1628 0%, #050505 50%, #000 100%)',
      }}
    >
      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-center text-lg font-black text-white tracking-widest mb-6">
          O MEU PERFIL
        </h1>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/60 border border-zinc-700/50 rounded-2xl p-5 space-y-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <UserIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-lg">{user?.name}</p>
              <p className="text-zinc-400 text-sm">{user?.email}</p>
            </div>
          </div>

          {isVip && (
            <div
              className="rounded-xl p-4 border border-amber-500/40 text-center"
              style={{ background: 'linear-gradient(135deg, rgba(217,119,6,0.15), rgba(180,83,9,0.1))' }}
            >
              <Crown className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <p className="text-amber-300 font-black">{roleLabel[user?.role] || 'Membro VIP'}</p>
              <p className="text-amber-200/70 text-xs mt-1">Acesso total aos sinais da IA</p>
            </div>
          )}

          <div className="flex items-center gap-3 bg-zinc-800/40 rounded-xl p-3">
            <Calendar className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-white font-bold text-sm">{memberSince}</p>
              <p className="text-zinc-500 text-xs">Membro desde</p>
            </div>
          </div>

          {(isAdmin || isSuperAdmin) && (
            <p className="text-purple-400 text-xs text-center font-bold">
              {isSuperAdmin ? '👑 Chef Máximo — controlo total' : '🛡️ Admin — painel disponível'}
            </p>
          )}
        </motion.div>

        <button
          onClick={logout}
          className="w-full mt-6 py-3.5 rounded-xl bg-red-600/90 hover:bg-red-600 text-white font-bold flex items-center justify-center gap-2 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Terminar Sessão
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
