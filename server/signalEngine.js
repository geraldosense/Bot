import { shouldShowMonitoring } from './casinoDataProvider.js';
import { scoreboardStore } from './scoreboardStore.js';

/**
 * Motor de sinais — dados reais Evolution Bac Bo.
 * Placar = histórico persistente + sync moneytix (fonte única no servidor).
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

  mergeHistoryFromResults(results = []) {
    const seen = new Set(this.signalHistory.map((s) => String(s.id)));
    let added = false;

    for (const raw of results) {
      if (raw?.signal_status !== 'result' || !raw?.id) continue;
      const id = String(raw.id);
      if (seen.has(id)) continue;
      seen.add(id);
      this.signalHistory.push(this.enrichSignal(raw));
      added = true;
    }

    if (!added) return;

    this.signalHistory.sort(
      (a, b) => new Date(b.created_date) - new Date(a.created_date),
    );
    if (this.signalHistory.length > 50) {
      this.signalHistory = this.signalHistory.slice(0, 50);
    }
    this.emit('history', this.signalHistory);
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
      signal.entry_bet = signal.bet;
    }

    if (signal.signal_status === 'gale_update' && prev) {
      signal = {
        ...prev,
        ...signal,
        entry_bet: prev.entry_bet || prev.bet || signal.entry_bet || signal.bet,
        bet: prev.bet || signal.bet || prev.entry_bet,
        bet_recommendation: prev.bet_recommendation || signal.bet_recommendation,
        tie_protection: signal.tie_protection ?? prev.tie_protection,
        gales: signal.gales ?? prev.gales ?? 0,
        analysis: signal.analysis || prev.analysis,
      };
    }

    const prevStatus = prev?.signal_status;
    this.currentSignal = this.enrichSignal(signal);

    if (signal.signal_status === 'result') {
      scoreboardStore.recordPlay(this.currentSignal);

      if (prevStatus !== 'result') {
        this.signalHistory.unshift({ ...this.currentSignal });
        if (this.signalHistory.length > 50) this.signalHistory.pop();
        this.emit('history', this.signalHistory);
      }
    }

    this.emit('signal', this.currentSignal);
    this.emitState();
  }

  enrichSignal(signal) {
    const sb = scoreboardStore.getScoreboard();
    const assertividade = sb.winRate;
    const meetsTarget = sb.meetsTarget === true;

    return {
      ...signal,
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
