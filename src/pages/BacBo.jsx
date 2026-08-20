import { useCallback } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useSignalAlerts } from '../hooks/useSignalAlerts';
import BacBoAIPanel from '../components/BacBoAIPanel';
import SignalHistory from '../components/SignalHistory';
import SignalResultAlert from '../components/SignalResultAlert';
import BottomNav from '../components/BottomNav';

/** Página dedicada do robô — só abre via botão no Dashboard */
export default function BacBo() {
  const { alert, showAlert, dismiss, seedSeen } = useSignalAlerts({ enabled: true });

  const handleSnapshot = useCallback(
    (data) => {
      const ids = (data.history || []).map((s) => s.id);
      if (data.rawSignal?.signal_status === 'result' && data.rawSignal?.id) {
        ids.push(data.rawSignal.id);
      }
      seedSeen(ids);
    },
    [seedSeen],
  );

  const { connected, snapshot } = useWebSocket({
    onPlayResult: showAlert,
    onSnapshot: handleSnapshot,
  });

  const showMonitoring = snapshot.monitoring ?? !snapshot.signal;
  const activeSignal = showMonitoring ? null : snapshot.signal;

  return (
    <div
      className="min-h-screen pb-28"
      style={{
        background: 'radial-gradient(ellipse at 50% 0%, #0A1F0A 0%, #050505 50%, #000 100%)',
      }}
    >
      <SignalResultAlert alert={alert} onDismiss={dismiss} />

      <div className="max-w-lg mx-auto px-3 pt-3 space-y-4">
        <BacBoAIPanel
          signal={activeSignal}
          showMonitoring={showMonitoring}
          rounds={snapshot.rounds}
          scoreboard={snapshot.scoreboard}
          casinoConnected={snapshot.casinoConnected}
          wsConnected={connected}
        />

        <SignalHistory history={snapshot.history} limit={12} />
      </div>
      <BottomNav />
    </div>
  );
}
