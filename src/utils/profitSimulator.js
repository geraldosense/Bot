/** Simulador de lucro diário — baseado em greens/losses e valor da aposta (estilo moneytix) */

const BACBO_AVG_PAYOUT = 0.95; // média Player 1:1 / Banker 0.95:1

/** Custo máximo num loss com gales (1 + 2 + 4 + …) */
export function galeLossMultiplier(maxGales = 2) {
  const gales = Math.max(0, Math.min(maxGales, 3));
  let total = 0;
  for (let i = 0; i <= gales; i++) total += Math.pow(2, i);
  return total;
}

export function calculateDailyProfit({
  greens = 0,
  reds = 0,
  baseBet = 10,
  maxGales = 2,
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

export function formatCurrency(value, currency = 'R$') {
  const n = Number(value) || 0;
  const sign = n >= 0 ? '+' : '';
  return `${sign}${currency} ${Math.abs(n).toFixed(2).replace('.', ',')}`;
}
