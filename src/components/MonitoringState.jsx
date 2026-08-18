import { motion } from 'framer-motion';
import { Bot, Radio } from 'lucide-react';

export default function MonitoringState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden bg-zinc-900/80 backdrop-blur border border-zinc-700/60 rounded-2xl p-8"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5" />

      <div className="relative flex flex-col items-center text-center space-y-6">
        <div className="relative">
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl"
          />
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Bot className="w-10 h-10 text-white" />
          </div>
        </div>

        <div>
          <h3 className="text-white font-black text-lg tracking-wide">ROBÔ ANALISANDO</h3>
          <p className="text-zinc-400 text-sm mt-1">Monitorando padrões em tempo real...</p>
        </div>

        <div className="flex items-center gap-3">
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="flex items-center gap-2 bg-red-500/15 border border-red-500/40 rounded-full px-4 py-1.5"
          >
            <Radio className="w-3 h-3 text-red-400" />
            <span className="text-red-400 text-xs font-bold uppercase tracking-wider">Ao Vivo</span>
          </motion.div>
        </div>

        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
              className="w-2 h-2 rounded-full bg-purple-500"
            />
          ))}
        </div>

        <p className="text-zinc-500 text-xs max-w-xs">
          O robô analisa streaks, momentum, alternância e desequilíbrios para gerar sinais com alta confiança
        </p>
      </div>
    </motion.div>
  );
}
