import type { RoundResult } from '../game/types';

interface ProgressBarProps {
  roundCount: number;
  /** Index der laufenden Runde. */
  current: number;
  /** Ergebnisse der bereits aufgelösten Runden. */
  results: readonly RoundResult[];
}

/** Ein Segment pro Runde; aufgelöste Runden tragen die Farbe ihrer Bewertung. */
export function ProgressBar({ roundCount, current, results }: ProgressBarProps) {
  return (
    <div
      className="flex flex-1 items-center gap-1 sm:gap-1.5"
      role="progressbar"
      aria-label="Spielfortschritt"
      aria-valuemin={1}
      aria-valuemax={roundCount}
      aria-valuenow={current + 1}
      aria-valuetext={`Runde ${current + 1} von ${roundCount}`}
    >
      {Array.from({ length: roundCount }, (_, index) => {
        const result = results[index];
        const state = result ? 'done' : index === current ? 'current' : 'upcoming';
        return (
          <span
            key={index}
            data-rating={result?.rating}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
              state === 'done'
                ? 'bg-tone'
                : state === 'current'
                  ? 'animate-[pulse-soft_1.8s_ease-in-out_infinite] bg-white'
                  : 'bg-white/15'
            }`}
          />
        );
      })}
    </div>
  );
}
