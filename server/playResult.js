/** Regras: entrada inicial + gales só após falha (API current_gale 0 = entrada) */

import { resolveSignalBet, reconcileSignalResult, parseOutcomeZone } from './signalBet.js';

export const MAX_GALES = 3;
export const GALE_ATTEMPTS = MAX_GALES + 1;
export const ATTEMPT_LABELS = ['ENTRADA', '1° GALE', '2° GALE', '3° GALE'];
export const GALE_ONLY_LABELS = ['1° GALE', '2° GALE', '3° GALE'];

/**
 * Classifica o resultado final de uma jogada.
 * - Green na entrada ou em qualquer gale = acerto
 * - Loss só conta se falhou no último gale (current_gale >= maxGales)
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
  return resolveAlertOutcome(signal) === 'green' || classifyPlayResult(signal) === 'green';
}

/** Outcome para SMS/popup — sempre dispara em resultado final GREEN ou RED */
export function resolveAlertOutcome(signal) {
  if (!signal?.id) return null;

  const reconciled = reconcileSignalResult({
    ...signal,
    signal_status: signal.signal_status || 'result',
  });

  if (reconciled.signal_status !== 'result') return null;

  const result = String(reconciled.result || '').toLowerCase();
  if (result === 'green') return 'green';
  if (result === 'loss' || result === 'red') return 'loss';

  return classifyPlayResult(reconciled);
}

export function formatAttemptLabel(apiGale = 0) {
  const idx = Math.max(0, Math.min(Number(apiGale) || 0, ATTEMPT_LABELS.length - 1));
  return ATTEMPT_LABELS[idx];
}

export function formatGaleLabel(apiGale = 0) {
  return formatAttemptLabel(apiGale);
}

const BET_LABELS = { Player: 'AZUL', Banker: 'VERMELHO', Tie: 'EMPATE' };

function zoneToBetLabel(zone) {
  if (zone === 'player') return 'AZUL';
  if (zone === 'banker') return 'VERMELHO';
  if (zone === 'tie') return 'EMPATE';
  return null;
}

/** Cor real para alerta — acerto usa cor que saiu na mesa (= aposta) */
function resolveAlertColorLabel(signal, outcome) {
  const reconciled = reconcileSignalResult({ ...signal, signal_status: 'result' });

  if (outcome === 'green') {
    const outcomeZone =
      parseOutcomeZone(reconciled.result_value) || parseOutcomeZone(reconciled.actual_outcome);
    if (outcomeZone) return zoneToBetLabel(outcomeZone);
  }

  const bet = resolveSignalBet(reconciled);
  if (bet) return BET_LABELS[bet] || bet;

  const outcomeZone =
    parseOutcomeZone(reconciled.result_value) || parseOutcomeZone(reconciled.actual_outcome);
  return zoneToBetLabel(outcomeZone);
}

export function buildPlayResultAlert(signal, outcome) {
  if (!signal || !outcome) return null;

  const attemptLabel = formatAttemptLabel(signal.current_gale);
  const colorLabel = resolveAlertColorLabel(signal, outcome);
  const prep = attemptLabel === 'ENTRADA' ? 'na' : 'no';

  if (outcome === 'green') {
    return {
      outcome: 'green',
      title: 'ACERTOU ✓',
      message: `Entrada confirmada — acertou ${prep} ${attemptLabel}`,
      sub: colorLabel ? `Cor acertada: ${colorLabel}` : 'Resultado GREEN confirmado',
      colorLabel,
      galeLabel: attemptLabel,
    };
  }

  return {
    outcome: 'loss',
    title: 'PERDEU ✗',
    message: `Entrada perdida — RED ${prep} ${attemptLabel}`,
    sub: colorLabel ? `Apostou: ${colorLabel}` : 'Resultado RED confirmado',
    colorLabel,
    galeLabel: attemptLabel,
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
