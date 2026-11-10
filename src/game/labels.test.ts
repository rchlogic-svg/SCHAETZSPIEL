import { describe, expect, it } from 'vitest';
import { buildShareText, describeDeviation, explainDeviation, toneFor } from './labels';
import { evaluate } from './scoring';

const plain = (text: string) => text.replace(/ /g, ' ');

describe('describeDeviation', () => {
  it('nennt Abweichung und Richtung', () => {
    expect(plain(describeDeviation(evaluate(80, 100)))).toBe('25 % zu niedrig');
    expect(plain(describeDeviation(evaluate(125, 100)))).toBe('25 % zu hoch');
    expect(describeDeviation(evaluate(100, 100))).toBe('Auf den Punkt genau');
  });
});

describe('explainDeviation', () => {
  it('formuliert zu hohe Tipps vom echten Preis aus', () => {
    expect(plain(explainDeviation(evaluate(125, 100)))).toBe('Dein Tipp liegt 25 % über dem echten Preis.');
    expect(plain(explainDeviation(evaluate(300, 100)))).toBe('Dein Tipp liegt 200 % über dem echten Preis.');
  });

  it('formuliert zu niedrige Tipps vom Tipp aus – so, wie auch gewertet wird', () => {
    expect(plain(explainDeviation(evaluate(80, 100)))).toBe('Der echte Preis liegt 25 % über deinem Tipp.');
    expect(plain(explainDeviation(evaluate(50, 100)))).toBe('Der echte Preis liegt 100 % über deinem Tipp.');
  });

  it('nennt dieselbe Prozentzahl, nach der die Punkte berechnet werden', () => {
    for (const [guess, actual] of [
      [80, 100],
      [125, 100],
      [50, 100],
      [200, 100],
    ] as const) {
      const result = evaluate(guess, actual);
      const percent = Number(plain(explainDeviation(result)).match(/(\d+) %/)![1]);
      expect(result.points).toBe(1000 - percent * 5);
    }
  });

  it('behandelt Volltreffer und Grenzfälle', () => {
    expect(explainDeviation(evaluate(100, 100))).toBe('Du hast den Preis genau getroffen.');
    expect(plain(explainDeviation(evaluate(100.3, 100)))).toBe('Dein Tipp liegt weniger als 1 % über dem echten Preis.');
    expect(plain(explainDeviation(evaluate(5000, 100)))).toBe('Dein Tipp liegt mehr als 999 % über dem echten Preis.');
  });
});

describe('toneFor', () => {
  it('fasst die sechs Bewertungsstufen zu drei Signalfarben zusammen', () => {
    expect(toneFor('perfect')).toBe('good');
    expect(toneFor('great')).toBe('good');
    expect(toneFor('good')).toBe('good');
    expect(toneFor('ok')).toBe('mid');
    expect(toneFor('far')).toBe('mid');
    expect(toneFor('miss')).toBe('off');
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
