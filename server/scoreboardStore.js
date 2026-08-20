import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { todayKey } from './dayKey.js';
import {
  MAX_GALES,
  classifyPlayResult,
  calcWinRate,
  calcTotalsFromPlays,
} from './playResult.js';
import { resolveEntryBet, reconcileSignalResult } from './signalBet.js';
import { senseSpotStore } from './senseSpotStore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'play-history.json');

function emptyDay() {
  return { plays: [], casinoTotals: null };
}

function buildPayload(greens, reds, _winRate, source, playsToday, updatedAt, gameId) {
  const g = Math.max(0, Number(greens) || 0);
  const r = Math.max(0, Number(reds) || 0);
  const wr = calcWinRate(g, r);
  return {
    greens: g,
    reds: r,
    winRate: wr,
    meetsTarget: wr >= 90 && g + r >= 1,
    gameId,
    source,
    playsToday,
    updatedAt,
    live: true,
  };
}

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(HISTORY_FILE)) {
    fs.writeFileSync(
      HISTORY_FILE,
      JSON.stringify({ version: 1, games: {} }, null, 2),
    );
  }
}

function readStore() {
  ensureStore();
  try {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  } catch {
    return { version: 1, games: {} };
  }
}

function writeStore(data) {
  ensureStore();
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2));
}

/**
 * Histórico persistente — fonte única no servidor.
 * Totais IA do casino têm prioridade; nunca regredir para contagem parcial.
 */
export class ScoreboardStore {
  constructor(gameId = 'bac_bo') {
    this.gameId = gameId;
    this.store = readStore();
    this.stableTotals = null;
    this.pendingEntry = null;
    if (!this.store.games[gameId]) {
      this.store.games[gameId] = { days: {} };
    }
    this.loadStableFromDisk();
  }

  /** Bloqueia aposta quando o robô confirma entrada (cor exacta do painel) */
  recordEntryIntent(signal) {
    if (!signal?.id) return;
    if (!['confirmed', 'gale_update'].includes(signal.signal_status)) return;

    const bet = resolveEntryBet(signal);
    if (!bet) return;

    this.pendingEntry = {
      signalId: String(signal.id),
      entry_bet: bet,
      bet_recommendation: signal.bet_recommendation || signal.bet_safe || bet,
      sequence: signal.sequence || null,
      entry_condition: signal.entry_condition || null,
      gales: Number(signal.gales) || MAX_GALES,
      tie_protection: signal.tie_protection ?? false,
      lockedAt: signal.created_date || new Date().toISOString(),
    };
  }

  consumePendingEntry() {
    const entry = this.pendingEntry;
    this.pendingEntry = null;
    return entry;
  }

  loadStableFromDisk() {
    const day = todayKey();
    const bucket = this.store.games[this.gameId]?.days[day];
    const casino = bucket?.casinoTotals;
    if (casino && casino.greens + casino.reds > 0) {
      this.stableTotals = { ...casino };
      return;
    }
    const fromPlays = this.totalsFromPlays(day);
    if (fromPlays.greens + fromPlays.reds > 0) {
      this.stableTotals = { ...fromPlays };
    }
  }

  persist() {
    writeStore(this.store);
  }

  dayBucket(day = todayKey()) {
    const game = this.store.games[this.gameId];
    if (!game.days[day]) game.days[day] = emptyDay();
    return game.days[day];
  }

  recordPlay(signal) {
    if (!signal?.id || signal.signal_status !== 'result') return false;

    const reconciled = reconcileSignalResult({ ...signal, signal_status: 'result' });
    let classified = classifyPlayResult(reconciled);
    if (!classified) {
      const r = String(reconciled.result || '').toLowerCase();
      if (r === 'green') classified = 'green';
      else if (r === 'loss' || r === 'red') classified = 'loss';
      else return false;
    }

    const at = reconciled.created_date || reconciled.criado_em || new Date().toISOString();
    const day = todayKey(new Date(at));
    const bucket = this.dayBucket(day);

    const existingIdx = bucket.plays.findIndex((p) => p.id === String(reconciled.id));
    const maxGales = Number.isFinite(Number(reconciled.gales)) ? Number(reconciled.gales) : MAX_GALES;

    const pending =
      this.pendingEntry?.signalId === String(reconciled.id) ? this.pendingEntry : null;
    const existing = existingIdx >= 0 ? bucket.plays[existingIdx] : null;
    const bet =
      existing?.entry_bet ||
      pending?.entry_bet ||
      resolveEntryBet(reconciled);

    if (!bet) return false;

    const entry = {
      id: String(reconciled.id),
      result: classified,
      bet,
      entry_bet: bet,
      bet_recommendation:
        pending?.bet_recommendation ||
        reconciled.bet_recommendation ||
        reconciled.bet_safe ||
        bet,
      sequence: reconciled.sequence || pending?.sequence || null,
      entry_condition: reconciled.entry_condition || pending?.entry_condition || null,
      result_value: reconciled.result_value || reconciled.actual_outcome || null,
      raw_message: reconciled.raw_message || reconciled.raw_text || null,
      scoreboard_green: Number(reconciled.scoreboard_green) || 0,
      scoreboard_red: Number(reconciled.scoreboard_red) || 0,
      win_rate: reconciled.win_rate ?? null,
      tie_protection: reconciled.tie_protection ?? pending?.tie_protection ?? false,
      gale: Number(reconciled.current_gale) || 0,
      maxGales,
      at,
      source: 'sense_spot',
    };

    if (existingIdx >= 0) {
      const prev = bucket.plays[existingIdx];
      bucket.plays[existingIdx] = {
        ...entry,
        entry_bet: prev.entry_bet || entry.entry_bet,
        bet: prev.bet || entry.bet,
        bet_recommendation: prev.bet_recommendation || entry.bet_recommendation,
      };
      bucket.plays.sort((a, b) => new Date(a.at) - new Date(b.at));
      this.persist();
      senseSpotStore.savePlay(bucket.plays[existingIdx]).catch(() => {});
      this.consumePendingEntry();
      return false;
    }

    bucket.plays.push(entry);

    bucket.plays.sort((a, b) => new Date(a.at) - new Date(b.at));
    this.persist();
    senseSpotStore.savePlay(entry).catch(() => {});
    this.consumePendingEntry();
    return true;
  }

