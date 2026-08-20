import { reconcileHistorySignal, isSignalGreen } from './signalResult';

export const PARTIAL_SCOREBOARD_MSG = 'Até agora estamos com';

export function isPartialScoreboardSignal(signal) {
  const raw = signal?.raw_message || signal?.raw_text || '';
  return String(raw).includes(PARTIAL_SCOREBOARD_MSG);
}

/** 1 linha = 1 entrada finalizada pelo robô */
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

function mergeHistoryRecords(prev, next) {
  return reconcileHistorySignal({
    ...prev,
    ...next,
    entry_bet: next.entry_bet || prev.entry_bet,
    bet: next.bet || prev.bet,
    bet_recommendation: next.bet_recommendation || prev.bet_recommendation,
    sequence: next.sequence || prev.sequence,
    entry_condition: next.entry_condition || prev.entry_condition,
    result_value: next.result_value || prev.result_value,
    result: next.result || prev.result,
    current_gale: next.current_gale ?? prev.current_gale,
    scoreboard_green: next.scoreboard_green ?? prev.scoreboard_green,
    scoreboard_red: next.scoreboard_red ?? prev.scoreboard_red,
    win_rate: next.win_rate ?? prev.win_rate,
    tie_protection: next.tie_protection ?? prev.tie_protection,
    created_date: next.created_date || prev.created_date,
    signal_status: 'result',
  });
}

/** Lista final — dedupe por id, filtro de entradas válidas, backfill sequence */
export function normalizeHistoryList(signals = []) {
  const context = [...signals];
  const byId = new Map();

  for (const raw of signals) {
    if (!isRobotHistorySignal(raw)) continue;

    const withSeq = backfillSequenceFromContext(
      { ...raw, signal_status: 'result' },
      context,
    );
    const reconciled = reconcileHistorySignal(withSeq);
    const id = String(reconciled.id);

    if (!byId.has(id)) {
      byId.set(id, reconciled);
      continue;
    }
    byId.set(id, mergeHistoryRecords(byId.get(id), reconciled));
  }

  return [...byId.values()].sort(
    (a, b) => new Date(b.created_date) - new Date(a.created_date),
  );
}

/** Stats do histórico filtrado (contagem local das entradas do robô) */
export function computeHistoryStats(signals = []) {
  const list = normalizeHistoryList(signals);
  let greens = 0;
  let losses = 0;

  for (const signal of list) {
    if (isSignalGreen(signal)) greens++;
    else losses++;
  }

  const total = greens + losses;
  const winRate = total ? Math.min(100, Math.round((greens / total) * 10000) / 100) : 0;

  return { list, greens, losses, reds: losses, total, winRate };
}

/** Placar — preferir totais IA do casino quando existem */
export function resolveHistoryScoreboard(historySignals = [], scoreboard = null) {
  const sbTotal = (Number(scoreboard?.greens) || 0) + (Number(scoreboard?.reds) || 0);
  if (sbTotal > 0 && scoreboard?.source === 'casino_ia') {
    return {
      greens: scoreboard.greens,
      losses: scoreboard.reds,
      reds: scoreboard.reds,
      total: sbTotal,
      winRate: scoreboard.winRate,
      source: 'casino_ia',
    };
  }

  const latestWithBoard = normalizeHistoryList(historySignals).find(
    (s) => (Number(s.scoreboard_green) || 0) + (Number(s.scoreboard_red) || 0) > 0,
  );

  if (latestWithBoard) {
    const g = Number(latestWithBoard.scoreboard_green) || 0;
    const r = Number(latestWithBoard.scoreboard_red) || 0;
    const total = g + r;
    return {
      greens: g,
      losses: r,
      reds: r,
      total,
      winRate: total
        ? Math.min(100, Math.round((g / total) * 10000) / 100)
        : Number(latestWithBoard.win_rate) || 0,
      source: 'signal_row',
    };
  }

  return { ...computeHistoryStats(historySignals), source: 'history' };
}

export function filterHistoryList(list = [], filters = {}) {
  const { result = 'all' } = filters;

  return list.filter((signal) => {
    const green = isSignalGreen(signal);
    if (result === 'green' && !green) return false;
    if (result === 'loss' && green) return false;
    return true;
  });
}
