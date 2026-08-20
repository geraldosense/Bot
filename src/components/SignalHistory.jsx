import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, ChevronUp, History, Wifi, X } from 'lucide-react';
import { formatTime } from '../hooks/useWebSocket';
import { getHistorySummary } from '../utils/signalResult';
import { computeHistoryStats } from '../utils/historyNormalize';
import { formatWinRate } from '../utils/scoreboard';
import BacBoColorSphere, { BacBoColorSphereRow } from './BacBoColorSphere';

const FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'green', label: 'GREEN' },
  { id: 'red', label: 'RED' },
];

function HistoryRowMoneyTix({ signal, index }) {
  const { resultLabel, isGreen, galePath, sequence, bet, outcome, galeLine } =
    getHistorySummary(signal);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className={`grid grid-cols-[auto_1fr_auto] gap-x-3 gap-y-1.5 items-center px-3 py-2.5 rounded-xl border ${
        isGreen
          ? 'border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-950/30'
          : 'border-red-500/25 bg-red-950/15 hover:bg-red-950/25'
      } transition-colors`}
    >
      {/* Resultado + tentativas */}
      <div className="flex items-center gap-2 shrink-0">
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
            isGreen ? 'bg-emerald-500' : 'bg-red-500'
          }`}
        >
          {isGreen ? (
            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
          ) : (
            <X className="w-3.5 h-3.5 text-white" strokeWidth={3} />
          )}
        </div>
        <div className="flex flex-col gap-0.5">
          <span
            className={`text-xs font-black tracking-wider ${
              isGreen ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {resultLabel}
          </span>
          <BacBoColorSphereRow zones={galePath} size="sm" gap="gap-0.5" />
        </div>
      </div>

      {/* Aposta + Seq + detalhe */}
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[9px] font-bold text-zinc-500 uppercase shrink-0">Aposta</span>
            {bet ? (
              <span className="inline-flex items-center gap-1">
                <BacBoColorSphere zone={bet.zone} size="sm" />
                <span className="text-[10px] font-bold text-zinc-200 truncate">
                  {bet.label}
                </span>
              </span>
            ) : (
              <span className="text-zinc-600 text-[10px]">—</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-bold text-zinc-500 uppercase shrink-0">Seq</span>
            <BacBoColorSphereRow zones={sequence} size="sm" gap="gap-0.5" />
          </div>
        </div>
        <p
          className={`text-[9px] font-semibold uppercase tracking-wide truncate ${
            isGreen ? 'text-emerald-500/70' : 'text-red-500/70'
          }`}
        >
          {galeLine}
          {outcome && !isGreen && bet && outcome.zone !== bet.zone && (
            <span className="text-zinc-500 normal-case">
              {' '}
              · Saiu {outcome.label}
            </span>
          )}
        </p>
      </div>

      {/* Hora */}
      <div className="text-right shrink-0">
        <span className="text-[10px] tabular-nums text-zinc-400 font-medium">
          {formatTime(signal.created_date)}
        </span>
        <span className="block text-[8px] text-zinc-600 tabular-nums">#{index + 1}</span>
      </div>
    </motion.div>
  );
}

function StatsBar({ stats, live }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-800/70 border border-zinc-700/50 px-2 py-1 text-[10px] font-bold text-zinc-300">
        <History className="w-3 h-3 text-zinc-500" />
        {stats.total} entradas
      </span>
      <span className="inline-flex items-center rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2 py-1 text-[10px] font-bold text-emerald-400">
        {stats.greens} GREEN
      </span>
      <span className="inline-flex items-center rounded-lg bg-red-500/15 border border-red-500/30 px-2 py-1 text-[10px] font-bold text-red-400">
        {stats.reds} RED
      </span>
      {stats.total > 0 && (
        <span className="inline-flex items-center rounded-lg bg-cyan-500/10 border border-cyan-500/25 px-2 py-1 text-[10px] font-bold text-cyan-400">
          {formatWinRate(stats.winRate)}
        </span>
      )}
      {live && (
        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 px-2 py-1 text-[9px] font-bold text-emerald-400">
          <Wifi className="w-3 h-3" />
          Ao vivo
        </span>
      )}
    </div>
  );
}

