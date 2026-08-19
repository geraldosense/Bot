import {
  getEntryZone,
  betToZone,
  getColorConfig,
  formatGaleLabel,
} from './bacBoStats';

export function isSignalGreen(signal) {
  return String(signal?.result || '').toLowerCase() === 'green';
}

export function getResultLabel(signal) {
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

export function getSignalBetColor(signal) {
  const zone =
    getEntryZone(signal) ||
    betToZone(signal?.bet) ||
    betToZone(signal?.bet_recommendation || signal?.entry_bet);

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

function matchZoneFromText(value) {
  if (!value) return null;
  const raw = String(value);
  const s = raw.toUpperCase();
  if (raw.includes('🔵')) return 'player';
  if (raw.includes('🔴')) return 'banker';
  if (raw.includes('🟡')) return 'tie';
  if (s.includes('AZUL') || s.includes('JOGADOR') || s.includes('PLAYER')) return 'player';
  if (s.includes('VERMELHO') || s.includes('BANCA') || s.includes('CASA') || s.includes('BANKER')) {
    return 'banker';
  }
  if (s.includes('EMPATE') || s.includes('TIE')) return 'tie';
  if (raw === 'Player' || raw === 'Banker' || raw === 'Tie') {
    return raw.toLowerCase();
  }
  return null;
}

export function getSignalOutcomeColor(signal) {
  const candidates = [
    signal?.result_value,
    signal?.actual_outcome,
    signal?.sequence?.split(' ').pop(),
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
  const apiGale = Number(signal?.current_gale) || 0;
  const galeLabel = formatGaleLabel(apiGale);
  return isSignalGreen(signal)
    ? `Acertou no ${galeLabel}`
    : `Perdeu no ${galeLabel}`;
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

export function parseSequenceZones(signal, max = 3) {
  const raw = signal?.sequence || '';
  const zones = [];

  for (const part of String(raw).trim().split(/\s+/)) {
    const zone = matchZoneFromText(part);
    if (zone) zones.push(zone);
  }

  if (zones.length >= max) return zones.slice(-max);

  const tail = signal?.entry_condition || signal?.analysis?.entryCondition;
  if (tail) {
    const zone = matchZoneFromText(tail);
    if (zone) zones.push(zone);
  }

  return zones.slice(-max);
}

/** Bolinhas ao lado do ACERTADO — tentativas até ganhar/perder */
export function getGalePathDots(signal) {
  const attempts = Math.min(3, (Number(signal?.current_gale) || 0) + 1);
  const seq = parseSequenceZones(signal, 10);
  const bet = getSignalBetColor(signal)?.zone;
  const outcome = getSignalOutcomeColor(signal)?.zone;

  if (seq.length >= attempts) {
    return seq.slice(-attempts);
  }

  const dots = [];
  for (let i = 0; i < attempts; i++) {
    const isLast = i === attempts - 1;
    if (isSignalGreen(signal)) {
      dots.push(isLast ? bet || outcome : bet || outcome);
    } else {
      dots.push(isLast ? outcome || bet : bet || outcome);
    }
  }

  return dots.filter(Boolean);
}

export function getHistorySummary(signal) {
  const bet = getSignalBetColor(signal);
  const outcome = getSignalOutcomeColor(signal);
  const highlight = getResultHighlightColor(signal);
  const resultLabel = getResultLabel(signal);
  const styles = getResultStyles(signal);
  const galeLine = getGaleResultLine(signal);
  const isGreen = isSignalGreen(signal);
  const galePath = getGalePathDots(signal);
  const sequence = parseSequenceZones(signal, 3);

  return {
    bet,
    outcome,
    highlight,
    highlightZone: highlight?.zone || bet?.zone || outcome?.zone || null,
    resultLabel,
    styles,
    galeLine,
    isGreen,
    colorCaption: getResultColorCaption(signal),
    galePath,
    sequence,
    betZone: bet?.zone || null,
  };
}
