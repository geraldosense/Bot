/** Dia operacional alinhado ao moneytix (Brasil UTC-3 por defeito) */
export const SCOREBOARD_TZ = process.env.SCOREBOARD_TZ || 'America/Sao_Paulo';
export const SCOREBOARD_UTC_OFFSET = Number(process.env.SCOREBOARD_UTC_OFFSET ?? -3);

export function todayKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SCOREBOARD_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Início do dia operacional em ISO UTC (para queries Supabase) */
export function dayStartIso(date = new Date()) {
  const key = todayKey(date);
  const [y, m, d] = key.split('-').map(Number);
  const utcMs = Date.UTC(y, m - 1, d) - SCOREBOARD_UTC_OFFSET * 3600000;
  return new Date(utcMs).toISOString();
}
