import { useCallback, useEffect, useRef, useState } from 'react';
import { classifyPlayResult } from '../utils/playResult';
import { getGaleResultLine } from '../utils/signalResult';
import { playWinAlertSound, playLossAlertSound, vibrateForOutcome, unlockAlertSound } from '../utils/signalAlertSound';

const ALERT_TTL_MS = 6000;

function buildAlertFromSignal(signal) {
  const outcome = classifyPlayResult(signal);
  if (!outcome) return null;

  const isGreen = outcome === 'green';
  return {
    id: `${signal.id}-${outcome}`,
    outcome,
    title: isGreen ? 'ACERTOU' : 'PERDEU',
    message: getGaleResultLine(signal),
    sub: isGreen
      ? 'Entrada confirmada pela IA'
      : 'Errou na entrada e nos 3 gales',
    signal,
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
            outcome: payload.outcome,
            title: payload.alert.title,
            message: payload.alert.message,
            sub: payload.alert.sub,
            signal: payload.signal,
            at: Date.now(),
          }
        : buildAlertFromSignal(payload.signal);

      if (!built) return;

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
