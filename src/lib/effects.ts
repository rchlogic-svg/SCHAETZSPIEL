import confetti from 'canvas-confetti';

const CONFETTI_COLORS = ['#ffd60a', '#ff7a59', '#34d399', '#38bdf8', '#ff6bb5', '#ffffff'];

/** Kurzes Vibrieren auf Geräten, die das unterstützen (z. B. Android). */
export function haptic(pattern: number | number[] = 10): void {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // Nicht verfügbar – dann eben ohne.
  }
}

/** Konfetti für Volltreffer und neue Bestwerte. Bei „Bewegung reduzieren“ bleibt es aus. */
export function celebrate(intensity: 'small' | 'big' = 'small'): void {
  const base = { colors: CONFETTI_COLORS, disableForReducedMotion: true, zIndex: 60 };
  if (intensity === 'small') {
    void confetti({ ...base, particleCount: 70, spread: 75, startVelocity: 38, origin: { y: 0.5 } });
    return;
  }
  void confetti({ ...base, particleCount: 90, spread: 70, angle: 60, origin: { x: 0, y: 0.75 } });
  void confetti({ ...base, particleCount: 90, spread: 70, angle: 120, origin: { x: 1, y: 0.75 } });
}
