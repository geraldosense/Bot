import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { formatTime } from '../hooks/useWebSocket';
import { getHistorySummary } from '../utils/signalResult';
import { dedupeHistorySignals } from '../utils/historyDedupe';
import BacBoColorSphere, { BacBoColorSphereRow } from './BacBoColorSphere';

function HistoryRow({ signal }) {
  const { resultLabel, isGreen, galePath, sequence, bet, attemptLabel } = getHistorySummary(signal);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl border px-3.5 py-3 ${
        isGreen
          ? 'border-emerald-500/45 bg-gradient-to-br from-emerald-950/40 via-zinc-950/80 to-zinc-950/90 shadow-[0_0_20px_rgba(16,185,129,0.12)]'
          : 'border-red-500/35 bg-gradient-to-br from-red-950/30 via-zinc-950/80 to-zinc-950/90 shadow-[0_0_16px_rgba(239,68,68,0.08)]'
      }`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-px ${
          isGreen
            ? 'bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent'
            : 'bg-gradient-to-r from-transparent via-red-400/50 to-transparent'
        }`}
      />

      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
            isGreen
              ? 'bg-emerald-500 shadow-emerald-500/30'
              : 'bg-red-500 shadow-red-500/30'
          }`}
        >
          {isGreen ? (
            <Check className="w-4 h-4 text-white" strokeWidth={3} />
          ) : (
            <X className="w-4 h-4 text-white" strokeWidth={3} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <span
                className={`font-black text-base tracking-wider uppercase ${
                  isGreen ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {resultLabel}
              </span>
              <BacBoColorSphereRow zones={galePath} size="md" gap="gap-1" />
            </div>
            <span className="text-zinc-500 text-[11px] tabular-nums shrink-0 pt-0.5">
              {formatTime(signal.created_date)}
            </span>
          </div>

          <div className="mt-2.5 space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="text-zinc-500 text-[11px] font-semibold shrink-0 w-[52px]">
                Aposta:
              </span>
              {bet ? (
                <span className="inline-flex items-center gap-2">
                  <BacBoColorSphere zone={bet.zone} size="sm" />
                  <span className="text-[11px] font-bold text-zinc-200">
                    {bet.emoji} {bet.label}
                  </span>
                </span>
              ) : (
                <span className="text-zinc-600 text-[10px]">—</span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-zinc-500 text-[11px] font-semibold shrink-0 w-[52px]">
                Seq:
              </span>
              <BacBoColorSphereRow zones={sequence} size="sm" gap="gap-1.5" />
            </div>

            {attemptLabel && attemptLabel !== 'ENTRADA' && (
              <p className="text-[10px] text-zinc-600 pl-[52px]">
                Ganhou no <span className="text-zinc-400 font-bold">{attemptLabel}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function SignalHistory({
  history,
  title = 'HISTÓRICO DE ENTRADAS',
  limit = 8,
  showVerMais = true,
}) {
  const [expanded, setExpanded] = useState(false);
  const results = dedupeHistorySignals(
    (history || []).filter(
      (s) =>
        s?.id &&
        (s.signal_status === 'result' ||
          s.result === 'green' ||
          s.result === 'loss' ||
          s.result === 'red'),
    ),
  );

  const visible = expanded ? results : results.slice(0, limit);
  const hasMore = results.length > limit;

  if (!results.length) {
    return (
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 px-4 py-10 text-center">
        <p className="text-zinc-500 text-sm">Sem histórico de entradas hoje</p>
        <p className="text-zinc-600 text-xs mt-1">Os resultados aparecem aqui em tempo real</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div className="flex items-center justify-between px-0.5">
        <div>
          <h3 className="text-white font-black text-sm tracking-wide uppercase">{title}</h3>
          <p className="text-zinc-600 text-[10px] mt-0.5">Cores reais da mesa Evolution Bac Bo</p>
        </div>
        {showVerMais && hasMore && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-cyan-400 text-xs font-bold hover:text-cyan-300 transition-colors shrink-0"
          >
            {expanded ? 'Ver menos' : 'Ver mais'}
          </button>
        )}
      </div>

      <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-0.5 scrollbar-thin">
        {visible.map((sig) => (
          <HistoryRow key={sig.id} signal={sig} />
        ))}
      </div>
    </motion.div>
  );
}
