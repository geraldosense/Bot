/**
 * Supabase da mesa Evolution Bac Bo (rounds + sinais IA).
 * Separado do Supabase de contas (sense_bot_users).
 */
export const CASINO_SUPABASE_URL =
  process.env.CASINO_SUPABASE_URL || 'https://btyescbddoopbbuacyhd.supabase.co';

export const CASINO_SUPABASE_KEY =
  process.env.SUPABASE_KEY ||
  process.env.CASINO_SUPABASE_KEY ||
  'sb_publishable_eqZiBte_sQPi_YQQpGpl0w_7aMhJjgr';

export function casinoHeaders(extra = {}) {
  return {
    apikey: CASINO_SUPABASE_KEY,
    Authorization: `Bearer ${CASINO_SUPABASE_KEY}`,
    ...extra,
  };
}
