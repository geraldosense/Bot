import { useMemo, useState } from 'react';
import { Calculator, TrendingUp, TrendingDown } from 'lucide-react';
import { calculateDailyProfit, formatCurrency } from '../utils/profitSimulator';
import { normalizeScoreboard } from '../utils/scoreboard';

export default function DailyProfitSimulator({ scoreboard, maxGales = 2, disabled = false }) {
  const [baseBet, setBaseBet] = useState(10);
  const stats = useMemo(() => normalizeScoreboard(scoreboard), [scoreboard]);

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

  const positive = result.profit >= 0;

  return (
    <div
      className={`rounded-xl border p-4 ${
        disabled
          ? 'bg-zinc-900/40 border-zinc-800/80 opacity-70'
          : 'bg-zinc-900/80 border-zinc-800'
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Calculator className="w-4 h-4 text-purple-400" />
        <h3 className="text-white font-bold text-sm">Simulador de Lucro Diário</h3>
      </div>

      <div className="flex items-center gap-3 mb-4">
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
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg py-2 pl-9 pr-3 text-white text-sm font-bold tabular-nums focus:outline-none focus:border-purple-500 disabled:opacity-50"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-zinc-950/60 rounded-lg p-2.5 border border-zinc-800">
          <p className="text-zinc-500 text-[9px] uppercase mb-1">Ganhos</p>
          <p className="text-emerald-400 font-black text-sm tabular-nums">
            {formatCurrency(result.winTotal)}
          </p>
        </div>
        <div className="bg-zinc-950/60 rounded-lg p-2.5 border border-zinc-800">
          <p className="text-zinc-500 text-[9px] uppercase mb-1">Perdas</p>
          <p className="text-red-400 font-black text-sm tabular-nums">
            {formatCurrency(-result.lossTotal)}
          </p>
        </div>
        <div
          className={`rounded-lg p-2.5 border ${
            positive
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-red-500/10 border-red-500/30'
          }`}
        >
          <p className="text-zinc-500 text-[9px] uppercase mb-1 flex items-center justify-center gap-1">
            {positive ? (
              <TrendingUp className="w-3 h-3 text-emerald-400" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-400" />
            )}
            Lucro
          </p>
          <p
            className={`font-black text-sm tabular-nums ${
              positive ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {formatCurrency(result.profit)}
          </p>
        </div>
      </div>

      <p className="text-zinc-600 text-[9px] mt-3 leading-relaxed">
        Baseado nos {stats.greens + stats.reds} sinais do dia · payout médio 0,95x · até{' '}
        {maxGales} gale{maxGales !== 1 ? 's' : ''} por loss
      </p>
    </div>
  );
}
