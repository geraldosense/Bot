import { normalizeOutcome, OUTCOMES } from './analyzer.js';
import { dayStartIso } from './dayKey.js';
import { calcWinRate } from './playResult.js';
import { resolveSignalBet, reconcileSignalResult } from './signalBet.js';
import { CASINO_SUPABASE_URL, casinoHeaders } from './casinoSupabase.js';
import {
  isPartialScoreboardSignal,
  isRobotHistorySignal,
  filterRobotHistorySignals,
} from './historyUtils.js';

const GAME_ID = process.env.BACBO_GAME_ID || 'bac_bo';

export async function fetchCasinoRounds(gameId = GAME_ID, limit = 200) {
  try {
    const url = `${CASINO_SUPABASE_URL}/rest/v1/bac_bo_rounds?select=id,outcome,multiplier,round_timestamp,game_id&game_id=eq.${gameId}&order=round_timestamp.desc&limit=${limit}`;
    const res = await fetch(url, { headers: casinoHeaders(), signal: AbortSignal.timeout(12000) });
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
    const url = `${CASINO_SUPABASE_URL}/rest/v1/sinais?jogo=eq.${gameId}&order=criado_em.desc&limit=1`;
    const res = await fetch(url, { headers: casinoHeaders(), signal: AbortSignal.timeout(12000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.length) return null;
    return mapCasinoSignal(data[0]);
  } catch (err) {
    console.error('[casino] Erro ao buscar sinal:', err.message);
    return null;
  }
}

/** Placar diário moneytix — último sinal com scoreboard_green preenchido pela IA */
export async function fetchCasinoScoreboard(gameId = GAME_ID) {
  try {
    const url =
      `${CASINO_SUPABASE_URL}/rest/v1/sinais?jogo=eq.${gameId}` +
      `&scoreboard_green=gt.0&order=criado_em.desc&limit=1` +
      `&select=scoreboard_green,scoreboard_red,win_rate,criado_em`;

    const res = await fetch(url, { headers: casinoHeaders(), signal: AbortSignal.timeout(12000) });
    if (!res.ok) return null;

    const data = await res.json();
    if (!data?.length) return null;

    return mapScoreboardRow(data[0], gameId);
  } catch (err) {
    console.error('[casino] Erro ao buscar placar:', err.message);
    return null;
  }
}

/** Resultados do dia — cada entrada finalizada pelo robô */
export async function fetchTodayResultSignals(gameId = GAME_ID) {
  const bundle = await fetchTodayHistoryBundle(gameId);
  return bundle.results;
}

/** Todos os sinais do dia (results + confirmed) para backfill de sequence */
export async function fetchTodayHistoryBundle(gameId = GAME_ID) {
  try {
    const iso = dayStartIso();

    const url =
      `${CASINO_SUPABASE_URL}/rest/v1/sinais?jogo=eq.${gameId}` +
      `&criado_em=gte.${encodeURIComponent(iso)}` +
      `&order=criado_em.desc&limit=800` +
      `&select=id,signal_status,result,result_value,bet_recommendation,bet_safe,bet,entry_bet,current_gale,gales,tie_protection,criado_em,sequence,entry_condition,raw_text,scoreboard_green,scoreboard_red,win_rate`;

    const res = await fetch(url, { headers: casinoHeaders(), signal: AbortSignal.timeout(12000) });
    if (!res.ok) return { results: [], context: [] };

    const data = await res.json();
    const context = (data || []).map(mapCasinoSignal).filter(Boolean);
    const rawResults = context.filter(
      (s) => s.signal_status === 'result' || s.signal_status === 'green' || isRobotHistorySignal(s),
    );
    const results = filterRobotHistorySignals(rawResults, context);

    return { results, context };
  } catch (err) {
    console.error('[casino] Erro ao buscar histórico do dia:', err.message);
    return { results: [], context: [] };
  }
}

export function mapScoreboardRow(row, gameId = GAME_ID) {
  if (!row) return null;

  const greens = Number(row.scoreboard_green) || 0;
  const reds = Number(row.scoreboard_red) || 0;

  return {
    greens,
    reds,
    winRate: calcWinRate(greens, reds),
    gameId,
    source: 'casino_ia',
    updatedAt: row.criado_em,
  };
}

function mapBetRecommendation(rec) {
  if (!rec) return null;
  const s = String(rec).toUpperCase();
  if (s.includes('AZUL') || s.includes('JOGADOR') || s === 'PLAYER') return 'Player';
  if (s.includes('VERMELHO') || s.includes('BANCA') || s.includes('CASA') || s === 'BANKER') return 'Banker';
  if (s.includes('EMPATE') || s === 'TIE') return 'Tie';
  if (rec === 'Player' || rec === 'Banker' || rec === 'Tie') return rec;
  return null;
}

function resolveIaConfidence(row, signalStatus, bet) {
  if (!bet || !['confirmed', 'gale_update'].includes(signalStatus)) return null;

  const g = Number(row.scoreboard_green) || 0;
  const r = Number(row.scoreboard_red) || 0;
  const total = g + r;
  if (total > 0) return calcWinRate(g, r);

  return null;
}

export function mapCasinoSignal(row) {
  if (!row) return null;

  const bet = resolveSignalBet(row);
  const tieProtection =
    row.tie_protection === true ||
    row.tie_protection === 'true' ||
    String(row.tie_protection).toLowerCase() === 'true';

  const signalStatus =
    row.signal_status === 'result' || row.signal_status === 'green'
      ? 'result'
      : row.signal_status || 'analyzing';

  const isAnalyzing = signalStatus === 'analyzing';

  if (isPartialScoreboardSignal({ raw_message: row.raw_text })) {
    return null;
  }

  const mapped = reconcileSignalResult({
    id: row.id,
    signal_status: signalStatus,
    created_date: row.criado_em,
    bet: isAnalyzing ? null : bet,
    entry_bet: isAnalyzing ? null : bet,
    bet_recommendation: isAnalyzing
      ? row.bet_recommendation || row.bet_safe || null
      : row.bet_recommendation || row.bet_safe || bet,
    bet_safe: row.bet_safe,
    sequence: row.sequence,
    entry_condition: row.entry_condition,
    tie_protection: tieProtection,
    gales: Number(row.gales) || 3,
    current_gale: Number(row.current_gale) || 0,
    result: parseResultFlag(row) || (row.signal_status === 'green' ? 'green' : null),
    result_value: row.result_value,
    actual_outcome: row.result_value || null,
    scoreboard_green: Number(row.scoreboard_green) || 0,
    scoreboard_red: Number(row.scoreboard_red) || 0,
    win_rate: row.win_rate,
    raw_message: row.raw_text,
    source: 'evolution_casino',
    confidence: resolveIaConfidence(row, signalStatus, bet),
    ia_assertividade: resolveIaConfidence(row, signalStatus, bet),
    analysis:
      !isAnalyzing && bet
        ? {
            bet,
            betRecommendation: row.bet_recommendation || row.bet_safe,
            reason: row.entry_condition || 'Sinal confirmado pela mesa Evolution Bac Bo',
            entryCondition: row.sequence?.split(' ').pop() || OUTCOMES[bet]?.emoji,
          }
        : null,
  });

  return mapped;
}

function parseResultFlag(row) {
  const raw = String(row?.result || '').toLowerCase();
  if (raw === 'green') return 'green';
  if (raw === 'loss' || raw === 'red') return 'loss';

  const rv = String(row?.result_value || '').toLowerCase();
  if (!rv) return null;
  if (rv.includes('green') || rv.includes('acert') || rv.includes('win')) return 'green';
  if (rv.includes('loss') || rv.includes('red') || rv.includes('perd')) return 'loss';

  return null;
}

/** Lógica igual ao moneytix — quando mostrar monitoramento vs sinal */
export function shouldShowMonitoring(signal) {
  if (!signal) return true;

  const ageMs = Date.now() - new Date(signal.created_date).getTime();

  // Analisando mesa — sempre ecrã satélite, sem cor de entrada anterior
  if (signal.signal_status === 'analyzing') return true;
  if (signal.signal_status === 'confirmed') return ageMs > 180000;
  if (signal.signal_status === 'result') return ageMs > 20000;
  if (signal.signal_status === 'gale_update') return ageMs > 180000;
  return ageMs > 300000;
}

export class CasinoDataProvider {
  constructor({ onRounds, onSignal, onStatus, onSyncScoreboard }) {
    this.onRounds = onRounds;
    this.onSignal = onSignal;
    this.onStatus = onStatus;
    this.onSyncScoreboard = onSyncScoreboard;
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
    const [rounds, signal, scoreboard, historyBundle] = await Promise.all([
      fetchCasinoRounds(this.gameId, 200),
      fetchLatestCasinoSignal(this.gameId),
      fetchCasinoScoreboard(this.gameId),
      fetchTodayHistoryBundle(this.gameId),
    ]);

    const todayResults = historyBundle.results;

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

    // Placar ANTES do sinal — evita flash de valores parciais (2/1/67)
    this.onSyncScoreboard?.({ casinoScoreboard: scoreboard, todayResults });

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
