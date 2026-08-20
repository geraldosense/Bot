import {
  getEntryZone,
  betToZone,
  getColorConfig,
  formatAttemptLabel,
  formatResultAttemptLine,
} from './bacBoStats';

export function isSignalGreen(signal) {
  return String(signal?.result || '').toLowerCase() === 'green';
}

/** Garante green/loss coerente com aposta vs resultado real da mesa */
export function reconcileHistorySignal(signal) {
  if (!signal || signal.signal_status !== 'result') return signal;

  const betZone = getSignalBetColor(signal)?.zone;
  const outcomeZone = getSignalOutcomeColor(signal)?.zone;
  let result = String(signal.result || '').toLowerCase();

  if (result !== 'green' && result !== 'loss') {
    const rv = String(signal.result_value || '').toLowerCase();
    if (rv.includes('green') || rv.includes('acert') || rv.includes('win')) result = 'green';
    else if (rv.includes('loss') || rv.includes('red') || rv.includes('perd')) result = 'loss';
    else result = '';
  }

  if (betZone && outcomeZone) {
    result = betZone === outcomeZone ? 'green' : 'loss';
  }

  if (!result) result = 'loss';

  return { ...signal, result };
}

export function getResultLabel(signal) {
  return isSignalGreen(signal) ? 'GREEN' : 'RED';
}

export function getResultLabelPt(signal) {
  return isSignalGreen(signal) ? 'ACERTADO' : 'PERDIDO';
}

export function getResultTone(signal) {
  return isSignalGreen(signal) ? 'success' : 'loss';
}

