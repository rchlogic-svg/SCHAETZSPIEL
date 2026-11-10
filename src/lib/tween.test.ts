import { describe, expect, it, vi } from 'vitest';
import { createSignal, easeOutCubic, easeOutQuint, progressAt } from './tween';

describe('Easing-Kurven', () => {
  it.each([
    ['easeOutCubic', easeOutCubic],
    ['easeOutQuint', easeOutQuint],
  ] as const)('%s beginnt bei 0, endet bei 1 und steigt stetig', (_name, ease) => {
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
    let previous = 0;
    for (let t = 0.05; t <= 1; t += 0.05) {
      const value = ease(t);
      expect(value).toBeGreaterThan(previous);
      previous = value;
    }
  });

  it('bremst zum Ende hin ab', () => {
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
    expect(easeOutQuint(0.5)).toBeGreaterThan(easeOutCubic(0.5));
  });
});

describe('progressAt', () => {
  const linear = (t: number) => t;

  it('bleibt während der Verzögerung bei 0', () => {
    expect(progressAt(0, 1000, 300, linear)).toBe(0);
    expect(progressAt(300, 1000, 300, linear)).toBe(0);
  });

  it('läuft danach gleichmäßig bis 1', () => {
    expect(progressAt(800, 1000, 300, linear)).toBeCloseTo(0.5, 10);
    expect(progressAt(1300, 1000, 300, linear)).toBe(1);
    expect(progressAt(5000, 1000, 300, linear)).toBe(1);
  });

  it('springt bei Dauer 0 direkt ans Ende', () => {
    expect(progressAt(1, 0)).toBe(1);
    expect(progressAt(0, 0)).toBe(0);
  });
});

describe('createSignal', () => {
  it('speichert den Wert und benachrichtigt Beobachter', () => {
    const signal = createSignal(0);
    const listener = vi.fn();
    const unsubscribe = signal.subscribe(listener);

    signal.set(0.4);
    expect(signal.get()).toBe(0.4);
    expect(listener).toHaveBeenCalledWith(0.4);

    unsubscribe();
    signal.set(1);
    expect(signal.get()).toBe(1);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
