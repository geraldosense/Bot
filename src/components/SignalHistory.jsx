import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { formatTime } from '../hooks/useWebSocket';
import { getColorConfig } from '../utils/bacBoStats';
import { getHistorySummary } from '../utils/signalResult';

const ZONE_BG = {
  player: '#2563EB',
  banker: '#DC2626',
  tie: '#CA8A04',
};

function ColorDot({ zone, className = '' }) {
  if (!zone) {
    return <span className={`inline-block w-3 h-3 rounded-full bg-zinc-700 ${className}`} />;
  }

  return (
    <span
      className={`inline-block w-3 h-3 rounded-full shrink-0 border border-black/30 shadow-sm ${className}`}
      style={{ backgroundColor: ZONE_BG[zone] || '#71717A' }}
      title={getColorConfig(zone)?.bet}
    />
  );
}

function ColorLabel({ colorInfo, fallback = '—' }) {
  if (!colorInfo) {
    return <span className="text-zinc-600 text-[10px]">{fallback}</span>;
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-zinc-200">
      <ColorDot zone={colorInfo.zone} />
      <span>
        {colorInfo.emoji} {colorInfo.label}
      </span>
    </span>
  );
}

function DotRow({ zones, gap = 'gap-1' }) {
  if (!zones?.length) {
    return <span className="text-zinc-600 text-[10px]">—</span>;
  }

  return (
    <span className={`inline-flex items-center ${gap}`}>
      {zones.map((zone, i) => (
        <ColorDot key={`${zone}-${i}`} zone={zone} />
      ))}
    </span>
  );
}

function HistoryRow({ signal }) {
  const { resultLabel, isGreen, galePath, sequence, bet, attemptLabel } = getHistorySummary(signal);

  return (
    <div
      className={`rounded-xl border px-3 py-2.5 ${
        isGreen
          ? 'bg-emerald-950/20 border-emerald-800/50'
          : 'bg-red-950/15 border-red-900/40'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            isGreen ? 'bg-emerald-500' : 'bg-red-500'
          }`}
        >
          {isGreen ? (
            <Check className="w-4 h-4 text-white" strokeWidth={3} />
          ) : (
            <X className="w-4 h-4 text-white" strokeWidth={3} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <span
                className={`font-black text-sm tracking-wide uppercase ${
                  isGreen ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {resultLabel}
              </span>
              <DotRow zones={galePath} />
            </div>
            <span className="text-zinc-500 text-[11px] tabular-nums shrink-0">
              {formatTime(signal.created_date)}
            </span>
          </div>

          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-zinc-500 shrink-0 w-14">Aposta:</span>
              <ColorLabel colorInfo={bet} />
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-zinc-500 shrink-0 w-14">Seq:</span>
              <DotRow zones={sequence} gap="gap-1.5" />
            </div>
            {attemptLabel && (
              <div className="flex items-center gap-2 text-[10px] text-zinc-600">
                <span className="shrink-0 w-14">Gale:</span>
                <span className="text-zinc-400 font-semibold">{attemptLabel}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignalHistory({
  history,
  title = 'HISTÓRICO RECENTE',
  limit = 8,
  showVerMais = true,
}) {
  const [expanded, setExpanded] = useState(false);
  const results = (history || []).filter((s) => s.signal_status === 'result');

  const visible = expanded ? results : results.slice(0, limit);
  const hasMore = results.length > limit;

  if (!results.length) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-8 text-center">
        <p className="text-zinc-500 text-sm">Sem histórico de sinais hoje</p>
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
        <h3 className="text-white font-black text-sm tracking-wide uppercase">{title}</h3>
        {showVerMais && hasMore && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-cyan-400 text-xs font-bold hover:text-cyan-300 transition-colors"
          >
            {expanded ? 'Ver menos' : 'Ver mais'}
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-[480px] overflow-y-auto pr-0.5">
        {visible.map((sig) => (
          <HistoryRow key={sig.id} signal={sig} />
        ))}
      </div>
    </motion.div>
  );
}
