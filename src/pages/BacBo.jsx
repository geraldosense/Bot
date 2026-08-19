import { useWebSocket } from '../hooks/useWebSocket';
import BacBoAIPanel from '../components/BacBoAIPanel';
import BottomNav from '../components/BottomNav';

/** Página dedicada do robô — só abre via botão no Dashboard */
export default function BacBo() {
  const { connected, snapshot } = useWebSocket();

  const showMonitoring = snapshot.monitoring ?? !snapshot.signal;
  const activeSignal = snapshot.rawSignal || snapshot.signal;

  return (
    <div
      className="min-h-screen pb-28"
      style={{
        background: 'radial-gradient(ellipse at 50% 0%, #0A1F0A 0%, #050505 50%, #000 100%)',
      }}
    >
      <div className="max-w-lg mx-auto px-3 pt-3">
        <BacBoAIPanel
          signal={activeSignal}
          showMonitoring={showMonitoring}
          rounds={snapshot.rounds}
          scoreboard={snapshot.scoreboard}
          casinoConnected={snapshot.casinoConnected}
          wsConnected={connected}
        />
      </div>
      <BottomNav />
    </div>
  );
}
