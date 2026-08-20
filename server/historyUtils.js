/** Regras de histórico de entradas do robô */

import { resolveEntryBet } from './signalBet.js';

export const PARTIAL_SCOREBOARD_MSG = 'Até agora estamos com';

export function isPartialScoreboardSignal(signal) {
  const raw = signal?.raw_message || signal?.raw_text || '';
  return String(raw).includes(PARTIAL_SCOREBOARD_MSG);
}

/** Entrada válida = 1 jogada finalizada pelo robô (não mensagens parciais de placar) */
export function isRobotHistorySignal(signal) {
  if (!signal?.id) return false;
  if (isPartialScoreboardSignal(signal)) return false;

  const status = signal.signal_status;
  if (status === 'green') return true;
  if (status !== 'result') return false;

  const r = String(signal.result || '').toLowerCase();
  if (r === 'green' || r === 'loss' || r === 'red') return true;

  return Boolean(signal.result_value);
}

/** Se result não tem sequence, usa a do confirmed anterior */
export function backfillSequenceFromContext(signal, contextSignals = []) {
  if (signal?.sequence) return signal;

  const createdMs = new Date(signal.created_date || signal.criado_em || 0).getTime();
  if (!Number.isFinite(createdMs)) return signal;

  const prior = contextSignals.find((s) => {
    if (!s?.sequence || s.signal_status !== 'confirmed') return false;
    const ms = new Date(s.created_date || s.criado_em || 0).getTime();
    return ms < createdMs;
  });

  if (!prior?.sequence) return signal;
  return { ...signal, sequence: prior.sequence };
}

/** Bloqueia aposta da entrada confirmada — evita confundir com cores da sequence */
export function attachLockedEntryBet(signal, contextSignals = []) {
  const locked = resolveEntryBet(signal);
  if (locked) {
    return {
      ...signal,
      entry_bet: locked,
      bet: locked,
      bet_recommendation: signal.bet_recommendation || signal.bet_safe || locked,
    };
  }

  const createdMs = new Date(signal.created_date || signal.criado_em || 0).getTime();
  if (!Number.isFinite(createdMs)) return signal;

  const priorEntry = contextSignals.find((s) => {
    if (!['confirmed', 'gale_update'].includes(s.signal_status)) return false;
    const ms = new Date(s.created_date || s.criado_em || 0).getTime();
    if (ms >= createdMs) return false;
    return Boolean(s.bet_recommendation || s.bet_safe || s.entry_bet || s.bet);
  });

  if (!priorEntry) return signal;

  const bet = resolveEntryBet(priorEntry);
  if (!bet) return signal;

  return {
    ...signal,
    entry_bet: bet,
    bet,
    bet_recommendation: priorEntry.bet_recommendation || priorEntry.bet_safe || bet,
  };
}

export function prepareRobotHistorySignal(signal, contextSignals = []) {
  if (!isRobotHistorySignal(signal)) return null;

  const normalized = attachLockedEntryBet(
    { ...signal, signal_status: 'result' },
    contextSignals,
  );

  return backfillSequenceFromContext(normalized, contextSignals);
}

export function filterRobotHistorySignals(signals = [], contextSignals = []) {
  const byId = new Map();

  for (const raw of signals) {
    const prepared = prepareRobotHistorySignal(raw, contextSignals);
    if (!prepared) continue;
    byId.set(String(prepared.id), prepared);
  }

  return [...byId.values()].sort(
    (a, b) => new Date(b.created_date || b.criado_em) - new Date(a.created_date || a.criado_em),
  );
}
