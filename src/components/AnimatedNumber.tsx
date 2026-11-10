import { useLayoutEffect, useRef } from 'react';
import { easeOutQuint, tween } from '../lib/tween';
import { useReducedMotion } from '../lib/useReducedMotion';

interface AnimatedNumberProps {
  value: number;
  format: (value: number) => string;
  /** Startwert beim ersten Anzeigen; ohne Angabe erscheint der Wert sofort. */
  from?: number;
  /** Dauer und Verzögerung in Millisekunden. */
  duration?: number;
  delay?: number;
  className?: string;
}

/**
 * Zählt weich zum neuen Wert, sobald sich `value` ändert.
 * Schreibt direkt in den Textknoten, damit pro Bild kein React-Render nötig ist.
 */
export function AnimatedNumber({ value, format, from, duration = 700, delay = 0, className }: AnimatedNumberProps) {
  const node = useRef<HTMLSpanElement>(null);
  const shown = useRef(from ?? value);
  const reduceMotion = useReducedMotion();

  useLayoutEffect(() => {
    const element = node.current;
    if (!element) return;

    const start = shown.current;
    if (reduceMotion || start === value) {
      shown.current = value;
      element.textContent = format(value);
      return;
    }

    element.textContent = format(Math.round(start));
    return tween({
      duration,
      delay,
      ease: easeOutQuint,
      onUpdate: (progress) => {
        shown.current = start + (value - start) * progress;
        element.textContent = format(Math.round(shown.current));
      },
      onComplete: () => {
        shown.current = value;
        element.textContent = format(value);
      },
    });
  }, [value, format, duration, delay, reduceMotion]);

  return <span ref={node} className={className} />;
}
