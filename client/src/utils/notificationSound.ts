/**
 * Joue un son de notification depuis le fichier audio.
 * Fichier: /sounds/notification.mp3 (fourni par l'utilisateur)
 */

let audio: HTMLAudioElement | null = null;

const getAudio = (): HTMLAudioElement => {
  if (!audio) {
    audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.5;
  }
  return audio;
};

export const playDing = () => {
  try {
    const a = getAudio();
    a.currentTime = 0;
    a.play().catch(() => {}); // Silencieux si bloqué par le navigateur
  } catch {
    // Ignorer
  }
};

/**
 * Joue le son seulement si les notifications sonores sont activées
 */
export const notifySound = (enabled: boolean) => {
  if (enabled) playDing();
};
