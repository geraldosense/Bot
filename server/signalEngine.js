import { shouldShowMonitoring } from './casinoDataProvider.js';
import { scoreboardStore } from './scoreboardStore.js';
import { classifyPlayResult, buildPlayResultAlert, MAX_GALES } from './playResult.js';
import { mergeSignalRecords, resolveSignalBet, historyFingerprint, reconcileSignalResult } from './signalBet.js';

const MAX_HISTORY = 100;

/**
 * Motor de sinais — dados reais Evolution Bac Bo.
 * Placar = histórico persistente + sync casino (fonte única no servidor).
 */
export class SignalEngine {
  constructor(broadcast) {
    this.broadcast = broadcast;
    this.rounds = [];
    this.currentSignal = null;
    this.signalHistory = [];
    this.state = 'idle';
    this.casinoConnected = false;
    this.dataSource = 'evolution_casino';
    this.historyBootstrapped = false;
    this.rebuildDayHistory([]);
  }

  emit(type, data) {
    this.broadcast({ type, data, timestamp: new Date().toISOString() });
  }

  getScoreboard() {
    return scoreboardStore.getScoreboard();
  }

  emitScoreboard() {
    this.emit('scoreboard', this.getScoreboard());
  }

  emitState() {
    const monitoring = shouldShowMonitoring(this.currentSignal);
    this.state = this.resolveState(monitoring);

    this.emit('state', {
      state: this.state,
      signal: monitoring ? null : this.currentSignal,
      scoreboard: this.getScoreboard(),
      roundsCount: this.rounds.length,
      casinoConnected: this.casinoConnected,
      dataSource: this.dataSource,
      monitoring,
    });
  }

  resolveState(monitoring) {
    if (!this.casinoConnected) return 'disconnected';
    if (!this.currentSignal || monitoring) return 'idle';
    const s = this.currentSignal.signal_status;
    if (s === 'analyzing') return 'analyzing';
    if (s === 'confirmed') return 'confirmed';
    if (s === 'gale_update') return 'gale';
    if (s === 'result') return 'result';
    return 'idle';
  }

  /** Importa jogadas do dia + totais externos */
  syncScoreboardData({ casinoScoreboard, todayResults = [] }) {
    if (todayResults.length) {
      scoreboardStore.importPlays(todayResults);
    }
    this.rebuildDayHistory(todayResults);
    if (casinoScoreboard) {
      scoreboardStore.syncCasinoTotals(casinoScoreboard);
    }
    this.emitScoreboard();
  }

  playToHistorySignal(play) {
    if (!play?.id) return null;
    return {
      id: play.id,
      signal_status: 'result',
      result: play.result,
      created_date: play.at,
      bet: play.bet,
      entry_bet: play.entry_bet || play.bet,
      bet_recommendation: play.bet_recommendation || play.bet,
      sequence: play.sequence,
      entry_condition: play.entry_condition,
      current_gale: play.gale ?? 0,
      gales: play.maxGales ?? MAX_GALES,
    };
  }

  isHistoryResult(raw) {
    if (!raw?.id) return false;
    if (raw.signal_status === 'result') return true;
    const r = String(raw.result || '').toLowerCase();
    return r === 'green' || r === 'loss' || r === 'red';
  }

  /** Reconstrói histórico do dia — casino + disco + memória */
  rebuildDayHistory(todayResults = []) {
    const candidates = [
      ...scoreboardStore.getPlays().map((p) => this.playToHistorySignal(p)),
      ...todayResults,
      ...this.signalHistory,
    ];

    const byId = new Map();
    for (const raw of candidates) {
      if (!this.isHistoryResult(raw)) continue;
      const normalized = this.normalizeHistorySignal({
        ...raw,
        signal_status: 'result',
      });
      if (!normalized) continue;
      const id = String(normalized.id);
      byId.set(id, byId.has(id) ? mergeSignalRecords(byId.get(id), normalized) : normalized);
    }

    const sorted = [...byId.values()].sort(
      (a, b) => new Date(b.created_date) - new Date(a.created_date),
    );

    const seenFp = new Set();
    const unique = [];
    for (const item of sorted) {
      const fp = historyFingerprint(item);
      if (seenFp.has(fp)) continue;
      seenFp.add(fp);
      unique.push(item);
    }

    const prevKey = this.signalHistory.map((s) => String(s.id)).join('|');
    this.signalHistory = unique.slice(0, MAX_HISTORY);
    const nextKey = this.signalHistory.map((s) => String(s.id)).join('|');

    if (prevKey !== nextKey) {
      this.emit('history', this.signalHistory);
    }
  }

  normalizeHistorySignal(raw) {
    if (!raw?.id) return null;
    if (!this.isHistoryResult(raw)) return null;

    const stored = scoreboardStore.getSignalMeta(raw.id);
    const merged = mergeSignalRecords(stored || {}, raw);
    const bet = resolveSignalBet(merged);

    return this.enrichSignal({
      ...merged,
      bet: merged.bet || bet,
      entry_bet: merged.entry_bet || bet,
      bet_recommendation: merged.bet_recommendation || bet,
      signal_status: 'result',
    });
  }

