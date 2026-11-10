import { useCallback, useReducer, useState } from 'react';
import { QUESTIONS } from '../data/questions';
import { gameReducer, initialState } from './game';
import { buildRounds, pickQuestions } from './rounds';
import { totalPoints } from './scoring';
import { loadSaved, saveData, type SavedData } from './storage';

/** Merkt sich gespielte Fragen; ist der Vorrat aufgebraucht, beginnt ein neuer Durchlauf. */
function rememberSeen(seen: readonly string[], played: readonly string[]): string[] {
  const known = new Set(QUESTIONS.map((question) => question.id));
  const merged = [...new Set([...seen, ...played])].filter((id) => known.has(id));
  return merged.length >= known.size ? [...played] : merged;
}

export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [saved, setSaved] = useState<SavedData>(loadSaved);
  /** Bestwert vor dem laufenden Spiel – Vergleichswert für „Neuer Bestwert“. */
  const [previousBest, setPreviousBest] = useState(saved.best);

  const persist = useCallback((data: SavedData) => {
    saveData(data);
    setSaved(data);
  }, []);

  const start = useCallback(() => {
    const questions = pickQuestions(QUESTIONS, new Set(saved.seen));
    persist({
      ...saved,
      seen: rememberSeen(
        saved.seen,
        questions.map((question) => question.id),
      ),
    });
    setPreviousBest(saved.best);
    dispatch({ type: 'start', rounds: buildRounds(questions) });
  }, [saved, persist]);

  const submit = useCallback((guess: number) => dispatch({ type: 'submit', guess }), []);

  const next = useCallback(() => {
    const isLastRound = state.index + 1 >= state.rounds.length;
    if (state.phase === 'revealed' && isLastRound) {
      const total = totalPoints(state.results);
      if (total > saved.best) persist({ ...saved, best: total });
    }
    dispatch({ type: 'next' });
  }, [state, saved, persist]);

  const home = useCallback(() => dispatch({ type: 'home' }), []);

  const total = totalPoints(state.results);

  return {
    ...state,
    round: state.rounds[state.index],
    total,
    best: saved.best,
    previousBest,
    isNewBest: state.phase === 'summary' && total > previousBest,
    start,
    submit,
    next,
    home,
  };
}

export type Game = ReturnType<typeof useGame>;
