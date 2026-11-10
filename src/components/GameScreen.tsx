import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { formatPoints } from '../game/format';
import { totalPoints } from '../game/scoring';
import type { Game } from '../game/useGame';
import { AnimatedNumber } from './AnimatedNumber';
import { CloseIcon } from './Icons';
import { ProgressBar } from './ProgressBar';
import { RoundView } from './RoundView';

export function GameScreen({ game }: { game: Game }) {
  const { rounds, index, results, round } = game;

  // Punkte und Fortschritt erst zeigen, wenn die Enthüllung durchgelaufen ist –
  // sonst würde die Kopfzeile das Ergebnis vorwegnehmen.
  const [settledRounds, setSettledRounds] = useState(0);
  const handleSettled = useCallback(() => setSettledRounds(index + 1), [index]);
  const shownResults = results.slice(0, settledRounds);

  if (!round) return null;

  return (
    <motion.main
      className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-3 px-[max(1rem,env(safe-area-inset-left))] pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:gap-5 sm:px-6 sm:pb-8 sm:pt-6 wide:h-dvh wide:max-w-5xl wide:px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <header className="flex h-10 shrink-0 items-center gap-3 sm:gap-4">
        <QuitButton onQuit={game.home} />
        <ProgressBar roundCount={rounds.length} current={index} results={shownResults} />
        <p
          className="flex h-10 shrink-0 items-baseline gap-1.5 rounded-full bg-white/8 px-3.5 leading-10 ring-1 ring-inset ring-white/10"
          aria-label={`Punktestand: ${formatPoints(totalPoints(shownResults))}`}
        >
          <AnimatedNumber
            value={totalPoints(shownResults)}
            format={formatPoints}
            className="numeric text-base font-bold"
          />
          <span className="label text-white/50">Pkt</span>
        </p>
      </header>

      <AnimatePresence mode="wait">
        <RoundView
          key={round.question.id}
          round={round}
          index={index}
          roundCount={rounds.length}
          result={results[index]}
          settled={settledRounds > index}
          onSubmit={game.submit}
          onSettled={handleSettled}
          onNext={game.next}
        />
      </AnimatePresence>
    </motion.main>
  );
}

/** Beenden mit Rückfrage: erster Tipp fragt nach, zweiter bestätigt. */
function QuitButton({ onQuit }: { onQuit: () => void }) {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const timer = window.setTimeout(() => setConfirming(false), 3000);
    return () => window.clearTimeout(timer);
  }, [confirming]);

  return (
    <button
      type="button"
      onClick={() => (confirming ? onQuit() : setConfirming(true))}
      aria-label={confirming ? 'Spiel wirklich beenden' : 'Spiel beenden'}
      className={`grid h-10 shrink-0 place-items-center rounded-full text-sm font-semibold ring-1 ring-inset transition-colors ${
        confirming
          ? 'bg-rose-500/20 px-3.5 text-rose-200 ring-rose-400/40'
          : 'w-10 bg-white/8 text-white/70 ring-white/10 hover:bg-white/14 hover:text-white'
      }`}
    >
      {confirming ? 'Beenden?' : <CloseIcon width={18} height={18} />}
    </button>
  );
}
