import { IconArrowRight, IconHistory } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { formatPoints, formatSavedAgo } from '../game/format';
import { MAX_POINTS } from '../game/scoring';
import type { ResumableGame } from '../game/useGame';
import { Button } from './Button';

interface ResumeCardProps {
  game: ResumableGame;
  onResume: () => void;
  onDiscard: () => void;
}

/**
 * Bietet ein gespeichertes Spiel zum Fortsetzen an. Verwerfen braucht eine
 * Bestätigung, damit Punkte nicht aus Versehen verloren gehen.
 */
export function ResumeCard({ game, onResume, onDiscard }: ResumeCardProps) {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const timer = window.setTimeout(() => setConfirming(false), 4000);
    return () => window.clearTimeout(timer);
  }, [confirming]);

  const title = game.finished ? 'Letztes Ergebnis' : 'Unterbrochenes Spiel';
  const summary = game.finished
    ? `${formatPoints(game.points)} von ${formatPoints(game.roundCount * MAX_POINTS)} Punkten`
    : `Frage ${game.questionNumber} von ${game.roundCount} · ${formatPoints(game.points)} Punkte`;

  return (
    <article aria-labelledby="resume-title" className="card flex animate-enter flex-col gap-4 p-4 sm:p-5">
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-control bg-accent-soft text-accent">
          <IconHistory size={24} stroke={1.75} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="resume-title" className="text-heading">
            {title}
          </h2>
          <p className="mt-1 text-body tabular-nums text-ink-2">{summary}</p>
          <p className="mt-0.5 text-small text-ink-3">
            Freies Spiel · gespeichert {formatSavedAgo(game.savedAt, Date.now())}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-2">
        <Button onClick={onResume}>
          {game.finished ? 'Ergebnis ansehen' : 'Weiterspielen'}
          <IconArrowRight size={20} stroke={2} aria-hidden="true" />
        </Button>
        {confirming ? (
          <button
            type="button"
            data-tone="off"
            onClick={onDiscard}
            className="min-h-14 animate-fade rounded-control bg-tone-soft px-4 text-body font-semibold text-tone"
          >
            {game.finished ? 'Ausblenden?' : 'Verwerfen?'}
          </button>
        ) : (
          <Button variant="secondary" onClick={() => setConfirming(true)} className="px-4">
            {game.finished ? 'Ausblenden' : 'Verwerfen'}
          </Button>
        )}
      </div>
    </article>
  );
}
