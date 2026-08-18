import { motion } from 'framer-motion';
import { formatDateTime, getOutcomeInfo, parseBet } from '../hooks/useWebSocket';

export default function SignalHistory({ history }) {
  const results = (history || []).filter((s) => s.signal_status === 'result');
  if (!results.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-xl p-4"
    >
      <h3 className="text-white font-bold text-sm mb-3">HISTÓRICO DE SINAIS</h3>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {results.map((sig) => {
          const isGreen = sig.result === 'green';
          const bet = parseBet(sig.bet_recommendation);
          const actual = getOutcomeInfo(sig.actual_outcome || sig.sequence);

          return (
            <div
              key={sig.id}
              className={`rounded-lg border p-3 ${
                isGreen
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{isGreen ? '✅' : '❌'}</span>
                  <div>
                    <span className={`font-black text-sm ${isGreen ? 'text-green-400' : 'text-red-400'}`}>
                      {isGreen ? 'GREEN' : 'LOSS'}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-zinc-500 text-[10px]">Apostou:</span>
                      {bet === 'player' && <span className="text-blue-300 text-xs font-bold">🔵 AZUL</span>}
                      {bet === 'banker' && <span className="text-red-300 text-xs font-bold">🔴 VERMELHO</span>}
                      <span className="text-zinc-500 text-[10px]">→</span>
                      <span className={`text-xs font-bold ${actual.text}`}>
                        {actual.emoji} {actual.label}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-zinc-500 text-[10px]">
                  {formatDateTime(sig.created_date)}
                </span>
              </div>
              {sig.confidence && (
                <p className="text-zinc-500 text-[10px] mt-1">
                  Confiança: {sig.confidence}% | {sig.strategy}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
