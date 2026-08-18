import { normalizeOutcome, OUTCOMES } from './analyzer.js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://btyescbddoopbbuacyhd.supabase.co';
const SUPABASE_KEY =
  process.env.SUPABASE_KEY || 'sb_publishable_eqZiBte_sQPi_YQQpGpl0w_7aMhJjgr';

const GAME_ID = process.env.BACBO_GAME_ID || 'bac_bo';

function headers() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
  };
}

export async function fetchCasinoRounds(gameId = GAME_ID, limit = 200) {
  try {
    const url = `${SUPABASE_URL}/rest/v1/bac_bo_rounds?select=id,outcome,multiplier,round_timestamp,game_id&game_id=eq.${gameId}&order=round_timestamp.desc&limit=${limit}`;
    const res = await fetch(url, { headers: headers(), signal: AbortSignal.timeout(12000) });
    if (!res.ok) return [];
    const data = await res.json();
    return data
      .map((r) => ({
        id: String(r.id),
        game_id: r.game_id || gameId,
        outcome: normalizeOutcome(r.outcome),
        multiplier: r.multiplier,
        round_timestamp: r.round_timestamp,
        created_at: r.round_timestamp,
        source: 'evolution_casino',
      }))
      .filter((r) => r.outcome);
  } catch (err) {
    console.error('[casino] Erro ao buscar rounds:', err.message);
    return [];
  }
}

export async function fetchLatestCasinoSignal(gameId = GAME_ID) {
  try {
    const url = `${SUPABASE_URL}/rest/v1/sinais?jogo=eq.${gameId}&order=criado_em.desc&limit=1`;
    const res = await fetch(url, { headers: headers(), signal: AbortSignal.timeout(12000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.length) return null;
    return mapCasinoSignal(data[0]);
  } catch (err) {
    console.error('[casino] Erro ao buscar sinal:', err.message);
    return null;
  }
}

function mapBetRecommendation(rec) {
  if (!rec) return null;
  const s = String(rec).toUpperCase();
  if (s.includes('AZUL') || s.includes('JOGADOR')) return 'Player';
  if (s.includes('VERMELHO') || s.includes('BANCA') || s.includes('CASA')) return 'Banker';
  if (s.includes('EMPATE') || s.includes('TIE')) return 'Tie';
  return null;
}

export function mapCasinoSignal(row) {
  if (!row) return null;

  const bet = mapBetRecommendation(row.bet_recommendation || row.bet_safe);
  const tieProtection =
    row.tie_protection === true ||
    row.tie_protection === 'true' ||
    String(row.tie_protection).toLowerCase() === 'true';

  let result = null;
  if (row.result === 'green' || row.result === 'GREEN') result = 'green';
  if (row.result === 'loss' || row.result === 'LOSS' || row.result === 'red') result = 'loss';
  if (row.signal_status === 'result' && row.result_value) {
    result = String(row.result_value).toLowerCase().includes('green') ? 'green' : 'loss';
  }

  const signalStatus =
    row.signal_status === 'result' && result
      ? 'result'
      : row.signal_status || 'analyzing';

  return {
    id: row.id,
    signal_status: signalStatus,
    created_date: row.criado_em,
    bet,
    entry_bet: bet,
    bet_recommendation: row.bet_recommendation || row.bet_safe,
    sequence: row.sequence,
    entry_condition: row.entry_condition,
    tie_protection: tieProtection,
    gales: Number(row.gales) || 0,
    current_gale: Number(row.current_gale) || 0,
    result,
    result_value: row.result_value,
    scoreboard_green: Number(row.scoreboard_green) || 0,
    scoreboard_red: Number(row.scoreboard_red) || 0,
    win_rate: row.win_rate,
    raw_message: row.raw_text,
    source: 'evolution_casino',
    confidence: bet && signalStatus === 'confirmed' ? 92 : null,
    analysis: bet
      ? {
          bet,
          betRecommendation: row.bet_recommendation || row.bet_safe,
          reason: row.entry_condition || 'Sinal confirmado pela mesa Evolution Bac Bo',
          entryCondition: row.sequence?.split(' ').pop() || OUTCOMES[bet]?.emoji,
        }
      : null,
  };
}

/** Lógica igual ao moneytix — quando mostrar monitoramento vs sinal */
export function shouldShowMonitoring(signal) {
  if (!signal) return true;

  const ageMs = Date.now() - new Date(signal.created_date).getTime();

  if (signal.signal_status === 'analyzing') return ageMs > 10000;
  if (signal.signal_status === 'confirmed') return ageMs > 180000;
  if (signal.signal_status === 'result') return ageMs > 20000;
  if (signal.signal_status === 'gale_update') return ageMs > 180000;
  return ageMs > 300000;
}

export class CasinoDataProvider {
  constructor({ onRounds, onSignal, onStatus }) {
    this.onRounds = onRounds;
    this.onSignal = onSignal;
    this.onStatus = onStatus;
    this.seenRoundIds = new Set();
    this.lastSignalId = null;
    this.connected = false;
    this.initialized = false;
    this.pollTimer = null;
    this.gameId = GAME_ID;
  }

  async start() {
    console.log('[casino] Ligado à mesa Evolution Bac Bo via Supabase');
    await this.sync();
    this.pollTimer = setInterval(() => this.sync(), 3000);
  }

  stop() {
    if (this.pollTimer) clearInterval(this.pollTimer);
  }

  async sync() {
    const [rounds, signal] = await Promise.all([
      fetchCasinoRounds(this.gameId, 200),
      fetchLatestCasinoSignal(this.gameId),
    ]);

    if (rounds.length > 0) {
      this.connected = true;
      const newRounds = [];

      for (const r of [...rounds].reverse()) {
        if (!this.seenRoundIds.has(r.id)) {
          this.seenRoundIds.add(r.id);
          newRounds.push(r);
        }
      }

      this.onRounds(rounds, {
        newRounds: this.initialized ? newRounds : [],
        initial: !this.initialized,
      });
      this.initialized = true;
    } else {
      this.connected = false;
    }

    if (signal && signal.id !== this.lastSignalId) {
      this.lastSignalId = signal.id;
      this.onSignal(signal, { isNew: true });
    } else if (signal) {
      this.onSignal(signal, { isNew: false });
    }

    this.onStatus({
      connected: this.connected,
      roundsCount: rounds.length,
      source: 'evolution_casino',
      monitoring: shouldShowMonitoring(signal),
    });
  }
}
