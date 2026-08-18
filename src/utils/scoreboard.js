const DEFAULT = { greens: 0, reds: 0, winRate: 0 };

export function normalizeScoreboard(raw) {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT };

  const greens = Number(raw.greens);
  const reds = Number(raw.reds);
  const winRate = Number(raw.winRate);

  const g = Number.isFinite(greens) ? greens : 0;
  const r = Number.isFinite(reds) ? reds : 0;
  const total = g + r;

  return {
    greens: g,
    reds: r,
    winRate: Number.isFinite(winRate)
      ? Math.round(winRate)
      : total
        ? Math.round((g / total) * 100)
        : 0,
  };
}

/**
 * Placar estável — nunca regredir para 0 se já havia dados da IA do casino.
 * Aceita sempre totais iguais ou superiores (novos greens/losses).
 */
export function mergeScoreboard(prev, next) {
  const base = normalizeScoreboard(prev);
  if (!next) return base;

  const incoming = normalizeScoreboard(next);
  const baseTotal = base.greens + base.reds;
  const incomingTotal = incoming.greens + incoming.reds;

  if (incomingTotal > baseTotal) return incoming;
  if (incomingTotal === baseTotal && incomingTotal > 0) return incoming;
  if (baseTotal > 0 && incomingTotal === 0) return base;

  return incomingTotal > 0 ? incoming : base;
}
