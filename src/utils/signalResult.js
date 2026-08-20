import {
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
  if (!signal) return signal;

  const isResult =
    signal.signal_status === 'result' ||
    ['green', 'loss', 'red'].includes(String(signal.result || '').toLowerCase());
  if (!isResult) return signal;

  const betZone = parseBetZoneStrict(signal);
  const outcomeZone = parseOutcomeZoneStrict(signal);
  let result = String(signal.result || '').toLowerCase();

  if (result !== 'green' && result !== 'loss' && result !== 'red') {
    const rv = String(signal.result_value || '').toLowerCase();
    if (rv.includes('green') || rv.includes('acert') || rv.includes('win')) result = 'green';
    else if (rv.includes('loss') || rv.includes('red') || rv.includes('perd')) result = 'loss';
    else result = '';
  }

  if (!result && betZone && outcomeZone) {
    result = betZone === outcomeZone ? 'green' : 'loss';
  }

  if (!result) result = 'loss';

  return {
    ...signal,
    signal_status: 'result',
    result: result === 'green' ? 'green' : 'loss',
  };
}

function parseBetZoneStrict(signal) {
  for (const value of [signal?.entry_bet, signal?.bet, signal?.bet_recommendation, signal?.bet_safe]) {
    const zone = matchZoneFromText(value) || betToZone(value);
    if (zone) return zone;
  }
  return null;
}

function parseOutcomeZoneStrict(signal) {
  for (const value of [signal?.result_value, signal?.actual_outcome]) {
    const zone = matchZoneFromText(value);
    if (zone) return zone;
  }
  return null;
}

export function getResultLabel(signal) {
  return isSignalGreen(signal) ? 'GREEN' : 'LOSS';
}

export function getResultEmoji(signal) {
  return isSignalGreen(signal) ? '✅' : '❌';
}

/** String bruta da sequência vinda do casino */
export function getRawSequenceDisplay(signal) {
  return signal?.sequence || signal?.entry_condition || '—';
}

/** "Saiu AZUL/VERMELHO" — parse a partir de sequence/result_value */
export function parseSaiuLabel(signal) {
  const outcome = getSignalOutcomeColor(signal);
  if (outcome?.label) return outcome.label;

  const seq = String(signal?.sequence || signal?.result_value || '').toUpperCase();
  if (seq.includes('AZUL') || seq.includes('JOGADOR') || seq.includes('PLAYER')) return 'AZUL';
  if (seq.includes('VERMELHO') || seq.includes('BANCA') || seq.includes('BANKER') || seq.includes('CASA')) {
    return 'VERMELHO';
  }
  if (seq.includes('EMPATE') || seq.includes('TIE')) return 'EMPATE';
  return null;
}

export function getHistoryEntrySummary(signal) {
  const normalized = reconcileHistorySignal(signal);
  const bet = getSignalBetColor(normalized);
  const isGreen = isSignalGreen(normalized);
  const sequenceRaw = getRawSequenceDisplay(normalized);
  const saiu = parseSaiuLabel(normalized);
  const gales = Number(normalized.gales) || 3;
  const currentGale = Number(normalized.current_gale) || 0;
  const tieProtection = normalized.tie_protection === true || normalized.tie_protection === 'true';
  const boardG = Number(normalized.scoreboard_green) || 0;
  const boardR = Number(normalized.scoreboard_red) || 0;
  const boardWr = normalized.win_rate ?? (boardG + boardR ? Math.round((boardG / (boardG + boardR)) * 10000) / 100 : 0);

  return {
    bet,
    isGreen,
    resultLabel: getResultLabel(normalized),
    resultEmoji: getResultEmoji(normalized),
    sequenceRaw,
    saiu,
    gales,
    currentGale,
    tieProtection,
    boardG,
    boardR,
    boardWr,
    resultHint: normalized.result_value || normalized.entry_condition || null,
  };
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
  ].filter(Boolean);
}

export function getSignalBetColor(signal) {
  for (const value of [signal?.entry_bet, signal?.bet, signal?.bet_recommendation, signal?.bet_safe]) {
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

  return null;
}

export function getSignalOutcomeColor(signal) {
  const candidates = [signal?.result_value, signal?.actual_outcome];

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
  const normalized = reconcileHistorySignal(signal);
  if (isSignalGreen(normalized)) {
    return getSignalOutcomeColor(normalized) || getSignalBetColor(normalized);
  }
  return getSignalOutcomeColor(normalized);
}

/** Cor correcta para alertas SMS — acerto = cor que saiu na mesa (= aposta) */
export function getAlertDisplayColor(signal, outcome) {
  const normalized = reconcileHistorySignal({
    ...signal,
    signal_status: signal?.signal_status || 'result',
  });

  if (outcome === 'green' || isSignalGreen(normalized)) {
    return getSignalOutcomeColor(normalized) || getSignalBetColor(normalized);
  }

  return getSignalBetColor(normalized) || getSignalOutcomeColor(normalized);
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

/** Seq — últimas 3 cores da mesa ANTES da entrada */
export function getTriggerSequence(signal, max = 3) {
  const all = parseAllSequenceZones(signal);
  const attempts = Math.min(4, (Number(signal?.current_gale) || 0) + 1);

  if (all.length > attempts) {
    const beforePlay = all.slice(0, -attempts);
    return beforePlay.slice(-max);
  }

  const fromCondition = parseSequenceZones({ sequence: signal?.entry_condition }, max);
  if (fromCondition.length) return fromCondition;

  if (all.length <= max) return all;

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
