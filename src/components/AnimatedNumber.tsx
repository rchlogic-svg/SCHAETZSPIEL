import { animate, useReducedMotion } from 'motion/react';
import { useLayoutEffect, useRef } from 'react';

interface AnimatedNumberProps {
  value: number;
  format: (value: number) => string;
  /** Startwert beim ersten Anzeigen; ohne Angabe erscheint der Wert sofort. */
  from?: number;
  duration?: number;
  delay?: number;
  className?: string;
}

/**
 * Zählt weich zum neuen Wert, sobald sich `value` ändert.
 * Schreibt direkt in den Textknoten, damit pro Frame kein React-Render nötig ist.
 */
export function AnimatedNumber({
  value,
  format,
  from,
  duration = 0.9,
  delay = 0,
  className,
}: AnimatedNumberProps) {
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
    const controls = animate(start, value, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        shown.current = latest;
        element.textContent = format(Math.round(latest));
      },
      onComplete: () => {
        shown.current = value;
        element.textContent = format(value);
      },
    });
    return () => controls.stop();
  }, [value, format, duration, delay, reduceMotion]);

  return <span ref={node} className={className} />;
}
