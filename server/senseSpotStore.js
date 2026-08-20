/**
 * SenseSpot — histórico persistente do robô Sense Bot (base própria).
 * Usa SUPABASE_URL + service_role (mesmo projecto das contas, tabela separada).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isSupabaseConfigured } from './auth/supabaseClient.js';
import { todayKey, dayStartIso } from './dayKey.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const FILE = path.join(DATA_DIR, 'sense-spot-plays.json');
const TABLE = 'sense_spot_plays';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_KEY ||
  '';

function headers(extra = {}) {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE)) {
    fs.writeFileSync(FILE, JSON.stringify({ version: 1, plays: [] }, null, 2));
  }
}

function readFilePlays() {
  ensureFile();
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8')).plays || [];
  } catch {
    return [];
  }
}

function writeFilePlays(plays) {
  ensureFile();
  fs.writeFileSync(FILE, JSON.stringify({ version: 1, plays }, null, 2));
}

function rowToPlay(row) {
  if (!row) return null;
  return {
    id: row.signal_id,
    signal_id: row.signal_id,
    game_id: row.game_id || 'bac_bo',
    result: row.result,
    entry_bet: row.entry_bet,
    bet: row.entry_bet,
    bet_recommendation: row.bet_recommendation || row.entry_bet,
    result_value: row.result_value,
    sequence: row.sequence,
    entry_condition: row.entry_condition,
    current_gale: row.current_gale ?? 0,
    gales: row.max_gales ?? 3,
    tie_protection: row.tie_protection ?? false,
    scoreboard_green: row.scoreboard_green ?? 0,
    scoreboard_red: row.scoreboard_red ?? 0,
    win_rate: row.win_rate,
    created_date: row.played_at,
    signal_status: 'result',
    source: 'sense_spot',
  };
}

function playToRow(play, gameId = 'bac_bo') {
  return {
    signal_id: String(play.id || play.signal_id),
    game_id: gameId,
    result: play.result,
    entry_bet: play.entry_bet || play.bet,
    bet_recommendation: play.bet_recommendation || play.entry_bet || play.bet,
    result_value: play.result_value || null,
    sequence: play.sequence || null,
    entry_condition: play.entry_condition || null,
    current_gale: Number(play.gale ?? play.current_gale) || 0,
    max_gales: Number(play.maxGales ?? play.gales) || 3,
    tie_protection: !!play.tie_protection,
    scoreboard_green: Number(play.scoreboard_green) || 0,
    scoreboard_red: Number(play.scoreboard_red) || 0,
    win_rate: play.win_rate ?? null,
    played_at: play.at || play.created_date || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

class SenseSpotStore {
  constructor(gameId = 'bac_bo') {
    this.gameId = gameId;
    this.mode = 'file';
    this.ready = false;
    this.cache = [];
  }

  async init() {
    if (this.ready) return this.mode;

    if (isSupabaseConfigured()) {
      const ping = await this.pingTable();
      if (ping.ok) {
        this.mode = 'supabase';
        this.ready = true;
        await this.migrateFileToSupabase();
        console.log('[sense-spot] Histórico SenseSpot activo — Supabase');
        return this.mode;
      }
      console.warn(`[sense-spot] Tabela sense_spot_plays indisponível (${ping.reason}) — ficheiro local`);
    }

    this.mode = 'file';
    this.ready = true;
    return this.mode;
  }

  async pingTable() {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/${TABLE}?select=signal_id&limit=1`,
        { headers: headers(), signal: AbortSignal.timeout(10000) },
      );
      if (res.status === 404 || res.status === 406) return { ok: false, reason: 'table_missing' };
      if (!res.ok) return { ok: false, reason: 'error', detail: await res.text() };
      return { ok: true };
    } catch (err) {
      return { ok: false, reason: 'network', detail: err.message };
    }
  }

  async migrateFileToSupabase() {
    const local = readFilePlays();
    if (!local.length) return;
    const existing = await this.fetchTodayFromSupabase();
    if (existing.length > 0) return;
    for (const play of local) {
      await this.upsertSupabase(playToRow(play, this.gameId));
    }
    console.log(`[sense-spot] Migrados ${local.length} registos locais → Supabase`);
  }

  async upsertSupabase(row) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?on_conflict=signal_id`, {
      method: 'POST',
      headers: headers({ Prefer: 'resolution=merge-duplicates,return=minimal' }),
      body: JSON.stringify(row),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`SenseSpot upsert: ${res.status} ${(await res.text()).slice(0, 120)}`);
  }

  async fetchTodayFromSupabase() {
    const iso = dayStartIso();
    const url =
      `${SUPABASE_URL}/rest/v1/${TABLE}?game_id=eq.${this.gameId}` +
      `&played_at=gte.${encodeURIComponent(iso)}` +
      `&order=played_at.desc&select=*`;
    const res = await fetch(url, { headers: headers(), signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`SenseSpot list: ${res.status}`);
    const rows = await res.json();
    return rows.map(rowToPlay).filter(Boolean);
  }

  async savePlay(play) {
    await this.init();
    const row = playToRow(play, this.gameId);

    if (this.mode === 'supabase') {
      await this.upsertSupabase(row);
    } else {
      const plays = readFilePlays();
      const idx = plays.findIndex((p) => p.signal_id === row.signal_id);
      const entry = { ...row, signal_id: row.signal_id };
      if (idx >= 0) {
        const prev = plays[idx];
        plays[idx] = {
          ...entry,
          entry_bet: prev.entry_bet || entry.entry_bet,
          bet_recommendation: prev.bet_recommendation || entry.bet_recommendation,
        };
      } else {
        plays.push(entry);
      }
      writeFilePlays(plays);
    }

    const mapped = rowToPlay(row);
    const cacheIdx = this.cache.findIndex((p) => String(p.id) === String(mapped.id));
    if (cacheIdx >= 0) this.cache[cacheIdx] = { ...this.cache[cacheIdx], ...mapped };
    else this.cache.unshift(mapped);
    return mapped;
  }

  async listToday() {
    await this.init();
    if (this.mode === 'supabase') {
      this.cache = await this.fetchTodayFromSupabase();
      return this.cache;
    }
    const key = todayKey();
    this.cache = readFilePlays()
      .filter((p) => todayKey(new Date(p.played_at || p.at)) === key)
      .map((p) => rowToPlay({ ...p, signal_id: p.signal_id || p.id, played_at: p.played_at || p.at }))
      .filter(Boolean)
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    return this.cache;
  }
}

export const senseSpotStore = new SenseSpotStore('bac_bo');
