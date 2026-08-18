import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { mergeScoreboard, normalizeScoreboard } from '../utils/scoreboard';
import { loadScoreboard, saveScoreboard, scoreboardFromSignal } from '../utils/scoreboardStorage';

const GAME_ID = 'bac_bo';

function getWsUrl(token) {
  const host = import.meta.env.DEV ? `${window.location.hostname}:3001` : window.location.host;
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${host}?token=${encodeURIComponent(token)}`;
}

function resolveScoreboard(ref, incoming) {
  const merged = mergeScoreboard(ref.current, incoming);
  ref.current = merged;
  saveScoreboard(GAME_ID, merged);
  return merged;
}

export function useWebSocket() {
  const { token, isVip } = useAuth();
  const wsRef = useRef(null);
  const scoreboardRef = useRef(loadScoreboard(GAME_ID) || normalizeScoreboard());
  const [connected, setConnected] = useState(false);
  const [snapshot, setSnapshot] = useState({
    state: 'idle',
    signal: null,
    rawSignal: null,
    monitoring: true,
    rounds: [],
    history: [],
    scoreboard: scoreboardRef.current,
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
            setSnapshot((prev) => ({
              ...msg.data,
              scoreboard: resolveScoreboard(
                scoreboardRef,
                msg.data.scoreboard || scoreboardFromSignal(msg.data.rawSignal),
              ),
              gameId: GAME_ID,
            }));
            break;
          case 'state':
            setSnapshot((prev) => ({
              ...prev,
              state: msg.data.state,
              signal: msg.data.signal ?? prev.signal,
              monitoring: msg.data.monitoring ?? prev.monitoring,
              scoreboard: resolveScoreboard(
                scoreboardRef,
                msg.data.scoreboard || scoreboardFromSignal(msg.data.signal),
              ),
              casinoConnected: msg.data.casinoConnected ?? prev.casinoConnected,
            }));
            break;
          case 'round':
            setLastRound(msg.data);
            break;
          case 'rounds':
            patchSnapshot({ rounds: msg.data });
            break;
          case 'signal': {
            const fromSignal =
              msg.data.scoreboard || scoreboardFromSignal(msg.data);
            setLastSignal(msg.data);
            setSnapshot((prev) => ({
              ...prev,
              rawSignal: msg.data,
              signal: msg.data,
              scoreboard: fromSignal
                ? resolveScoreboard(scoreboardRef, fromSignal)
                : prev.scoreboard,
            }));
            break;
          }
          case 'casino_status':
            setSnapshot((prev) => ({
              ...prev,
              casinoConnected: msg.data.connected,
              monitoring: msg.data.monitoring ?? prev.monitoring,
            }));
            break;
          case 'history':
            patchSnapshot({ history: msg.data });
            break;
          default:
            break;
        }
      } catch {
        /* ignore */
      }
    };
  }, [token, isVip, patchSnapshot]);

  useEffect(() => {
    if (!token || !isVip) {
      wsRef.current?.close();
      setConnected(false);
      return;
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
  }, [connect, token, isVip]);

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const forceAnalyze = useCallback(() => send({ type: 'force_analyze' }), [send]);

  return { connected, snapshot, lastRound, lastSignal, forceAnalyze };
}

export function formatTime(dateStr) {
  if (!dateStr) return '--:--';
  try {
    return new Date(dateStr).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '--:--';
  }
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleString('pt-BR', {
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
