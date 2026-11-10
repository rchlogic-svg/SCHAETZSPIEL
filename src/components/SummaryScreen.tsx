import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { formatDeviation, formatPoints, formatPrice } from '../game/format';
import { buildShareText } from '../game/labels';
import { MAX_POINTS, rankFor } from '../game/scoring';
import type { Round, RoundResult } from '../game/types';
import { celebrate } from '../lib/effects';
import { AnimatedNumber } from './AnimatedNumber';
import { Button } from './Button';
import { LogoMark, ReplayIcon, ShareIcon } from './Icons';

interface SummaryScreenProps {
  rounds: readonly Round[];
  results: readonly RoundResult[];
  total: number;
  previousBest: number;
  isNewBest: boolean;
  onReplay: () => void;
  onHome: () => void;
}

type ShareState = 'idle' | 'copied' | 'failed';

const today = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' });

export function SummaryScreen({
  rounds,
  results,
  total,
  previousBest,
  isNewBest,
  onReplay,
  onHome,
}: SummaryScreenProps) {
  const maxTotal = rounds.length * MAX_POINTS;
  const rank = rankFor(total, rounds.length);
  const [shareState, setShareState] = useState<ShareState>('idle');

  useEffect(() => {
    if (!isNewBest) return;
    const timer = window.setTimeout(() => celebrate('big'), 900);
    return () => window.clearTimeout(timer);
  }, [isNewBest]);

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
    <motion.main
      className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-8 px-[max(1.25rem,env(safe-area-inset-left))] pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-8 sm:pt-8 wide:max-w-5xl wide:flex-row wide:items-start wide:gap-14 wide:px-12 wide:pb-12"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <section className="flex flex-col wide:sticky wide:top-8 wide:flex-1" aria-labelledby="summary-title">
        <p className="flex h-10 items-center gap-2.5 text-lg font-bold tracking-[-0.02em]">
          <LogoMark />
          Schätzspiel
        </p>

        <div className="mt-6 flex flex-col items-center text-center wide:mt-12 wide:items-start wide:text-left">
          <motion.p
            aria-hidden="true"
            className="text-7xl leading-none"
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 12, delay: 0.2 }}
          >
            {rank.emoji}
          </motion.p>
          <p className="label mt-5 text-brand">Dein Ergebnis</p>
          <h1 id="summary-title" className="mt-2 text-[clamp(2.25rem,10vw,3.5rem)] font-extrabold leading-none tracking-[-0.04em]">
            {rank.title}
          </h1>

          <p className="mt-5 flex items-baseline gap-2.5">
            <AnimatedNumber
              value={total}
              from={0}
              duration={1.6}
              delay={0.3}
              format={formatPoints}
              fixedDigits
              className="text-[clamp(3.5rem,17vw,5.5rem)] font-extrabold leading-none tracking-[-0.05em] text-brand"
            />
            <span className="text-left text-sm leading-tight text-white/55">
              von {formatPoints(maxTotal)}
              <br />
              Punkten
            </span>
          </p>

          <p className="mt-4 max-w-sm text-pretty text-[1.0625rem] leading-relaxed text-white/65">{rank.line}</p>

          {isNewBest ? (
            <motion.p
              className="mt-5 rounded-full bg-brand px-4 py-2 text-sm font-bold text-ink-950"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 1.1 }}
            >
              🎉 Neuer Bestwert!
            </motion.p>
          ) : (
            previousBest > 0 && (
              <p className="mt-5 rounded-full bg-white/8 px-4 py-2 text-sm text-white/65 ring-1 ring-inset ring-white/10">
                Dein Bestwert: <span className="numeric font-bold text-white">{formatPoints(previousBest)}</span>
              </p>
            )
          )}
        </div>

        <div className="mt-8 flex w-full flex-col gap-2.5 wide:max-w-sm">
          <Button onClick={onReplay}>
            <ReplayIcon />
            Nochmal spielen
          </Button>
          <div className="grid grid-cols-2 gap-2.5">
            <Button variant="secondary" onClick={share}>
              <ShareIcon width={18} height={18} />
              <span aria-live="polite">
                {shareState === 'copied' ? 'Kopiert!' : shareState === 'failed' ? 'Ging nicht' : 'Teilen'}
              </span>
            </Button>
            <Button variant="secondary" onClick={onHome}>
              Zum Start
            </Button>
          </div>
        </div>
      </section>

      {/* Kassenbon mit allen Runden */}
      <motion.section
        aria-label="Alle Runden im Überblick"
        className="wide:flex-1"
        initial={{ opacity: 0, y: 40, rotate: -1.5 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 16, delay: 0.45 }}
      >
        <div className="tag-shadow">
          <div className="receipt px-5 pt-6 font-mono text-[0.8125rem] sm:px-7">
            <header className="text-center">
              <p className="text-base font-bold tracking-[0.3em]">SCHÄTZSPIEL</p>
              <p className="mt-1 text-paper-muted">Was kostet das?</p>
              <p className="mt-1 text-paper-muted">
                {today.format(new Date())} · {rounds.length} Posten
              </p>
            </header>

            <div className="receipt-rule mt-4" />

            <ol>
              {rounds.map((round, index) => {
                const result = results[index];
                if (!result) return null;
                return (
                  <li key={round.question.id} className="flex items-start gap-3 border-b border-dashed border-paper-line/70 py-2.5 last:border-b-0">
                    <span aria-hidden="true" className="w-6 shrink-0 pt-0.5 text-center font-sans text-lg leading-none">
                      {round.question.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-sans text-[0.9375rem] font-bold tracking-[-0.01em]">{round.question.title}</p>
                      <p className="numeric mt-0.5 text-[0.75rem] leading-snug text-paper-muted">
                        Tipp {formatPrice(result.guess)} · Echt {formatPrice(round.question.price)}
                      </p>
                    </div>
                    <div className="numeric shrink-0 text-right">
                      <p className="font-bold">{result.points > 0 ? `+${formatPoints(result.points)}` : '0'}</p>
                      <p className="mt-0.5 text-[0.75rem] text-paper-muted">
                        {result.direction === 'exact' ? '±0 %' : formatDeviation(result.deviation)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>

            <div className="receipt-rule" />

            <p className="numeric flex items-baseline justify-between py-3 text-base font-bold">
              <span className="tracking-[0.2em]">SUMME</span>
              <span>{formatPoints(total)} Pkt</span>
            </p>

            <div className="receipt-rule" />

            <div className="barcode mx-auto mt-5 w-4/5" aria-hidden="true" />
            <p className="mt-2 text-center text-paper-muted">Danke fürs Schätzen!</p>
          </div>
        </div>
      </motion.section>
    </motion.main>
  );
}
