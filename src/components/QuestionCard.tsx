import { IconExternalLink } from '@tabler/icons-react';
import { useEffect, useRef, type Ref } from 'react';
import { CATEGORIES } from '../data/questions';
import { formatAsOf, formatPrice } from '../game/format';
import { roundToSignificant } from '../game/scale';
import type { PriceQuestion } from '../game/types';
import type { Signal } from '../lib/tween';
import { PictogramTile } from './Pictogram';

export interface CardReveal {
  guess: number;
  /** Läuft von 0 nach 1, während der Preis vom Tipp zum echten Wert zählt. */
  progress: Signal;
  settled: boolean;
}

interface QuestionCardProps {
  question: PriceQuestion;
  /** Die Frage ist die Hauptüberschrift des Spielbildschirms. */
  headingRef?: Ref<HTMLHeadingElement>;
  reveal?: CardReveal;
}

/**
 * Die Frage als Preisschild: oben gelocht, unten – hinter der Abrisskante –
 * der Abschnitt, auf dem nach dem Tipp der echte Preis erscheint.
 */
export function QuestionCard({ question, headingRef, reveal }: QuestionCardProps) {
  return (
    <article className="tag flex flex-1 flex-col">
      <span className="tag-hole" aria-hidden="true" />

      <div className="flex flex-1 items-center px-5 pb-3.5 pt-8 short:px-4 short:pb-2 short:pt-7 roomy:px-8 roomy:pb-6 roomy:pt-12">
        <div className="flex w-full items-start gap-4 roomy:flex-col roomy:items-center roomy:gap-5 roomy:text-center">
          <PictogramTile name={question.icon} className="w-14 short:w-12 roomy:w-24" />
          <div className="min-w-0 flex-1">
            <p className="label text-ink-3">{CATEGORIES[question.category].label}</p>
            <h1 ref={headingRef} tabIndex={-1} className="mt-1.5 text-pretty text-title short:mt-1 short:text-heading roomy:text-balance">
              {question.question}
            </h1>
            <p className="mt-1.5 text-pretty text-small text-ink-2 short:mt-1 roomy:mt-2 roomy:text-balance roomy:text-body">
              {question.detail}
            </p>
          </div>
        </div>
      </div>

      <footer className="tag-stub flex shrink-0 flex-col items-center pb-1.5 pt-3 text-center short:pb-0.5 short:pt-2 roomy:pb-3 roomy:pt-5">
        {reveal ? (
          <RevealedPrice actual={question.price} reveal={reveal} />
        ) : (
          <p className="text-figure-lg tracking-[0.12em] text-line-strong" aria-hidden="true">
            ???
          </p>
        )}

        {/* Diese Zeile behält ihre Höhe, damit beim Aufdecken nichts springt. */}
        {reveal?.settled ? (
          <a
            href={question.source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 flex min-h-11 max-w-full animate-fade items-center rounded-control px-3 py-1 text-small text-ink-2 transition-colors duration-150 hover:bg-surface-2"
          >
            <span className="text-balance">
              Quelle:{' '}
              <span className="font-semibold text-ink underline decoration-line-strong decoration-1 underline-offset-[3px]">
                {question.source.name}
              </span>{' '}
              · Stand {formatAsOf(question.source.asOf)}
              <IconExternalLink size={15} stroke={1.75} className="ml-1 inline-block align-[-2px]" aria-hidden="true" />
            </span>
            <span className="sr-only">(öffnet die Quelle in einem neuen Tab)</span>
          </a>
        ) : (
          <p className="mt-0.5 flex min-h-11 items-center text-small text-ink-3">
            {reveal ? 'Der echte Preis ist …' : 'Der echte Preis erscheint nach deinem Tipp'}
          </p>
        )}
      </footer>
    </article>
  );
}

/** Zählt sichtbar vom Tipp zum echten Preis. */
function RevealedPrice({ actual, reveal }: { actual: number; reveal: CardReveal }) {
  const node = useRef<HTMLSpanElement>(null);
  const { guess, progress, settled } = reveal;

  useEffect(() => {
    const render = (p: number) => {
      if (!node.current) return;
      // Geometrisch interpolieren – passt zur logarithmischen Skala des Reglers.
      const value = p >= 1 ? actual : roundToSignificant(guess * Math.pow(actual / guess, p), 3, 'round');
      node.current.textContent = formatPrice(value);
    };
    render(progress.get());
    return progress.subscribe(render);
  }, [actual, guess, progress]);

  return (
    <p className={`text-figure-lg tabular-nums ${settled ? 'animate-pop' : ''}`}>
      <span ref={node} aria-hidden="true" />
      {/* Für Screenreader erst vorlesen, wenn der Preis feststeht. */}
      <span className="sr-only" role="status">
        {settled ? `Echter Preis: ${formatPrice(actual)}` : ''}
      </span>
    </p>
  );
}
