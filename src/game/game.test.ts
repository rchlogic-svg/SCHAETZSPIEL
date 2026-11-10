import { describe, expect, it } from 'vitest';
import { QUESTIONS } from '../data/questions';
import { gameReducer, initialState, type GameState } from './game';
import { buildRounds } from './rounds';
import { seededRandom } from './testUtils';

const rounds = buildRounds(QUESTIONS.slice(0, 3), seededRandom(5));

function started(): GameState {
  return gameReducer(initialState, { type: 'start', rounds });
}

describe('gameReducer', () => {
  it('beginnt auf dem Startbildschirm', () => {
    expect(initialState.phase).toBe('start');
  });

  it('startet ein Spiel mit der ersten Runde', () => {
    const state = started();
    expect(state.phase).toBe('guessing');
    expect(state.index).toBe(0);
    expect(state.results).toEqual([]);
    expect(state.rounds).toBe(rounds);
  });

  it('startet nicht ohne Runden', () => {
    expect(gameReducer(initialState, { type: 'start', rounds: [] })).toBe(initialState);
  });

  it('wertet eine Schätzung aus und zeigt die Auflösung', () => {
    const price = rounds[0]!.question.price;
    const state = gameReducer(started(), { type: 'submit', guess: price });
    expect(state.phase).toBe('revealed');
    expect(state.results).toHaveLength(1);
    expect(state.results[0]!.points).toBe(1000);
  });

  it('begrenzt Schätzungen auf den Sliderbereich', () => {
    const { range } = rounds[0]!;
    const state = gameReducer(started(), { type: 'submit', guess: range.max * 100 });
    expect(state.results[0]!.guess).toBe(range.max);
  });

  it('ignoriert eine zweite Schätzung in derselben Runde', () => {
    const once = gameReducer(started(), { type: 'submit', guess: 1 });
    expect(gameReducer(once, { type: 'submit', guess: 2 })).toBe(once);
  });

  it('geht erst nach der Auflösung zur nächsten Runde', () => {
    const state = started();
    expect(gameReducer(state, { type: 'next' })).toBe(state);

    const revealed = gameReducer(state, { type: 'submit', guess: 1 });
    const next = gameReducer(revealed, { type: 'next' });
    expect(next.phase).toBe('guessing');
    expect(next.index).toBe(1);
  });

  it('endet nach der letzten Runde mit der Auswertung', () => {
    let state = started();
    for (let i = 0; i < rounds.length; i++) {
      state = gameReducer(state, { type: 'submit', guess: rounds[i]!.question.price });
      state = gameReducer(state, { type: 'next' });
    }
    expect(state.phase).toBe('summary');
    expect(state.results).toHaveLength(rounds.length);
    expect(gameReducer(state, { type: 'next' })).toBe(state);
  });

  it('kehrt jederzeit zum Start zurück', () => {
    const revealed = gameReducer(started(), { type: 'submit', guess: 1 });
    expect(gameReducer(revealed, { type: 'home' })).toEqual(initialState);
  });

  it('setzt einen gespeicherten Spielstand unverändert fort', () => {
    const revealed = gameReducer(started(), { type: 'submit', guess: 1 });
    const restored = gameReducer(initialState, { type: 'restore', state: revealed });
    expect(restored).toBe(revealed);
    expect(restored.phase).toBe('revealed');
    expect(restored.results).toHaveLength(1);
  });

  it('ignoriert leere oder unfertige Spielstände beim Fortsetzen', () => {
    expect(gameReducer(initialState, { type: 'restore', state: initialState })).toBe(initialState);
    const empty: GameState = { phase: 'guessing', rounds: [], index: 0, results: [] };
    expect(gameReducer(initialState, { type: 'restore', state: empty })).toBe(initialState);
  });

  it('beginnt ein neues Spiel mit leeren Ergebnissen', () => {
    const revealed = gameReducer(started(), { type: 'submit', guess: 1 });
    const again = gameReducer(revealed, { type: 'start', rounds });
    expect(again.results).toEqual([]);
    expect(again.index).toBe(0);
  });
});
