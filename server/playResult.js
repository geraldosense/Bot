/** Regras de gale — 3 tentativas: 1° gale (entrada), 2° gale, 3° gale */

export const MAX_GALES = 2;
export const GALE_ATTEMPTS = MAX_GALES + 1;

/**
 * Classifica o resultado final de uma jogada.
 * - Green em qualquer gale (1°, 2° ou 3°) = acerto
 * - Loss só conta se falhou no 3° gale (current_gale >= maxGales na API)
 */
export function classifyPlayResult(signal) {
  if (!signal || signal.signal_status !== 'result') return null;

  const result = String(signal.result || '').toLowerCase();
  if (result === 'green') return 'green';

  if (result === 'loss' || result === 'red') {
    const maxGales = Number.isFinite(Number(signal.gales)) ? Number(signal.gales) : MAX_GALES;
    const currentGale = Number(signal.current_gale) || 0;
    if (currentGale >= maxGales) return 'loss';
    return null;
  }

  return null;
}

export function isDefinitiveLoss(signal) {
  return classifyPlayResult(signal) === 'loss';
}

export function isPlayGreen(signal) {
  return classifyPlayResult(signal) === 'green';
}

/** Etiqueta do gale — API usa current_gale 0-based */
export function formatGaleLabel(apiGale = 0) {
  const n = Math.max(0, Math.min(Number(apiGale) || 0, MAX_GALES));
  return `${n + 1}° GALE`;
}

export function buildPlayResultAlert(signal, outcome) {
  if (!signal || !outcome) return null;

  const galeLabel = formatGaleLabel(signal.current_gale);
  const bet = String(signal.bet_recommendation || signal.bet || signal.entry_bet || '').toUpperCase();

  if (outcome === 'green') {
    return {
      outcome: 'green',
      title: 'ACERTOU',
      message: `Sinal confirmado — ${galeLabel}`,
      sub: bet ? `Cor: ${bet}` : null,
      galeLabel,
    };
  }

  return {
    outcome: 'loss',
    title: 'PERDEU',
    message: `Errou nos ${GALE_ATTEMPTS} gales`,
    sub: bet ? `Entrada: ${bet}` : 'Todos os gales esgotados',
    galeLabel,
  };
}

/** Acertividade diária — 2 casas decimais, sempre coerente com verdes/perdas */
export function calcWinRate(greens, reds) {
  const g = Math.max(0, Number(greens) || 0);
  const r = Math.max(0, Number(reds) || 0);
  const total = g + r;
  if (!total) return 0;
  const rate = (g / total) * 100;
  return Math.min(100, Math.round(rate * 100) / 100);
}

export function calcTotalsFromPlays(plays = []) {
  let greens = 0;
  let reds = 0;

  for (const play of plays) {
    if (play.result === 'green') {
      greens++;
      continue;
    }
    if (play.result === 'loss') {
      const maxGales = Number.isFinite(play.maxGales) ? play.maxGales : MAX_GALES;
      const gale = Number(play.gale) || 0;
      if (play.maxGales == null || gale >= maxGales) reds++;
    }
  }

  return {
    greens,
    reds,
    winRate: calcWinRate(greens, reds),
  };
}
