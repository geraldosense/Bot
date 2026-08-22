import { SignalEngine } from './signalEngine.js';
import { CasinoDataProvider } from './casinoDataProvider.js';
import { senseSpotStore } from './senseSpotStore.js';

let runtimePromise = null;
let dataReady = null;

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
  await ensureVipData();
  const { casino } = await getVipRuntime();
  await casino.sync();
}
