import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';
import { X, Satellite } from 'lucide-react';
import {
  calculateProbabilities,
  getDisplayPercents,
  getActiveZone,
  getEntryZone,
  getPredictedZone,
  getStatusLabel,
  getColorConfig,
  getGaleProgress,
} from '../utils/bacBoStats';
import { normalizeScoreboard } from '../utils/scoreboard';
import { getPremiumBadge } from '../utils/playResult';
import { getHistorySummary } from '../utils/signalResult';
import BacBoLogo from './BacBoLogo';
import ScoreboardCards from './ScoreboardCards';
import GaleProgressBars from './GaleProgressBars';

function LogoHeader({ onClose }) {
  return (
    <div className="relative px-4 pt-3 pb-1">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white/80 hover:bg-black/60 transition-colors z-10"
          aria-label="Fechar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      <div className="flex flex-col items-center gap-3">
        <BacBoLogo className="h-[200px] sm:h-[240px] w-auto max-w-[min(100%,520px)]" />
        <div className="inline-flex items-center gap-1.5 bg-black/50 border border-white/10 rounded-full px-2.5 py-0.5">
          <span className="text-xs">🎲</span>
          <span className="text-white/90 text-[9px] font-bold tracking-wider">V1.0 FINAL</span>
        </div>
      </div>
    </div>
  );
}

function formatPercent(percent) {
  if (typeof percent === 'number') return `${percent}%`;
  return '--%';
}

