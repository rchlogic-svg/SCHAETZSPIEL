import { buildRange } from './scale';
import type { CategoryId, PriceQuestion, Round } from './types';

export const ROUNDS_PER_GAME = 10;

/** Höchstens so viele Fragen pro Kategorie in einem Spiel – sorgt für Abwechslung. */
export const MAX_PER_CATEGORY = 3;

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

/**
 * Wählt die Fragen für ein Spiel: zufällig, bevorzugt noch nicht gesehene,
 * und nicht zu viele aus derselben Kategorie.
 */
export function pickQuestions(
  all: readonly PriceQuestion[],
  seenIds: ReadonlySet<string>,
  count: number = ROUNDS_PER_GAME,
  random: () => number = Math.random,
): PriceQuestion[] {
  const shuffled = shuffle(all, random);
  const ordered = [
    ...shuffled.filter((question) => !seenIds.has(question.id)),
    ...shuffled.filter((question) => seenIds.has(question.id)),
  ];

  const picked: PriceQuestion[] = [];
  const perCategory = new Map<CategoryId, number>();
  for (const question of ordered) {
    if (picked.length === count) break;
    const used = perCategory.get(question.category) ?? 0;
    if (used >= MAX_PER_CATEGORY) continue;
    perCategory.set(question.category, used + 1);
    picked.push(question);
  }

  // Falls die Kategorie-Grenze zu streng war, mit den übrigen Fragen auffüllen.
  for (const question of ordered) {
    if (picked.length === count) break;
    if (!picked.includes(question)) picked.push(question);
  }

  return shuffle(picked, random);
}

export function buildRounds(
  questions: readonly PriceQuestion[],
  random: () => number = Math.random,
): Round[] {
  return questions.map((question) => ({
    question,
    range: buildRange(question.price, random),
  }));
}
