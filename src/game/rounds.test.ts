import { describe, expect, it } from 'vitest';
import { QUESTIONS } from '../data/questions';
import { MAX_PER_CATEGORY, ROUNDS_PER_GAME, buildRounds, pickQuestions } from './rounds';
import { seededRandom } from './testUtils';
import type { PriceQuestion } from './types';

function countByCategory(questions: readonly PriceQuestion[]): number[] {
  const counts = new Map<string, number>();
  for (const question of questions) {
    counts.set(question.category, (counts.get(question.category) ?? 0) + 1);
  }
  return [...counts.values()];
}

describe('pickQuestions', () => {
  it('wählt die gewünschte Anzahl unterschiedlicher Fragen', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const picked = pickQuestions(QUESTIONS, new Set(), ROUNDS_PER_GAME, seededRandom(seed));
      expect(picked).toHaveLength(ROUNDS_PER_GAME);
      expect(new Set(picked.map((question) => question.id)).size).toBe(ROUNDS_PER_GAME);
    }
  });

  it('nimmt nicht zu viele Fragen aus einer Kategorie', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const picked = pickQuestions(QUESTIONS, new Set(), ROUNDS_PER_GAME, seededRandom(seed));
      expect(Math.max(...countByCategory(picked))).toBeLessThanOrEqual(MAX_PER_CATEGORY);
    }
  });

  it('bevorzugt Fragen, die noch nicht gespielt wurden', () => {
    const random = seededRandom(3);
    const first = pickQuestions(QUESTIONS, new Set(), ROUNDS_PER_GAME, random);
    const seen = new Set(first.map((question) => question.id));
    const second = pickQuestions(QUESTIONS, seen, ROUNDS_PER_GAME, random);
    expect(second.filter((question) => seen.has(question.id))).toEqual([]);
  });

  it('greift auf bekannte Fragen zurück, wenn es zu wenige neue gibt', () => {
    const seen = new Set(QUESTIONS.slice(3).map((question) => question.id));
    const picked = pickQuestions(QUESTIONS, seen, ROUNDS_PER_GAME, seededRandom(9));
    expect(picked).toHaveLength(ROUNDS_PER_GAME);
    for (const fresh of QUESTIONS.slice(0, 3)) {
      expect(picked).toContain(fresh);
    }
  });

  it('füllt auf, wenn die Kategorie-Grenze sonst zu wenige Fragen ließe', () => {
    const oneCategory = QUESTIONS.filter((question) => question.category === 'alltag');
    const picked = pickQuestions(oneCategory, new Set(), 5, seededRandom(1));
    expect(picked).toHaveLength(5);
  });

  it('liefert alle Fragen, wenn weniger vorhanden sind als gewünscht', () => {
    const few = QUESTIONS.slice(0, 4);
    expect(pickQuestions(few, new Set(), ROUNDS_PER_GAME, seededRandom(1))).toHaveLength(4);
  });
});

describe('buildRounds', () => {
  it('erzeugt pro Frage eine Runde mit passendem Sliderbereich', () => {
    const questions = QUESTIONS.slice(0, 5);
    const rounds = buildRounds(questions, seededRandom(11));
    expect(rounds.map((round) => round.question)).toEqual(questions);
    for (const round of rounds) {
      expect(round.range.min).toBeLessThan(round.question.price);
      expect(round.range.max).toBeGreaterThan(round.question.price);
    }
  });
});
