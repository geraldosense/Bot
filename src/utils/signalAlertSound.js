let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  return audioCtx;
}

export function unlockAlertSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
}

function playTone({ frequency, duration, type = 'sine', gain = 0.12, delay = 0 }) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const vol = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  vol.gain.setValueAtTime(0, start);
  vol.gain.linearRampToValueAtTime(gain, start + 0.02);
  vol.gain.exponentialRampToValueAtTime(0.001, start + duration);

  osc.connect(vol);
  vol.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

export function playWinAlertSound() {
  unlockAlertSound();
  playTone({ frequency: 523, duration: 0.12, gain: 0.1 });
  playTone({ frequency: 659, duration: 0.12, gain: 0.1, delay: 0.1 });
  playTone({ frequency: 784, duration: 0.18, gain: 0.12, delay: 0.2 });
}

export function playLossAlertSound() {
  unlockAlertSound();
  playTone({ frequency: 220, duration: 0.25, type: 'triangle', gain: 0.14 });
  playTone({ frequency: 165, duration: 0.35, type: 'triangle', gain: 0.12, delay: 0.18 });
}

export function vibrateForOutcome(outcome) {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  if (outcome === 'green') navigator.vibrate([80, 40, 120, 40, 180]);
  else if (outcome === 'loss') navigator.vibrate([200, 80, 200, 80, 300]);
}
