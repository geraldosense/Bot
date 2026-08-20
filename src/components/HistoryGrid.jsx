import { useState } from 'react';
import { getOutcomeInfo } from '../hooks/useWebSocket';

export default function HistoryGrid({ rounds, compact = false }) {
  const [expanded, setExpanded] = useState(false);
  const sorted = [...(rounds || [])].sort(
    (a, b) => new Date(b.round_timestamp || b.timestamp || 0) - new Date(a.round_timestamp || a.timestamp || 0),
  );
  const display = expanded ? sorted : sorted.slice(0, compact ? 60 : 100);
  const cols = compact ? 12 : 10;
  const latestId = sorted[0]?.id;

  if (!sorted.length) {
    return (
      <div className="text-zinc-500 text-sm text-center py-8">
        Sem dados de histórico
      </div>
    );
  }

  const stats = {
    Player: sorted.filter((r) => r.outcome === 'Player').length,
    Banker: sorted.filter((r) => r.outcome === 'Banker').length,
    Tie: sorted.filter((r) => r.outcome === 'Tie').length,
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-white font-bold text-sm">CATALOGADOR</h4>
        <div className="flex gap-3 text-[10px]">
          <span className="text-blue-400">🔵 {stats.Player}</span>
          <span className="text-red-400">🔴 {stats.Banker}</span>
          <span className="text-yellow-400">🟡 {stats.Tie}</span>
        </div>
      </div>

      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {display.map((round, i) => {
          const info = getOutcomeInfo(round.outcome);
          const isLatest = round.id && round.id === latestId;
          return (
            <div
              key={round.id || i}
              title={`${info.label}${round.multiplier ? ` x${round.multiplier}` : ''}${isLatest ? ' · último' : ''}`}
              className={`aspect-square rounded-md ${info.color} flex items-center justify-center text-[8px] font-bold text-white/90 shadow-sm hover:scale-110 transition-transform cursor-default ${
                isLatest ? 'ring-2 ring-cyan-400/70 ring-offset-1 ring-offset-zinc-950' : ''
              }`}
              style={{
                boxShadow: `0 2px 8px ${info.color === 'bg-blue-500' ? '#2563EB40' : info.color === 'bg-red-500' ? '#DC262640' : '#CA8A0440'}`,
              }}
            >
              {round.multiplier ? `${round.multiplier}x` : ''}
            </div>
          );
        })}
      </div>

      {sorted.length > (compact ? 60 : 100) && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-center text-cyan-400 text-xs py-2 hover:text-cyan-300 transition-colors"
        >
          {expanded ? 'Mostrar menos' : `Ver todos (${sorted.length})`}
        </button>
      )}
    </div>
  );
}
