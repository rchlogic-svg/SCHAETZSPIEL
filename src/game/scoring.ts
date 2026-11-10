import type { PictogramName } from '../data/pictograms';
import type { Direction, Rating, RoundResult } from './types';

/** Punkte für eine exakte Schätzung. */
export const MAX_POINTS = 1000;

/**
 * Abweichung, ab der es keine Punkte mehr gibt (2 = 200 %).
 * Dazwischen sinken die Punkte gleichmäßig: 1000 / 200 = 5 Punkte pro Prozent.
 */
export const ZERO_POINTS_DEVIATION = 2;

export const POINTS_PER_PERCENT = MAX_POINTS / (ZERO_POINTS_DEVIATION * 100);

/**
 * Prozentuale Abweichung zwischen Schätzung und echtem Preis, gemessen am
 * kleineren der beiden Werte. Dadurch zählen „halb so viel“ und „doppelt so
 * viel“ gleich (beide 100 %). Mit der üblichen Rechnung „Differenz / echter
 * Preis“ käme eine zu niedrige Schätzung nie über 100 % hinaus – wer immer
 * ganz links tippt, bekäme dann grundlos viele Punkte.
 */
export function deviation(guess: number, actual: number): number {
  if (!(guess > 0) || !(actual > 0)) return Number.POSITIVE_INFINITY;
  const high = Math.max(guess, actual);
  const low = Math.min(guess, actual);
  return high / low - 1;
}

/** Punkte sinken linear mit der Abweichung, von 1000 bis auf 0. */
export function pointsFor(dev: number): number {
  if (!Number.isFinite(dev)) return 0;
  const share = 1 - dev / ZERO_POINTS_DEVIATION;
  return Math.round(MAX_POINTS * Math.min(1, Math.max(0, share)));
}

const RATING_LIMITS: ReadonlyArray<readonly [Rating, number]> = [
  ['perfect', 0.05],
  ['great', 0.12],
  ['good', 0.3],
  ['ok', 0.6],
  ['far', 1.2],
];

export function ratingFor(dev: number): Rating {
  for (const [rating, limit] of RATING_LIMITS) {
    if (dev <= limit) return rating;
  }
  return 'miss';
}

/** Unterhalb dieser Abweichung gilt eine Schätzung als punktgenau. */
const EXACT_TOLERANCE = 0.0005;

export function directionFor(guess: number, actual: number): Direction {
  if (deviation(guess, actual) < EXACT_TOLERANCE) return 'exact';
  return guess < actual ? 'low' : 'high';
}

export function evaluate(guess: number, actual: number): RoundResult {
  const dev = deviation(guess, actual);
  return {
    guess,
    deviation: dev,
    direction: directionFor(guess, actual),
    points: pointsFor(dev),
    rating: ratingFor(dev),
  };
}

export function totalPoints(results: readonly RoundResult[]): number {
  return results.reduce((sum, result) => sum + result.points, 0);
}

export interface Rank {
  title: string;
  icon: PictogramName;
  line: string;
}

const RANKS: ReadonlyArray<readonly [number, Rank]> = [
  [0.9, { title: 'Preis-Orakel', icon: 'crystal-ball', line: 'Unheimlich. Arbeitest du heimlich im Einkauf?' }],
  [0.8, { title: 'Preis-Profi', icon: 'trophy', line: 'Dir macht an der Kasse so schnell niemand etwas vor.' }],
  [0.65, { title: 'Schnäppchenjäger', icon: 'target', line: 'Starkes Preisgefühl – da fehlt nicht mehr viel.' }],
  [0.5, { title: 'Solides Bauchgefühl', icon: 'thumb-up', line: 'Ordentlich! Mit etwas Übung geht da noch mehr.' }],
  [0.35, { title: 'Schätz-Azubi', icon: 'seedling', line: 'Der Anfang ist gemacht. Die nächste Runde wird besser.' }],
  [0, { title: 'Glücksritter', icon: 'dice', line: 'Mutig geschätzt! Probier es gleich noch einmal.' }],
];

/** Titel für das Gesamtergebnis, abhängig vom Anteil der erreichten Punkte. */
export function rankFor(total: number, rounds: number): Rank {
  const share = rounds > 0 ? total / (rounds * MAX_POINTS) : 0;
  for (const [limit, rank] of RANKS) {
    if (share >= limit) return rank;
  }
  return RANKS[RANKS.length - 1]![1];
}
