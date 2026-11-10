import { PICTOGRAMS } from '../data/pictograms';
import { CATEGORIES } from '../data/questions';
import type { GameState } from './game';
import { MAX_POINTS } from './scoring';
import type { Direction, PriceQuestion, Rating, Round, RoundResult } from './types';

/**
 * Speichern und Wiederherstellen eines laufenden Spiels.
 *
 * Gespeichert wird der vollständige Spielstand – inklusive der Fragen, so wie
 * sie beim Spielbeginn waren. Ändert sich später ein Preis oder fällt eine
 * Frage weg, läuft das gespeicherte Spiel trotzdem unverändert weiter, und
 * bereits erzielte Punkte bleiben genau erhalten.
 *
 * Alles, was aus dem Speicher kommt, wird streng geprüft. Ein beschädigter
 * oder veralteter Eintrag wird verworfen, statt das Spiel abstürzen zu lassen.
 */

export const GAME_KEY = 'schaetzspiel:spiel:v1';

/** Ein Spielstand verfällt 24 Stunden nach der letzten Aktion. */
export const MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** Uhren von Geräten gehen manchmal etwas vor – so viel Zukunft wird toleriert. */
const CLOCK_SKEW_MS = 5 * 60 * 1000;

const FORMAT_VERSION = 1;

/** Ein Spielstand, der fortgesetzt werden kann (also nicht auf der Startseite). */
export type ActiveGameState = GameState & { phase: Exclude<GameState['phase'], 'start'> };

export interface SavedGame {
  state: ActiveGameState;
  /** Bestwert vor diesem Spiel – damit „Neuer Bestwert“ auch nach dem Neuladen stimmt. */
  previousBest: number;
  /** Reglerstellung der offenen Frage, solange noch kein Tipp abgegeben ist. */
  draft?: number;
  /** Zeitpunkt der letzten Aktion (Millisekunden seit 1970). */
  savedAt: number;
}

// ── Prüfungen ──────────────────────────────────────────────────────────

type Unknown = Record<string, unknown>;

const isObject = (value: unknown): value is Unknown => typeof value === 'object' && value !== null;
const isText = (value: unknown): value is string => typeof value === 'string' && value.trim() !== '';
const isPositive = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0;
const isIndex = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 0;

const RATINGS: readonly Rating[] = ['perfect', 'great', 'good', 'ok', 'far', 'miss'];
const DIRECTIONS: readonly Direction[] = ['low', 'high', 'exact'];
const PHASES: readonly ActiveGameState['phase'][] = ['guessing', 'revealed', 'summary'];

function parseQuestion(value: unknown): PriceQuestion | null {
  if (!isObject(value) || !isObject(value.source)) return null;
  const { id, title, category, icon, question, detail, price, source } = value;
  if (!isText(id) || !isText(title) || !isText(question) || !isText(detail)) return null;
  if (typeof category !== 'string' || !Object.hasOwn(CATEGORIES, category)) return null;
  if (typeof icon !== 'string' || !(PICTOGRAMS as readonly string[]).includes(icon)) return null;
  if (!isPositive(price)) return null;
  if (!isText(source.name) || !isText(source.url) || !isText(source.asOf)) return null;
  return {
    id,
    title,
    category: category as PriceQuestion['category'],
    icon: icon as PriceQuestion['icon'],
    question,
    detail,
    price,
    source: { name: source.name, url: source.url, asOf: source.asOf },
  };
}

function parseRound(value: unknown): Round | null {
  if (!isObject(value) || !isObject(value.range)) return null;
  const question = parseQuestion(value.question);
  const { min, max } = value.range;
  if (!question || !isPositive(min) || !isPositive(max) || !(min < max)) return null;
  if (question.price < min || question.price > max) return null;
  return { question, range: { min, max } };
}

function parseResult(value: unknown, round: Round): RoundResult | null {
  if (!isObject(value)) return null;
  const { guess, deviation, direction, points, rating } = value;
  if (!isPositive(guess) || guess < round.range.min || guess > round.range.max) return null;
  if (typeof deviation !== 'number' || !Number.isFinite(deviation) || deviation < 0) return null;
  if (!Number.isInteger(points) || (points as number) < 0 || (points as number) > MAX_POINTS) return null;
  if (!DIRECTIONS.includes(direction as Direction) || !RATINGS.includes(rating as Rating)) return null;
  return { guess, deviation, direction: direction as Direction, points: points as number, rating: rating as Rating };
}

