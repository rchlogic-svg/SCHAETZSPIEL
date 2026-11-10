import { describe, expect, it } from 'vitest';
import { QUESTIONS } from '../data/questions';
import { gameReducer, initialState, type GameState } from './game';
import { buildRounds } from './rounds';
import {
  GAME_KEY,
  MAX_AGE_MS,
  clearGame,
  isExpired,
  loadGame,
  parseSavedGame,
  saveGame,
  serializeGame,
  type ActiveGameState,
  type KeyValueStore,
  type SavedGame,
} from './savedGame';
import { totalPoints } from './scoring';
import { seededRandom } from './testUtils';

const NOW = Date.UTC(2026, 10, 10, 12, 0, 0);
const HOUR = 60 * 60 * 1000;

const rounds = buildRounds(QUESTIONS.slice(0, 4), seededRandom(17));

/** Spielt die ersten `answered` Fragen und bleibt dann in der gewünschten Phase stehen. */
function play(answered: number, phase: 'guessing' | 'revealed' | 'summary'): ActiveGameState {
  let state: GameState = gameReducer(initialState, { type: 'start', rounds });
  for (let i = 0; i < answered; i++) {
    state = gameReducer(state, { type: 'submit', guess: rounds[i]!.question.price * (1 + i * 0.3) });
    const isLast = i === answered - 1;
    if (!isLast || phase !== 'revealed') state = gameReducer(state, { type: 'next' });
  }
  expect(state.phase).toBe(phase);
  return state as ActiveGameState;
}

function saved(state: ActiveGameState, extra: Partial<SavedGame> = {}): SavedGame {
  return { state, previousBest: 4200, savedAt: NOW - HOUR, ...extra };
}

/** Speicher im Arbeitsspeicher, der sich wie localStorage verhält. */
function memoryStore(initial: Record<string, string> = {}): KeyValueStore & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

/** Ändert einen gespeicherten Eintrag gezielt, um Beschädigungen nachzustellen. */
function tamper(game: SavedGame, change: (data: any) => void): string {
  const data = JSON.parse(serializeGame(game));
  change(data);
  return JSON.stringify(data);
}

describe('Spielstand speichern und laden', () => {
  it.each([
    ['vor dem ersten Tipp', play(0, 'guessing')],
    ['mitten im Spiel, Frage offen', play(2, 'guessing')],
    ['nach einem Tipp, Antwort aufgedeckt', play(2, 'revealed')],
    ['nach dem Spiel, Ergebnisseite', play(4, 'summary')],
  ])('stellt den Stand %s vollständig wieder her', (_label, state) => {
    const restored = parseSavedGame(serializeGame(saved(state)), NOW);
    expect(restored).not.toBeNull();
    expect(restored!.state).toEqual(state);
    expect(restored!.previousBest).toBe(4200);
    expect(totalPoints(restored!.state.results)).toBe(totalPoints(state.results));
  });

  it('merkt sich die Reglerstellung der offenen Frage', () => {
    const state = play(1, 'guessing');
    const draft = rounds[1]!.range.min * 2;
    expect(parseSavedGame(serializeGame(saved(state, { draft })), NOW)!.draft).toBe(draft);
  });

  it('speichert keine Reglerstellung, wenn die Frage schon beantwortet ist', () => {
    const state = play(1, 'revealed');
    const text = serializeGame(saved(state, { draft: rounds[0]!.range.min * 2 }));
    expect(JSON.parse(text)).not.toHaveProperty('draft');
  });

  it('behält Preise und Punkte vom Spielbeginn, auch wenn sich Fragen später ändern', () => {
    const state = play(2, 'guessing');
    const text = serializeGame(saved(state));
    // Die gespeicherte Kopie ist unabhängig vom aktuellen Fragenkatalog.
    const restored = parseSavedGame(text, NOW)!;
    expect(restored.state.rounds.map((round) => round.question)).toEqual(rounds.map((round) => round.question));
    expect(restored.state.results.map((result) => result.points)).toEqual(state.results.map((result) => result.points));
  });
});

describe('Verfall nach 24 Stunden', () => {
  const state = play(1, 'guessing');

  it('lädt einen Stand von vor 23 Stunden', () => {
    expect(parseSavedGame(serializeGame(saved(state, { savedAt: NOW - 23 * HOUR })), NOW)).not.toBeNull();
  });

  it('verwirft einen Stand, der älter als 24 Stunden ist', () => {
    expect(parseSavedGame(serializeGame(saved(state, { savedAt: NOW - MAX_AGE_MS - 1 })), NOW)).toBeNull();
  });

  it('verwirft einen Stand aus der Zukunft, toleriert aber kleine Uhrabweichungen', () => {
    expect(parseSavedGame(serializeGame(saved(state, { savedAt: NOW + 2 * 60 * 1000 })), NOW)).not.toBeNull();
    expect(parseSavedGame(serializeGame(saved(state, { savedAt: NOW + 2 * HOUR })), NOW)).toBeNull();
  });

  it('erkennt abgelaufene Stände auch während die App offen ist', () => {
    const game = saved(state, { savedAt: NOW });
    expect(isExpired(game, NOW + 23 * HOUR)).toBe(false);
    expect(isExpired(game, NOW + 25 * HOUR)).toBe(true);
  });
});

