import { motion } from 'framer-motion';

const BAR_STYLES = {
  done: {
    bar: 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.45)]',
    label: 'text-emerald-400/90',
  },
  active: {
    bar: 'bg-purple-500 shadow-[0_0_16px_rgba(168,85,247,0.65)]',
    label: 'text-purple-300',
  },
  failed: {
    bar: 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]',
    label: 'text-red-400',
  },
  pending: {
    bar: 'bg-white/10',
    label: 'text-white/25',
  },
};

function ProgressBar({ label, state, wide = false }) {
  const styles = BAR_STYLES[state] || BAR_STYLES.pending;
  const isActive = state === 'active';

  return (
    <div className={`flex flex-col items-center gap-1.5 ${wide ? 'w-full' : 'flex-1'}`}>
      <motion.div
        className={`w-full h-1.5 rounded-full ${styles.bar}`}
        animate={
          isActive ? { opacity: [0.75, 1, 0.75], scaleY: [1, 1.15, 1] } : { opacity: 1 }
        }
        transition={
          isActive ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } : undefined
        }
      />
      <span
        className={`text-[8px] font-black tracking-[0.12em] uppercase whitespace-nowrap ${styles.label}`}
      >
        {label}
      </span>
    </div>
  );
}

export default function GaleProgressBars({ progress }) {
  if (!progress?.show) return null;

  const { entry, gales } = progress;

  return (
    <div className="w-full max-w-[300px] mx-auto mt-3 mb-1 space-y-2.5">
      {/* Entrada inicial — nunca conta como gale */}
      <ProgressBar label={entry.label} state={entry.state} wide />

      {/* 3 gales — só activam após falha da entrada */}
      <div className="flex items-center gap-2">
        {gales.map((gale) => (
          <ProgressBar key={gale.label} label={gale.label} state={gale.state} />
        ))}
      </div>
    </div>
  );
}
