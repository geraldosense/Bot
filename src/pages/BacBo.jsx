import { useWebSocket } from '../hooks/useWebSocket';
import BacBoAIPanel from '../components/BacBoAIPanel';
import HistoryGrid from '../components/HistoryGrid';
import SignalHistory from '../components/SignalHistory';
import BottomNav from '../components/BottomNav';

export default function BacBo() {
  const { snapshot } = useWebSocket();

  const showMonitoring = snapshot.monitoring ?? !snapshot.signal;
  const activeSignal = snapshot.rawSignal || snapshot.signal;
  const casinoLive = snapshot.casinoConnected;

  return (
    <div
      className="min-h-screen pb-28"
      style={{
        background: 'radial-gradient(ellipse at 50% 0%, #0A1F0A 0%, #050505 50%, #000 100%)',
      }}
    >
      <div className="max-w-lg mx-auto px-3 pt-3 space-y-4">
        {/* Painel IA — design profissional */}
        <BacBoAIPanel
          signal={activeSignal}
          showMonitoring={showMonitoring}
          rounds={snapshot.rounds}
          scoreboard={snapshot.scoreboard}
          casinoConnected={casinoLive}
        />

        {/* Catalogador */}
        <div
          className="rounded-2xl p-4 border border-white/5"
          style={{ background: 'rgba(15, 23, 42, 0.6)' }}
        >
          <HistoryGrid rounds={snapshot.rounds} compact />
        </div>

        <SignalHistory history={snapshot.history} />
      </div>
      <BottomNav />
    </div>
  );
}
