// Simple Text-To-Speech wrapper (Web Speech API) to read prompts aloud.
// Falls back silently when the browser has no speech synthesis.

let enabled = true;

export function speechAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function setSpeechEnabled(on: boolean) {
  enabled = on;
  if (!on) cancelSpeech();
}

export function isSpeechEnabled(): boolean {
  return enabled;
}

export function speak(text: string) {
  if (!enabled || !speechAvailable() || !text) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    u.rate = 0.95;
    u.pitch = 1.1;
    window.speechSynthesis.speak(u);
  } catch {
    /* ignore — TTS is a nice-to-have */
  }
}

export function cancelSpeech() {
  if (speechAvailable()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
  }
}
