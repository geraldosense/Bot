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

export function resolveSignalBet(rowOrSignal) {
  if (!rowOrSignal) return null;

  const candidates = [
    rowOrSignal.entry_bet,
    rowOrSignal.bet,
    rowOrSignal.bet_recommendation,
    rowOrSignal.bet_safe,
    rowOrSignal.raw_text,
    rowOrSignal.raw_message,
  ];

  for (const value of candidates) {
    const bet = mapBetRecommendation(value) || parseBetFromText(value);
    if (bet) return bet;
  }

  return null;
}

export function mergeSignalRecords(primary, secondary) {
  if (!secondary) return primary;
  if (!primary) return secondary;

  const bet = resolveSignalBet(primary) || resolveSignalBet(secondary);

  return {
    ...primary,
    ...secondary,
    bet: primary.bet || secondary.bet || bet,
    entry_bet: primary.entry_bet || secondary.entry_bet || bet,
    bet_recommendation:
      primary.bet_recommendation || secondary.bet_recommendation || primary.bet_safe || secondary.bet_safe,
    bet_safe: primary.bet_safe || secondary.bet_safe,
    sequence: primary.sequence || secondary.sequence,
    entry_condition: primary.entry_condition || secondary.entry_condition,
    result: secondary.result ?? primary.result,
    result_value: secondary.result_value ?? primary.result_value,
    current_gale: secondary.current_gale ?? primary.current_gale,
    gales: secondary.gales ?? primary.gales,
    created_date: secondary.created_date || primary.created_date,
  };
}

export function historyFingerprint(signal) {
  if (!signal) return '';
  const bet = resolveSignalBet(signal) || '';
  const ts = signal.created_date || signal.criado_em || '';
  const sec = ts ? Math.floor(new Date(ts).getTime() / 1000) : 0;
  return `${String(signal.id)}|${sec}|${signal.result || ''}|${bet}`;
}