  async loadSenseSpotToday() {
    const plays = await senseSpotStore.listToday();
    const day = todayKey();
    const bucket = this.dayBucket(day);

    for (const signal of plays) {
      const idx = bucket.plays.findIndex((p) => p.id === String(signal.id));
      const entry = {
        id: String(signal.id),
        result: signal.result,
        bet: signal.entry_bet || signal.bet,
        entry_bet: signal.entry_bet || signal.bet,
        bet_recommendation: signal.bet_recommendation || signal.entry_bet,
        sequence: signal.sequence,
        entry_condition: signal.entry_condition,
        result_value: signal.result_value,
        scoreboard_green: signal.scoreboard_green || 0,
        scoreboard_red: signal.scoreboard_red || 0,
        win_rate: signal.win_rate,
        tie_protection: signal.tie_protection,
        gale: signal.current_gale || 0,
        maxGales: signal.gales || MAX_GALES,
        at: signal.created_date,
        source: 'sense_spot',
      };
      if (idx >= 0) {
        const prev = bucket.plays[idx];
        bucket.plays[idx] = {
          ...entry,
          entry_bet: prev.entry_bet || entry.entry_bet,
          bet: prev.bet || entry.bet,
        };
      } else {
        bucket.plays.push(entry);
      }
    }

    bucket.plays.sort((a, b) => new Date(a.at) - new Date(b.at));
    this.persist();
    return bucket.plays;
  }

  /** Remove entradas importadas do feed externo (histórico errado) */
  purgeImportedPlays(day = todayKey()) {
    const bucket = this.dayBucket(day);
    const before = bucket.plays.length;
    bucket.plays = bucket.plays.filter((p) => p.source === 'sense_spot');
    if (bucket.plays.length !== before) {
      this.persist();
      console.log(
        `[sense-spot] Removidas ${before - bucket.plays.length} entradas importadas do feed externo`,
      );
    }
  }

  /** @deprecated — histórico vem do SenseSpot, não reimportar feed externo em massa */
  importPlays(signals = []) {
    let added = 0;
    for (const signal of signals) {
      if (this.recordPlay(signal)) added++;
    }
    return added;
  }

  syncCasinoTotals(casino) {
    if (!casino || casino.greens + casino.reds === 0) return;

    const day = todayKey();
    const bucket = this.dayBucket(day);
    bucket.casinoTotals = {
      greens: casino.greens,
      reds: casino.reds,
      winRate: calcWinRate(casino.greens, casino.reds),
      syncedAt: casino.updatedAt || new Date().toISOString(),
    };
    this.stableTotals = { ...bucket.casinoTotals };
    this.persist();
  }

  totalsFromPlays(day = todayKey()) {
    const bucket = this.store.games[this.gameId]?.days[day] || emptyDay();
    return calcTotalsFromPlays(bucket.plays);
  }

  getPlays(day = todayKey()) {
    return this.dayBucket(day).plays;
  }

  getSignalMeta(signalId) {
    if (!signalId) return null;
    const day = todayKey();
    const bucket = this.store.games[this.gameId]?.days[day];
    if (!bucket) return null;
    const play = bucket.plays.find((p) => p.id === String(signalId));
    if (!play) return null;

    return {
      id: play.id,
      bet: play.bet,
      entry_bet: play.entry_bet,
      bet_recommendation: play.bet_recommendation,
      sequence: play.sequence,
      entry_condition: play.entry_condition,
      result_value: play.result_value,
      raw_message: play.raw_message,
      scoreboard_green: play.scoreboard_green,
      scoreboard_red: play.scoreboard_red,
      win_rate: play.win_rate,
      tie_protection: play.tie_protection,
      current_gale: play.gale,
      gales: play.maxGales,
      result: play.result,
      created_date: play.at,
      signal_status: 'result',
    };
  }

  getScoreboard() {
    const day = todayKey();
    const bucket = this.dayBucket(day);
    const casino = bucket.casinoTotals;

    if (casino && casino.greens + casino.reds > 0) {
      this.stableTotals = { ...casino };
      return buildPayload(
        casino.greens,
        casino.reds,
        casino.winRate,
        'casino_ia',
        bucket.plays.length,
        casino.syncedAt,
        this.gameId,
      );
    }

    if (this.stableTotals && this.stableTotals.greens + this.stableTotals.reds > 0) {
      return buildPayload(
        this.stableTotals.greens,
        this.stableTotals.reds,
        this.stableTotals.winRate,
        'casino_ia',
        bucket.plays.length,
        this.stableTotals.syncedAt || new Date().toISOString(),
        this.gameId,
      );
    }

    const fromPlays = this.totalsFromPlays(day);
    if (fromPlays.greens + fromPlays.reds > 0) {
      return buildPayload(
        fromPlays.greens,
        fromPlays.reds,
        fromPlays.winRate,
        'history',
        bucket.plays.length,
        bucket.plays.at(-1)?.at || null,
        this.gameId,
      );
    }

    return buildPayload(0, 0, 0, 'history', 0, null, this.gameId);
  }
}

export const scoreboardStore = new ScoreboardStore('bac_bo');
