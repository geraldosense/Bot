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
import { resolveSignalBet } from './signalBet.js';

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
 * Totais moneytix têm prioridade; nunca regredir para contagem parcial.
 */
export class ScoreboardStore {
  constructor(gameId = 'bac_bo') {
    this.gameId = gameId;
    this.store = readStore();
    this.stableTotals = null;
    if (!this.store.games[gameId]) {
      this.store.games[gameId] = { days: {} };
    }
    this.loadStableFromDisk();
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
    if (!signal?.id) return false;

    const classified = classifyPlayResult(signal);
    if (!classified) return false;

    const at = signal.created_date || signal.criado_em || new Date().toISOString();
    const day = todayKey(new Date(at));
    const bucket = this.dayBucket(day);

    const existingIdx = bucket.plays.findIndex((p) => p.id === String(signal.id));
    const maxGales = Number.isFinite(Number(signal.gales)) ? Number(signal.gales) : MAX_GALES;
    const bet = resolveSignalBet(signal) || signal.bet_recommendation || signal.bet || null;

    const entry = {
      id: String(signal.id),
      result: classified,
      bet,
      entry_bet: signal.entry_bet || signal.bet || bet,
      bet_recommendation: signal.bet_recommendation || signal.bet || bet,
      sequence: signal.sequence || null,
      entry_condition: signal.entry_condition || null,
      gale: Number(signal.current_gale) || 0,
      maxGales,
      at,
    };

    if (existingIdx >= 0) {
      bucket.plays[existingIdx] = { ...bucket.plays[existingIdx], ...entry };
      bucket.plays.sort((a, b) => new Date(a.at) - new Date(b.at));
      this.persist();
      return false;
    }

    bucket.plays.push(entry);

    bucket.plays.sort((a, b) => new Date(a.at) - new Date(b.at));
    this.persist();
    return true;
  }

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
