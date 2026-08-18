import { memo, useMemo } from 'react';
import { Target, BarChart3, TrendingUp } from 'lucide-react';
import { normalizeScoreboard } from '../utils/scoreboard';

const VARIANTS = {
  dashboard: {
    wrap: 'grid grid-cols-3 gap-3',
    card: 'bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center min-h-[88px] flex flex-col items-center justify-center',
    value: 'font-black text-2xl tabular-nums leading-none',
    label: 'text-zinc-400 text-[10px] uppercase',
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

const ScoreboardCards = memo(function ScoreboardCards({
  scoreboard,
  variant = 'dashboard',
  gameName,
  live = true,
}) {
  const stats = useMemo(() => normalizeScoreboard(scoreboard), [scoreboard]);
  const v = VARIANTS[variant] || VARIANTS.dashboard;

  const items = [
    {
      label: variant === 'panel' ? 'GREEN' : 'Greens',
      value: stats.greens,
      color: 'text-emerald-400',
      border: 'border-emerald-500/25',
      bg: 'bg-emerald-500/5',
      icon: Target,
      iconColor: 'text-green-400',
    },
    {
      label: variant === 'panel' ? 'LOSS' : 'Losses',
      value: stats.reds,
      color: 'text-red-400',
      border: 'border-red-500/25',
      bg: 'bg-red-500/5',
      icon: BarChart3,
      iconColor: 'text-red-400',
    },
    {
      label: variant === 'panel' ? 'WIN RATE' : 'Win Rate',
      value: `${stats.winRate}%`,
      color: variant === 'panel' ? 'text-amber-400' : 'text-cyan-400',
      border: variant === 'panel' ? 'border-amber-500/25' : 'border-zinc-800',
      bg: variant === 'panel' ? 'bg-amber-500/5' : '',
      icon: TrendingUp,
      iconColor: 'text-cyan-400',
    },
  ];

  return (
    <div>
      {gameName && (
        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-2 px-0.5">
          {live ? `IA ao vivo · ${gameName}` : `${gameName} · Em breve`}
        </p>
      )}
      <div className={v.wrap} aria-live="polite" aria-atomic="false">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className={`${v.card} ${item.bg} ${item.border}`}
            >
              {v.showIcons && (
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Icon className={`w-3 h-3 ${item.iconColor}`} />
                  <span className={v.label}>{item.label}</span>
                </div>
              )}
              <p className={`${v.value} ${item.color}`}>{item.value}</p>
              {!v.showIcons && (
                <p className={v.label}>{item.label}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default ScoreboardCards;
