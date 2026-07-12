// Tiny sound-effect helper using the Web Audio API — no external assets.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, duration: number, type: OscillatorType = 'sine') {
  const ac = getCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t = ac.currentTime + start;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

/** Cheerful ascending chime. */
export function playCorrect() {
  tone(523.25, 0, 0.16); // C5
  tone(659.25, 0.1, 0.18); // E5
  tone(783.99, 0.22, 0.26); // G5
}

/** Gentle low "try again" — never harsh for kids. */
export function playWrong() {
  tone(311.13, 0, 0.22, 'triangle'); // Eb4
  tone(261.63, 0.14, 0.3, 'triangle'); // C4
}

/** Celebration flourish for finishing an activity / daily plan. */
export function playCheer() {
  tone(523.25, 0, 0.14);
  tone(659.25, 0.12, 0.14);
  tone(783.99, 0.24, 0.14);
  tone(1046.5, 0.36, 0.32);
}