  dedupeHistory() {
    const byId = new Map();

    for (const item of this.signalHistory) {
      const id = String(item.id);
      if (!byId.has(id)) {
        byId.set(id, item);
        continue;
      }
      byId.set(id, mergeSignalRecords(byId.get(id), item));
    }

    const seenFp = new Set();
    const unique = [];

    for (const item of [...byId.values()].sort(
      (a, b) => new Date(b.created_date) - new Date(a.created_date),
    )) {
      const fp = historyFingerprint(item);
      if (seenFp.has(fp)) continue;
      seenFp.add(fp);
      unique.push(item);
    }

    this.signalHistory = unique.slice(0, MAX_HISTORY);
  }

  upsertHistorySignal(raw) {
    if (!this.isHistoryResult(raw)) return false;

    const signal = this.normalizeHistorySignal({ ...raw, signal_status: 'result' });
    if (!signal) return false;

    const id = String(signal.id);
    const idx = this.signalHistory.findIndex((s) => String(s.id) === id);

    if (idx >= 0) {
      this.signalHistory[idx] = mergeSignalRecords(this.signalHistory[idx], signal);
    } else {
      this.signalHistory.unshift(signal);
    }

    this.dedupeHistory();
    return true;
  }

  emitHistory() {
    this.emit('history', this.signalHistory);
  }

  setCasinoScoreboard(casinoScoreboard) {
    if (!casinoScoreboard) return;
    scoreboardStore.syncCasinoTotals(casinoScoreboard);
    this.emitScoreboard();
  }

  setCasinoRounds(rounds, meta = {}) {
    this.rounds = rounds.slice(0, 500);
    this.emit('rounds', this.rounds);

    if (meta.newRounds?.length) {
      for (const r of meta.newRounds) {
        this.emit('round', r);
      }
    }
  }

  setCasinoSignal(signal) {
    if (!signal) return;

    const prev = this.currentSignal;

    if (signal.signal_status === 'confirmed' && !signal.entry_bet) {
      signal.entry_bet = signal.bet || resolveSignalBet(signal);
    }

    if (signal.signal_status === 'gale_update' && prev) {
      signal = {
        ...prev,
        ...signal,
        entry_bet: prev.entry_bet || prev.bet || signal.entry_bet || signal.bet || resolveSignalBet(prev),
        bet: prev.bet || signal.bet || prev.entry_bet || resolveSignalBet(prev),
        bet_recommendation: prev.bet_recommendation || signal.bet_recommendation,
        tie_protection: signal.tie_protection ?? prev.tie_protection,
        gales: signal.gales ?? prev.gales ?? 0,
        analysis: signal.analysis || prev.analysis,
        sequence: signal.sequence || prev.sequence,
      };
    }

    const prevStatus = prev?.signal_status;
    this.currentSignal = this.enrichSignal(signal);

    if (signal.signal_status === 'result') {
      scoreboardStore.recordPlay(this.currentSignal);

      const prevKey = this.signalHistory.map((s) => String(s.id)).join('|');
      this.upsertHistorySignal(this.currentSignal);
      const nextKey = this.signalHistory.map((s) => String(s.id)).join('|');

      if (prevStatus !== 'result' || prevKey !== nextKey) {
        this.emitHistory();

        if (prevStatus !== 'result') {
          const outcome = classifyPlayResult(this.currentSignal);
          if (outcome) {
            this.emit('play_result', {
              outcome,
              signal: this.currentSignal,
              alert: buildPlayResultAlert(this.currentSignal, outcome),
            });
          }
        }
      }
    }

    this.emit('signal', this.currentSignal);
    this.emitState();
  }

  enrichSignal(signal) {
    const sb = scoreboardStore.getScoreboard();
    const assertividade = sb.winRate;
    const meetsTarget = sb.meetsTarget === true;
    const isAnalyzing = signal.signal_status === 'analyzing';
    const bet = isAnalyzing ? null : resolveSignalBet(signal);

    const enriched = {
      ...signal,
      bet: isAnalyzing ? null : signal.bet || bet,
      entry_bet: isAnalyzing ? null : signal.entry_bet || bet,
      bet_recommendation: isAnalyzing
        ? signal.bet_recommendation || null
        : signal.bet_recommendation || bet,
      ia_assertividade: assertividade,
      meets_assertivity_target: meetsTarget,
      confidence: meetsTarget ? assertividade : signal.confidence ?? null,
    };

    return signal.signal_status === 'result' ? reconcileSignalResult(enriched) : enriched;
  }

  setCasinoStatus(status) {
    this.casinoConnected = status.connected;
    this.dataSource = status.source || 'evolution_casino';
    this.emitState();
    this.emit('casino_status', status);
  }

  getSnapshot() {
    const monitoring = shouldShowMonitoring(this.currentSignal);
    return {
      state: this.resolveState(monitoring),
      signal: monitoring ? null : this.currentSignal,
      rawSignal: this.currentSignal,
      monitoring,
      rounds: this.rounds.slice(0, 200),
      history: this.signalHistory,
      scoreboard: this.getScoreboard(),
      casinoConnected: this.casinoConnected,
      dataSource: this.dataSource,
    };
  }

  forceAnalyze() {
    this.emit('refresh_requested', { at: new Date().toISOString() });
  }
}
