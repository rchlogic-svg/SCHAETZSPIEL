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

/**
 * Farbstimmung einer Bewertung. Die Oberfläche kennt nur drei Signalfarben –
 * getroffen, mittel, daneben –, damit Farbe eine klare Bedeutung behält.
 */
export type Tone = 'good' | 'mid' | 'off';

const RATING_TONE: Record<Rating, Tone> = {
  perfect: 'good',
  great: 'good',
  good: 'good',
  ok: 'mid',
  far: 'mid',
  miss: 'off',
};

export function toneFor(rating: Rating): Tone {
  return RATING_TONE[rating];
}

const NBSP = ' ';

function percentInWords(deviation: number): string {
  if (!Number.isFinite(deviation) || deviation > 9.99) return `mehr als 999${NBSP}%`;
  const percent = Math.round(deviation * 100);
  return percent === 0 ? `weniger als 1${NBSP}%` : `${percent}${NBSP}%`;
}

/**
 * Erklärt die Abweichung in einem ganzen Satz – genau so, wie sie gewertet wird.
 * Gemessen wird immer vom kleineren Wert aus: Bei einem zu niedrigen Tipp heißt
 * es deshalb „der echte Preis liegt x % über deinem Tipp“ und nicht „x % zu
 * niedrig“, was man leicht als Anteil des echten Preises missversteht.
 */
export function explainDeviation(result: RoundResult): string {
  if (result.direction === 'exact') return 'Du hast den Preis genau getroffen.';
  const amount = percentInWords(result.deviation);
  return result.direction === 'high'
    ? `Dein Tipp liegt ${amount} über dem echten Preis.`
    : `Der echte Preis liegt ${amount} über deinem Tipp.`;
}

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
