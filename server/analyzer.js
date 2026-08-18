/**
 * Motor de análise Bac Bo — analisa histórico e gera previsões
 * Outcomes: Player (Azul/Jogador), Banker (Vermelho/Banca), Tie (Empate)
 */

export const OUTCOMES = {
  Player: { key: 'Player', label: 'JOGADOR', color: 'blue', emoji: '🔵', bet: 'AZUL' },
  Banker: { key: 'Banker', label: 'BANCA', color: 'red', emoji: '🔴', bet: 'VERMELHO' },
  Tie: { key: 'Tie', label: 'EMPATE', color: 'yellow', emoji: '🟡', bet: 'EMPATE' },
};

export function normalizeOutcome(raw) {
  if (!raw) return null;
  const s = String(raw).toLowerCase();
  if (s.includes('player') || s.includes('jogador') || s.includes('azul') || s.includes('playerwon') || s === 'p') return 'Player';
  if (s.includes('banker') || s.includes('banca') || s.includes('vermelho') || s.includes('bankerwon') || s === 'b') return 'Banker';
  if (s.includes('tie') || s.includes('empate') || s === 't') return 'Tie';
  return null;
}

function countRecent(rounds, n = 20) {
  const slice = rounds.slice(0, n);
  return {
    Player: slice.filter((r) => r.outcome === 'Player').length,
    Banker: slice.filter((r) => r.outcome === 'Banker').length,
    Tie: slice.filter((r) => r.outcome === 'Tie').length,
    total: slice.length,
  };
}

function getStreak(rounds) {
  if (!rounds.length) return { outcome: null, length: 0 };
  const first = rounds[0].outcome;
  if (first === 'Tie') return { outcome: null, length: 0 };
  let length = 0;
  for (const r of rounds) {
    if (r.outcome === first) length++;
    else if (r.outcome !== 'Tie') break;
  }
  return { outcome: first, length };
}

function getLastNonTie(rounds) {
  for (const r of rounds) {
    if (r.outcome !== 'Tie') return r.outcome;
  }
  return null;
}

/** Estratégia 1: Reversão após streak longa */
function strategyStreakReversal(rounds) {
  const streak = getStreak(rounds);
  if (streak.length >= 3 && streak.outcome) {
    const opposite = streak.outcome === 'Player' ? 'Banker' : 'Player';
    const confidence = Math.min(95, 70 + streak.length * 5);
    return {
      bet: opposite,
      confidence,
      strategy: 'streak_reversal',
      reason: `Sequência de ${streak.length}x ${OUTCOMES[streak.outcome].label} — reversão esperada`,
    };
  }
  return null;
}

/** Estratégia 2: Maioria recente (momentum) */
function strategyMomentum(rounds) {
  const counts = countRecent(rounds, 15);
  if (counts.total < 10) return null;
  const nonTie = counts.Player + counts.Banker;
  if (nonTie < 8) return null;
  const playerPct = counts.Player / nonTie;
  const bankerPct = counts.Banker / nonTie;
  if (playerPct >= 0.65) {
    return {
      bet: 'Player',
      confidence: Math.round(72 + playerPct * 20),
      strategy: 'momentum',
      reason: `Momentum AZUL: ${counts.Player}/${nonTie} nos últimos ${counts.total} rounds`,
    };
  }
  if (bankerPct >= 0.65) {
    return {
      bet: 'Banker',
      confidence: Math.round(72 + bankerPct * 20),
      strategy: 'momentum',
      reason: `Momentum VERMELHO: ${counts.Banker}/${nonTie} nos últimos ${counts.total} rounds`,
    };
  }
  return null;
}

