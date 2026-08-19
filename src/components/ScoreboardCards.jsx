import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Target, BarChart3, TrendingUp, Radio } from 'lucide-react';
import { normalizeScoreboard, formatWinRatePrecise } from '../utils/scoreboard';
import { getPremiumBadge } from '../utils/playResult';

const VARIANTS = {
  dashboard: {
    wrap: 'grid grid-cols-3 gap-3',
    card: 'bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center min-h-[88px] flex flex-col items-center justify-center',
    value: 'font-black text-2xl tabular-nums leading-none',
    label: 'text-zinc-400 text-[10px] uppercase tracking-wide',
    showIcons: true,
  },
  panel: {
    wrap: 'grid grid-cols-3 gap-2',
    card: 'rounded-xl p-3 text-center min-h-[72px] flex flex-col items-center justify-center border',
    value: 'font-black text-xl sm:text-2xl tabular-nums leading-none',
    label: 'text-white/35 text-[9px] font-bold tracking-[0.15em] mt-1.5',
    showIcons: false,
  },
};

const LABELS = {
  greens: 'ACERTOS',
  reds: 'PERDAS',
  winRate: 'ACERTIVIDADE',
};

function LiveBadge({ live, connected }) {
  if (!live) return null;

  const online = connected !== false;

  return (
    <div className="flex items-center justify-center mb-2">
      <div
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 border ${
          online
            ? 'bg-red-500/10 border-red-500/30'
            : 'bg-zinc-800/80 border-zinc-700'
        }`}
      >
        {online && (
          <motion.span
            className="w-2 h-2 rounded-full bg-red-500"
            animate={{ opacity: [1, 0.35, 1], scale: [1, 0.85, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
        )}
        <Radio className={`w-3 h-3 ${online ? 'text-red-400' : 'text-zinc-500'}`} />
        <span
          className={`text-[9px] font-black tracking-[0.2em] uppercase ${
            online ? 'text-red-300' : 'text-zinc-500'
          }`}
        >
          {online ? 'AO VIVO' : 'OFFLINE'}
        </span>
      </div>
    </div>
  );
}

const ScoreboardCards = memo(function ScoreboardCards({
  scoreboard,
  variant = 'dashboard',
  gameName,
  live = true,
  connected = true,
}) {
  const stats = useMemo(() => normalizeScoreboard(scoreboard), [scoreboard]);
  const v = VARIANTS[variant] || VARIANTS.dashboard;
  const premium = stats.meetsTarget;
  const badge = getPremiumBadge(stats.winRate, stats.playsToday);

  const items = [
    {
      key: 'greens',
      value: stats.greens,
      color: 'text-emerald-400',
      border: 'border-emerald-500/25',
      bg: 'bg-emerald-500/5',
      icon: Target,
      iconColor: 'text-green-400',
    },
    {
      key: 'reds',
      value: stats.reds,
      color: 'text-red-400',
      border: 'border-red-500/25',
      bg: 'bg-red-500/5',
      icon: BarChart3,
      iconColor: 'text-red-400',
    },
    {
      key: 'winRate',
      value: formatWinRatePrecise(stats.winRate),
      color: premium
        ? 'text-emerald-400'
        : variant === 'panel'
          ? 'text-amber-400'
          : 'text-cyan-400',
      border: premium
        ? 'border-emerald-500/40 ring-1 ring-emerald-500/20'
        : variant === 'panel'
          ? 'border-amber-500/25'
          : 'border-zinc-800',
      bg: premium ? 'bg-emerald-500/10' : variant === 'panel' ? 'bg-amber-500/5' : '',
      icon: TrendingUp,
      iconColor: premium ? 'text-emerald-400' : 'text-cyan-400',
    },
  ];

  return (
    <div>
      <LiveBadge live={live} connected={connected} />

      {gameName && (
        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-2 px-0.5 text-center">
          {live ? `Robô IA · ${gameName}` : `${gameName} · Em breve`}
        </p>
      )}

      {stats.playsToday > 0 && (
        <p
          className={`text-center text-[9px] font-bold tracking-[0.18em] uppercase mb-2 ${
            premium ? 'text-emerald-400/90' : 'text-zinc-500'
          }`}
        >
          {badge.text}
        </p>
      )}

      <div className={v.wrap} aria-live="polite" aria-atomic="false">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.key} className={`${v.card} ${item.bg} ${item.border}`}>
              {v.showIcons && (
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Icon className={`w-3 h-3 ${item.iconColor}`} />
                  <span className={v.label}>{LABELS[item.key]}</span>
                </div>
              )}
              <p className={`${v.value} ${item.color}`}>{item.value}</p>
              {!v.showIcons && <p className={v.label}>{LABELS[item.key]}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default ScoreboardCards;
