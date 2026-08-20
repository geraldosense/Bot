import { reconcileHistorySignal, getHistorySummary } from './signalResult';

function isResultSignal(signal) {
  if (!signal?.id) return false;
  if (signal.signal_status === 'result') return true;
  const r = String(signal.result || '').toLowerCase();
  return r === 'green' || r === 'loss' || r === 'red';
}

/** Lista final do histórico — dedupe por id + reconciliação MoneyTix */
export function normalizeHistoryList(signals = []) {
  const byId = new Map();

  for (const raw of signals) {
    if (!isResultSignal(raw)) continue;
    const base = { ...raw, signal_status: 'result' };
    const reconciled = reconcileHistorySignal(base);
    const id = String(reconciled.id);
    if (!byId.has(id)) {
      byId.set(id, reconciled);
      continue;
    }
    const prev = byId.get(id);
    byId.set(id, reconcileHistorySignal({
      ...prev,
      ...reconciled,
      entry_bet: reconciled.entry_bet || prev.entry_bet,
      bet: reconciled.bet || prev.bet,
      bet_recommendation: reconciled.bet_recommendation || prev.bet_recommendation,
      sequence: reconciled.sequence || prev.sequence,
      entry_condition: reconciled.entry_condition || prev.entry_condition,
      result_value: reconciled.result_value || prev.result_value,
      result: reconciled.result || prev.result,
      current_gale: reconciled.current_gale ?? prev.current_gale,
      created_date: reconciled.created_date || prev.created_date,
    }));
  }

  return [...byId.values()].sort(
    (a, b) => new Date(b.created_date) - new Date(a.created_date),
  );
}

/** Estatísticas calculadas a partir do histórico real (como MoneyTix) */
export function computeHistoryStats(signals = []) {
  const list = normalizeHistoryList(signals);
  let greens = 0;
  let reds = 0;
  let g0Wins = 0;
  let galeWins = 0;
  let galeLosses = 0;

  for (const signal of list) {
    const summary = getHistorySummary(signal);
    const gale = Number(signal.current_gale) || 0;
    if (summary.isGreen) {
      greens++;
      if (gale === 0) g0Wins++;
      else galeWins++;
    } else {
      reds++;
      if (gale > 0) galeLosses++;
    }
  }

  const total = greens + reds;
  const winRate = total ? Math.min(100, Math.round((greens / total) * 10000) / 100) : 0;
  const streak = computeHistoryStreak(list);

  return { list, greens, reds, total, winRate, g0Wins, galeWins, galeLosses, streak };
}

/** Sequência actual de GREEN ou RED (mais recente primeiro) */
export function computeHistoryStreak(list = []) {
  if (!list.length) return { type: null, count: 0 };

  const firstGreen = getHistorySummary(list[0]).isGreen;
  let count = 0;

  for (const signal of list) {
    if (getHistorySummary(signal).isGreen === firstGreen) count++;
    else break;
  }

  return { type: firstGreen ? 'green' : 'red', count };
}

export function filterHistoryList(list = [], filters = {}) {
  const { result = 'all', gale = null, color = null } = filters;

  return list.filter((signal) => {
    const summary = getHistorySummary(signal);
    const galeNum = Number(signal.current_gale) || 0;

    if (result === 'green' && !summary.isGreen) return false;
    if (result === 'red' && summary.isGreen) return false;

    if (gale === 'g0' && galeNum !== 0) return false;
    if (gale === 'gale' && galeNum === 0) return false;

    if (color === 'player' && summary.betZone !== 'player') return false;
    if (color === 'banker' && summary.betZone !== 'banker') return false;

    return true;
  });
}