describe('Beschädigte Einträge werden verworfen', () => {
  const game = saved(play(2, 'revealed'));

  it.each<[string, string | null]>([
    ['kein Eintrag', null],
    ['leerer Text', ''],
    ['kein JSON', '{kaputt'],
    ['kein Objekt', '42'],
    ['falsche Version', tamper(game, (d) => (d.version = 99))],
    ['ohne Zeitstempel', tamper(game, (d) => delete d.savedAt)],
    ['negativer Bestwert', tamper(game, (d) => (d.previousBest = -1))],
    ['unbekannte Phase', tamper(game, (d) => (d.state.phase = 'pause'))],
    ['Startseite als Phase', tamper(game, (d) => (d.state.phase = 'start'))],
    ['Index außerhalb', tamper(game, (d) => (d.state.index = 10))],
    ['Ergebnisse passen nicht zur Phase', tamper(game, (d) => (d.state.phase = 'guessing'))],
    ['zu viele Ergebnisse', tamper(game, (d) => d.state.results.push(d.state.results[0]))],
    ['keine Fragen', tamper(game, (d) => (d.state.rounds = []))],
    ['doppelte Fragen', tamper(game, (d) => (d.state.rounds[1] = d.state.rounds[0]))],
    ['Preis außerhalb des Reglers', tamper(game, (d) => (d.state.rounds[0].question.price = 1e12))],
    ['unbekanntes Piktogramm', tamper(game, (d) => (d.state.rounds[0].question.icon = 'ufo'))],
    ['unbekannte Kategorie', tamper(game, (d) => (d.state.rounds[0].question.category = 'sport'))],
    ['Quelle fehlt', tamper(game, (d) => delete d.state.rounds[0].question.source)],
    ['Tipp außerhalb des Reglers', tamper(game, (d) => (d.state.results[0].guess = 1e15))],
    ['zu viele Punkte', tamper(game, (d) => (d.state.results[0].points = 5000))],
    ['Punkte als Text', tamper(game, (d) => (d.state.results[0].points = '900'))],
    ['unbekannte Bewertung', tamper(game, (d) => (d.state.results[0].rating = 'super'))],
  ])('%s', (_label, raw) => {
    expect(parseSavedGame(raw, NOW)).toBeNull();
  });

  it('verwirft nur eine unpassende Reglerstellung, nicht das ganze Spiel', () => {
    const open = saved(play(1, 'guessing'));
    const raw = tamper(open, (d) => (d.draft = 1e15));
    const restored = parseSavedGame(raw, NOW);
    expect(restored).not.toBeNull();
    expect(restored!.draft).toBeUndefined();
  });
});

describe('Zugriff auf den Speicher', () => {
  it('speichert, lädt und löscht', () => {
    const store = memoryStore();
    const game = saved(play(1, 'guessing'));
    saveGame(game, store);
    expect(store.data.has(GAME_KEY)).toBe(true);
    expect(loadGame(NOW, store)!.state).toEqual(game.state);
    clearGame(store);
    expect(loadGame(NOW, store)).toBeNull();
  });

  it('räumt unbrauchbare und abgelaufene Einträge gleich weg', () => {
    const broken = memoryStore({ [GAME_KEY]: '{kaputt' });
    expect(loadGame(NOW, broken)).toBeNull();
    expect(broken.data.has(GAME_KEY)).toBe(false);

    const old = memoryStore({ [GAME_KEY]: serializeGame(saved(play(1, 'guessing'), { savedAt: NOW - 2 * MAX_AGE_MS })) });
    expect(loadGame(NOW, old)).toBeNull();
    expect(old.data.has(GAME_KEY)).toBe(false);
  });

  it('läuft weiter, wenn der Browser keinen Speicher erlaubt', () => {
    const blocked: KeyValueStore = {
      getItem: () => {
        throw new Error('blockiert');
      },
      setItem: () => {
        throw new Error('blockiert');
      },
      removeItem: () => {
        throw new Error('blockiert');
      },
    };
    const game = saved(play(1, 'guessing'));
    expect(() => saveGame(game, blocked)).not.toThrow();
    expect(loadGame(NOW, blocked)).toBeNull();
    expect(() => clearGame(blocked)).not.toThrow();
    expect(loadGame(NOW, null)).toBeNull();
  });
});
