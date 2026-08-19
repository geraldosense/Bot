import { Link, useLocation } from 'react-router-dom';
import { Dice5, MessageCircle, User, Shield, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

function NavItem({ to, icon: Icon, label, active, accent = 'emerald', badge }) {
  const accents = {
    emerald: {
      activeText: 'text-emerald-300',
      glow: 'from-emerald-500/25 via-cyan-500/10 to-transparent',
      ring: 'ring-emerald-400/35',
      dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]',
    },
    purple: {
      activeText: 'text-purple-300',
      glow: 'from-purple-500/30 via-indigo-500/10 to-transparent',
      ring: 'ring-purple-400/35',
      dot: 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]',
    },
    amber: {
      activeText: 'text-amber-300',
      glow: 'from-amber-500/25 via-orange-500/10 to-transparent',
      ring: 'ring-amber-400/35',
      dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]',
    },
  };

  const tone = accents[accent] || accents.emerald;

  return (
    <Link
      to={to}
      className={`relative flex flex-1 flex-col items-center justify-center gap-1 py-2.5 min-w-0 transition-colors duration-200 ${
        active ? tone.activeText : 'text-zinc-500 hover:text-zinc-300'
      }`}
    >
      {active && (
        <motion.div
          layoutId="bottom-nav-active"
          className={`absolute inset-x-1.5 inset-y-1 rounded-2xl bg-gradient-to-b ${tone.glow} ring-1 ${tone.ring}`}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        />
      )}

      <div className="relative z-10 flex flex-col items-center gap-1">
        <div className="relative">
          <Icon
            className={`w-[22px] h-[22px] transition-all duration-200 ${
              active ? 'scale-110' : 'scale-100'
            }`}
            strokeWidth={active ? 2.25 : 1.75}
          />
          {badge === 'vip' && (
            <span className="absolute -top-2 -right-3 px-1.5 py-[1px] rounded-md text-[7px] font-black tracking-wide bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-[0_2px_8px_rgba(251,191,36,0.45)]">
              VIP
            </span>
          )}
          {badge === 'chef' && (
            <span className="absolute -top-2 -right-3 flex items-center justify-center w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-[0_2px_8px_rgba(251,191,36,0.5)]">
              <Crown className="w-2.5 h-2.5 text-black" strokeWidth={2.5} />
            </span>
          )}
        </div>
        <span
          className={`text-[10px] font-semibold tracking-wide transition-all duration-200 ${
            active ? 'opacity-100' : 'opacity-80'
          }`}
        >
          {label}
        </span>
        <span
          className={`h-1 w-1 rounded-full transition-all duration-200 ${
            active ? tone.dot : 'bg-transparent scale-0'
          }`}
        />
      </div>
    </Link>
  );
}

export default function BottomNav() {
  const location = useLocation();
  const { user, isVip, isAdmin, isSuperAdmin } = useAuth();

  if (!user) return null;

  const tabs = [
    { path: '/Dashboard', icon: Dice5, label: 'Sinais', accent: 'emerald' },
    { path: '/Support', icon: MessageCircle, label: 'Suporte', accent: 'emerald' },
    {
      path: '/Profile',
      icon: User,
      label: 'Perfil',
      accent: 'amber',
      badge: isVip ? 'vip' : null,
    },
  ];

  if (isAdmin) {
    tabs.push({
      path: '/Admin',
      icon: Shield,
      label: isSuperAdmin ? 'Chef' : 'Admin',
      accent: 'purple',
      badge: isSuperAdmin ? 'chef' : null,
    });
  }

  const isActive = (path) =>
    location.pathname === path || (path === '/Dashboard' && location.pathname === '/BacBo');

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div
        className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent"
        aria-hidden
      />
      <div className="relative max-w-lg mx-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pointer-events-auto">
        <nav
          className="relative overflow-hidden rounded-[1.35rem] border border-white/[0.08] shadow-[0_-4px_40px_rgba(0,0,0,0.45),0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-2xl"
          style={{
            background:
              'linear-gradient(180deg, rgba(24, 24, 27, 0.96) 0%, rgba(9, 9, 11, 0.98) 100%)',
          }}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/25 to-transparent" />

          <div className="flex items-stretch px-1.5 py-1.5">
            {tabs.map((tab) => (
              <NavItem
                key={tab.path}
                to={tab.path}
                icon={tab.icon}
                label={tab.label}
                accent={tab.accent}
                badge={tab.badge}
                active={isActive(tab.path)}
              />
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
