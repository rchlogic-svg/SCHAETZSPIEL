import { formatDeviation, formatPoints } from './format';
import type { Rating, RoundResult } from './types';

export const RATING_LABEL: Record<Rating, string> = {
  perfect: 'Volltreffer!',
  great: 'Ganz nah dran!',
  good: 'Gut geschätzt!',
  ok: 'Nicht schlecht',
  far: 'Da geht noch was',
  miss: 'Weit daneben',
};

const RATING_SQUARE: Record<Rating, string> = {
  perfect: '🎯',
  great: '🟩',
  good: '🟩',
  ok: '🟨',
  far: '🟧',
  miss: '🟥',
};

/** Beschreibt in Worten, wie weit und in welche Richtung die Schätzung danebenlag. */
export function describeDeviation(result: RoundResult): string {
  if (result.direction === 'exact') return 'Auf den Punkt genau';
  const side = result.direction === 'low' ? 'zu niedrig' : 'zu hoch';
  return `${formatDeviation(result.deviation)} ${side}`;
}

/** Text zum Teilen des Ergebnisses – eine Zeile Farbfelder wie bei Wortspielen. */
export function buildShareText(
  results: readonly RoundResult[],
  total: number,
  maxTotal: number,
  rankTitle: string,
): string {
  return [
    'Schätzspiel – Was kostet das?',
    `${formatPoints(total)} von ${formatPoints(maxTotal)} Punkten · ${rankTitle}`,
    results.map((result) => RATING_SQUARE[result.rating]).join(''),
    'Schaffst du mehr?',
  ].join('\n');
}
