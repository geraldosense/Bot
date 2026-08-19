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

/** Entrada inicial (não é gale) + 3 gales após falha da entrada */
export const ENTRY_LABEL = 'ENTRADA';
export const GALE_ONLY_LABELS = ['1° GALE', '2° GALE', '3° GALE'];
export const MAX_GALE_ROUNDS = GALE_ONLY_LABELS.length;
export const ATTEMPT_LABELS = [ENTRY_LABEL, ...GALE_ONLY_LABELS];
export const TOTAL_ATTEMPTS = ATTEMPT_LABELS.length;
/** @deprecated */
export const TOTAL_GALE_ATTEMPTS = TOTAL_ATTEMPTS;
export const GALE_ROUNDS = MAX_GALE_ROUNDS;

/** API: 0 = entrada · 1 = 1° gale · 2 = 2° gale · 3 = 3° gale */
export function apiToGaleBarIndex(apiGale = 0) {
  const n = Number(apiGale) || 0;
  if (n <= 0) return -1;
  return Math.min(n - 1, MAX_GALE_ROUNDS - 1);
}

export function formatAttemptLabel(apiGale = 0) {
  const idx = Math.max(0, Math.min(Number(apiGale) || 0, ATTEMPT_LABELS.length - 1));
  return ATTEMPT_LABELS[idx];
}

export function formatGaleOnlyLabel(apiGale = 0) {
  const idx = apiToGaleBarIndex(apiGale);
  if (idx < 0) return null;
  return GALE_ONLY_LABELS[idx];
}

export function isEntryAttempt(apiGale = 0) {
  return Number(apiGale) === 0;
}

export function formatGaleLabel(apiGale = 0) {
  return formatAttemptLabel(apiGale);
}

export function formatResultAttemptLine(signal) {
  const label = formatAttemptLabel(signal?.current_gale);
  const isGreen = String(signal?.result || '').toLowerCase() === 'green';
  const prep = label === ENTRY_LABEL ? 'na' : 'no';
  return isGreen ? `Acertou ${prep} ${label}` : `Perdeu ${prep} ${label}`;
}

export function getStatusLabel(signal, showMonitoring) {
  if (showMonitoring || !signal) {
    return { sub: 'AGUARDANDO', main: 'ANALISANDO' };
  }
  if (signal.signal_status === 'analyzing') {
    return { sub: 'PROCESSANDO', main: 'ANALISANDO' };
  }
  if (signal.signal_status === 'confirmed') {
    return { sub: 'ENTRADA', main: 'ENTRADA CONFIRMADA' };
  }
  if (signal.signal_status === 'gale_update') {
    const apiGale = Number(signal.current_gale) || 0;
    const galeLabel = formatGaleOnlyLabel(apiGale) || 'GALE';
    return {
      sub: galeLabel,
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

/** Entrada separada + 3 barras de gale (só após falha da entrada) */
export function getGaleProgress(signal) {
  if (!signal || !['confirmed', 'gale_update', 'result'].includes(signal.signal_status)) {
    return null;
  }

  const apiGale = Number(signal.current_gale) || 0;
  const galeIdx = apiToGaleBarIndex(apiGale);

  let entryState = 'pending';
  const galeStates = GALE_ONLY_LABELS.map(() => 'pending');

  if (signal.signal_status === 'confirmed') {
    entryState = 'active';
  } else if (signal.signal_status === 'gale_update') {
    entryState = 'done';
    if (galeIdx >= 0) {
      galeStates[galeIdx] = 'active';
      for (let i = 0; i < galeIdx; i++) galeStates[i] = 'done';
    }
  } else if (signal.signal_status === 'result') {
    const isGreen = signal.result === 'green';

    if (apiGale === 0) {
      entryState = isGreen ? 'done' : 'failed';
    } else {
      entryState = 'done';
      if (galeIdx >= 0) {
        for (let i = 0; i < galeIdx; i++) galeStates[i] = 'done';
        galeStates[galeIdx] = isGreen ? 'done' : 'failed';
      }
    }
  }

  return {
    entry: { label: ENTRY_LABEL, state: entryState },
    gales: GALE_ONLY_LABELS.map((label, i) => ({ label, state: galeStates[i] })),
    show: true,
  };
}
