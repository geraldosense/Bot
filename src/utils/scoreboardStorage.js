import { normalizeScoreboard } from './scoreboard';

const PREFIX = 'sensebot_scoreboard_';

export function loadScoreboard(gameId) {
  try {
    const raw = localStorage.getItem(`${PREFIX}${gameId}`);
    if (!raw) return null;
    return normalizeScoreboard(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveScoreboard(gameId, scoreboard) {
  try {
    localStorage.setItem(`${PREFIX}${gameId}`, JSON.stringify(normalizeScoreboard(scoreboard)));
  } catch {
    /* ignore quota */
  }
}

export function scoreboardFromSignal(signal) {
  if (!signal) return null;

  const greens = Number(signal.scoreboard_green);
  const reds = Number(signal.scoreboard_red);
  if (!Number.isFinite(greens) || !Number.isFinite(reds)) return null;

  const total = greens + reds;
  const winRateRaw = Number(signal.win_rate);

  return {
    greens,
    reds,
    winRate: Number.isFinite(winRateRaw)
      ? Math.round(winRateRaw)
      : total
        ? Math.round((greens / total) * 100)
        : 0,
  };
}
