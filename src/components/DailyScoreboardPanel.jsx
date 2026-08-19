import { useMemo, useState } from 'react';
import { normalizeScoreboard, formatWinRatePrecise, meetsAssertivityTarget } from '../utils/scoreboard';
import { getPremiumBadge } from '../utils/playResult';
import { calculateDailyProfit, formatCurrency } from '../utils/profitSimulator';

const TABS = [
  { id: 'placar', label: 'PLACAR DO DIA', icon: null },
  { id: 'simulador', label: 'SIMULADOR DE LUCRO', icon: '💰' },
  { id: 'banca', label: 'BANCA', icon: '🏦' },
];

function TabBar({ active, onChange }) {
  return (
    <div className="flex border-b border-zinc-800">
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex-1 py-3 px-2 text-[10px] sm:text-[11px] font-bold tracking-wide uppercase transition-colors relative ${
              isActive ? 'text-cyan-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab.icon && <span className="mr-1">{tab.icon}</span>}
            {tab.label}
            {isActive && (
              <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-cyan-400 rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}

function DailyScoreStrip({ stats, gameName, live, playsToday }) {
  const badge = getPremiumBadge(stats.winRate, playsToday);

  return (
    <div className="py-5 px-2">
      <p className="text-zinc-500 text-[10px] font-bold tracking-[0.12em] uppercase text-center mb-5">
        Desempenho da IA no {gameName}
        {live && <span className="text-cyan-400/80"> (ao vivo)</span>}
      </p>

      <div className="flex items-center justify-center gap-3 sm:gap-5 flex-wrap">
        <div className="text-center min-w-[72px]">
          <p className="text-emerald-400 font-black text-3xl sm:text-4xl tabular-nums leading-none">
            {stats.greens}
          </p>
          <p className="text-zinc-500 text-[10px] font-bold tracking-[0.15em] uppercase mt-2">
            Verdes
          </p>
        </div>

        <span className="text-zinc-600 text-xl font-light pb-4">×</span>

        <div className="text-center min-w-[72px]">
          <p className="text-red-400 font-black text-3xl sm:text-4xl tabular-nums leading-none">
            {stats.reds}
          </p>
          <p className="text-zinc-500 text-[10px] font-bold tracking-[0.15em] uppercase mt-2">
            Perdas
          </p>
        </div>

        <div className="hidden sm:block w-px h-14 bg-zinc-700/80 mx-1" />

        <div className="text-center min-w-[100px]">
          <p
            className={`font-black text-3xl sm:text-4xl tabular-nums leading-none ${
              meetsAssertivityTarget(stats.winRate) ? 'text-cyan-400' : 'text-amber-400'
            }`}
          >
            {formatWinRatePrecise(stats.winRate)}
          </p>
          <p className="text-zinc-500 text-[10px] font-bold tracking-[0.15em] uppercase mt-2">
            Acertividade
          </p>
        </div>
      </div>

      {playsToday > 0 && (
        <p
          className={`text-[9px] text-center mt-3 font-bold tracking-[0.12em] uppercase ${
            stats.meetsTarget ? 'text-emerald-400/80' : 'text-zinc-500'
          }`}
        >
          {badge.text}
        </p>
      )}

      {playsToday > 0 && (
        <p className="text-zinc-600 text-[9px] text-center mt-2">
          Histórico do robô · {playsToday} jogadas · perda só após entrada + 3 gales
        </p>
      )}
    </div>
  );
}

function SimulatorTab({ stats, maxGales, disabled }) {
  const [baseBet, setBaseBet] = useState(10);
  const result = useMemo(
    () =>
      calculateDailyProfit({
        greens: stats.greens,
        reds: stats.reds,
        baseBet,
        maxGales,
      }),
    [stats.greens, stats.reds, baseBet, maxGales],
  );

  return (
    <div className="py-4 px-1 space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-zinc-400 text-xs shrink-0">Valor da aposta</label>
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">€</span>
          <input
            type="number"
            min="1"
            step="1"
            value={baseBet}
            disabled={disabled}
            onChange={(e) => setBaseBet(Math.max(1, Number(e.target.value) || 1))}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 pl-9 pr-3 text-white text-sm font-bold tabular-nums focus:outline-none focus:border-cyan-500/50 disabled:opacity-50"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-zinc-950/80 rounded-lg p-3 border border-zinc-800">
          <p className="text-zinc-500 text-[9px] uppercase mb-1">Ganhos</p>
          <p className="text-emerald-400 font-black text-sm tabular-nums">
            {formatCurrency(result.winTotal)}
          </p>
        </div>
        <div className="bg-zinc-950/80 rounded-lg p-3 border border-zinc-800">
          <p className="text-zinc-500 text-[9px] uppercase mb-1">Perdas</p>
          <p className="text-red-400 font-black text-sm tabular-nums">
            {formatCurrency(-result.lossTotal)}
          </p>
        </div>
        <div
          className={`rounded-lg p-3 border ${
            result.profit >= 0
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-red-500/10 border-red-500/30'
          }`}
        >
          <p className="text-zinc-500 text-[9px] uppercase mb-1">Lucro</p>
          <p
            className={`font-black text-sm tabular-nums ${
              result.profit >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {formatCurrency(result.profit)}
          </p>
        </div>
      </div>

      <p className="text-zinc-600 text-[9px] leading-relaxed text-center">
        {stats.greens} verdes · {stats.reds} perdas · payout 0,95x · entrada + gales
      </p>
    </div>
  );
}

function BancaTab({ stats, maxGales, disabled }) {
  const [bankroll, setBankroll] = useState(100);
  const [baseBet, setBaseBet] = useState(10);

  const result = useMemo(
    () =>
      calculateDailyProfit({
        greens: stats.greens,
        reds: stats.reds,
        baseBet,
        maxGales,
      }),
    [stats.greens, stats.reds, baseBet, maxGales],
  );

  const current = bankroll + result.profit;

  return (
    <div className="py-4 px-1 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-zinc-500 text-[10px] uppercase font-bold block mb-1.5">
            Banca inicial
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">€</span>
            <input
              type="number"
              min="1"
              value={bankroll}
              disabled={disabled}
              onChange={(e) => setBankroll(Math.max(1, Number(e.target.value) || 1))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 pl-9 pr-3 text-white text-sm font-bold tabular-nums focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>
        <div>
          <label className="text-zinc-500 text-[10px] uppercase font-bold block mb-1.5">
            Aposta base
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">€</span>
            <input
              type="number"
              min="1"
              value={baseBet}
              disabled={disabled}
              onChange={(e) => setBaseBet(Math.max(1, Number(e.target.value) || 1))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 pl-9 pr-3 text-white text-sm font-bold tabular-nums focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>
      </div>

      <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 text-center">
        <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-1">
          Banca atual
        </p>
        <p
          className={`font-black text-3xl tabular-nums ${
            current >= bankroll ? 'text-cyan-400' : 'text-red-400'
          }`}
        >
          {formatCurrency(current).replace('+', '')}
        </p>
        <p className="text-zinc-600 text-[9px] mt-2">
          Lucro do dia:{' '}
          <span className={result.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
            {formatCurrency(result.profit)}
          </span>
        </p>
      </div>
    </div>
  );
}

export default function DailyScoreboardPanel({
  scoreboard,
  gameName = 'Bac Bo',
  live = true,
  maxGales = 2,
  disabled = false,
}) {
  const [tab, setTab] = useState('placar');
  const stats = useMemo(() => normalizeScoreboard(scoreboard), [scoreboard]);
  const playsToday = scoreboard?.playsToday ?? stats.greens + stats.reds;

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
      <TabBar active={tab} onChange={setTab} />

      <div className="px-4 pb-4">
        {tab === 'placar' && (
          <DailyScoreStrip
            stats={stats}
            gameName={gameName}
            live={live}
            playsToday={playsToday}
          />
        )}
        {tab === 'simulador' && (
          <SimulatorTab stats={stats} maxGales={maxGales} disabled={disabled} />
        )}
        {tab === 'banca' && (
          <BancaTab stats={stats} maxGales={maxGales} disabled={disabled} />
        )}
      </div>
    </div>
  );
}
