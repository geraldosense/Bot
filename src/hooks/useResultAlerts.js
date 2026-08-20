import { useCallback } from 'react';
import { useSignalAlerts } from './useSignalAlerts';
import { resolveAlertOutcome } from '../utils/playResult';
import { reconcileHistorySignal } from '../utils/signalResult';

/** Alertas obrigatórios de GREEN/RED — play_result + fallback via histórico */
export function useResultAlerts(options = {}) {
  const { onSnapshot: onSnapshotProp } = options;
  const { alert, showAlert, dismiss, seedSeen } = useSignalAlerts({ enabled: true });

  const handleSnapshot = useCallback(
    (data) => {
      const ids = (data.history || []).map((s) => s.id);
      if (data.rawSignal?.signal_status === 'result' && data.rawSignal?.id) {
        ids.push(data.rawSignal.id);
      }
      seedSeen(ids);
      onSnapshotProp?.(data);
    },
    [seedSeen, onSnapshotProp],
  );

  const handlePlayResult = useCallback(
    (payload) => {
      showAlert(payload);
    },
    [showAlert],
  );

  const handleHistory = useCallback(
    (history) => {
      const latest = history?.[0];
      if (!latest?.id) return;
      const normalized = reconcileHistorySignal({ ...latest, signal_status: 'result' });
      const outcome = resolveAlertOutcome(normalized);
      if (!outcome) return;
      showAlert({ signal: normalized, outcome });
    },
    [showAlert],
  );

  return {
    alert,
    dismiss,
    handlePlayResult,
    handleHistory,
    handleSnapshot,
  };
}
