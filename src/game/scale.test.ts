import { describe, expect, it } from 'vitest';
import { QUESTIONS } from '../data/questions';
import {
  MIN_PRICE,
  buildRange,
  initialValue,
  nudgeValue,
  positionToValue,
  roundToSignificant,
  snapValue,
  stepFor,
  ticksFor,
  valueToPosition,
} from './scale';
import { evaluate } from './scoring';
import { seededRandom } from './testUtils';

/** Zufallswerte inklusive der Ränder, an denen Rundungsfehler am ehesten auffallen. */
function randomSources(): Array<() => number> {
  const random = seededRandom(20261110);
  return [() => 0, () => 0.5, () => 0.999999, ...Array.from({ length: 300 }, () => random)];
}

describe('buildRange', () => {
  it('enthält den echten Preis bei jeder Frage und jedem Zufallswert', () => {
    for (const question of QUESTIONS) {
      for (const random of randomSources()) {
        const range = buildRange(question.price, random);
        expect(range.min, question.id).toBeLessThan(question.price);
        expect(range.max, question.id).toBeGreaterThan(question.price);
        expect(range.min, question.id).toBeGreaterThanOrEqual(MIN_PRICE);
      }
    }
  });

  it('enthält den echten Preis auch bei extremen Beträgen', () => {
    const prices = [0.01, 0.02, 0.05, 0.99, 1, 9.99, 10, 99.99, 1e3, 1e6, 1e9, 5e11];
    for (const price of prices) {
      for (const random of randomSources()) {
        const range = buildRange(price, random);
        expect(range.min, String(price)).toBeLessThanOrEqual(price);
        expect(range.max, String(price)).toBeGreaterThan(price);
        if (price > MIN_PRICE) expect(range.min, String(price)).toBeLessThan(price);
      }
    }
  });

  it('legt den echten Preis nie an den Rand des Sliders', () => {
    for (const question of QUESTIONS) {
      for (const random of randomSources()) {
        const range = buildRange(question.price, random);
        const position = valueToPosition(question.price, range);
        expect(position, question.id).toBeGreaterThan(0.08);
        expect(position, question.id).toBeLessThan(0.92);
      }
    }
  });

  it('verrät die Lösung nicht über die Mitte des Sliders', () => {
    const random = seededRandom(7);
    const positions = Array.from({ length: 400 }, () =>
      valueToPosition(100, buildRange(100, random)),
    );
    expect(Math.min(...positions)).toBeLessThan(0.25);
    expect(Math.max(...positions)).toBeGreaterThan(0.75);
  });

  it('lehnt ungültige Preise ab', () => {
    expect(() => buildRange(0)).toThrow(RangeError);
    expect(() => buildRange(-5)).toThrow(RangeError);
    expect(() => buildRange(Number.NaN)).toThrow(RangeError);
  });
});

describe('Volltreffer sind erreichbar', () => {
  it('lässt sich bei jeder Frage auf mindestens 995 Punkte einstellen', () => {
    for (const question of QUESTIONS) {
      for (const random of randomSources().slice(0, 20)) {
        const range = buildRange(question.price, random);
        const best = snapValue(question.price, range);
        expect(evaluate(best, question.price).points, question.id).toBeGreaterThanOrEqual(995);
      }
    }
  });
});

describe('Position und Wert', () => {
  const range = { min: 12, max: 740 };

  it('bildet die Ränder auf min und max ab', () => {
    expect(positionToValue(0, range)).toBeCloseTo(12, 10);
    expect(positionToValue(1, range)).toBeCloseTo(740, 8);
    expect(positionToValue(-1, range)).toBeCloseTo(12, 10);
    expect(positionToValue(2, range)).toBeCloseTo(740, 8);
  });

  it('ist umkehrbar', () => {
    for (const position of [0, 0.1, 0.33, 0.5, 0.9, 1]) {
      expect(valueToPosition(positionToValue(position, range), range)).toBeCloseTo(position, 10);
    }
  });

  it('verteilt die Werte logarithmisch', () => {
    expect(positionToValue(0.5, { min: 1, max: 100 })).toBeCloseTo(10, 10);
  });

  it('begrenzt Werte außerhalb des Bereichs', () => {
    expect(valueToPosition(1, range)).toBe(0);
    expect(valueToPosition(10_000, range)).toBe(1);
  });
});

describe('snapValue, stepFor und nudgeValue', () => {
  it('rundet auf glatte Beträge', () => {
    const range = { min: 0.01, max: 1e9 };
    expect(snapValue(0.954, range)).toBe(0.95);
    expect(snapValue(4.567, range)).toBe(4.57);
    expect(snapValue(45.67, range)).toBe(45.7);
    expect(snapValue(456.7, range)).toBe(457);
    expect(snapValue(4567, range)).toBe(4570);
    expect(snapValue(1_234_567, range)).toBe(1_230_000);
  });

  it('bleibt innerhalb des Bereichs', () => {
    const range = { min: 12, max: 740 };
    expect(snapValue(5, range)).toBe(12);
    expect(snapValue(900, range)).toBe(740);
  });

  it('wählt die Schrittweite passend zur Größenordnung', () => {
    expect(stepFor(0.5)).toBe(0.01);
    expect(stepFor(5)).toBe(0.01);
    expect(stepFor(50)).toBeCloseTo(0.1, 12);
    expect(stepFor(500)).toBe(1);
    expect(stepFor(5000)).toBe(10);
  });

  it('macht Feinschritte in beide Richtungen', () => {
    const range = { min: 1, max: 10_000 };
    expect(nudgeValue(4.57, 1, range)).toBe(4.58);
    expect(nudgeValue(4.57, -1, range)).toBe(4.56);
    expect(nudgeValue(457, 1, range)).toBe(458);
    expect(nudgeValue(100, -1, range)).toBe(99.9);
    expect(nudgeValue(10_000, 1, range)).toBe(10_000);
    expect(nudgeValue(1, -1, range)).toBe(1);
  });

  it('startet in der Mitte der Skala', () => {
    expect(initialValue({ min: 1, max: 100 })).toBe(10);
  });
});

describe('roundToSignificant', () => {
  it('rundet auf geltende Stellen', () => {
    expect(roundToSignificant(1234, 2, 'floor')).toBe(1200);
    expect(roundToSignificant(1234, 2, 'ceil')).toBe(1300);
    expect(roundToSignificant(0.1234, 2, 'floor')).toBe(0.12);
    expect(roundToSignificant(0.1234, 2, 'ceil')).toBe(0.13);
    expect(roundToSignificant(0, 2, 'floor')).toBe(0);
  });
});

describe('ticksFor', () => {
  it('liefert Marken bei 1, 2 und 5 mal Zehnerpotenz innerhalb des Bereichs', () => {
    const ticks = ticksFor({ min: 12, max: 740 });
    expect(ticks.map((tick) => tick.value)).toEqual([20, 50, 100, 200, 500]);
    expect(ticks.filter((tick) => tick.major).map((tick) => tick.value)).toEqual([100]);
    for (const tick of ticks) {
      expect(tick.position).toBeGreaterThan(0);
      expect(tick.position).toBeLessThan(1);
    }
  });

  it('funktioniert auch für Centbeträge', () => {
    const ticks = ticksFor({ min: 0.03, max: 1.8 });
    expect(ticks.map((tick) => tick.value)).toEqual([0.05, 0.1, 0.2, 0.5, 1]);
  });
});
