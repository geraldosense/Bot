import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Wifi, WifiOff } from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';
import BacBoAIPanel from '../components/BacBoAIPanel';
import HistoryGrid from '../components/HistoryGrid';
import SignalHistory from '../components/SignalHistory';
import BottomNav from '../components/BottomNav';
import SenseBotLogo from '../components/SenseBotLogo';
import GameCard from '../components/GameCard';
import ScoreboardCards from '../components/ScoreboardCards';
import DailyProfitSimulator from '../components/DailyProfitSimulator';
import { normalizeScoreboard } from '../utils/scoreboard';

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

const PLACEHOLDER_SCORE = normalizeScoreboard();

export default function Dashboard() {
  const { connected, snapshot, forceAnalyze } = useWebSocket();
  const [selectedGame, setSelectedGame] = React.useState(GAMES[0]);
  const [category, setCategory] = React.useState('all');
  const [tab, setTab] = React.useState('sinais');

  const showMonitoring = snapshot.monitoring ?? !snapshot.signal;
  const activeSignal = snapshot.rawSignal || snapshot.signal;
  const isLiveGame = selectedGame.type === 'bacbo' && !selectedGame.disabled;

  const displayScoreboard = useMemo(
    () => (isLiveGame ? snapshot.scoreboard : PLACEHOLDER_SCORE),
    [isLiveGame, snapshot.scoreboard],
  );

  const maxGales = activeSignal?.gales ?? 2;

  const filteredGames = GAMES.filter(
    (g) => category === 'all' || g.category === category,
  );

  return (
    <div className="min-h-screen bg-zinc-950 pb-28">
      {/* Header */}
      <div
        className="relative overflow-hidden py-5 px-4 shadow-xl border-b border-purple-500/20"
        style={{
          background: 'linear-gradient(135deg, #6366F1, #8B5CF6, #6366F1)',
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.12),transparent_55%)]" />
        <div className="max-w-4xl mx-auto flex items-center justify-between relative">
          <div className="flex items-center">
            <SenseBotLogo variant="header" className="h-20 w-20 sm:h-24 sm:w-24" />
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                connected
                  ? 'bg-green-500/20 text-green-300 border border-green-500/40'
                  : 'bg-red-500/20 text-red-300 border border-red-500/40'
              }`}
            >
              {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {connected ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* Placar do casino seleccionado — estável, IA moneytix */}
        <ScoreboardCards
          scoreboard={displayScoreboard}
          variant="dashboard"
          gameName={selectedGame.name}
          live={isLiveGame}
        />

        <DailyProfitSimulator
          scoreboard={displayScoreboard}
          maxGales={maxGales}
          disabled={!isLiveGame}
        />

        {/* Game selector */}
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
                onSelect={setSelectedGame}
              />
            ))}
          </div>
        </div>

        {/* Tabs */}
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

        {/* Content */}
        {tab === 'sinais' && isLiveGame && (
          <div className="space-y-4">
            <BacBoAIPanel
              signal={activeSignal}
              showMonitoring={showMonitoring}
              rounds={snapshot.rounds}
              scoreboard={displayScoreboard}
              casinoConnected={snapshot.casinoConnected}
              compact
            />

            <div className="flex gap-2">
              <Link
                to="/BacBo"
                className="flex-1 text-center py-3 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-opacity"
                style={{
                  background: 'linear-gradient(135deg, #14532D, #052E16)',
                  boxShadow: '0 4px 16px rgba(20, 83, 45, 0.4)',
                }}
              >
                Abrir Bac Bo Completo →
              </Link>
              <button
                onClick={forceAnalyze}
                className="px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-300 text-sm font-bold hover:bg-zinc-700 transition-colors"
              >
                Analisar
              </button>
            </div>
          </div>
        )}

        {tab === 'sinais' && !isLiveGame && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center">
            <p className="text-zinc-400 text-sm">
              A IA para <span className="text-white font-bold">{selectedGame.name}</span> estará
              disponível em breve.
            </p>
            <p className="text-zinc-600 text-xs mt-2">
              Seleccione Bac Bo para sinais ao vivo da mesa Evolution.
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

        {tab === 'historico' && isLiveGame && <SignalHistory history={snapshot.history} />}

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
