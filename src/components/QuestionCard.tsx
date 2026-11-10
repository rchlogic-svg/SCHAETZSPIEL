import { motion, useMotionValueEvent, type MotionValue } from 'motion/react';
import { useLayoutEffect, useRef } from 'react';
import { CATEGORIES } from '../data/questions';
import { formatAsOf, formatPrice } from '../game/format';
import { roundToSignificant } from '../game/scale';
import type { PriceQuestion } from '../game/types';
import { ExternalIcon } from './Icons';

export interface CardReveal {
  guess: number;
  /** Läuft von 0 nach 1, während der Preis von der Schätzung zum echten Wert zählt. */
  progress: MotionValue<number>;
  settled: boolean;
}

interface QuestionCardProps {
  question: PriceQuestion;
  /** Laufende Nummer, z. B. „03/10“. */
  counter: string;
  reveal?: CardReveal;
}

/** Die Frage als Preisschild: oben gelocht, unten der Abschnitt mit dem Preis. */
export function QuestionCard({ question, counter, reveal }: QuestionCardProps) {
  return (
    <div className="tag-shadow flex flex-1 flex-col">
      <article className="tag relative flex flex-1 flex-col" data-category={question.category}>
        <span className="tag-eyelet" aria-hidden="true" />

        <header className="flex shrink-0 items-center justify-between px-5 pt-3.5 short:px-4 short:pt-2.5">
          <span className="label rounded-full bg-accent-ink/10 px-2.5 py-1 text-accent-ink">
            {CATEGORIES[question.category].label}
          </span>
          <span className="label text-paper-muted">{counter}</span>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center gap-[clamp(0.5rem,1.8dvh,1.25rem)] px-6 py-3 text-center short:flex-row short:gap-3.5 short:px-4 short:py-2 short:text-left">
          <motion.div
            aria-hidden="true"
            className="grid size-[clamp(3.75rem,11dvh,7.5rem)] shrink-0 place-items-center rounded-[28%] bg-linear-to-br from-accent/30 to-accent-2/30 text-[clamp(2.1rem,6.4dvh,4.4rem)] leading-none short:size-14 short:text-[2rem]"
            initial={{ scale: 0.4, rotate: -14 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 15, delay: 0.18 }}
          >
            <motion.span
              className="block"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
            >
              {question.emoji}
            </motion.span>
          </motion.div>

          <div className="min-w-0">
            <h2 className="text-balance text-[clamp(1.3rem,5.4vw,2rem)] font-bold leading-[1.1] tracking-[-0.025em] short:text-[1.2rem] wide:text-[clamp(1.5rem,2.6vw,2.25rem)] short:wide:text-[1.2rem]">
              {question.question}
            </h2>
            <p className="mt-1.5 text-balance text-[0.9375rem] leading-snug text-paper-muted short:mt-1 short:text-[0.8125rem] sm:text-base short:sm:text-[0.8125rem]">
              {question.detail}
            </p>
          </div>
        </div>

        <footer className="tag-stub flex shrink-0 flex-col items-center justify-center gap-1 text-center">
          {reveal ? (
            <RevealedPrice actual={question.price} reveal={reveal} />
          ) : (
            <p className="flex gap-2 text-4xl font-extrabold leading-none text-paper-line short:text-3xl" aria-hidden="true">
              {[0, 1, 2].map((dot) => (
                <span key={dot} className="animate-[pulse-soft_1.6s_ease-in-out_infinite]" style={{ animationDelay: `${dot * 0.2}s` }}>
                  ?
                </span>
              ))}
            </p>
          )}

          {reveal?.settled ? (
            <motion.p
              className="line-clamp-2 max-w-full px-1 font-mono text-[0.6875rem] leading-tight text-paper-muted short:line-clamp-1"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              Quelle:{' '}
              <a
                href={question.source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-paper-ink underline decoration-paper-line decoration-2 underline-offset-2 hover:decoration-accent-ink"
              >
                {question.source.name}
                <ExternalIcon width={11} height={11} className="ml-0.5 inline-block align-[-1px]" />
              </a>{' '}
              · Stand: {formatAsOf(question.source.asOf)}
            </motion.p>
          ) : (
            <p className="label text-paper-muted">Echter Preis</p>
          )}
        </footer>
      </article>
    </div>
  );
}

/** Zählt sichtbar von der Schätzung zum echten Preis und „stempelt“ ihn am Ende ein. */
function RevealedPrice({ actual, reveal }: { actual: number; reveal: CardReveal }) {
  const node = useRef<HTMLSpanElement>(null);
  const { guess, progress, settled } = reveal;

  const render = (p: number) => {
    if (!node.current) return;
    // Geometrisch interpolieren – passt zur logarithmischen Skala des Sliders.
    const value = p >= 1 ? actual : roundToSignificant(guess * Math.pow(actual / guess, p), 3, 'round');
    node.current.textContent = formatPrice(value);
  };

  useMotionValueEvent(progress, 'change', render);
  useLayoutEffect(() => render(progress.get()));

  return (
    <motion.p
      className="numeric text-[clamp(1.9rem,8.5vw,2.75rem)] font-extrabold leading-none tracking-[-0.03em] short:text-3xl wide:text-[2.75rem]"
      animate={settled ? { scale: [1, 1.16, 1], color: ['#16141d', 'var(--accent-ink)', '#16141d'] } : { scale: 1 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      aria-live="polite"
    >
      <span className="sr-only">Echter Preis: </span>
      <span ref={node} />
    </motion.p>
  );
}
