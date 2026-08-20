/** Resolve a cor de entrada do robô a partir dos campos do casino / sinal */

function mapBetRecommendation(rec) {
  if (!rec) return null;
  const s = String(rec).toUpperCase();
  if (s.includes('AZUL') || s.includes('JOGADOR') || s === 'PLAYER') return 'Player';
  if (s.includes('VERMELHO') || s.includes('BANCA') || s.includes('CASA') || s === 'BANKER') {
    return 'Banker';
  }
  if (s.includes('EMPATE') || s === 'TIE') return 'Tie';
  if (rec === 'Player' || rec === 'Banker' || rec === 'Tie') return rec;
  return null;
}

function parseBetFromText(raw) {
  if (!raw) return null;
  const text = String(raw);
  const upper = text.toUpperCase();
  if (text.includes('🔵') || upper.includes('AZUL') || upper.includes('JOGADOR')) return 'Player';
  if (text.includes('🔴') || upper.includes('VERMELHO') || upper.includes('BANCA') || upper.includes('CASA')) {
    return 'Banker';
  }
  if (text.includes('🟡') || upper.includes('EMPATE') || upper.includes('TIE')) return 'Tie';
  return null;
}

export function parseOutcomeZone(value) {
  if (value == null || value === '') return null;
  const raw = String(value).trim();
  const upper = raw.toUpperCase();

  if (raw.includes('🔵') || upper.includes('AZUL') || upper.includes('JOGADOR') || upper === 'PLAYER') {
    return 'player';
  }
  if (
    raw.includes('🔴') ||
    upper.includes('VERMELHO') ||
    upper.includes('BANCA') ||
    upper.includes('CASA') ||
    upper === 'BANKER'
  ) {
    return 'banker';
  }
  if (raw.includes('🟡') || upper.includes('EMPATE') || upper === 'TIE') {
    return 'tie';
  }
  if (raw === 'Player') return 'player';
  if (raw === 'Banker') return 'banker';
  if (raw === 'Tie') return 'tie';
  return null;
}

/** Aposta do robô — só campos de recomendação IA (nunca sequence/raw_text) */
export function resolveEntryBet(rowOrSignal) {
  if (!rowOrSignal) return null;

  const candidates = [
    rowOrSignal.entry_bet,
    rowOrSignal.bet,
    rowOrSignal.bet_recommendation,
    rowOrSignal.bet_safe,
    rowOrSignal.analysis?.bet,
    rowOrSignal.analysis?.betRecommendation,
  ];

  for (const value of candidates) {
    const bet = mapBetRecommendation(value) || parseBetFromText(value);
    if (bet) return bet;
  }

  return null;
}

export function resolveSignalBet(rowOrSignal) {
  return resolveEntryBet(rowOrSignal);
}

function betToZone(bet) {
  if (!bet) return null;
  if (bet === 'Player') return 'player';
  if (bet === 'Banker') return 'banker';
  if (bet === 'Tie') return 'tie';
  return parseOutcomeZone(bet);
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

function resolveOutcomeZone(signal) {
  return (
    parseOutcomeZone(signal?.result_value) ||
    parseOutcomeZone(signal?.actual_outcome)
  );
}

/** Alinha green/loss com a cor apostada vs cor que saiu na mesa */
export function reconcileSignalResult(signal) {
  if (!signal || signal.signal_status !== 'result') return signal;

  const betZone = betToZone(resolveSignalBet(signal));
  const outcomeZone = resolveOutcomeZone(signal);
  let result = parseResultFlag(signal);

  if (!result && betZone && outcomeZone) {
    if (betZone === outcomeZone) {
      result = 'green';
    } else if (outcomeZone === 'tie' && betZone !== 'tie') {
      result = 'loss';
    } else if (betZone !== outcomeZone) {
      result = 'loss';
    }
  }

  if (!result) {
    result = parseResultFlag(signal) || 'loss';
  }

  return {
    ...signal,
    result,
    bet: signal.bet || resolveSignalBet(signal),
    entry_bet: signal.entry_bet || signal.bet || resolveSignalBet(signal),
    actual_outcome: outcomeZone || signal.actual_outcome,
  };
}

export function mergeSignalRecords(primary, secondary) {
  if (!secondary) return reconcileSignalResult(primary);
  if (!primary) return reconcileSignalResult(secondary);

  const bet = resolveEntryBet(primary) || resolveEntryBet(secondary);

  const merged = {
    ...primary,
    ...secondary,
    bet: primary.bet || primary.entry_bet || secondary.bet || bet,
    entry_bet: primary.entry_bet || secondary.entry_bet || bet,
    bet_recommendation:
      primary.bet_recommendation ||
      secondary.bet_recommendation ||
      primary.bet_safe ||
      secondary.bet_safe,
    bet_safe: primary.bet_safe || secondary.bet_safe,
    sequence: primary.sequence || secondary.sequence,
    entry_condition: primary.entry_condition || secondary.entry_condition,
    result: secondary.result ?? primary.result,
    result_value: secondary.result_value ?? primary.result_value,
    current_gale: secondary.current_gale ?? primary.current_gale,
    gales: secondary.gales ?? primary.gales,
    created_date: secondary.created_date || primary.created_date,
  };

  return reconcileSignalResult(merged);
}

export function historyFingerprint(signal) {
  if (!signal) return '';
  const bet = resolveSignalBet(signal) || '';
  const ts = signal.created_date || signal.criado_em || '';
  const sec = ts ? Math.floor(new Date(ts).getTime() / 1000) : 0;
  return `${String(signal.id)}|${sec}|${signal.result || ''}|${bet}`;
}
