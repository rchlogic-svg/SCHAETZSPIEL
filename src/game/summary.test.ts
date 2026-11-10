import { describe, expect, it } from 'vitest';
import { evaluate } from './scoring';
import { pickHighlights } from './summary';

describe('pickHighlights', () => {
  it('findet den besten Tipp und den größten Ausreißer', () => {
    const results = [evaluate(150, 100), evaluate(102, 100), evaluate(400, 100), evaluate(80, 100)];
    expect(pickHighlights(results)).toEqual({ best: 1, worst: 2 });
  });

  it('bewertet zu niedrige und zu hohe Tipps nach demselben Maß', () => {
    // 20 € statt 100 € ist weiter daneben als 300 € statt 100 €.
    const results = [evaluate(300, 100), evaluate(20, 100), evaluate(95, 100)];
    expect(pickHighlights(results)).toEqual({ best: 2, worst: 1 });
  });

  it('nimmt bei Gleichstand die frühere Runde', () => {
    const results = [evaluate(110, 100), evaluate(110, 100), evaluate(200, 100), evaluate(200, 100)];
    expect(pickHighlights(results)).toEqual({ best: 0, worst: 2 });
  });

  it('hebt nichts hervor, wenn es nichts zu vergleichen gibt', () => {
    expect(pickHighlights([])).toBeNull();
    expect(pickHighlights([evaluate(90, 100)])).toBeNull();
    expect(pickHighlights([evaluate(120, 100), evaluate(120, 100)])).toBeNull();
  });
});
