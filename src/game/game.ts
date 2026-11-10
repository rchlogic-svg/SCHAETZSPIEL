import { evaluate } from './scoring';
import type { Round, RoundResult } from './types';

export type Phase = 'start' | 'guessing' | 'revealed' | 'summary';

export interface GameState {
  phase: Phase;
  rounds: Round[];
  /** Index der aktuellen Runde. */
  index: number;
  /** Ein Ergebnis pro abgeschlossener Runde. */
  results: RoundResult[];
}

export type GameAction =
  | { type: 'start'; rounds: Round[] }
  | { type: 'submit'; guess: number }
  | { type: 'next' }
  | { type: 'home' }
  /** Setzt einen gespeicherten, bereits geprüften Spielstand fort. */
  | { type: 'restore'; state: GameState };

export const initialState: GameState = {
  phase: 'start',
  rounds: [],
  index: 0,
  results: [],
};

/**
 * Spielablauf: start → guessing ⇄ revealed → summary.
 * Aktionen, die nicht zur aktuellen Phase passen, werden ignoriert.
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'start': {
      if (action.rounds.length === 0) return state;
      return { phase: 'guessing', rounds: action.rounds, index: 0, results: [] };
    }

    case 'submit': {
      if (state.phase !== 'guessing') return state;
      const round = state.rounds[state.index];
      if (!round) return state;
      const guess = Math.min(round.range.max, Math.max(round.range.min, action.guess));
      return {
        ...state,
        phase: 'revealed',
        results: [...state.results, evaluate(guess, round.question.price)],
      };
    }

    case 'next': {
      if (state.phase !== 'revealed') return state;
      const isLastRound = state.index + 1 >= state.rounds.length;
      if (isLastRound) return { ...state, phase: 'summary' };
      return { ...state, phase: 'guessing', index: state.index + 1 };
    }

    case 'home':
      return initialState;

    case 'restore':
      return action.state.phase === 'start' || action.state.rounds.length === 0 ? state : action.state;
  }
}
