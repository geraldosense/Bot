/**
 * Probabilidades e estado visual — Evolution Bac Bo
 * Player = Azul | Banker = Vermelho (Casa) | Tie = Amarelo
 */

export const BACBO_COLORS = {
  player: {
    zone: 'player',
    label: 'JOGADOR',
    casinoLabel: 'PLAYER',
    bet: 'AZUL',
    hex: '#2563EB',
    gradient: 'linear-gradient(180deg, #4A72E8 0%, #2563EB 55%, #1D4ED8 100%)',
    glow: 'rgba(37, 99, 235, 0.65)',
    emoji: '🔵',
  },
  banker: {
    zone: 'banker',
    label: 'CASA',
    casinoLabel: 'BANKER',
    bet: 'VERMELHO',
    hex: '#DC2626',
    gradient: 'linear-gradient(180deg, #E04040 0%, #DC2626 55%, #B91C1C 100%)',
    glow: 'rgba(220, 38, 38, 0.65)',
    emoji: '🔴',
  },
  tie: {
    zone: 'tie',
    label: 'EMPATE',
    casinoLabel: 'TIE',
    bet: 'EMPATE',
    hex: '#CA8A04',
    gradient: 'linear-gradient(180deg, #F0C940 0%, #D4A017 50%, #B8860B 100%)',
    glow: 'rgba(234, 179, 8, 0.65)',
    emoji: '🟡',
  },
};

/** Garante que player + banker + tie = 100 exactamente */
function normalizeTo100(values) {
  const keys = ['player', 'banker', 'tie'];
  const total = keys.reduce((s, k) => s + (values[k] || 0), 0);

  if (total === 0) {
    return { player: 34, banker: 33, tie: 33 };
  }

  const raw = keys.map((k) => ({ k, exact: ((values[k] || 0) / total) * 100 }));
  const result = Object.fromEntries(raw.map(({ k, exact }) => [k, Math.floor(exact)]));
  let remainder = 100 - keys.reduce((s, k) => s + result[k], 0);

  raw
    .map(({ k, exact }) => ({ k, frac: exact - Math.floor(exact) }))
    .sort((a, b) => b.frac - a.frac)
    .forEach(({ k }) => {
      if (remainder > 0) {
        result[k]++;
        remainder--;
      }
    });

  return result;
}

export function calculateProbabilities(rounds, limit = 30) {
  const slice = (rounds || []).slice(0, limit);
  if (!slice.length) {
    return { player: 34, banker: 33, tie: 33 };
  }

  const counts = {
    player: slice.filter((r) => r.outcome === 'Player').length,
    banker: slice.filter((r) => r.outcome === 'Banker').length,
    tie: slice.filter((r) => r.outcome === 'Tie').length,
  };

  return normalizeTo100(counts);
}

/** Percentagens do histórico real do casino — sempre somam 100% */
export function getDisplayPercents(_signal, probs) {
  return normalizeTo100({
    player: probs.player ?? 0,
    banker: probs.banker ?? 0,
    tie: probs.tie ?? 0,
  });
}

export function betToZone(bet) {
  if (!bet) return null;
  const s = String(bet).toUpperCase();
  if (s.includes('AZUL') || s.includes('JOGADOR') || s === 'PLAYER') return 'player';
  if (s.includes('VERMELHO') || s.includes('BANCA') || s.includes('CASA') || s === 'BANKER') return 'banker';
  if (s.includes('EMPATE') || s === 'TIE') return 'tie';
  if (bet === 'Player') return 'player';
  if (bet === 'Banker') return 'banker';
  if (bet === 'Tie') return 'tie';
  return null;
}

export function getEntryZone(signal) {
  if (!signal) return null;

  const candidates = [
    signal.entry_bet,
    signal.bet,
    signal.bet_recommendation,
    signal.analysis?.bet,
    signal.analysis?.betRecommendation,
  ];

  for (const value of candidates) {
    const zone = betToZone(value);
    if (zone) return zone;
  }

  return null;
}

export function getActiveZone(signal) {
  if (!signal) return null;

  if (['confirmed', 'gale_update', 'result'].includes(signal.signal_status)) {
    return getEntryZone(signal);
  }

  return betToZone(signal.bet_recommendation || signal.bet || signal.analysis?.bet);
}

