import { motion } from 'framer-motion';

export default function GameCard({ game, selected, onSelect, liveAssertivity, opensRobot = false }) {
  const confidence = liveAssertivity || game.confidence;

  return (
    <motion.button
      type="button"
      whileHover={{ scale: game.disabled ? 1 : 1.03 }}
      whileTap={{ scale: game.disabled ? 1 : 0.98 }}
      onClick={() => onSelect(game)}
      disabled={game.disabled}
      aria-label={opensRobot ? `Abrir robô ${game.name}` : game.name}
      className={`relative overflow-hidden rounded-2xl text-left border transition-all ${
        selected
          ? 'border-purple-400 ring-2 ring-purple-500/40 shadow-lg shadow-purple-500/20'
          : 'border-zinc-800 hover:border-zinc-600'
      } ${game.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className="relative aspect-[5/3] w-full overflow-hidden bg-zinc-900">
        <img
          src={game.image}
          alt={game.name}
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

        {game.hot && (
          <span className="absolute top-2 right-2 z-10 bg-red-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-md">
            HOT
          </span>
        )}

        {opensRobot && (
          <span className="absolute top-2 left-2 z-10 bg-emerald-600/90 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-md">
            ABRIR ROBÔ
          </span>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-2.5">
          <p className="text-white font-black text-xs leading-tight drop-shadow-md">{game.name}</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-emerald-400 text-[10px] font-bold">{confidence}</p>
            {game.disabled ? (
              <p className="text-zinc-400 text-[9px] font-semibold">Em breve</p>
            ) : opensRobot ? (
              <p className="text-emerald-300/90 text-[9px] font-semibold">Toque aqui →</p>
            ) : null}
          </div>
        </div>
      </div>
    </motion.button>
  );
}