/** Wie viele Ergebnisse es in einer Phase geben muss, damit der Stand stimmig ist. */
function expectedResults(phase: ActiveGameState['phase'], index: number): number {
  return phase === 'guessing' ? index : index + 1;
}

function parseState(value: unknown): ActiveGameState | null {
  if (!isObject(value) || !Array.isArray(value.rounds) || !Array.isArray(value.results)) return null;
  const { phase, index } = value;
  if (!PHASES.includes(phase as ActiveGameState['phase']) || !isIndex(index)) return null;

  const rounds: Round[] = [];
  for (const raw of value.rounds) {
    const round = parseRound(raw);
    if (!round) return null;
    rounds.push(round);
  }
  if (rounds.length === 0 || rounds.length > 50) return null;
  if (new Set(rounds.map((round) => round.question.id)).size !== rounds.length) return null;
  if (index >= rounds.length) return null;

  const typedPhase = phase as ActiveGameState['phase'];
  if (typedPhase === 'summary' && index !== rounds.length - 1) return null;
  if (value.results.length !== expectedResults(typedPhase, index)) return null;

  const results: RoundResult[] = [];
  for (let i = 0; i < value.results.length; i++) {
    const result = parseResult(value.results[i], rounds[i]!);
    if (!result) return null;
    results.push(result);
  }

  return { phase: typedPhase, index, rounds, results };
}

/**
 * Liest einen gespeicherten Spielstand. Gibt `null` zurück, wenn nichts
 * gespeichert ist, der Eintrag beschädigt ist oder älter als 24 Stunden.
 */
export function parseSavedGame(raw: string | null, now: number): SavedGame | null {
  if (!raw) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isObject(data) || data.version !== FORMAT_VERSION) return null;

  const { savedAt, previousBest, draft } = data;
  if (typeof savedAt !== 'number' || !Number.isFinite(savedAt)) return null;
  if (savedAt > now + CLOCK_SKEW_MS || now - savedAt > MAX_AGE_MS) return null;
  if (typeof previousBest !== 'number' || !Number.isFinite(previousBest) || previousBest < 0) return null;

  const state = parseState(data.state);
  if (!state) return null;

  const saved: SavedGame = { state, previousBest, savedAt };
  // Die Reglerstellung ist nur ein Komfort: Passt sie nicht, fällt nur sie weg.
  const round = state.rounds[state.index]!;
  if (state.phase === 'guessing' && isPositive(draft) && draft >= round.range.min && draft <= round.range.max) {
    saved.draft = draft;
  }
  return saved;
}

export function serializeGame(saved: SavedGame): string {
  const { state, previousBest, draft, savedAt } = saved;
  return JSON.stringify({
    version: FORMAT_VERSION,
    savedAt,
    previousBest,
    ...(state.phase === 'guessing' && draft !== undefined ? { draft } : {}),
    state: { phase: state.phase, index: state.index, rounds: state.rounds, results: state.results },
  });
}

export function isExpired(saved: SavedGame, now: number): boolean {
  return now - saved.savedAt > MAX_AGE_MS;
}

// ── Zugriff auf den Browser-Speicher ───────────────────────────────────

/** Die Teile des Browser-Speichers, die hier gebraucht werden – austauschbar für Tests. */
export type KeyValueStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function browserStore(): KeyValueStore | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    // Manche Browser verweigern schon den Zugriff auf den Speicher.
    return null;
  }
}

/** Lädt den Spielstand. Unbrauchbare Einträge werden dabei gleich entfernt. */
export function loadGame(now: number = Date.now(), store: KeyValueStore | null = browserStore()): SavedGame | null {
  if (!store) return null;
  try {
    const raw = store.getItem(GAME_KEY);
    const saved = parseSavedGame(raw, now);
    if (raw !== null && !saved) store.removeItem(GAME_KEY);
    return saved;
  } catch {
    return null;
  }
}

/** Speichert den Spielstand. Schlägt das fehl, läuft das Spiel ohne Speichern weiter. */
export function saveGame(saved: SavedGame, store: KeyValueStore | null = browserStore()): void {
  try {
    store?.setItem(GAME_KEY, serializeGame(saved));
  } catch {
    // Privater Modus oder voller Speicher.
  }
}

export function clearGame(store: KeyValueStore | null = browserStore()): void {
  try {
    store?.removeItem(GAME_KEY);
  } catch {
    // Nichts zu tun.
  }
}
