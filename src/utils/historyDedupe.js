/** @deprecated use normalizeHistoryList — mantido para compatibilidade */
import { normalizeHistoryList } from './historyNormalize';

export function dedupeHistorySignals(signals = []) {
  return normalizeHistoryList(signals);
}