/** Estratégia 3: Alternância (zig-zag) */
function strategyAlternation(rounds) {
  const nonTie = rounds.filter((r) => r.outcome !== 'Tie').slice(0, 6);
  if (nonTie.length < 4) return null;
  let alternating = true;
  for (let i = 1; i < nonTie.length; i++) {
    if (nonTie[i].outcome === nonTie[i - 1].outcome) {
      alternating = false;
      break;
    }
  }
  if (alternating) {
    const last = nonTie[0].outcome;
    const next = last === 'Player' ? 'Banker' : 'Player';
    return {
      bet: next,
      confidence: 78,
      strategy: 'alternation',
      reason: 'Padrão alternado detectado — continuação zig-zag',
    };
  }
  return null;
}

/** Estratégia 4: Dominância fraca (após empate) */
function strategyPostTie(rounds) {
  if (rounds[0]?.outcome !== 'Tie') return null;
  const afterTie = rounds.slice(1).find((r) => r.outcome !== 'Tie');
  if (!afterTie) return null;
  return {
    bet: afterTie.outcome,
    confidence: 75,
    strategy: 'post_tie',
    reason: 'Após EMPATE, seguir tendência imediata',
    tieProtection: true,
  };
}

/** Estratégia 5: Underdog (menos frequente nos últimos N) */
function strategyUnderdog(rounds) {
  const counts = countRecent(rounds, 20);
  const nonTie = counts.Player + counts.Banker;
  if (nonTie < 12) return null;
  const diff = Math.abs(counts.Player - counts.Banker);
  if (diff >= 6) {
    const underdog = counts.Player < counts.Banker ? 'Player' : 'Banker';
    return {
      bet: underdog,
      confidence: Math.min(88, 68 + diff * 2),
      strategy: 'underdog',
      reason: `Underdog ${OUTCOMES[underdog].label}: desequilíbrio ${counts.Player}P / ${counts.Banker}B`,
    };
  }
  return null;
}

const STRATEGIES = [
  strategyStreakReversal,
  strategyMomentum,
  strategyAlternation,
  strategyPostTie,
  strategyUnderdog,
];

export function analyze(rounds, minConfidence = 72) {
  if (!rounds || rounds.length < 5) {
    return { shouldSignal: false, reason: 'Histórico insuficiente' };
  }

  const signals = STRATEGIES.map((fn) => fn(rounds)).filter(Boolean);
  if (!signals.length) {
    return { shouldSignal: false, reason: 'Nenhum padrão identificado' };
  }

  signals.sort((a, b) => b.confidence - a.confidence);
  const best = signals[0];
  const consensus = signals.filter((s) => s.bet === best.bet);
  const avgConfidence = Math.round(
    consensus.reduce((sum, s) => sum + s.confidence, 0) / consensus.length
  );
  const boostedConfidence = Math.min(95, avgConfidence + (consensus.length - 1) * 3);

  if (boostedConfidence < minConfidence) {
    return { shouldSignal: false, reason: `Confiança baixa (${boostedConfidence}%)` };
  }

  const lastColor = getLastNonTie(rounds);
  const entryCondition = lastColor ? OUTCOMES[lastColor].emoji : '🟡';

  return {
    shouldSignal: true,
    bet: best.bet,
    betRecommendation: OUTCOMES[best.bet].bet,
    confidence: boostedConfidence,
    strategy: best.strategy,
    reason: best.reason,
    strategies: consensus.map((s) => s.strategy),
    entryCondition,
    tieProtection: best.tieProtection ?? boostedConfidence >= 80,
    gales: boostedConfidence >= 85 ? 1 : 2,
    lastOutcome: lastColor,
  };
}

export function validateSignal(signal, actualOutcome) {
  const normalized = normalizeOutcome(actualOutcome);
  if (!normalized) return { result: 'pending' };
  if (normalized === 'Tie') {
    return signal.tieProtection
      ? { result: 'green', resultValue: 'EMPATE — proteção ativa' }
      : { result: 'loss', resultValue: 'EMPATE' };
  }
  if (normalized === signal.bet) {
    return { result: 'green', resultValue: OUTCOMES[normalized].label };
  }
  return { result: 'loss', resultValue: OUTCOMES[normalized].label };
}
