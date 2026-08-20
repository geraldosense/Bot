import { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, ChevronUp, History, Wifi, X } from 'lucide-react';
import { formatTime } from '../hooks/useWebSocket';
import { getMoneytixHistorySummary } from '../utils/signalResult';
import {
  normalizeHistoryList,
  computeHistoryStats,
  filterHistoryList,
} from '../utils/historyNormalize';
import { formatWinRate, formatWinRatePrecise } from '../utils/scoreboard';

const RESULT_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'green', label: 'GREEN' },
  { id: 'loss', label: 'LOSS' },
];

/** Linha igual ao moneytix01.com — 1 entrada do robô por linha */
function HistoryRowMoneyTix({ signal, index, total, isLatest, live, expanded, onToggle }) {
  const summary = getMoneytixHistorySummary(signal);
  const { bet, isGreen, resultLabel, resultEmoji, sequenceRaw, saiu, gales, tieProtection, boardG, boardR, boardWr, resultHint } =
    summary;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}
      className={`rounded-xl border px-3 py-2.5 cursor-pointer select-none transition-colors ${
        isGreen
          ? 'border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-950/30'
          : 'border-red-500/25 bg-red-950/15 hover:bg-red-950/25'
      } ${isLatest && live ? 'ring-1 ring-cyan-400/40 shadow-[0_0_12px_rgba(34,211,238,0.12)]' : ''}`}
    >
      <div className="grid grid-cols-[auto_1fr_auto] gap-x-3 gap-y-1 items-center">
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
          <span
            className={`text-xs font-black tracking-wider whitespace-nowrap ${
              isGreen ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {resultLabel} {resultEmoji}
          </span>
        </div>

        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-3 flex-wrap text-[10px]">
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-[9px] font-bold text-zinc-500 uppercase shrink-0">Aposta</span>
              {bet ? (
                <span className="font-bold text-zinc-200 truncate">
                  {bet.emoji} {bet.label}
                </span>
              ) : (
                <span className="text-zinc-600">—</span>
              )}
            </div>
            {!isGreen && saiu && (
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-bold text-zinc-500 uppercase shrink-0">Saiu</span>
                <span className="font-bold text-zinc-300">{saiu}</span>
              </div>
            )}
          </div>
          <div className="flex items-start gap-1.5 min-w-0">
            <span className="text-[9px] font-bold text-zinc-500 uppercase shrink-0 pt-0.5">Seq</span>
            <span className="text-[10px] font-mono text-zinc-400 leading-snug break-all line-clamp-2">
              {sequenceRaw}
            </span>
          </div>
          {resultHint && !expanded && (
            <p className="text-[9px] text-zinc-600 truncate">{resultHint}</p>
          )}
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] tabular-nums text-zinc-400 font-medium">
            {formatTime(signal.created_date)}
          </span>
          <span className="block text-[8px] text-zinc-600 tabular-nums">
            #{total - index}
            {isLatest && live ? (
              <span className="ml-1 text-cyan-500 font-bold">· novo</span>
            ) : null}
          </span>
        </div>
      </div>

      {expanded && (
        <div className="mt-2.5 pt-2.5 border-t border-zinc-800/80 space-y-2 text-[10px]">
          {bet && (
            <p className="text-zinc-400">
              <span className="text-zinc-500 font-bold uppercase text-[9px]">Recomendação IA · </span>
              {bet.emoji} {bet.label}
            </p>
          )}
          <p className="text-zinc-400">
            <span className="text-zinc-500 font-bold uppercase text-[9px]">Proteções · </span>
            {gales} gales
            {tieProtection ? ' · proteção empate activa' : ''}
          </p>
          {(boardG > 0 || boardR > 0) && (
            <p className="text-zinc-300">
              <span className="text-zinc-500 font-bold uppercase text-[9px]">Placar no momento · </span>
              {boardG} GREEN · {boardR} LOSS · {formatWinRatePrecise(boardWr)}
            </p>
          )}
          <p className="text-zinc-500 font-mono text-[9px] break-all">{sequenceRaw}</p>
        </div>
      )}
    </motion.div>
  );
}

function StatsBar({ stats, live, placarIa }) {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-800/70 border border-zinc-700/50 px-2 py-1 text-[10px] font-bold text-zinc-300">
          <History className="w-3 h-3 text-zinc-500" />
          {stats.total} entradas robô
        </span>
        <span className="inline-flex items-center rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2 py-1 text-[10px] font-bold text-emerald-400">
          {stats.greens} GREEN
        </span>
        <span className="inline-flex items-center rounded-lg bg-red-500/15 border border-red-500/30 px-2 py-1 text-[10px] font-bold text-red-400">
          {stats.losses ?? stats.reds} LOSS
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
      {placarIa && (
        <p className="text-[9px] text-zinc-500 px-0.5">
          Placar IA do dia · {placarIa.greens} GREEN · {placarIa.reds} LOSS ·{' '}
          {formatWinRatePrecise(placarIa.winRate)}
        </p>
      )}
    </div>
  );
}

export default function SignalHistory({
  history,
  scoreboard = null,
  title = 'HISTÓRICO DE ENTRADAS',
  limit = 8,
  showVerMais = true,
  variant = 'default',
  defaultExpanded = false,
  maxHeight = 520,
  live = false,
}) {
  const [listExpanded, setListExpanded] = useState(defaultExpanded || variant === 'robot');
  const [resultFilter, setResultFilter] = useState('all');
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [latestHighlightId, setLatestHighlightId] = useState(null);
  const listRef = useRef(null);
  const prevTopIdRef = useRef(null);

  const allResults = useMemo(() => normalizeHistoryList(history), [history]);
  const listStats = useMemo(() => computeHistoryStats(history), [history]);

  const placarIa = useMemo(() => {
    const g = Number(scoreboard?.greens) || 0;
    const r = Number(scoreboard?.reds) || 0;
    if (g + r > 0 && scoreboard?.source === 'casino_ia') {
      return { greens: g, reds: r, winRate: scoreboard.winRate };
    }
    return null;
  }, [scoreboard]);

  const filtered = useMemo(
    () => filterHistoryList(allResults, { result: resultFilter }),
    [allResults, resultFilter],
  );

  const pageLimit = variant === 'robot' ? Math.max(limit, 500) : limit;
  const visible = listExpanded ? filtered : filtered.slice(0, pageLimit);
  const hasMore = filtered.length > pageLimit;
  const isRobot = variant === 'robot';
  const latestId = allResults[0]?.id ? String(allResults[0].id) : null;

  useEffect(() => {
    if (!latestId || latestId === prevTopIdRef.current) return;
    prevTopIdRef.current = latestId;
    setLatestHighlightId(latestId);

    const el = listRef.current;
    if (el && el.scrollTop < 48) el.scrollTop = 0;

    const timer = setTimeout(() => setLatestHighlightId(null), 4000);
    return () => clearTimeout(timer);
  }, [latestId]);

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
          Sem entradas do robô hoje
        </p>
        <p className="text-zinc-600 text-xs mt-1 max-w-xs mx-auto">
          Cada entrada confirmada e finalizada pela IA aparece aqui — igual ao MoneyTix
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
      <div className="mb-3 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-white font-black text-sm tracking-wide uppercase">{title}</h3>
            <p className="text-zinc-600 text-[10px] mt-0.5">
              1 linha = 1 entrada do robô · GREEN/LOSS · Aposta · Seq · Hora
            </p>
          </div>
          {showVerMais && hasMore && (
            <button
              type="button"
              onClick={() => setListExpanded((v) => !v)}
              className="inline-flex items-center gap-0.5 text-emerald-400 text-[11px] font-bold hover:text-emerald-300 shrink-0"
            >
              {listExpanded ? (
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

        <StatsBar stats={listStats} live={live} placarIa={placarIa} />

        <div className="flex gap-1.5 p-0.5 rounded-lg bg-zinc-900/80 border border-zinc-800/80">
          {RESULT_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setResultFilter(f.id)}
              className={`flex-1 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wide transition-all ${
                resultFilter === f.id
                  ? f.id === 'green'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : f.id === 'loss'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-zinc-700 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {f.label}
              {f.id === 'green' && listStats.greens > 0 && (
                <span className="ml-1 opacity-80">({listStats.greens})</span>
              )}
              {f.id === 'loss' && (listStats.losses ?? listStats.reds) > 0 && (
                <span className="ml-1 opacity-80">({listStats.losses ?? listStats.reds})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="hidden sm:grid grid-cols-[auto_1fr_auto] gap-x-3 px-3 pb-1.5 text-[9px] font-bold text-zinc-600 uppercase tracking-wider">
        <span>Resultado</span>
        <span>Aposta · Seq</span>
        <span className="text-right">Hora</span>
      </div>

      <div
        ref={listRef}
        className="space-y-1.5 overflow-y-auto pr-0.5 scrollbar-thin"
        style={{ maxHeight }}
      >
        <AnimatePresence mode="popLayout">
          {visible.length === 0 ? (
            <p className="text-center text-zinc-600 text-xs py-6">
              Nenhuma entrada {resultFilter === 'green' ? 'GREEN' : 'LOSS'} hoje
            </p>
          ) : (
            visible.map((sig, i) => {
              const id = String(sig.id);
              return (
                <HistoryRowMoneyTix
                  key={id}
                  signal={sig}
                  index={i}
                  total={filtered.length}
                  isLatest={id === latestHighlightId}
                  live={live}
                  expanded={expandedRowId === id}
                  onToggle={() => setExpandedRowId((prev) => (prev === id ? null : id))}
                />
              );
            })
          )}
        </AnimatePresence>
      </div>

      <p className="text-center text-zinc-600 text-[9px] mt-2 pt-2 border-t border-zinc-800/50">
        {visible.length} de {filtered.length} entradas do robô
        {resultFilter !== 'all' ? ` · ${resultFilter.toUpperCase()}` : ''} · dia operacional BR
      </p>
    </motion.div>
  );
}
