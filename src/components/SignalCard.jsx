import { motion } from 'framer-motion';
import { CheckCircle, Shield, Zap, TrendingUp } from 'lucide-react';
import BacBoTable from './BacBoTable';
import { formatTime } from '../hooks/useWebSocket';
import { getEntryZone, betToZone, formatAttemptLabel, GALE_ROUNDS } from '../utils/bacBoStats';
import {
  getResultLabel,
  getResultStyles,
  getSignalBetColor,
  getSignalOutcomeColor,
  getGaleResultLine,
  isSignalGreen,
} from '../utils/signalResult';

export default function SignalCard({ signal }) {
  if (!signal) return null;

  if (signal.signal_status === 'analyzing') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900/80 border border-amber-500/40 rounded-2xl p-6 text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-3 border-amber-500/30 border-t-amber-500 rounded-full mx-auto mb-3"
        />
        <p className="text-amber-300 font-bold">Analisando padrões...</p>
        <p className="text-zinc-500 text-xs mt-1">{formatTime(signal.created_date)}</p>
      </motion.div>
    );
  }

  const betZone = getEntryZone(signal) || betToZone(signal.bet_recommendation || signal.bet);
  const isGale = signal.signal_status === 'gale_update';
  const isResult = signal.signal_status === 'result';
  const isGreen = isSignalGreen(signal);
  const resultStyles = getResultStyles(signal);
  const betColor = getSignalBetColor(signal);
  const outcomeColor = getSignalOutcomeColor(signal);

  if (isResult) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`relative overflow-hidden rounded-2xl p-6 border-2 ${resultStyles.bg} ${resultStyles.border} ${resultStyles.glow}`}
      >
        <div className="text-center space-y-4">
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-full border-2 ${resultStyles.badge}`}
          >
            <span className="text-3xl">{isGreen ? '✓' : '✕'}</span>
          </div>
          <h3 className={`font-black text-3xl tracking-[0.15em] uppercase ${resultStyles.text}`}>
            {getResultLabel(signal)}
          </h3>
          <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider">
            {getGaleResultLine(signal)}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            {betColor && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black border"
                style={{
                  color: betColor.hex,
                  borderColor: `${betColor.hex}55`,
                  backgroundColor: `${betColor.hex}18`,
                }}
              >
                {betColor.emoji} Apostou {betColor.label}
              </span>
            )}
            {outcomeColor && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black border"
                style={{
                  color: outcomeColor.hex,
                  borderColor: `${outcomeColor.hex}55`,
                  backgroundColor: `${outcomeColor.hex}18`,
                }}
              >
                {outcomeColor.emoji} Saiu {outcomeColor.label}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-500/50 rounded-2xl p-4 space-y-3"
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/10 to-green-500/0"
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />

      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <h3 className="text-green-300 font-bold text-sm">
                {isGale
                  ? `${formatAttemptLabel(signal.current_gale)} — MANTER A MESMA COR`
                  : 'ENTRADA CONFIRMADA'}
              </h3>
              <p className="text-[10px] text-green-500">{formatTime(signal.created_date)}</p>
            </div>
          </div>
          {signal.confidence && (
            <div className="flex items-center gap-1 bg-green-500/15 border border-green-500/30 rounded-full px-2.5 py-1">
              <TrendingUp className="w-3 h-3 text-green-400" />
              <span className="text-green-300 text-xs font-bold">{signal.confidence}%</span>
            </div>
          )}
        </div>

        <BacBoTable betZone={betZone} coverTie={signal.tie_protection} status="confirmed" />

        {signal.reason && (
          <p className="text-zinc-400 text-xs mt-3 text-center italic">{signal.reason}</p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
          {signal.entry_condition && (
            <div className="bg-slate-800/60 rounded-lg px-3 py-1.5">
              <span className="text-[10px] text-slate-400">Última cor: </span>
              <span className="text-base">{signal.entry_condition}</span>
            </div>
          )}
          {signal.tie_protection && (
            <div className="bg-yellow-500/15 border border-yellow-500/40 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-yellow-400" />
              <span className="text-yellow-300 text-[10px] font-bold">COBRIR EMPATE</span>
            </div>
          )}
          <div className="bg-purple-500/15 border border-purple-500/40 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-purple-400" />
            <span className="text-purple-300 text-[10px] font-bold">
              ENTRADA + ATÉ {GALE_ROUNDS} GALES
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
