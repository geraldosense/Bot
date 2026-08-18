import { motion } from 'framer-motion';

export default function BacBoTable({ betZone, coverTie, status = 'confirmed' }) {
  const isPlayer = betZone === 'player';
  const isBanker = betZone === 'banker';
  const isTie = betZone === 'tie';
  const isGreen = status === 'green';
  const isLoss = status === 'loss';

  const playerActive = isPlayer || (isGreen && betZone === 'player');
  const bankerActive = isBanker || (isGreen && betZone === 'banker');

  return (
    <div className="relative mx-auto max-w-sm">
      <div className="bg-zinc-950/80 rounded-xl border border-zinc-700/50 p-4">
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Player / Jogador */}
          <motion.div
            animate={playerActive ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
            className={`relative rounded-xl p-4 text-center border-2 transition-all ${
              playerActive
                ? 'bg-blue-500/20 border-blue-400 shadow-lg shadow-blue-500/30'
                : 'bg-zinc-800/50 border-zinc-700 opacity-60'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-blue-500 mx-auto mb-2 border-2 border-blue-300 shadow-lg shadow-blue-500/50" />
            <p className="text-blue-300 font-black text-sm">JOGADOR</p>
            <p className="text-blue-400/70 text-[10px]">PLAYER</p>
            {playerActive && status === 'confirmed' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute -top-2 -right-2 bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full"
              >
                APOSTAR
              </motion.div>
            )}
          </motion.div>

          {/* Banker / Banca */}
          <motion.div
            animate={bankerActive ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
            className={`relative rounded-xl p-4 text-center border-2 transition-all ${
              bankerActive
                ? 'bg-red-500/20 border-red-400 shadow-lg shadow-red-500/30'
                : 'bg-zinc-800/50 border-zinc-700 opacity-60'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-red-500 mx-auto mb-2 border-2 border-red-300 shadow-lg shadow-red-500/50" />
            <p className="text-red-300 font-black text-sm">BANCA</p>
            <p className="text-red-400/70 text-[10px]">BANKER</p>
            {bankerActive && status === 'confirmed' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute -top-2 -right-2 bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full"
              >
                APOSTAR
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Tie row */}
        {(coverTie || isTie) && (
          <div
            className={`rounded-xl p-3 text-center border-2 ${
              isTie
                ? 'bg-yellow-500/20 border-yellow-400 shadow-lg shadow-yellow-500/30'
                : coverTie
                ? 'bg-yellow-500/10 border-yellow-500/30'
                : 'bg-zinc-800/30 border-zinc-700 opacity-40'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <div className="w-6 h-6 rounded-full bg-yellow-500 border border-yellow-300" />
              <p className="text-yellow-300 font-bold text-xs">EMPATE — PROTEÇÃO</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
