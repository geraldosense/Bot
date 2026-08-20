import { useCallback, useEffect, useRef, useState } from 'react';
import { resolveAlertOutcome } from '../utils/playResult';
import { getGaleResultLine, getAlertDisplayColor, reconcileHistorySignal } from '../utils/signalResult';
import { playWinAlertSound, playLossAlertSound, vibrateForOutcome, unlockAlertSound } from '../utils/signalAlertSound';

const ALERT_TTL_MS = 10000;

function buildAlertFromSignal(signal) {
  const normalized = reconcileHistorySignal({ ...signal, signal_status: 'result' });
  const outcome = resolveAlertOutcome(normalized);
  if (!outcome) return null;

  const isGreen = outcome === 'green';
  const color = getAlertDisplayColor(normalized, outcome);
  const attemptLine = getGaleResultLine(normalized);

  return {
    id: `${normalized.id}-${outcome}`,
    outcome,
    title: isGreen ? 'ACERTOU ✓' : 'PERDEU ✗',
    message: isGreen
      ? `Entrada confirmada — ${attemptLine.toLowerCase()}`
      : `Entrada perdida — ${attemptLine.toLowerCase()}`,
    sub: color
      ? isGreen
        ? `Cor acertada: ${color.emoji} ${color.label}`
        : `Apostou: ${color.emoji} ${color.label}`
      : isGreen
        ? 'Resultado GREEN confirmado pela mesa'
        : 'Resultado RED confirmado pela mesa',
    signal: normalized,
    at: Date.now(),
  };
}

export function useSignalAlerts({ enabled = true } = {}) {
  const [alert, setAlert] = useState(null);
  const seenRef = useRef(new Set());
  const timerRef = useRef(null);

  const seedSeen = useCallback((ids = []) => {
    for (const id of ids) {
      if (id) seenRef.current.add(String(id));
    }
  }, []);

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setAlert(null);
  }, []);

  const showAlert = useCallback(
    (payload) => {
      if (!enabled || !payload?.signal?.id) return;

      const key = String(payload.signal.id);
      if (seenRef.current.has(key)) return;
      seenRef.current.add(key);

      const built = payload.alert
        ? {
            id: key,
            outcome: payload.outcome || resolveAlertOutcome(payload.signal),
            title: payload.alert.title,
            message: payload.alert.message,
            sub: payload.alert.sub,
            signal: reconcileHistorySignal({
              ...payload.signal,
              signal_status: 'result',
            }),
            at: Date.now(),
          }
        : buildAlertFromSignal(payload.signal);

      if (!built || !built.outcome) return;

      setAlert(built);

      if (built.outcome === 'green') playWinAlertSound();
      else if (built.outcome === 'loss') playLossAlertSound();
      vibrateForOutcome(built.outcome);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setAlert(null), ALERT_TTL_MS);
    },
    [enabled],
  );

  useEffect(() => {
    if (!enabled) return undefined;

    const unlock = () => unlockAlertSound();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });

    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled]);

  return { alert, showAlert, dismiss, seedSeen };
}
