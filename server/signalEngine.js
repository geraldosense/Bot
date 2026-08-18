import { shouldShowMonitoring } from './casinoDataProvider.js';
import { OUTCOMES } from './analyzer.js';

/**
 * Motor de sinais — usa APENAS dados reais do casino (Evolution Bac Bo).
 * Não gera entradas aleatórias nem simuladas.
 */
export class SignalEngine {
  constructor(broadcast) {
    this.broadcast = broadcast;
    this.rounds = [];
    this.currentSignal = null;
    this.signalHistory = [];
    this.scoreboard = { greens: 0, reds: 0 };
    this.state = 'idle';
    this.casinoConnected = false;
    this.dataSource = 'evolution_casino';
  }

  emit(type, data) {
    this.broadcast({ type, data, timestamp: new Date().toISOString() });
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

  getScoreboard() {
    const fromSignal = this.getScoreboardFromSignal(this.currentSignal);
    if (fromSignal) {
      this.scoreboard = { greens: fromSignal.greens, reds: fromSignal.reds };
      return fromSignal;
    }

    const { greens, reds } = this.scoreboard;
    const total = greens + reds;
    return {
      greens,
      reds,
      winRate: total ? Math.round((greens / total) * 100) : 0,
      gameId: 'bac_bo',
      source: 'internal',
    };
  }

  /** Totais da IA moneytix — scoreboard_green / scoreboard_red no sinal Supabase */
  getScoreboardFromSignal(signal) {
    if (!signal) return null;

    const greens = Number(signal.scoreboard_green);
    const reds = Number(signal.scoreboard_red);
    if (!Number.isFinite(greens) || !Number.isFinite(reds)) return null;

    const total = greens + reds;
    if (total === 0 && signal.signal_status !== 'result') return null;

    const winRateRaw = Number(signal.win_rate);
    return {
      greens,
      reds,
      winRate: Number.isFinite(winRateRaw)
        ? Math.round(winRateRaw)
        : total
          ? Math.round((greens / total) * 100)
          : 0,
      gameId: 'bac_bo',
      source: 'casino_ia',
    };
  }

  /** Sincroniza placar com a IA do casino em cada poll */
  syncScoreboardFromSignal(signal, prevStatus) {
    if (!signal) return;

    const fromCasino = this.getScoreboardFromSignal(signal);
    if (fromCasino && fromCasino.greens + fromCasino.reds > 0) {
      this.scoreboard = { greens: fromCasino.greens, reds: fromCasino.reds };
      return;
    }

    if (signal.signal_status === 'result' && prevStatus !== 'result') {
      if (signal.result === 'green') this.scoreboard.greens++;
      else if (signal.result === 'loss') this.scoreboard.reds++;
    }
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
    this.syncScoreboardFromSignal(signal, prevStatus);
    this.currentSignal = signal;

    if (signal.signal_status === 'result' && prevStatus !== 'result') {
      this.signalHistory.unshift({ ...signal });
      if (this.signalHistory.length > 50) this.signalHistory.pop();
      this.emit('history', this.signalHistory);
    }

    this.emit('signal', { ...signal, scoreboard: this.getScoreboard() });
    this.emitState();
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

  /** Apenas re-sincroniza — nunca inventa sinal */
  forceAnalyze() {
    this.emit('refresh_requested', { at: new Date().toISOString() });
  }
}
