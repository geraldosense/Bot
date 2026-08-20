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

  for (const signal of list) {
    const summary = getHistorySummary(signal);
    if (summary.isGreen) greens++;
    else reds++;
  }

  const total = greens + reds;
  const winRate = total ? Math.min(100, Math.round((greens / total) * 10000) / 100) : 0;

  return { list, greens, reds, total, winRate };
}
