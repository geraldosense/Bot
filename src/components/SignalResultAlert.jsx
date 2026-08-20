import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, X } from 'lucide-react';
import { getAlertDisplayColor, reconcileHistorySignal } from '../utils/signalResult';

export default function SignalResultAlert({ alert, onDismiss }) {
  if (!alert) return null;

  const isGreen = alert.outcome === 'green';
  const signal = reconcileHistorySignal(alert.signal);
  const color = getAlertDisplayColor(signal, alert.outcome);
  const colorLine = color
    ? isGreen
      ? `Cor acertada: ${color.emoji} ${color.label}`
      : `${color.emoji} ${color.label}`
    : null;

  return (
    <AnimatePresence>
      {alert && (
        <motion.div
          key={alert.id}
          initial={{ opacity: 0, y: -24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          className="fixed top-3 left-3 right-3 z-[100] max-w-lg mx-auto pointer-events-auto"
          role="alert"
          aria-live="assertive"
        >
          <div
            className={`relative overflow-hidden rounded-2xl border px-4 py-3.5 shadow-2xl backdrop-blur-md ${
              isGreen
                ? 'bg-emerald-950/95 border-emerald-400/50 shadow-emerald-500/25'
                : 'bg-red-950/95 border-red-400/50 shadow-red-500/25'
            }`}
          >
            <div
              className={`absolute inset-x-0 top-0 h-1 ${
                isGreen
                  ? 'bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-600'
                  : 'bg-gradient-to-r from-red-700 via-red-500 to-red-700'
              }`}
            />

            <button
              type="button"
              onClick={onDismiss}
              className="absolute top-2.5 right-2.5 p-1 rounded-full text-white/50 hover:text-white/90 hover:bg-white/10"
              aria-label="Fechar alerta"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3 pr-6">
              <div
                className={`mt-0.5 flex-shrink-0 rounded-full p-1.5 ${
                  isGreen ? 'bg-emerald-500/20' : 'bg-red-500/20'
                }`}
              >
                {isGreen ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-400" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className={`text-lg font-black tracking-wide ${
                    isGreen ? 'text-emerald-300' : 'text-red-300'
                  }`}
                >
                  {isGreen ? '🎯 ' : '💔 '}
                  {alert.title}
                </p>
                <p className="text-white font-semibold text-sm mt-0.5">{alert.message}</p>
                {colorLine && (
                  <p className="text-white/80 text-xs mt-1.5 font-semibold">{colorLine}</p>
                )}
                {!colorLine && alert.sub && (
                  <p className="text-white/60 text-xs mt-1.5">{alert.sub}</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
