/**
 * Joue un son de notification (ding) via l'API Web Audio.
 * Ne nécessite aucun fichier externe.
 */

let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

export const playDing = () => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Son 1 : "ding" aigu (fréquence montante rapide)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(800, now);
    osc1.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Son 2 : "dong" grave (résonance)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(600, now + 0.05);
    osc2.frequency.exponentialRampToValueAtTime(400, now + 0.25);
    gain2.gain.setValueAtTime(0.15, now + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.05);
    osc2.stop(now + 0.4);
  } catch {
    // Silencieux si le navigateur bloque l'audio
  }
};

/**
 * Joue le ding seulement si les notifications sonores sont activées
 */
export const notifySound = (enabled: boolean) => {
  if (enabled) playDing();
};
