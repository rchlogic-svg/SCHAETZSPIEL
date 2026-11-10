import { IconX } from '@tabler/icons-react';
import { useCallback, useEffect, useState } from 'react';
import { formatPoints } from '../game/format';
import { totalPoints } from '../game/scoring';
import type { Game } from '../game/useGame';
import { AnimatedNumber } from './AnimatedNumber';
import { HeaderActions } from './AppHeader';
import { IconButton } from './Button';
import { ProgressBar } from './ProgressBar';
import { RoundView } from './RoundView';

interface GameScreenProps {
  game: Game;
  onHelp: () => void;
}

export function GameScreen({ game, onHelp }: GameScreenProps) {
  const { rounds, index, results, round } = game;

  // Punkte und Fortschritt erst zeigen, wenn die Enthüllung durchgelaufen ist –
  // sonst würde die Kopfzeile das Ergebnis vorwegnehmen. Ein fortgesetztes Spiel
  // startet mit allen bereits aufgedeckten Runden.
  const [settledRounds, setSettledRounds] = useState(() => (game.phase === 'revealed' ? index + 1 : index));
  const handleSettled = useCallback(() => setSettledRounds(index + 1), [index]);
  const shownResults = results.slice(0, settledRounds);
  const points = totalPoints(shownResults);

  if (!round) return null;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl animate-fade flex-col gap-2.5 px-[max(1rem,env(safe-area-inset-left))] pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.25rem,env(safe-area-inset-top))] short:gap-2 short:pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:gap-4 sm:px-6 sm:pb-8 sm:pt-4 short:sm:gap-2 short:sm:pb-2 short:sm:pt-1 split:max-w-4xl">
      <header className="flex shrink-0 flex-col gap-1.5">
        <div className="flex items-center gap-1">
          <QuitButton onQuit={game.quit} />
          {/* Bei vergrößerter Schrift rutschen Stand und Punkte untereinander. */}
          <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-3 px-1 text-small">
            <p className="whitespace-nowrap font-semibold" aria-live="polite">
              Frage {index + 1} <span className="font-normal text-ink-3">von {rounds.length}</span>
            </p>
            <p className="whitespace-nowrap text-ink-3">
              <span className="sr-only">Punktestand: </span>
              <AnimatedNumber value={points} format={formatPoints} className="font-semibold tabular-nums text-ink" />{' '}
              Punkte
            </p>
          </div>
          <HeaderActions onHelp={onHelp} />
        </div>
        <ProgressBar roundCount={rounds.length} current={index} results={shownResults} />
      </header>

      <main className="flex flex-1 flex-col">
        <RoundView
          key={round.question.id}
          round={round}
          result={results[index]}
          settled={settledRounds > index}
          isLastRound={index === rounds.length - 1}
          initialGuess={game.draft}
          onGuessChange={game.setDraft}
          onSubmit={game.submit}
          onSettled={handleSettled}
          onNext={game.next}
        />
      </main>
    </div>
  );
}

/** Beenden mit Rückfrage: Der erste Tipp fragt nach, der zweite bestätigt. */
function QuitButton({ onQuit }: { onQuit: () => void }) {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const timer = window.setTimeout(() => setConfirming(false), 3500);
    return () => window.clearTimeout(timer);
  }, [confirming]);

  if (confirming) {
    return (
      <button
        type="button"
        data-tone="off"
        onClick={onQuit}
        aria-label="Spiel wirklich beenden"
        className="min-h-[44px] shrink-0 animate-fade rounded-control bg-tone-soft px-3 text-small font-semibold text-tone"
      >
        Beenden?
      </button>
    );
  }

  return (
    <IconButton label="Spiel beenden" onClick={() => setConfirming(true)} className="-ml-2">
      <IconX size={22} stroke={1.75} aria-hidden="true" />
    </IconButton>
  );
}
