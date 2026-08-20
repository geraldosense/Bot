import { useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useResultAlerts } from '../hooks/useResultAlerts';
import BacBoAIPanel from '../components/BacBoAIPanel';
import SignalHistory from '../components/SignalHistory';
import SignalResultAlert from '../components/SignalResultAlert';
import BottomNav from '../components/BottomNav';

/** Página dedicada do robô — só abre via botão no Dashboard */
export default function BacBo() {
  const { alert, dismiss, handlePlayResult, handleHistory, handleSnapshot } = useResultAlerts();

  const { connected, snapshot, refreshHistory } = useWebSocket({
    onPlayResult: handlePlayResult,
    onHistory: handleHistory,
    onSnapshot: handleSnapshot,
  });

  useEffect(() => {
    if (!connected) return;
    refreshHistory();
    const timer = setInterval(refreshHistory, 15000);
    return () => clearInterval(timer);
  }, [connected, refreshHistory]);

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

        <SignalHistory
          history={snapshot.history}
          scoreboard={snapshot.scoreboard}
          variant="robot"
          title="Histórico de Entradas"
          limit={500}
          defaultExpanded
          showVerMais={false}
          maxHeight={520}
          live={connected && snapshot.casinoConnected}
        />
      </div>
      <BottomNav />
    </div>
  );
}
