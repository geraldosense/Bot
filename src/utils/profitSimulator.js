/** Simulador — perda só após falhar no 3° gale */

import { MAX_GALES, galeLossMultiplier } from './playResult.js';

const BACBO_AVG_PAYOUT = 0.95;

export function calculateDailyProfit({
  greens = 0,
  reds = 0,
  baseBet = 10,
  maxGales = MAX_GALES,
}) {
  const bet = Math.max(0, Number(baseBet) || 0);
  const g = Math.max(0, Number(greens) || 0);
  const r = Math.max(0, Number(reds) || 0);

  const winTotal = g * bet * BACBO_AVG_PAYOUT;
  const lossTotal = r * bet * galeLossMultiplier(maxGales);
  const profit = winTotal - lossTotal;

  return {
    winTotal,
    lossTotal,
    profit,
    baseBet: bet,
    maxGales,
  };
}

export function formatCurrency(value, currency = '€') {
  const n = Number(value) || 0;
  const sign = n >= 0 ? '+' : '';
  return `${sign}${currency} ${Math.abs(n).toFixed(2).replace('.', ',')}`;
}