const TONE_STYLES = {
  success: {
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/35',
    glow: 'shadow-[0_0_24px_rgba(16,185,129,0.25)]',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
  loss: {
    text: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/35',
    glow: 'shadow-[0_0_24px_rgba(239,68,68,0.2)]',
    badge: 'bg-red-500/15 text-red-300 border-red-500/40',
  },
};

export function getResultStyles(signal) {
  return TONE_STYLES[getResultTone(signal)] || TONE_STYLES.loss;
}

function matchZoneFromText(value) {
  if (value == null || value === '') return null;
  const raw = String(value).trim();
  const s = raw.toUpperCase();
  if (raw.includes('🔵')) return 'player';
  if (raw.includes('🔴')) return 'banker';
  if (raw.includes('🟡')) return 'tie';
  if (s.includes('AZUL') || s.includes('JOGADOR') || s.includes('PLAYER')) return 'player';
  if (s.includes('VERMELHO') || s.includes('BANCA') || s.includes('CASA') || s.includes('BANKER')) {
    return 'banker';
  }
  if (s.includes('EMPATE') || s.includes('TIE')) return 'tie';
  if (raw === 'Player' || raw === 'Banker' || raw === 'Tie') return raw.toLowerCase();
  if (s === 'P' || s === 'B') return s === 'P' ? 'player' : 'banker';
  return betToZone(raw);
}

function collectBetCandidates(signal) {
  return [
    signal?.entry_bet,
    signal?.bet,
    signal?.bet_recommendation,
    signal?.bet_safe,
    signal?.analysis?.bet,
    signal?.analysis?.betRecommendation,
    signal?.raw_message,
  ].filter(Boolean);
}

export function getSignalBetColor(signal) {
  for (const value of collectBetCandidates(signal)) {
    const zone = matchZoneFromText(value) || betToZone(value);
    if (!zone) continue;
    const config = getColorConfig(zone);
    if (config) {
      return {
        zone,
        label: config.bet,
        casinoLabel: config.casinoLabel,
        emoji: config.emoji,
        hex: config.hex,
      };
    }
  }

  const zone = getEntryZone(signal);
  if (!zone) return null;
  const config = getColorConfig(zone);
  if (!config) return null;

  return {
    zone,
    label: config.bet,
    casinoLabel: config.casinoLabel,
    emoji: config.emoji,
    hex: config.hex,
  };
}

export function getSignalOutcomeColor(signal) {
  const candidates = [
    signal?.result_value,
    signal?.actual_outcome,
    signal?.sequence?.split(/\s+/).pop(),
    signal?.entry_condition,
  ];

  for (const value of candidates) {
    const zone = matchZoneFromText(value);
    if (zone) {
      const config = getColorConfig(zone);
      return config
        ? {
            zone,
            label: config.bet,
            casinoLabel: config.casinoLabel,
            emoji: config.emoji,
            hex: config.hex,
          }
        : null;
    }
  }

  if (isSignalGreen(signal)) {
    return getSignalBetColor(signal);
  }

  return null;
}

export function getGaleResultLine(signal) {
  return formatResultAttemptLine(signal);
}

export function getResultHighlightColor(signal) {
  if (isSignalGreen(signal)) {
    return getSignalBetColor(signal);
  }
  return getSignalOutcomeColor(signal);
}

export function getResultColorCaption(signal) {
  return isSignalGreen(signal) ? 'Cor acertada' : 'Cor que saiu';
}

/** Todas as cores parseadas do campo sequence / casino */
export function parseAllSequenceZones(signal) {
  const raw = signal?.sequence || signal?.actual_outcome || '';
  const zones = [];

  for (const part of String(raw).split(/[\s,|/]+/)) {
    const zone = matchZoneFromText(part);
    if (zone) zones.push(zone);
  }

  return zones;
}

/** Resultados reais da mesa durante a jogada (campo sequence do casino) */
export function parseSequenceZones(signal, max = 3) {
  const all = parseAllSequenceZones(signal);
  if (all.length >= max) return all.slice(-max);

  const tail = signal?.entry_condition || signal?.analysis?.entryCondition;
  if (tail) {
    const zone = matchZoneFromText(tail);
    if (zone && all[all.length - 1] !== zone) all.push(zone);
  }

  return all.slice(-max);
}

/** Seq — padrão do casino antes / durante análise (últimas 3 cores reais) */
export function getTriggerSequence(signal, max = 3) {
  const all = parseAllSequenceZones(signal);
  const attempts = Math.min(4, (Number(signal?.current_gale) || 0) + 1);

  if (all.length > attempts) {
    return all.slice(-(attempts + max), -attempts).slice(-max);
  }

  const fromCondition = parseSequenceZones({ sequence: signal?.entry_condition }, max);
  if (fromCondition.length) return fromCondition;

  return all.slice(0, max);
}

/** Cores que saíram na mesa em cada rodada da jogada (entrada + gales) */
export function getPlayOutcomes(signal) {
  const all = parseAllSequenceZones(signal);
  const attempts = Math.min(4, (Number(signal?.current_gale) || 0) + 1);

  if (all.length >= attempts) {
    return all.slice(-attempts);
  }

  const bet = getSignalBetColor(signal)?.zone;
  const outcome = getSignalOutcomeColor(signal)?.zone;
  if (!bet && !outcome) return all;

  const built = [];
  for (let i = 0; i < attempts; i++) {
    const isLast = i === attempts - 1;
    if (isSignalGreen(signal)) {
      built.push(isLast ? bet || outcome : outcome || bet);
    } else {
      built.push(isLast ? outcome || bet : bet || outcome);
    }
  }

  return built.filter(Boolean);
}

/** Cores apostadas em cada tentativa (entrada + gales — mesma cor no martingale) */
export function getPlayBetAttempts(signal) {
  const betZone = getSignalBetColor(signal)?.zone;
  if (!betZone) return [];

  const apiGale = Number(signal?.current_gale) || 0;
  const attempts = Math.min(4, apiGale + 1);
  return Array.from({ length: attempts }, () => betZone);
}

/** Bolinhas ao lado do GREEN/RED — cor que o robô mandou entrar em cada tentativa */
export function getGalePathDots(signal) {
  const betAttempts = getPlayBetAttempts(signal);
  if (betAttempts.length) return betAttempts;

  const bet = getSignalBetColor(signal)?.zone;
  if (!bet) return [];

  const attempts = Math.min(4, (Number(signal?.current_gale) || 0) + 1);
  return Array.from({ length: attempts }, () => bet);
}

export function getHistorySummary(signal) {
  const normalized = reconcileHistorySignal(signal);
  const bet = getSignalBetColor(normalized);
  const outcome = getSignalOutcomeColor(normalized);
  const highlight = getResultHighlightColor(normalized);
  const resultLabel = getResultLabel(normalized);
  const styles = getResultStyles(normalized);
  const galeLine = getGaleResultLine(normalized);
  const isGreen = isSignalGreen(normalized);
  const galePath = getGalePathDots(normalized);
  const sequence = getTriggerSequence(normalized, 3);
  const playOutcomes = getPlayOutcomes(normalized);
  const betAttempts = getPlayBetAttempts(normalized);

  return {
    bet,
    outcome,
    highlight,
    highlightZone: highlight?.zone || bet?.zone || outcome?.zone || null,
    resultLabel,
    styles,
    galeLine,
    isGreen,
    colorCaption: getResultColorCaption(normalized),
    galePath,
    sequence,
    playOutcomes,
    betAttempts,
    betZone: bet?.zone || null,
    attemptLabel: formatAttemptLabel(normalized?.current_gale),
  };
}
