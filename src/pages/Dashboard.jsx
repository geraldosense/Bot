import React, { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wifi, WifiOff } from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useResultAlerts } from '../hooks/useResultAlerts';
import HistoryGrid from '../components/HistoryGrid';
import SignalHistory from '../components/SignalHistory';
import SignalResultAlert from '../components/SignalResultAlert';
import BottomNav from '../components/BottomNav';
import GameCard from '../components/GameCard';
import DailyScoreboardPanel from '../components/DailyScoreboardPanel';
import MemberDashboard from '../components/MemberDashboard';
import SiteHeader from '../components/SiteHeader';
import { useAuth } from '../context/AuthContext';
import { normalizeScoreboard, formatWinRate } from '../utils/scoreboard';

const GAMES = [
  {
    id: 'bac-bo',
    name: 'Bac Bo',
    image: '/games/bac-bo.png',
    path: '/BacBo',
    type: 'bacbo',
    category: 'Cartas',
    confidence: '95%',
    hot: true,
  },
  {
    id: 'football-studio',
    name: 'Football Studio Dice',
    image: '/games/football-studio.png',
    path: '#',
    type: 'football',
    category: 'Cartas',
    confidence: '92%',
    hot: true,
    disabled: true,
  },
  {
    id: 'aviator',
    name: 'Aviator',
    image: '/games/aviator.png',
    path: '#',
    type: 'aviator',
    category: 'Crash',
    confidence: '88%',
    hot: false,
    disabled: true,
  },
  {
    id: 'roulette',
    name: 'Roleta',
    image: '/games/roleta.png',
    path: '#',
    type: 'roulette',
    category: 'Roleta',
    confidence: '90%',
    hot: false,
    disabled: true,
  },
];

const CATEGORIES = ['all', 'Cartas', 'Crash', 'Roleta'];

export default function Dashboard() {
  const { user, isVip } = useAuth();

  if (!isVip) {
    return <MemberDashboard user={user} />;
  }

  return <VipDashboard />;
}

function VipDashboard() {
  const navigate = useNavigate();
  const { alert, dismiss, handlePlayResult, handleHistory, handleSnapshot } = useResultAlerts();
  const { connected, snapshot, refreshHistory } = useWebSocket({
    onPlayResult: handlePlayResult,
    onHistory: handleHistory,
    onSnapshot: handleSnapshot,
  });
  const [selectedGame, setSelectedGame] = React.useState(GAMES[0]);
  const [category, setCategory] = React.useState('all');
  const [tab, setTab] = React.useState('sinais');

  useEffect(() => {
    if (!connected) return undefined;
    if (tab !== 'sinais' && tab !== 'historico') return undefined;
    refreshHistory();
    const timer = setInterval(refreshHistory, 5000);
    return () => clearInterval(timer);
  }, [connected, tab, refreshHistory]);

  const handleGameSelect = (game) => {
    if (game.disabled) return;
    setSelectedGame(game);
    if (game.type === 'bacbo' && game.path) {
      navigate(game.path);
    }
  };

  const isLiveGame = selectedGame.type === 'bacbo' && !selectedGame.disabled;

  const displayScoreboard = useMemo(
    () => (isLiveGame ? snapshot.scoreboard : normalizeScoreboard()),
    [isLiveGame, snapshot.scoreboard],
  );

  const maxGales = snapshot.rawSignal?.gales ?? snapshot.signal?.gales ?? 3;

  const filteredGames = GAMES.filter(
    (g) => category === 'all' || g.category === category,
  );

  return (
    <div className="min-h-screen bg-zinc-950 pb-28">
      <SignalResultAlert alert={alert} onDismiss={dismiss} />

      <SiteHeader
        theme="vip"
        rightSlot={
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              connected
                ? 'bg-green-500/20 text-green-300 border border-green-500/40'
                : 'bg-zinc-700/40 text-zinc-400 border border-zinc-600/40'
            }`}
          >
            {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {connected ? 'Online' : 'Offline'}
          </div>
        }
      />

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        <DailyScoreboardPanel
          scoreboard={displayScoreboard}
          gameName={selectedGame.name}
          live={isLiveGame && connected && snapshot.casinoConnected}
          maxGales={maxGales}
          disabled={!isLiveGame}
        />

        <div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  category === cat
                    ? 'bg-purple-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {cat === 'all' ? 'Todos' : cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
            {filteredGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                selected={selectedGame.id === game.id}
                onSelect={handleGameSelect}
                opensRobot={game.type === 'bacbo' && !game.disabled}
                liveAssertivity={
                  game.type === 'bacbo' && displayScoreboard.meetsTarget
                    ? formatWinRate(displayScoreboard.winRate)
                    : null
                }
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2 bg-zinc-900/50 p-1 rounded-xl">
          {['sinais', 'catalogador', 'historico'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                tab === t
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t === 'sinais' ? 'Sinais' : t === 'catalogador' ? 'Catalogador' : 'Histórico'}
            </button>
          ))}
        </div>

        {tab === 'sinais' && isLiveGame && (
          <div className="space-y-4">
            <SignalHistory
              history={snapshot.history}
              scoreboard={snapshot.scoreboard}
              variant="robot"
              limit={12}
              live={connected && snapshot.casinoConnected}
            />

            <Link
              to="/BacBo"
              className="block w-full text-center py-3.5 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-opacity"
              style={{
                background: 'linear-gradient(135deg, #14532D, #052E16)',
                boxShadow: '0 4px 16px rgba(20, 83, 45, 0.4)',
              }}
            >
              Abrir robô do Bac Bo
            </Link>
          </div>
        )}

        {tab === 'sinais' && !isLiveGame && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center">
            <p className="text-zinc-400 text-sm">
              A IA para <span className="text-white font-bold">{selectedGame.name}</span> estará
              disponível em breve.
            </p>
            <p className="text-zinc-600 text-xs mt-2">
              Selecione Bac Bo para sinais ao vivo da mesa Evolution.
            </p>
          </div>
        )}

        {tab === 'catalogador' && isLiveGame && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <HistoryGrid rounds={snapshot.rounds} />
          </div>
        )}

        {tab === 'catalogador' && !isLiveGame && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center text-zinc-500 text-sm">
            Catalogador disponível apenas para Bac Bo.
          </div>
        )}

        {tab === 'historico' && isLiveGame && (
          <div className="space-y-4">
            <SignalHistory
              history={snapshot.history}
              scoreboard={snapshot.scoreboard}
              variant="robot"
              title="HISTÓRICO COMPLETO"
              limit={200}
              defaultExpanded
              showVerMais={false}
              maxHeight={640}
              live={connected && snapshot.casinoConnected}
            />
            <Link
              to="/BacBo"
              className="block w-full text-center py-3.5 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-opacity"
              style={{
                background: 'linear-gradient(135deg, #14532D, #052E16)',
                boxShadow: '0 4px 16px rgba(20, 83, 45, 0.4)',
              }}
            >
              Abrir robô do Bac Bo
            </Link>
          </div>
        )}

        {tab === 'historico' && !isLiveGame && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center text-zinc-500 text-sm">
            Histórico disponível apenas para Bac Bo.
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
