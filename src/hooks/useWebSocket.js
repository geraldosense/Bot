import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { normalizeScoreboard } from '../utils/scoreboard';
import { normalizeHistoryList } from '../utils/historyNormalize';

const GAME_ID = 'bac_bo';
const USE_POLLING = import.meta.env.VITE_SIGNAL_MODE === 'poll';

function getWsUrl(token) {
  const host = import.meta.env.DEV ? `${window.location.hostname}:3001` : window.location.host;
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${host}?token=${encodeURIComponent(token)}`;
}

/** Nunca regredir placar — só actualiza com totais iguais ou superiores da IA */
function applyServerScoreboard(ref, incoming) {
  if (!incoming) return ref.current;

  const next = normalizeScoreboard(incoming);
  const prev = ref.current;
  const prevTotal = prev.greens + prev.reds;
  const nextTotal = next.greens + next.reds;

  if (next.source === 'casino_ia' && nextTotal > 0) {
    ref.current = next;
    return next;
  }

  if (nextTotal >= prevTotal && nextTotal > 0) {
    ref.current = next;
    return next;
  }

  if (prevTotal > 0 && nextTotal < prevTotal) {
    return prev;
  }

  ref.current = next;
  return next;
}

export function useWebSocket(options = {}) {
  const { onPlayResult, onSnapshot, onHistory } = options;
  const onPlayResultRef = useRef(onPlayResult);
  const onSnapshotRef = useRef(onSnapshot);
  const onHistoryRef = useRef(onHistory);

  useEffect(() => {
    onPlayResultRef.current = onPlayResult;
    onSnapshotRef.current = onSnapshot;
    onHistoryRef.current = onHistory;
  }, [onPlayResult, onSnapshot, onHistory]);
  const { token, isVip } = useAuth();
  const wsRef = useRef(null);
  const scoreboardRef = useRef(normalizeScoreboard());
  const [connected, setConnected] = useState(false);
  const [snapshot, setSnapshot] = useState({
    state: 'idle',
    signal: null,
    rawSignal: null,
    monitoring: true,
    rounds: [],
    history: [],
    scoreboard: normalizeScoreboard(),
    casinoConnected: false,
    dataSource: 'evolution_casino',
    gameId: GAME_ID,
  });
  const [lastRound, setLastRound] = useState(null);
  const [lastSignal, setLastSignal] = useState(null);
  const reconnectRef = useRef(null);

  const patchSnapshot = useCallback((patch) => {
    setSnapshot((prev) => ({ ...prev, ...patch }));
  }, []);

  const applyScoreboard = useCallback((incoming) => {
    return applyServerScoreboard(scoreboardRef, incoming);
  }, []);

  useEffect(() => {
    if (!token || !isVip) return;

    fetch('/api/scoreboard', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          patchSnapshot({ scoreboard: applyScoreboard(data) });
        }
      })
      .catch(() => {});
  }, [token, isVip, applyScoreboard, patchSnapshot]);

  const applySnapshot = useCallback(
    (data) => {
      setSnapshot((prev) => ({
        ...data,
        signal: data.monitoring ? null : data.signal,
        history: normalizeHistoryList(data.history || []),
        scoreboard: applyScoreboard(data.scoreboard),
        gameId: GAME_ID,
      }));
      onSnapshotRef.current?.(data);
    },
    [applyScoreboard],
  );

  const pollSnapshot = useCallback(async () => {
    if (!token || !isVip) return;
    try {
      const res = await fetch('/api/snapshot', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setConnected(false);
        return;
      }
      const data = await res.json();
      setConnected(true);
      applySnapshot(data);
    } catch {
      setConnected(false);
    }
  }, [token, isVip, applySnapshot]);

  const connect = useCallback(() => {
    if (!token || !isVip) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(getWsUrl(token));
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
    };

    ws.onclose = () => {
      setConnected(false);
      reconnectRef.current = setTimeout(connect, 3000);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'auth_error') {
          setConnected(false);
          return;
        }

        switch (msg.type) {
          case 'snapshot':
            applySnapshot(msg.data);
            break;
          case 'state':
            setSnapshot((prev) => ({
              ...prev,
              state: msg.data.state,
              signal: msg.data.monitoring ? null : (msg.data.signal ?? prev.signal),
              monitoring: msg.data.monitoring ?? prev.monitoring,
              scoreboard: applyScoreboard(msg.data.scoreboard),
              casinoConnected: msg.data.casinoConnected ?? prev.casinoConnected,
            }));
            break;
          case 'round':
            setLastRound(msg.data);
            break;
          case 'rounds':
            patchSnapshot({ rounds: msg.data });
            break;
          case 'signal':
            setLastSignal(msg.data);
            setSnapshot((prev) => {
              const monitoring =
                msg.data?.signal_status === 'analyzing' ? true : prev.monitoring;
              return {
                ...prev,
                rawSignal: msg.data,
                monitoring,
                signal: monitoring ? null : msg.data,
              };
            });
            break;
          case 'play_result':
            onPlayResultRef.current?.(msg.data);
            break;
          case 'casino_status':
            setSnapshot((prev) => {
              const monitoring = msg.data.monitoring ?? prev.monitoring;
              return {
                ...prev,
                casinoConnected: msg.data.connected,
                monitoring,
                signal: monitoring ? null : (prev.rawSignal ?? prev.signal),
              };
            });
            break;
          case 'history':
            patchSnapshot({ history: normalizeHistoryList(msg.data || []) });
            onHistoryRef.current?.(msg.data);
            break;
          case 'scoreboard':
            patchSnapshot({ scoreboard: applyScoreboard(msg.data) });
            break;
          default:
            break;
        }
      } catch {
        /* ignore */
      }
    };
  }, [token, isVip, patchSnapshot, applyScoreboard, applySnapshot]);

  useEffect(() => {
    if (!token || !isVip) {
      wsRef.current?.close();
      setConnected(false);
      return;
    }

    if (USE_POLLING) {
      pollSnapshot();
      const timer = setInterval(pollSnapshot, 3000);
      return () => clearInterval(timer);
    }

    connect();
    const ping = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
    return () => {
      clearInterval(ping);
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, [connect, pollSnapshot, token, isVip]);

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const forceAnalyze = useCallback(async () => {
    if (USE_POLLING) {
      if (!token || !isVip) return;
      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.snapshot) applySnapshot(data.snapshot);
        }
      } catch {
        /* ignore */
      }
      return;
    }
    send({ type: 'force_analyze' });
  }, [send, token, isVip, applySnapshot]);

  const refreshHistory = useCallback(async () => {
    if (!token || !isVip) return;
    try {
      const res = await fetch('/api/signals', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      patchSnapshot({
        history: normalizeHistoryList(data.history || []),
        scoreboard: applyScoreboard(data.scoreboard),
        monitoring: data.monitoring ?? undefined,
      });
    } catch {
      /* ignore */
    }
  }, [token, isVip, patchSnapshot, applyScoreboard]);

  return { connected, snapshot, lastRound, lastSignal, forceAnalyze, refreshHistory };
}

export function formatTime(dateStr) {
  if (!dateStr) return '--:--';
  try {
    return new Date(dateStr).toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '--:--';
  }
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

const OUTCOME_MAP = {
  Player: { label: 'AZUL', color: 'bg-blue-500', text: 'text-blue-300', emoji: '🔵' },
  Banker: { label: 'VERMELHO', color: 'bg-red-500', text: 'text-red-300', emoji: '🔴' },
  Tie: { label: 'EMPATE', color: 'bg-yellow-500', text: 'text-yellow-300', emoji: '🟡' },
};

export function getOutcomeInfo(outcome) {
  return OUTCOME_MAP[outcome] || { label: outcome, color: 'bg-zinc-500', text: 'text-zinc-300', emoji: '⚪' };
}

export function parseBet(betRecommendation) {
  const s = (betRecommendation || '').toUpperCase();
  if (s.includes('AZUL') || s.includes('JOGADOR')) return 'player';
  if (s.includes('VERMELHO') || s.includes('BANCA')) return 'banker';
  if (s.includes('EMPATE') || s.includes('TIE')) return 'tie';
  return null;
}
