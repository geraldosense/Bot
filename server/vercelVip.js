import { SignalEngine } from './signalEngine.js';
import { CasinoDataProvider } from './casinoDataProvider.js';

let runtimePromise = null;
let lastSnapshot = null;
let lastSyncAt = 0;

export function getVipRuntime() {
  if (!runtimePromise) {
    runtimePromise = (async () => {
      const engine = new SignalEngine(() => {});
      const casino = new CasinoDataProvider({
        onRounds: (rounds, meta) => engine.setCasinoRounds(rounds, meta),
        onSignal: (signal) => engine.setCasinoSignal(signal),
        onStatus: (status) => engine.setCasinoStatus(status),
        onSyncScoreboard: (data) => engine.syncScoreboardData(data),
      });
      return { engine, casino };
    })();
  }
  return runtimePromise;
}

export async function runVipSync() {
  const now = Date.now();
  if (lastSnapshot && now - lastSyncAt < 2500) {
    return lastSnapshot;
  }

  const { engine, casino } = await getVipRuntime();
  await casino.sync({ light: true });
  lastSnapshot = engine.getSnapshot();
  lastSyncAt = Date.now();
  return lastSnapshot;
}

export async function getVipSnapshot() {
  if (lastSnapshot) return lastSnapshot;
  return runVipSync();
}
