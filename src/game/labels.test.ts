import { describe, expect, it } from 'vitest';
import { buildShareText, describeDeviation } from './labels';
import { evaluate } from './scoring';

const plain = (text: string) => text.replace(/ /g, ' ');

describe('describeDeviation', () => {
  it('nennt Abweichung und Richtung', () => {
    expect(plain(describeDeviation(evaluate(80, 100)))).toBe('25 % zu niedrig');
    expect(plain(describeDeviation(evaluate(125, 100)))).toBe('25 % zu hoch');
    expect(describeDeviation(evaluate(100, 100))).toBe('Auf den Punkt genau');
  });
});

describe('buildShareText', () => {
  it('fasst das Ergebnis mit einem Farbfeld pro Runde zusammen', () => {
    const results = [evaluate(100, 100), evaluate(110, 100), evaluate(150, 100), evaluate(400, 100)];
    const text = buildShareText(results, 2700, 4000, 'Schnäppchenjäger');
    expect(text.split('\n')).toEqual([
      'Schätzspiel – Was kostet das?',
      '2.700 von 4.000 Punkten · Schnäppchenjäger',
      '🎯🟩🟨🟥',
      'Schaffst du mehr?',
    ]);
  });
});
