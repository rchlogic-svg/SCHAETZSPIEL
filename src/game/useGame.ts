import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { QUESTIONS } from '../data/questions';
import { useErrorTrap } from '../lib/useErrorTrap';
import { gameReducer, initialState } from './game';
import { buildRounds, pickQuestions } from './rounds';
import { clearGame, isExpired, loadGame, saveGame, type ActiveGameState, type SavedGame } from './savedGame';
import { totalPoints } from './scoring';
import { loadSaved, saveData, type SavedData } from './storage';

/** Wie lange nach der letzten Reglerbewegung gespeichert wird. */
const DRAFT_SAVE_DELAY = 300;

/** Merkt sich gespielte Fragen; ist der Vorrat aufgebraucht, beginnt ein neuer Durchlauf. */
function rememberSeen(seen: readonly string[], played: readonly string[]): string[] {
  const known = new Set(QUESTIONS.map((question) => question.id));
  const merged = [...new Set([...seen, ...played])].filter((id) => known.has(id));
  return merged.length >= known.size ? [...played] : merged;
}

function isActive(state: { phase: string }): state is ActiveGameState {
  return state.phase !== 'start';
}

/** Kurzinfo zu einem gespeicherten Spiel für die Karte auf der Startseite. */
export interface ResumableGame {
  finished: boolean;
  /** Nummer der Frage, bei der es weitergeht (bzw. der letzten Frage). */
  questionNumber: number;
  roundCount: number;
  points: number;
  savedAt: number;
}

export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [saved, setSaved] = useState<SavedData>(loadSaved);
  /** Bestwert vor dem laufenden Spiel – Vergleichswert für „Neuer Bestwert“. */
  const [previousBest, setPreviousBest] = useState(saved.best);
  /** Reglerstellung der offenen Frage, solange noch kein Tipp abgegeben ist. */
  const [draft, setDraft] = useState<number | undefined>(undefined);
  /** Gespeichertes Spiel, das auf der Startseite zum Fortsetzen angeboten wird. */
  const [stash, setStash] = useState<SavedGame | null>(() => loadGame());
  const trap = useErrorTrap();

  const persistStats = useCallback((data: SavedData) => {
    saveData(data);
    setSaved(data);
  }, []);

  // ── Automatisches Speichern ────────────────────────────────────────
  // Nach jeder Aktion (Spielstart, Tipp, nächste Frage) sofort; Reglerbewegungen
  // gebündelt, damit beim Ziehen nicht hunderte Male geschrieben wird.
  const latest = useRef({ state, previousBest, draft });
  latest.current = { state, previousBest, draft };

  const writeNow = useCallback(() => {
    const { state: current, previousBest: best, draft: currentDraft } = latest.current;
    if (!isActive(current)) return;
    saveGame({ state: current, previousBest: best, draft: currentDraft, savedAt: Date.now() });
  }, []);

  useEffect(() => {
    writeNow();
  }, [state, previousBest, writeNow]);

  useEffect(() => {
    if (draft === undefined) return;
    const timer = window.setTimeout(writeNow, DRAFT_SAVE_DELAY);
    return () => window.clearTimeout(timer);
  }, [draft, writeNow]);

  // Wird die App in den Hintergrund geschickt oder geschlossen, sofort sichern.
  useEffect(() => {
    const flush = () => {
      if (document.visibilityState === 'hidden') writeNow();
    };
    document.addEventListener('visibilitychange', flush);
    window.addEventListener('pagehide', writeNow);
    return () => {
      document.removeEventListener('visibilitychange', flush);
      window.removeEventListener('pagehide', writeNow);
    };
  }, [writeNow]);

  // ── Aktionen ───────────────────────────────────────────────────────

  /** Neues Spiel. Ein gespeichertes Spiel wird dabei ersetzt. */
  const start = useMemo(
    () =>
      trap(() => {
        const questions = pickQuestions(QUESTIONS, new Set(saved.seen));
        persistStats({ ...saved, seen: rememberSeen(saved.seen, questions.map((question) => question.id)) });
        setPreviousBest(saved.best);
        setDraft(undefined);
        setStash(null);
        dispatch({ type: 'start', rounds: buildRounds(questions) });
      }),
    [saved, persistStats, trap],
  );

  /** Setzt das gespeicherte Spiel genau dort fort, wo es unterbrochen wurde. */
  const resume = useMemo(
    () =>
      trap(() => {
        if (!stash) return;
        setPreviousBest(stash.previousBest);
        setDraft(stash.draft);
        setStash(null);
        dispatch({ type: 'restore', state: stash.state });
      }),
    [stash, trap],
  );

  const submit = useMemo(
    () =>
      trap((guess: number) => {
        setDraft(undefined);
        dispatch({ type: 'submit', guess });
      }),
    [trap],
  );

  const next = useMemo(
    () =>
      trap(() => {
        const isLastRound = state.index + 1 >= state.rounds.length;
        if (state.phase === 'revealed' && isLastRound) {
          const total = totalPoints(state.results);
          if (total > saved.best) persistStats({ ...saved, best: total });
        }
        setDraft(undefined);
        dispatch({ type: 'next' });
      }),
    [state, saved, persistStats, trap],
  );

  /** Zur Startseite, das Spiel bleibt gespeichert (z. B. über die Zurück-Taste). */
  const leave = useCallback(() => {
    const { state: current, previousBest: best, draft: currentDraft } = latest.current;
    if (!isActive(current)) return;
    const snapshot: SavedGame = { state: current, previousBest: best, draft: currentDraft, savedAt: Date.now() };
    saveGame(snapshot);
    setStash(snapshot);
    setDraft(undefined);
    dispatch({ type: 'home' });
  }, []);

  /** Spiel beenden und den gespeicherten Stand löschen. */
  const quit = useCallback(() => {
    clearGame();
    setStash(null);
    setDraft(undefined);
    dispatch({ type: 'home' });
  }, []);

  /** Gespeichertes Spiel auf der Startseite verwerfen. */
  const discard = useCallback(() => {
    clearGame();
    setStash(null);
  }, []);

  const total = totalPoints(state.results);

  const resumable: ResumableGame | null =
    stash && !isExpired(stash, Date.now())
      ? {
          finished: stash.state.phase === 'summary',
          questionNumber: stash.state.index + 1,
          roundCount: stash.state.rounds.length,
          points: totalPoints(stash.state.results),
          savedAt: stash.savedAt,
        }
      : null;

  return {
    ...state,
    round: state.rounds[state.index],
    total,
    best: saved.best,
    previousBest,
    isNewBest: state.phase === 'summary' && total > previousBest,
    draft,
    resumable,
    start,
    resume,
    submit,
    next,
    setDraft,
    leave,
    quit,
    discard,
  };
}

export type Game = ReturnType<typeof useGame>;
