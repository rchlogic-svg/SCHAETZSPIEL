import type { RoundResult } from './types';

export interface Highlights {
  /** Index der Runde mit der kleinsten Abweichung. */
  best: number;
  /** Index der Runde mit der größten Abweichung. */
  worst: number;
}

/**
 * Sucht die beiden bemerkenswertesten Runden eines Spiels heraus.
 * Gibt `null` zurück, wenn es nichts hervorzuheben gibt – bei weniger als
 * zwei Runden oder wenn alle Tipps gleich gut waren.
 */
export function pickHighlights(results: readonly RoundResult[]): Highlights | null {
  if (results.length < 2) return null;

  let best = 0;
  let worst = 0;
  results.forEach((result, index) => {
    if (result.deviation < results[best]!.deviation) best = index;
    if (result.deviation > results[worst]!.deviation) worst = index;
  });

  return best === worst ? null : { best, worst };
}
