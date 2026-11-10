import { animate, useReducedMotion } from 'motion/react';
import { useLayoutEffect, useRef } from 'react';
import { setDigits } from './Digits';

interface AnimatedNumberProps {
  value: number;
  format: (value: number) => string;
  /** Startwert beim ersten Anzeigen; ohne Angabe erscheint der Wert sofort. */
  from?: number;
  duration?: number;
  delay?: number;
  /** Ziffern in gleich breiten Zellen – für große, zentrierte Zahlen. */
  fixedDigits?: boolean;
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
  fixedDigits = false,
  className,
}: AnimatedNumberProps) {
  const node = useRef<HTMLSpanElement>(null);
  const shown = useRef(from ?? value);
  const reduceMotion = useReducedMotion();

  useLayoutEffect(() => {
    const element = node.current;
    if (!element) return;

    const write = (text: string) => {
      if (fixedDigits) setDigits(element, text);
      else element.textContent = text;
    };

    const start = shown.current;
    if (reduceMotion || start === value) {
      shown.current = value;
      write(format(value));
      return;
    }

    write(format(Math.round(start)));
    const controls = animate(start, value, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        shown.current = latest;
        write(format(Math.round(latest)));
      },
      onComplete: () => {
        shown.current = value;
        write(format(value));
      },
    });
    return () => controls.stop();
  }, [value, format, duration, delay, fixedDigits, reduceMotion]);

  return <span ref={node} className={className} />;
}
