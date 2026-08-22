import { SignalEngine } from './signalEngine.js';
import { CasinoDataProvider } from './casinoDataProvider.js';
import { senseSpotStore } from './senseSpotStore.js';

let runtimePromise = null;
let dataReady = null;
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

async function ensureVipData() {
  if (!dataReady) {
    dataReady = (async () => {
      const { engine } = await getVipRuntime();
      await senseSpotStore.init();
      await engine.bootstrapHistory();
    })();
  }
  return dataReady;
}

export async function runVipSync() {
  const now = Date.now();
  if (lastSnapshot && now - lastSyncAt < 2500) {
    return lastSnapshot;
  }

  await ensureVipData();
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