/** Cor prevista para mostrar na área de análise (como moneytix / Evolution) */
export function getPredictedZone(signal, showMonitoring) {
  if (!signal || showMonitoring) return null;

  if (signal.signal_status === 'analyzing') {
    return betToZone(signal.analysis?.bet);
  }

  if (signal.signal_status === 'confirmed' || signal.signal_status === 'gale_update') {
    return getEntryZone(signal);
  }

  if (signal.signal_status === 'result') {
    return getEntryZone(signal);
  }

  return null;
}

const GALE_LABELS = ['1° GALE', '2° GALE', '3° GALE'];
export const TOTAL_GALE_ATTEMPTS = GALE_LABELS.length;

/** API usa current_gale 0-based: 0 = 1° gale (entrada), 1 = 2° gale, 2 = 3° gale */
export function apiGaleToDisplayNumber(apiGale = 0) {
  return Math.min(TOTAL_GALE_ATTEMPTS, Math.max(1, Number(apiGale) + 1));
}

export function apiGaleToBarIndex(apiGale = 0) {
  return Math.min(TOTAL_GALE_ATTEMPTS - 1, Math.max(0, Number(apiGale) || 0));
}

export function formatGaleLabel(apiGale = 0) {
  return `${apiGaleToDisplayNumber(apiGale)}° GALE`;
}

export function getStatusLabel(signal, showMonitoring) {
  if (showMonitoring || !signal) {
    return { sub: 'AGUARDANDO', main: 'ANALISANDO' };
  }
  if (signal.signal_status === 'analyzing') {
    return { sub: 'PROCESSANDO', main: 'ANALISANDO' };
  }
  if (signal.signal_status === 'confirmed') {
    return { sub: '1° GALE', main: 'ENTRADA CONFIRMADA' };
  }
  if (signal.signal_status === 'gale_update') {
    const apiGale = Number(signal.current_gale) || 0;
    return {
      sub: formatGaleLabel(apiGale),
      main: 'MANTER A MESMA COR',
    };
  }
  if (signal.signal_status === 'result') {
    const green = String(signal.result || '').toLowerCase() === 'green';
    return {
      sub: 'RESULTADO',
      main: green ? 'ACERTADO' : 'PERDIDO',
    };
  }
  return { sub: 'AGUARDANDO', main: 'ANALISANDO' };
}

export function getColorConfig(zone) {
  return BACBO_COLORS[zone] || null;
}

/** Estado das 3 barras — entrada = 1° gale, depois 2° e 3° gale */
export function getGaleProgress(signal) {
  if (!signal || !['confirmed', 'gale_update', 'result'].includes(signal.signal_status)) {
    return null;
  }

  const galesAllowed = Number(signal.gales) || 2;
  const currentGale = Number(signal.current_gale) || 0;

  let activeIndex = 0;
  let failedIndex = -1;

  if (signal.signal_status === 'confirmed') {
    activeIndex = 0;
  } else if (signal.signal_status === 'gale_update') {
    activeIndex = apiGaleToBarIndex(currentGale);
  } else if (signal.signal_status === 'result') {
    const idx = apiGaleToBarIndex(currentGale);
    if (signal.result === 'green') {
      activeIndex = idx;
    } else {
      failedIndex = idx;
    }
  }

  return {
    labels: GALE_LABELS,
    activeIndex,
    failedIndex,
    galesAllowed,
    show: galesAllowed > 0 || signal.signal_status === 'gale_update',
  };
}

export function getGaleBarState(index, progress, signal) {
  if (!progress) return 'hidden';

  const { activeIndex, failedIndex } = progress;
  const isResult = signal?.signal_status === 'result';
  const isGreen = signal?.result === 'green';

  if (failedIndex >= 0) {
    if (index < failedIndex) return 'done';
    if (index === failedIndex) return 'failed';
    return 'pending';
  }

  if (isResult && isGreen) {
    if (index <= activeIndex) return 'done';
    return 'pending';
  }

  if (index < activeIndex) return 'done';
  if (index === activeIndex) return 'active';
  return 'pending';
}