/** Barra com pequeno espaço entre JOGADOR | EMPATE | CASA */
function ProbabilityBar({ percents, activeZone, isAnalyzing, isConfirmed, isGale = false }) {
  const highlight = (zone) =>
    activeZone === zone && (isAnalyzing || isConfirmed);

  const galeGlow = (zone) =>
    isGale && activeZone === zone
      ? '0 0 0 3px rgba(168, 85, 247, 0.9), 0 0 28px rgba(168, 85, 247, 0.55), inset 0 2px 0 rgba(255,255,255,0.15)'
      : null;

  return (
    <div className="flex items-center justify-center gap-2.5 sm:gap-3 w-full max-w-[480px] sm:max-w-[540px] mx-auto">
      {/* JOGADOR */}
      <motion.div
        animate={highlight('player') ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
        className="flex-1 h-[112px] sm:h-[124px] flex flex-col items-center justify-center rounded-2xl rounded-r-lg"
        style={{
          background: 'linear-gradient(180deg, #4A72E8 0%, #3B5DBF 55%, #2F4DA3 100%)',
          boxShadow: galeGlow('player') || (highlight('player')
            ? '0 0 0 2px #93C5FD, 0 0 20px rgba(59,130,246,0.5), inset 0 2px 0 rgba(255,255,255,0.15)'
            : 'inset 0 2px 0 rgba(255,255,255,0.15), inset 0 -2px 4px rgba(0,0,0,0.2), 0 3px 10px rgba(0,0,0,0.3)'),
        }}
      >
        <PercentValue value={formatPercent(percents.player)} />
        <Label text="JOGADOR" />
      </motion.div>

      {/* EMPATE */}
      <motion.div
        animate={highlight('tie') ? { scale: [1, 1.03, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
        className="shrink-0 w-[108px] h-[108px] sm:w-[118px] sm:h-[118px] rounded-full flex flex-col items-center justify-center"
        style={{
          background: 'linear-gradient(180deg, #F0C940 0%, #D4A017 50%, #B8860B 100%)',
          border: '3px solid #F5D76E',
          boxShadow: galeGlow('tie') || (highlight('tie')
            ? '0 0 0 3px #FEF08A, 0 0 24px rgba(234,179,8,0.55), inset 0 2px 0 rgba(255,255,255,0.2)'
            : 'inset 0 2px 0 rgba(255,255,255,0.2), 0 4px 14px rgba(0,0,0,0.35)'),
        }}
      >
        <PercentValue value={formatPercent(percents.tie)} />
        <Label text="EMPATE" />
      </motion.div>

      {/* CASA */}
      <motion.div
        animate={highlight('banker') ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
        className="flex-1 h-[112px] sm:h-[124px] flex flex-col items-center justify-center rounded-2xl rounded-l-lg"
        style={{
          background: 'linear-gradient(180deg, #D63838 0%, #B91C1C 55%, #991B1B 100%)',
          boxShadow: galeGlow('banker') || (highlight('banker')
            ? '0 0 0 2px #FCA5A5, 0 0 20px rgba(220,38,38,0.5), inset 0 2px 0 rgba(255,255,255,0.12)'
            : 'inset 0 2px 0 rgba(255,255,255,0.12), inset 0 -2px 4px rgba(0,0,0,0.2), 0 3px 10px rgba(0,0,0,0.3)'),
        }}
      >
        <PercentValue value={formatPercent(percents.banker)} />
        <Label text="CASA" />
      </motion.div>
    </div>
  );
}

function PercentValue({ value }) {
  return (
    <span
      className="text-white font-black text-[26px] sm:text-[30px] leading-none tabular-nums"
      style={{
        fontFamily: 'Inter, system-ui, sans-serif',
        textShadow: '0 2px 5px rgba(0,0,0,0.5)',
      }}
    >
      {value}
    </span>
  );
}

function Label({ text }) {
  return (
    <span
      className="text-white text-[11px] sm:text-[12px] tracking-[0.1em] mt-1.5 uppercase"
      style={{
        fontFamily: 'Georgia, "Times New Roman", Times, serif',
        textShadow: '0 1px 2px rgba(0,0,0,0.4)',
      }}
    >
      {text}
    </span>
  );
}

/** Cor Evolution Bac Bo — entrada, acerto ou resultado */
function CasinoColorIndicator({
  zone,
  pulsing = false,
  confirmed = false,
  variant = 'prediction',
  size = 'md',
}) {
  const cfg = getColorConfig(zone);
  if (!cfg) return null;

  const labels = {
    prediction: { top: 'PREVISÃO', bottom: cfg.label },
    bet: { top: 'APOSTAR EM', bottom: cfg.label },
    win: { top: 'COR ACERTADA', bottom: cfg.label },
    'loss-bet': { top: 'APOSTOU', bottom: cfg.label },
    'loss-outcome': { top: 'SAIU', bottom: cfg.label },
  };
  const copy = labels[variant] || labels.prediction;
  const dim = size === 'lg' ? 'w-24 h-24 sm:w-28 sm:h-28' : 'w-20 h-20 sm:w-24 sm:h-24';
  const emojiSize = size === 'lg' ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl';

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex flex-col items-center gap-2"
    >
      <div className="relative">
        {(pulsing || variant === 'win') && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ background: cfg.glow }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
        <div
          className={`relative ${dim} rounded-full flex items-center justify-center border-4 border-white/25`}
          style={{
            background: cfg.gradient,
            boxShadow: `0 0 32px ${cfg.glow}, inset 0 2px 8px rgba(255,255,255,0.25)`,
          }}
        >
          <span className={`${emojiSize} drop-shadow-lg`}>{cfg.emoji}</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-white/70 font-black text-[10px] sm:text-xs tracking-[0.2em] uppercase">
          {variant === 'bet' && confirmed ? 'APOSTAR EM' : copy.top}
        </p>
        <p
          className="font-black text-lg sm:text-xl tracking-wider"
          style={{ color: cfg.hex, textShadow: `0 0 20px ${cfg.glow}` }}
        >
          {cfg.emoji} {copy.bottom}
        </p>
      </div>
    </motion.div>
  );
}

function ResultDetails({ signal, compact = false }) {
  const { bet, outcome, galeLine, styles, isGreen, highlight } = getHistorySummary(signal);

  if (compact) {
    return (
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className={`text-center text-[10px] font-bold uppercase tracking-wider ${styles.text}`}
      >
        {galeLine}
      </motion.p>
    );
  }

  if (isGreen && highlight) {
    return (
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className={`text-center text-[10px] font-bold uppercase tracking-wider ${styles.text}`}
      >
        {galeLine} · {highlight.emoji} {highlight.label}
      </motion.p>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 w-full max-w-xs space-y-2"
    >
      <p className={`text-center text-[10px] font-bold uppercase tracking-wider ${styles.text}`}>
        {galeLine}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {bet && (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black border"
            style={{
              color: bet.hex,
              borderColor: `${bet.hex}55`,
              backgroundColor: `${bet.hex}18`,
            }}
          >
            {bet.emoji} Apostou {bet.label}
          </span>
        )}
        {outcome && (
          <>
            <span className="text-zinc-600 text-[10px]">→</span>
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black border"
              style={{
                color: outcome.hex,
                borderColor: `${outcome.hex}55`,
                backgroundColor: `${outcome.hex}18`,
              }}
            >
              {outcome.emoji} Saiu {outcome.label}
            </span>
          </>
        )}
      </div>
    </motion.div>
  );
}

function StatusPanel({
  sub,
  main,
  isAnalyzing,
  isSuccess,
  isLoss,
  predictedZone,
  isConfirmed,
  showMonitoring,
  signal,
  galeProgress,
}) {
  const resultSummary = signal && (isSuccess || isLoss) ? getHistorySummary(signal) : null;
  const showColor = predictedZone && !showMonitoring && !isSuccess && !isLoss;
  const showSatellite =
    (showMonitoring || (isAnalyzing && !predictedZone)) && !isSuccess && !isLoss;

  return (
    <div
      className="relative mx-3 mb-3 mt-1 rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #1E293B 0%, #0F172A 60%, #020617 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 -4px 24px rgba(0,0,0,0.4)',
      }}
    >
      <div className="flex flex-col items-center justify-center py-7 px-4 min-h-[180px]">
        {/* Área principal: cor do casino OU satélite */}
        <div className="relative mb-4 min-h-[120px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            {isSuccess && resultSummary?.highlightZone ? (
              <motion.div
                key={`win-${resultSummary.highlightZone}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <CasinoColorIndicator
                  zone={resultSummary.highlightZone}
                  variant="win"
                  size="lg"
                />
              </motion.div>
            ) : isLoss && resultSummary?.bet?.zone ? (
              <motion.div
                key={`loss-${resultSummary.bet.zone}-${resultSummary.outcome?.zone}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-4 sm:gap-6"
              >
                <CasinoColorIndicator
                  zone={resultSummary.bet.zone}
                  variant="loss-bet"
                />
                <span className="text-zinc-600 text-xl font-light">→</span>
                {resultSummary.outcome?.zone ? (
                  <CasinoColorIndicator
                    zone={resultSummary.outcome.zone}
                    variant="loss-outcome"
                  />
                ) : null}
              </motion.div>
            ) : showColor ? (
              <motion.div
                key={`color-${predictedZone}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <CasinoColorIndicator
                  zone={predictedZone}
                  pulsing={isAnalyzing || isConfirmed}
                  confirmed={isConfirmed}
                />
              </motion.div>
            ) : showSatellite ? (
              <motion.div
                key="satellite"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative"
              >
                {isAnalyzing && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-cyan-500/20"
                    animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
                <div
                  className="relative w-16 h-16 rounded-full flex items-center justify-center"
                  style={{
                    background: 'radial-gradient(circle at 30% 30%, #334155, #0F172A)',
                    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)',
                  }}
                >
                  <Satellite
                    className={`w-8 h-8 ${isAnalyzing ? 'text-cyan-400' : 'text-slate-500'}`}
                    style={isAnalyzing ? { animation: 'spin 8s linear infinite' } : {}}
                  />
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <p className="text-white/50 text-[10px] font-bold tracking-[0.25em] uppercase mb-1">
          {sub}
        </p>

        <GaleProgressBars signal={signal} progress={galeProgress} />

        <AnimatePresence mode="wait">
          <motion.h2
            key={main}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={`font-black tracking-[0.12em] uppercase text-center ${
              isSuccess
                ? 'text-2xl sm:text-3xl text-emerald-400'
                : isLoss
                  ? 'text-xl sm:text-2xl text-red-400'
                  : 'text-lg sm:text-xl text-white'
            }`}
            style={{
              textShadow: isSuccess
                ? '0 0 28px rgba(16,185,129,0.45)'
                : '0 2px 10px rgba(0,0,0,0.5)',
            }}
          >
            {main}
          </motion.h2>
        </AnimatePresence>

        {(isSuccess || isLoss) && signal && (
          <ResultDetails signal={signal} compact={isSuccess} />
        )}

        {isAnalyzing && !showColor && (
          <div className="flex gap-1 mt-3">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-cyan-400/80"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BacBoAIPanel({
  signal,
  showMonitoring,
  rounds = [],
  scoreboard,
  onClose,
  compact = false,
  casinoConnected = true,
  wsConnected = true,
}) {
  const probs = calculateProbabilities(rounds);
  const percents = getDisplayPercents(signal, probs);
  const entryZone = getEntryZone(signal);
  const activeZone = entryZone || getActiveZone(signal);
  const predictedZone = getPredictedZone(signal, showMonitoring);
  const { sub, main } = getStatusLabel(signal, showMonitoring);
  const galeProgress = getGaleProgress(signal);

  const isAnalyzing =
    signal?.signal_status === 'analyzing' ||
    (showMonitoring && !signal);
  const isGale = signal?.signal_status === 'gale_update';
  const isConfirmed =
    signal?.signal_status === 'confirmed' || isGale;
  const isResult = signal?.signal_status === 'result';
  const isSuccess = isResult && signal.result === 'green';
  const isLoss = isResult && signal.result === 'loss';

  const stats = useMemo(() => normalizeScoreboard(scoreboard), [scoreboard]);
  const premiumBadge = getPremiumBadge(stats.winRate, stats.playsToday);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-3xl ${compact ? '' : 'shadow-2xl shadow-black/50'}`}
      style={{
        background: 'radial-gradient(ellipse at 50% 0%, #0B3D1A 0%, #062A12 45%, #031A0B 100%)',
      }}
    >
      <LogoHeader onClose={onClose} />

      {!casinoConnected && (
        <p className="text-center text-amber-400/90 text-[10px] font-bold px-4 pb-1 tracking-wide">
          ⚠️ A aguardar dados reais da mesa Evolution Bac Bo...
        </p>
      )}

      {/* Placar fixo — sempre visível */}
      <div className="px-4 pb-2">
        <ScoreboardCards
          scoreboard={scoreboard}
          variant="panel"
          live
          connected={wsConnected && casinoConnected}
        />
      </div>

      <div className="relative px-4 pt-1 pb-3">
        <ProbabilityBar
          percents={percents}
          activeZone={activeZone}
          isAnalyzing={signal?.signal_status === 'analyzing'}
          isConfirmed={isConfirmed}
          isGale={isGale}
        />

        {isConfirmed && signal?.reason && (
          <p className="text-center text-emerald-300/60 text-[10px] mt-3 px-3 italic">
            {signal.reason}
          </p>
        )}

        {isConfirmed && stats.playsToday > 0 && (
          <div className="flex justify-center mt-2">
            <span
              className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border ${
                stats.meetsTarget
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                  : 'bg-zinc-800/80 text-zinc-400 border-zinc-700'
              }`}
            >
              {premiumBadge.text}
            </span>
          </div>
        )}

        {isConfirmed && signal?.tie_protection && (
          <div className="flex justify-center mt-2">
            <span className="text-[9px] font-bold bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 px-2 py-0.5 rounded-full">
              🛡️ COBRIR EMPATE
            </span>
          </div>
        )}
      </div>

      <StatusPanel
        sub={sub}
        main={main}
        isAnalyzing={isAnalyzing || signal?.signal_status === 'analyzing'}
        isSuccess={isSuccess}
        isLoss={isLoss}
        predictedZone={predictedZone}
        isConfirmed={isConfirmed}
        showMonitoring={showMonitoring}
        signal={signal}
        galeProgress={galeProgress}
      />
    </motion.div>
  );
}
