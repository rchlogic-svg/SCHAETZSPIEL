import { toneFor } from '../game/labels';
import type { RoundResult } from '../game/types';

interface ProgressBarProps {
  roundCount: number;
  /** Index der laufenden Runde. */
  current: number;
  /** Ergebnisse der bereits aufgelösten Runden. */
  results: readonly RoundResult[];
}

/**
 * Ein Segment pro Frage: erledigte tragen die Signalfarbe ihrer Bewertung,
 * die laufende ist schwarz, kommende sind blass. Den genauen Stand nennt
 * zusätzlich der Text „Frage x von y“ daneben.
 */
export function ProgressBar({ roundCount, current, results }: ProgressBarProps) {
  return (
    <div
      className="flex items-center gap-1"
      role="progressbar"
      aria-label="Spielfortschritt"
      aria-valuemin={1}
      aria-valuemax={roundCount}
      aria-valuenow={current + 1}
      aria-valuetext={`Frage ${current + 1} von ${roundCount}`}
    >
      {Array.from({ length: roundCount }, (_, index) => {
        const result = results[index];
        const color = result ? 'bg-tone' : index === current ? 'bg-ink' : 'bg-line-strong';
        return (
          <span
            key={index}
            data-tone={result ? toneFor(result.rating) : undefined}
            className={`h-1.5 min-w-1 flex-1 rounded-full transition-colors duration-300 ${color}`}
          />
        );
      })}
    </div>
  );
}
