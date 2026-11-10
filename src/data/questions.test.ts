import { describe, expect, it } from 'vitest';
import { ROUNDS_PER_GAME } from '../game/rounds';
import { MIN_PRICE } from '../game/scale';
import { CATEGORIES, QUESTIONS } from './questions';

describe('Fragenkatalog', () => {
  it('enthält genug Fragen für mehrere unterschiedliche Spiele', () => {
    expect(QUESTIONS.length).toBeGreaterThanOrEqual(ROUNDS_PER_GAME * 3);
  });

  it('hat eindeutige IDs', () => {
    const ids = QUESTIONS.map((question) => question.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('nutzt nur bekannte Kategorien und jede Kategorie mehrfach', () => {
    for (const category of Object.keys(CATEGORIES)) {
      const count = QUESTIONS.filter((question) => question.category === category).length;
      expect(count, category).toBeGreaterThanOrEqual(3);
    }
    for (const question of QUESTIONS) {
      expect(CATEGORIES[question.category], question.id).toBeDefined();
    }
  });

  it.each(QUESTIONS.map((question) => [question.id, question] as const))(
    '%s hat gültigen Preis, Text, Quelle und Datum',
    (_id, question) => {
      expect(Number.isFinite(question.price)).toBe(true);
      expect(question.price).toBeGreaterThanOrEqual(MIN_PRICE);

      expect(question.emoji.trim()).not.toBe('');
      expect(question.question.trim().endsWith('?')).toBe(true);
      expect(question.question.length).toBeLessThanOrEqual(60);
      expect(question.detail.trim()).not.toBe('');
      expect(question.detail.length).toBeLessThanOrEqual(64);

      expect(question.source.name.trim()).not.toBe('');
      const url = new URL(question.source.url);
      expect(url.protocol).toBe('https:');

      expect(question.source.asOf).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
      const [year, month] = question.source.asOf.split('-').map(Number);
      const asOf = new Date(year!, month! - 1, 1);
      expect(asOf.getTime()).toBeLessThanOrEqual(Date.now());
    },
  );
});
