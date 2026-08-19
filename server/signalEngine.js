import { shouldShowMonitoring } from './casinoDataProvider.js';
import { scoreboardStore } from './scoreboardStore.js';
import { classifyPlayResult, buildPlayResultAlert } from './playResult.js';
import { mergeSignalRecords, resolveSignalBet, historyFingerprint } from './signalBet.js';

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
      signal: this.currentSignal,
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
      this.mergeHistoryFromResults(todayResults);
    }
    if (casinoScoreboard) {
      scoreboardStore.syncCasinoTotals(casinoScoreboard);
    }
    this.emitScoreboard();
  }

  normalizeHistorySignal(raw) {
    if (!raw || raw.signal_status !== 'result' || !raw.id) return null;

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

    this.signalHistory = unique.slice(0, 50);
  }

  upsertHistorySignal(raw) {
    const signal = this.normalizeHistorySignal(raw);
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

  emitHistoryIfChanged(changed) {
    if (changed) this.emit('history', this.signalHistory);
  }

  mergeHistoryFromResults(results = []) {
    let changed = false;

    for (const raw of results) {
      if (this.upsertHistorySignal(raw)) changed = true;
    }

    this.emitHistoryIfChanged(changed);
  }

  bootstrapHistory(todayResults = []) {
    if (this.historyBootstrapped) return;
    scoreboardStore.importPlays(todayResults);
    this.mergeHistoryFromResults(todayResults);
    this.historyBootstrapped = true;
    this.emitScoreboard();
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

      if (prevStatus !== 'result') {
        const changed = this.upsertHistorySignal(this.currentSignal);
        this.emitHistoryIfChanged(changed);

        const outcome = classifyPlayResult(this.currentSignal);
        if (outcome) {
          this.emit('play_result', {
            outcome,
            signal: this.currentSignal,
            alert: buildPlayResultAlert(this.currentSignal, outcome),
          });
        }
      } else {
        this.upsertHistorySignal(this.currentSignal);
      }
    }

    this.emit('signal', this.currentSignal);
    this.emitState();
  }

  enrichSignal(signal) {
    const sb = scoreboardStore.getScoreboard();
    const assertividade = sb.winRate;
    const meetsTarget = sb.meetsTarget === true;
    const bet = resolveSignalBet(signal);

    return {
      ...signal,
      bet: signal.bet || bet,
      entry_bet: signal.entry_bet || bet,
      bet_recommendation: signal.bet_recommendation || bet,
      ia_assertividade: assertividade,
      meets_assertivity_target: meetsTarget,
      confidence: meetsTarget ? assertividade : signal.confidence ?? null,
    };
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