export default function SignalHistory({
  history,
  scoreboard: _scoreboard,
  title = 'HISTÓRICO DE ENTRADAS',
  limit = 8,
  showVerMais = true,
  variant = 'default',
  defaultExpanded = false,
  maxHeight = 520,
  live = false,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded || variant === 'robot');
  const [filter, setFilter] = useState('all');

  const { list: allResults, greens, reds, total, winRate } = useMemo(
    () => computeHistoryStats(history),
    [history],
  );

  const stats = { greens, reds, total, winRate };

  const filtered = useMemo(() => {
    if (filter === 'green') return allResults.filter((s) => getHistorySummary(s).isGreen);
    if (filter === 'red') return allResults.filter((s) => !getHistorySummary(s).isGreen);
    return allResults;
  }, [allResults, filter]);

  const pageLimit = variant === 'robot' ? Math.max(limit, 100) : limit;
  const visible = expanded ? filtered : filtered.slice(0, pageLimit);
  const hasMore = filtered.length > pageLimit;
  const isRobot = variant === 'robot';

  if (!allResults.length) {
    return (
      <div
        className={`text-center ${
          isRobot
            ? 'rounded-2xl border border-emerald-900/40 bg-gradient-to-b from-zinc-950/80 to-black/60 px-4 py-8'
            : 'rounded-2xl border border-zinc-800/80 bg-zinc-900/40 px-4 py-10'
        }`}
      >
        <History className={`w-8 h-8 mx-auto mb-2 ${isRobot ? 'text-emerald-700' : 'text-zinc-600'}`} />
        <p className={`text-sm font-semibold ${isRobot ? 'text-zinc-400' : 'text-zinc-500'}`}>
          Sem entradas registadas hoje
        </p>
        <p className="text-zinc-600 text-xs mt-1 max-w-xs mx-auto">
          Cada entrada confirmada pelo robô aparece aqui com GREEN/RED, aposta, sequência e horário
        </p>
      </div>
    );
  }

  const wrapperClass = isRobot
    ? 'rounded-2xl border border-emerald-900/45 bg-gradient-to-b from-zinc-950/95 via-[#031A0B]/50 to-black/80 p-3.5 shadow-[inset_0_1px_0_rgba(16,185,129,0.08)]'
    : 'rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-3.5';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={wrapperClass}
    >
      {/* Header MoneyTix */}
      <div className="mb-3 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-white font-black text-sm tracking-wide uppercase">{title}</h3>
            <p className="text-zinc-600 text-[10px] mt-0.5">
              GREEN/RED · Aposta · Seq · Horário — dados Evolution Bac Bo
            </p>
          </div>
          {showVerMais && hasMore && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex items-center gap-0.5 text-emerald-400 text-[11px] font-bold hover:text-emerald-300 shrink-0"
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  Menos
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  Todas ({filtered.length})
                </>
              )}
            </button>
          )}
        </div>

        <StatsBar stats={stats} live={live} />

        {/* Filtros */}
        <div className="flex gap-1.5 p-0.5 rounded-lg bg-zinc-900/80 border border-zinc-800/80">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`flex-1 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wide transition-all ${
                filter === f.id
                  ? f.id === 'green'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : f.id === 'red'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-zinc-700 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {f.label}
              {f.id === 'green' && stats.greens > 0 && (
                <span className="ml-1 opacity-80">({stats.greens})</span>
              )}
              {f.id === 'red' && stats.reds > 0 && (
                <span className="ml-1 opacity-80">({stats.reds})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Colunas */}
      <div className="hidden sm:grid grid-cols-[auto_1fr_auto] gap-x-3 px-3 pb-1.5 text-[9px] font-bold text-zinc-600 uppercase tracking-wider">
        <span>Resultado</span>
        <span>Aposta · Seq</span>
        <span className="text-right">Hora</span>
      </div>

      {/* Lista */}
      <div
        className="space-y-1.5 overflow-y-auto pr-0.5 scrollbar-thin"
        style={{ maxHeight }}
      >
        <AnimatePresence mode="popLayout">
          {visible.length === 0 ? (
            <p className="text-center text-zinc-600 text-xs py-6">
              Nenhuma entrada {filter === 'green' ? 'GREEN' : 'RED'} hoje
            </p>
          ) : (
            visible.map((sig, i) => (
              <HistoryRowMoneyTix key={String(sig.id)} signal={sig} index={i} />
            ))
          )}
        </AnimatePresence>
      </div>

      <p className="text-center text-zinc-600 text-[9px] mt-2 pt-2 border-t border-zinc-800/50">
        {visible.length} de {filtered.length} entradas
        {filter !== 'all' ? ` (${filter.toUpperCase()})` : ''} · dia operacional BR
      </p>
    </motion.div>
  );
}
