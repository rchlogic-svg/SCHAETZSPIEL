/**
 * Kleine Hilfen für Animationen, die sich nicht mit reinem CSS ausdrücken
 * lassen: das Hochzählen von Zahlen und die Enthüllung des echten Preises.
 * Alle Zeiten in Millisekunden.
 */

export type Easing = (t: number) => number;

/** Schneller Start, weiches Auslaufen. */
export const easeOutCubic: Easing = (t) => 1 - (1 - t) ** 3;

/** Wie easeOutCubic, bremst aber noch früher – gut für lange Zählstrecken. */
export const easeOutQuint: Easing = (t) => 1 - (1 - t) ** 5;

/** Fortschritt (0–1) einer Animation, `elapsed` Millisekunden nach dem Start. */
export function progressAt(elapsed: number, duration: number, delay = 0, ease: Easing = easeOutCubic): number {
  if (elapsed <= delay) return 0;
  if (duration <= 0 || elapsed >= delay + duration) return 1;
  return ease((elapsed - delay) / duration);
}

export interface TweenOptions {
  duration: number;
  delay?: number;
  ease?: Easing;
  onUpdate: (progress: number) => void;
  onComplete?: () => void;
}

/** Startet eine Animation von 0 nach 1. Der Rückgabewert bricht sie ab. */
export function tween({ duration, delay = 0, ease = easeOutCubic, onUpdate, onComplete }: TweenOptions): () => void {
  const start = performance.now();
  let frame = 0;
  let stopped = false;

  const step = (now: number) => {
    if (stopped) return;
    const elapsed = now - start;
    onUpdate(progressAt(elapsed, duration, delay, ease));
    if (elapsed >= delay + duration) {
      onComplete?.();
      return;
    }
    frame = requestAnimationFrame(step);
  };

  frame = requestAnimationFrame(step);
  return () => {
    stopped = true;
    cancelAnimationFrame(frame);
  };
}

/**
 * Ein Wert, den mehrere Stellen der Oberfläche beobachten können, ohne dass
 * React bei jeder Änderung neu rendern muss.
 */
export interface Signal {
  get(): number;
  set(value: number): void;
  subscribe(listener: (value: number) => void): () => void;
}

export function createSignal(initial = 0): Signal {
  let current = initial;
  const listeners = new Set<(value: number) => void>();
  return {
    get: () => current,
    set(value) {
      current = value;
      for (const listener of listeners) listener(value);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
