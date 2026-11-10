import {
  IconArrowDown,
  IconArrowUp,
  IconAward,
  IconCheck,
  IconExternalLink,
  IconRefresh,
  IconShare2,
} from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import { formatAsOf, formatDeviation, formatPoints, formatPrice } from '../game/format';
import { buildShareText, describeDeviation, toneFor } from '../game/labels';
import { MAX_POINTS, rankFor } from '../game/scoring';
import { pickHighlights } from '../game/summary';
import type { Round, RoundResult } from '../game/types';
import { AnimatedNumber } from './AnimatedNumber';
import { AppHeader } from './AppHeader';
import { Button } from './Button';
import { PictogramTile } from './Pictogram';

interface SummaryScreenProps {
  rounds: readonly Round[];
  results: readonly RoundResult[];
  total: number;
  previousBest: number;
  isNewBest: boolean;
  onReplay: () => void;
  onHome: () => void;
  onHelp: () => void;
}

type ShareState = 'idle' | 'copied' | 'failed';

export function SummaryScreen({
  rounds,
  results,
  total,
  previousBest,
  isNewBest,
  onReplay,
  onHome,
  onHelp,
}: SummaryScreenProps) {
  const maxTotal = rounds.length * MAX_POINTS;
  const rank = rankFor(total, rounds.length);
  const highlights = pickHighlights(results);
  const [shareState, setShareState] = useState<ShareState>('idle');
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (shareState === 'idle') return;
    const timer = window.setTimeout(() => setShareState('idle'), 2200);
    return () => window.clearTimeout(timer);
  }, [shareState]);

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}`;
    const text = `${buildShareText(results, total, maxTotal, rank.title)}\n${url}`;

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ text });
        return;
      } catch (error) {
        // Abbrechen des Teilen-Dialogs ist kein Fehler.
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      setShareState('copied');
    } catch {
      setShareState('failed');
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl animate-fade flex-col px-[max(1rem,env(safe-area-inset-left))] pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-6 sm:pb-10 sm:pt-4 lg:max-w-5xl lg:px-8">
      <AppHeader onHome={onHome} onHelp={onHelp} />

      <main className="flex flex-col gap-6 py-5 sm:gap-8 lg:grid lg:grid-cols-[1fr_1.1fr] lg:items-start lg:gap-14 lg:py-10">
        <section aria-labelledby="summary-title" className="flex flex-col gap-5 lg:sticky lg:top-8">
          <div>
            <p className="label text-accent">Ergebnis · Freies Spiel</p>
            <h1
              id="summary-title"
              ref={heading}
              tabIndex={-1}
              aria-label={`${formatPoints(total)} von ${formatPoints(maxTotal)} Punkten`}
              className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1"
            >
              <AnimatedNumber
                value={total}
                from={0}
                duration={1200}
                delay={150}
                format={formatPoints}
                className="text-display tabular-nums"
              />
              <span className="text-body-lg font-normal tracking-normal text-ink-2">
                von {formatPoints(maxTotal)} Punkten
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <PictogramTile name={rank.icon} className="w-14" />
            <div className="min-w-0">
              <p className="text-heading">{rank.title}</p>
              <p className="text-body text-ink-2">{rank.line}</p>
            </div>
          </div>

          {isNewBest ? (
            <p
              data-tone="good"
              className="flex items-center gap-2 self-start rounded-control bg-tone-soft px-3 py-2 text-small font-semibold text-tone"
            >
              <IconAward size={20} stroke={1.75} aria-hidden="true" />
              Neuer Bestwert auf diesem Gerät
            </p>
          ) : (
            previousBest > 0 && (
              <p className="text-small text-ink-2">
                Dein Bestwert: <span className="font-semibold tabular-nums text-ink">{formatPoints(previousBest)}</span>{' '}
                Punkte
              </p>
            )
          )}

          {highlights && (
            <dl className="card divide-y divide-line">
              <Highlight label="Bester Tipp" round={rounds[highlights.best]} result={results[highlights.best]} />
              <Highlight
                label="Weitester daneben"
                round={rounds[highlights.worst]}
                result={results[highlights.worst]}
              />
            </dl>
          )}

          <div className="flex flex-col gap-2">
            <Button onClick={onReplay}>
              <IconRefresh size={20} stroke={2} aria-hidden="true" />
              Nochmal spielen
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" size="md" onClick={share}>
                {shareState === 'copied' ? (
                  <IconCheck size={20} stroke={2} aria-hidden="true" />
                ) : (
                  <IconShare2 size={20} stroke={1.75} aria-hidden="true" />
                )}
                <span aria-live="polite">
                  {shareState === 'copied' ? 'Kopiert' : shareState === 'failed' ? 'Nicht möglich' : 'Teilen'}
                </span>
              </Button>
              <Button variant="secondary" size="md" onClick={onHome}>
                Startseite
              </Button>
            </div>
          </div>
        </section>

        <section aria-labelledby="rounds-title" className="card overflow-hidden">
          <h2 id="rounds-title" className="label px-4 pt-5 text-ink-3 sm:px-6">
            Alle Fragen
          </h2>

          <ol className="mt-1">
            {rounds.map((round, index) => {
              const result = results[index];
              if (!result) return null;
              const { question } = round;
              return (
                <li
                  key={question.id}
                  data-tone={toneFor(result.rating)}
                  className="flex items-start gap-3 border-b border-line px-4 py-3 sm:gap-4 sm:px-6"
                >
                  <PictogramTile name={question.icon} className="mt-0.5 w-11" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="min-w-0 text-body font-semibold">{question.title}</h3>
                      <p className="shrink-0 text-body font-semibold tabular-nums">
                        {result.points > 0 ? `+${formatPoints(result.points)}` : '0'}
                      </p>
                    </div>
                    <div className="flex items-baseline justify-between gap-3 text-small text-ink-2">
                      <p className="min-w-0 tabular-nums">
                        Tipp {formatPrice(result.guess)} · Echt {formatPrice(question.price)}
                      </p>
                      <p className="flex shrink-0 items-center gap-0.5 font-semibold tabular-nums text-tone">
                        {result.direction === 'high' && <IconArrowUp size={16} stroke={2} aria-hidden="true" />}
                        {result.direction === 'low' && <IconArrowDown size={16} stroke={2} aria-hidden="true" />}
                        <span aria-hidden="true">
                          {result.direction === 'exact' ? 'genau' : formatDeviation(result.deviation)}
                        </span>
                        <span className="sr-only">{describeDeviation(result)}</span>
                      </p>
                    </div>
                    <a
                      href={question.source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="-mx-2 inline-flex min-h-11 max-w-full items-center rounded-control px-2 text-small text-ink-3 transition-colors duration-150 hover:bg-surface-2 hover:text-ink-2"
                    >
                      <span>
                        Quelle:{' '}
                        <span className="underline decoration-line-strong decoration-1 underline-offset-[3px]">
                          {question.source.name}
                        </span>{' '}
                        · Stand {formatAsOf(question.source.asOf)}
                        <IconExternalLink size={15} stroke={1.75} className="ml-1 inline-block align-[-2px]" aria-hidden="true" />
                      </span>
                      <span className="sr-only">(öffnet in einem neuen Tab)</span>
                    </a>
                  </div>
                </li>
              );
            })}
          </ol>

          <p className="flex items-baseline justify-between gap-3 px-4 py-4 text-heading sm:px-6">
            <span>Summe</span>
            <span className="tabular-nums">{formatPoints(total)} Punkte</span>
          </p>
        </section>
      </main>
    </div>
  );
}

interface HighlightProps {
  label: string;
  round: Round | undefined;
  result: RoundResult | undefined;
}

/** Hebt eine einzelne Runde hervor, etwa den besten Tipp des Spiels. */
function Highlight({ label, round, result }: HighlightProps) {
  if (!round || !result) return null;
  return (
    <div data-tone={toneFor(result.rating)} className="px-4 py-3">
      <dt className="label text-ink-3">{label}</dt>
      <dd className="mt-0.5 flex flex-wrap items-baseline justify-between gap-x-4">
        <span className="text-body font-semibold">{round.question.title}</span>
        <span className="text-small font-semibold tabular-nums text-tone">
          {result.direction === 'exact' ? 'genau getroffen' : `${formatDeviation(result.deviation)} Abweichung`}
        </span>
      </dd>
    </div>
  );
}
