/** Remove duplicados do histórico — mesmo id ou mesma jogada no mesmo segundo */
export function dedupeHistorySignals(signals = []) {
  const byId = new Map();

  for (const signal of signals) {
    if (signal?.signal_status !== 'result' || !signal?.id) continue;
    const id = String(signal.id);
    if (!byId.has(id)) {
      byId.set(id, signal);
      continue;
    }
    byId.set(id, mergeClientSignal(byId.get(id), signal));
  }

  const seen = new Set();
  const unique = [];

  for (const signal of [...byId.values()].sort(
    (a, b) => new Date(b.created_date) - new Date(a.created_date),
  )) {
    const bet =
      signal.entry_bet || signal.bet || signal.bet_recommendation || signal.bet_safe || '';
    const sec = signal.created_date
      ? Math.floor(new Date(signal.created_date).getTime() / 1000)
      : 0;
    const fp = `${sec}|${signal.result || ''}|${String(bet).toUpperCase()}`;
    if (seen.has(fp)) continue;
    seen.add(fp);
    unique.push(signal);
  }

  return unique;
}

function mergeClientSignal(a, b) {
  return {
    ...a,
    ...b,
    bet: a.bet || b.bet,
    entry_bet: a.entry_bet || b.entry_bet,
    bet_recommendation: a.bet_recommendation || b.bet_recommendation,
    bet_safe: a.bet_safe || b.bet_safe,
    sequence: a.sequence || b.sequence,
    entry_condition: a.entry_condition || b.entry_condition,
    result_value: a.result_value || b.result_value,
    created_date: b.created_date || a.created_date,
  };
}
