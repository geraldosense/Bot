export const MIN_ASSERTIVITY = 90;

const DEFAULT = { greens: 0, reds: 0, winRate: 0, meetsTarget: false };

export function meetsAssertivityTarget(winRate) {
  return Number(winRate) >= MIN_ASSERTIVITY;
}

export function formatWinRate(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0%';
  return Number.isInteger(n) ? `${n}%` : `${n.toFixed(1)}%`;
}

/** Formato moneytix — ex: 96.10% */
export function formatWinRatePrecise(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0.00%';
  return `${n.toFixed(2)}%`;
}

function calcWinRateFromTotals(g, r) {
  const total = g + r;
  if (!total) return 0;
  const rate = (g / total) * 100;
  return Math.min(100, Math.round(rate * 100) / 100);
}

export function normalizeScoreboard(raw) {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT };

  const greens = Number(raw.greens);
  const reds = Number(raw.reds);

  const g = Number.isFinite(greens) ? greens : 0;
  const r = Number.isFinite(reds) ? reds : 0;
  const total = g + r;

  const wr = total ? calcWinRateFromTotals(g, r) : 0;

  return {
    greens: g,
    reds: r,
    winRate: wr,
    meetsTarget: wr >= MIN_ASSERTIVITY && total > 0,
    playsToday: Number(raw.playsToday) || total,
    source: raw.source || 'server',
  };
}
