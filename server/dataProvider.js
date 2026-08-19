import { normalizeOutcome } from './analyzer.js';

/**
 * Provedor de dados Bac Bo
 * Modos: simulator | supabase | api
 */

import { CASINO_SUPABASE_URL, CASINO_SUPABASE_KEY } from './casinoSupabase.js';

let roundCounter = 0;

function generateRound(gameId = 'bac_bo') {
  const rand = Math.random();
  let outcome;
  if (rand < 0.095) outcome = 'Tie';
  else if (rand < 0.5475) outcome = 'Banker';
  else outcome = 'Player';

  roundCounter++;
  return {
    id: `sim_${Date.now()}_${roundCounter}`,
    game_id: gameId,
    outcome,
    multiplier: outcome === 'Tie' ? [4, 6, 10, 25, 88][Math.floor(Math.random() * 5)] : null,
    round_timestamp: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
}

export async function fetchSupabaseRounds(gameId = 'bac_bo', limit = 100) {
  if (!CASINO_SUPABASE_KEY) return null;

  try {
    const url = `${CASINO_SUPABASE_URL}/rest/v1/bac_bo_rounds?select=id,outcome,multiplier,round_timestamp,game_id&game_id=eq.${gameId}&order=round_timestamp.desc&limit=${limit}`;
    const res = await fetch(url, {
      headers: {
        apikey: CASINO_SUPABASE_KEY,
        Authorization: `Bearer ${CASINO_SUPABASE_KEY}`,
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.map((r) => ({
      id: r.id,
      game_id: r.game_id || gameId,
      outcome: normalizeOutcome(r.outcome) || r.outcome,
      multiplier: r.multiplier,
      round_timestamp: r.round_timestamp,
      created_at: r.round_timestamp,
    }));
  } catch {
    return null;
  }
}

export class DataProvider {
  constructor(onRound, options = {}) {
    this.onRound = onRound;
    this.mode = options.mode || 'simulator';
    this.gameId = options.gameId || 'bac_bo';
    this.intervalMs = options.intervalMs || 15000;
    this.timer = null;
    this.seenIds = new Set();
    this.pollTimer = null;
  }

  async start() {
    if (this.mode === 'supabase' && CASINO_SUPABASE_KEY) {
      await this.loadSupabaseHistory();
      this.pollTimer = setInterval(() => this.pollSupabase(), 5000);
    } else {
      await this.bootstrapSimulator();
      this.timer = setInterval(() => this.emitSimulatedRound(), this.intervalMs);
    }
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    if (this.pollTimer) clearInterval(this.pollTimer);
  }

  async bootstrapSimulator() {
    const history = [];
    for (let i = 0; i < 30; i++) {
      const r = generateRound(this.gameId);
      r.round_timestamp = new Date(Date.now() - (30 - i) * 20000).toISOString();
      history.unshift(r);
    }
    for (const r of history) {
      this.seenIds.add(r.id);
      this.onRound(r, { initial: true });
    }
  }

  emitSimulatedRound() {
    const round = generateRound(this.gameId);
    if (!this.seenIds.has(round.id)) {
      this.seenIds.add(round.id);
      this.onRound(round);
    }
  }

  async loadSupabaseHistory() {
    const rounds = await fetchSupabaseRounds(this.gameId, 200);
    if (!rounds?.length) {
      this.mode = 'simulator';
      await this.bootstrapSimulator();
      this.timer = setInterval(() => this.emitSimulatedRound(), this.intervalMs);
      return;
    }

    for (const r of [...rounds].reverse()) {
      this.seenIds.add(r.id);
      this.onRound(r, { initial: true });
    }
  }

  async pollSupabase() {
    const rounds = await fetchSupabaseRounds(this.gameId, 5);
    if (!rounds?.length) return;

    for (const r of [...rounds].reverse()) {
      if (!this.seenIds.has(r.id)) {
        this.seenIds.add(r.id);
        this.onRound(r);
      }
    }
  }
}
