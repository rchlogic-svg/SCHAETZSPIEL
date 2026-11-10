import { describe, expect, it } from 'vitest';
import {
  MAX_POINTS,
  POINTS_PER_PERCENT,
  deviation,
  directionFor,
  evaluate,
  pointsFor,
  rankFor,
  ratingFor,
  totalPoints,
} from './scoring';

describe('deviation', () => {
  it('ist 0 bei exakter Schätzung', () => {
    expect(deviation(100, 100)).toBe(0);
  });

  it('bewertet halb so viel und doppelt so viel gleich', () => {
    expect(deviation(50, 100)).toBe(1);
    expect(deviation(200, 100)).toBe(1);
  });

  it('entspricht bei zu hoher Schätzung der üblichen Prozentrechnung', () => {
    expect(deviation(110, 100)).toBeCloseTo(0.1, 10);
    expect(deviation(150, 100)).toBeCloseTo(0.5, 10);
  });

  it('ist unendlich bei ungültigen Werten', () => {
    expect(deviation(0, 100)).toBe(Number.POSITIVE_INFINITY);
    expect(deviation(100, 0)).toBe(Number.POSITIVE_INFINITY);
    expect(deviation(Number.NaN, 100)).toBe(Number.POSITIVE_INFINITY);
  });
});

describe('pointsFor', () => {
  it('gibt die volle Punktzahl für einen Volltreffer', () => {
    expect(pointsFor(0)).toBe(MAX_POINTS);
  });

  it('zieht pro Prozent Abweichung gleich viele Punkte ab', () => {
    expect(POINTS_PER_PERCENT).toBe(5);
    expect(pointsFor(0.01)).toBe(995);
    expect(pointsFor(0.1)).toBe(950);
    expect(pointsFor(0.5)).toBe(750);
    expect(pointsFor(1.5)).toBe(250);
  });

  it('sinkt gleichmäßig: gleiche Schritte kosten überall gleich viel', () => {
    const steps = [0, 0.2, 0.4, 0.6, 0.8, 1, 1.2, 1.4, 1.6, 1.8, 2].map(pointsFor);
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i - 1]! - steps[i]!).toBe(100);
    }
  });

  it('gibt bei Faktor 2 noch die halbe Punktzahl – nicht null', () => {
    expect(evaluate(200, 100).points).toBe(500);
    expect(evaluate(50, 100).points).toBe(500);
  });

  it('erreicht erst bei 200 % Abweichung (Faktor 3) null Punkte', () => {
    expect(pointsFor(1.99)).toBeGreaterThan(0);
    expect(pointsFor(2)).toBe(0);
    expect(evaluate(300, 100).points).toBe(0);
  });

  it('wird nie negativ und nie größer als das Maximum', () => {
    expect(pointsFor(50)).toBe(0);
    expect(pointsFor(Number.POSITIVE_INFINITY)).toBe(0);
    expect(pointsFor(-1)).toBe(MAX_POINTS);
  });
});

describe('ratingFor', () => {
  it('ordnet Abweichungen den Stufen zu', () => {
    expect(ratingFor(0)).toBe('perfect');
    expect(ratingFor(0.05)).toBe('perfect');
    expect(ratingFor(0.1)).toBe('great');
    expect(ratingFor(0.25)).toBe('good');
    expect(ratingFor(0.5)).toBe('ok');
    expect(ratingFor(1)).toBe('far');
    expect(ratingFor(1.5)).toBe('miss');
  });
});

describe('directionFor', () => {
  it('erkennt zu niedrig, zu hoch und punktgenau', () => {
    expect(directionFor(80, 100)).toBe('low');
    expect(directionFor(120, 100)).toBe('high');
    expect(directionFor(100, 100)).toBe('exact');
    expect(directionFor(650, 649.99)).toBe('exact');
  });
});

describe('totalPoints und rankFor', () => {
  it('summiert die Punkte aller Runden', () => {
    expect(totalPoints([evaluate(100, 100), evaluate(200, 100)])).toBe(1500);
    expect(totalPoints([])).toBe(0);
  });

  it('vergibt Titel nach dem Anteil der erreichten Punkte', () => {
    expect(rankFor(10_000, 10).title).toBe('Preis-Orakel');
    expect(rankFor(8_000, 10).title).toBe('Preis-Profi');
    expect(rankFor(6_500, 10).title).toBe('Schnäppchenjäger');
    expect(rankFor(5_000, 10).title).toBe('Solides Bauchgefühl');
    expect(rankFor(3_500, 10).title).toBe('Schätz-Azubi');
    expect(rankFor(0, 10).title).toBe('Glücksritter');
    expect(rankFor(0, 0).title).toBe('Glücksritter');
  });
});
