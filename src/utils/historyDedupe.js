/** Remove duplicados do histórico — mesmo id ou mesma jogada no mesmo segundo */
import { reconcileHistorySignal } from './signalResult';

export function dedupeHistorySignals(signals = []) {
  const byId = new Map();

  for (const signal of signals) {
    if (!signal?.id) continue;
    const isResult =
      signal.signal_status === 'result' ||
      signal.result === 'green' ||
      signal.result === 'loss' ||
      signal.result === 'red';
    if (!isResult) continue;
    const normalized = reconcileHistorySignal(signal);
    const id = String(normalized.id);
    if (!byId.has(id)) {
      byId.set(id, normalized);
      continue;
    }
    byId.set(id, mergeClientSignal(byId.get(id), normalized));
  }

  const seen = new Set();
  const unique = [];

  for (const signal of [...byId.values()].sort(
    (a, b) => new Date(b.created_date) - new Date(a.created_date),
  )) {
    const reconciled = reconcileHistorySignal(signal);
    const bet =
      reconciled.entry_bet ||
      reconciled.bet ||
      reconciled.bet_recommendation ||
      reconciled.bet_safe ||
      '';
    const sec = reconciled.created_date
      ? Math.floor(new Date(reconciled.created_date).getTime() / 1000)
      : 0;
    const fp = `${sec}|${reconciled.result || ''}|${String(bet).toUpperCase()}`;
    if (seen.has(fp)) continue;
    seen.add(fp);
    unique.push(reconciled);
  }

  return unique;
}

function mergeClientSignal(a, b) {
  return reconcileHistorySignal({
    ...a,
    ...b,
    bet: a.bet || b.bet,
    entry_bet: a.entry_bet || b.entry_bet,
    bet_recommendation: a.bet_recommendation || b.bet_recommendation,
    bet_safe: a.bet_safe || b.bet_safe,
    sequence: a.sequence || b.sequence,
    entry_condition: a.entry_condition || b.entry_condition,
    result_value: b.result_value || a.result_value,
    result: b.result || a.result,
    created_date: b.created_date || a.created_date,
  });
}
