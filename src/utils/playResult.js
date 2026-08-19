/** Regras de gale — entrada inicial + gales após falha */

export const MAX_GALES = 2;
export const GALE_ATTEMPTS = MAX_GALES + 1;
export const ATTEMPT_LABELS = ['ENTRADA', '1° GALE', '2° GALE', '3° GALE'];
export const GALE_ONLY_LABELS = ['1° GALE', '2° GALE', '3° GALE'];
export const MAX_GALE_ROUNDS = 3;

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

export function formatAttemptLabel(apiGale = 0) {
  const idx = Math.max(0, Math.min(Number(apiGale) || 0, ATTEMPT_LABELS.length - 1));
  return ATTEMPT_LABELS[idx];
}

export function formatGaleLabel(apiGale = 0) {
  return formatAttemptLabel(apiGale);
}

export function calcWinRate(greens, reds) {
  const g = Math.max(0, Number(greens) || 0);
  const r = Math.max(0, Number(reds) || 0);
  const total = g + r;
  if (!total) return 0;
  const rate = (g / total) * 100;
  return Math.min(100, Math.round(rate * 100) / 100);
}

export function getPremiumBadge(winRate, totalPlays = 0) {
  const rate = Number.isFinite(Number(winRate)) ? Number(winRate) : 0;
  const plays = Number(totalPlays) || 0;

  if (plays > 0 && rate >= 90) {
    return {
      meetsTarget: true,
      text: '✓ IA Premium · Meta 90%+ atingida',
      subtext: `${rate.toFixed(2)}% acertividade diária`,
    };
  }

  if (plays > 0) {
    return {
      meetsTarget: false,
      text: `IA Premium · ${rate.toFixed(2)}% acertividade diária`,
      subtext: 'Meta operacional: 90%+',
    };
  }

  return {
    meetsTarget: false,
    text: 'IA Premium · A recolher histórico do dia',
    subtext: null,
  };
}

/** Custo de uma perda definitiva — 1° + 2° + 3° gale (martingale 1+2+4) */
export function galeLossMultiplier(maxGales = MAX_GALES) {
  const gales = Math.max(0, Math.min(maxGales, MAX_GALES));
  let total = 0;
  for (let i = 0; i <= gales; i++) total += Math.pow(2, i);
  return total;
}
