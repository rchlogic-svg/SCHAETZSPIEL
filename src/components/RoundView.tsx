import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { formatPrice } from '../game/format';
import { initialValue, nudgeValue } from '../game/scale';
import type { Round, RoundResult } from '../game/types';
import { celebrate, haptic } from '../lib/effects';
import { Button } from './Button';
import { Digits } from './Digits';
import { ArrowRightIcon, MinusIcon, PlusIcon } from './Icons';
import { PriceSlider } from './PriceSlider';
import { QuestionCard } from './QuestionCard';
import { RevealPanel } from './RevealPanel';

interface RoundViewProps {
  round: Round;
  index: number;
  roundCount: number;
  /** Vorhanden, sobald die Schätzung abgegeben wurde. */
  result: RoundResult | undefined;
  /** Wahr, sobald die Enthüllung zu Ende gelaufen ist. */
  settled: boolean;
  onSubmit: (guess: number) => void;
  onSettled: () => void;
  onNext: () => void;
}

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export function RoundView({ round, index, roundCount, result, settled, onSubmit, onSettled, onNext }: RoundViewProps) {
  const { question, range } = round;
  const [guess, setGuess] = useState(() => initialValue(range));
  const [touched, setTouched] = useState(false);
  const progress = useMotionValue(0);
  const reduceMotion = useReducedMotion();
  const isLastRound = index === roundCount - 1;

  const changeGuess = useCallback((value: number) => {
    setGuess(value);
    setTouched(true);
  }, []);

  const submit = () => {
    if (!touched || result) return;
    haptic(12);
    onSubmit(guess);
  };

  // Enthüllung: Der Preis zählt von der Schätzung zum echten Wert. Je weiter
  // die Schätzung daneben liegt, desto länger dauert es – das hält die Spannung.
  useEffect(() => {
    if (!result) return;

    const finish = () => {
      onSettled();
      if (result.rating === 'perfect') {
        celebrate();
        haptic([18, 50, 18]);
      }
    };

    if (reduceMotion) {
      progress.set(1);
      finish();
      return;
    }

    const distance = Math.abs(Math.log(question.price / result.guess));
    const controls = animate(progress, 1, {
      delay: 0.35,
      duration: 0.8 + Math.min(1.4, distance * 0.8),
      ease: [0.22, 1, 0.36, 1],
      onComplete: finish,
    });
    return () => controls.stop();
  }, [result, question.price, progress, reduceMotion, onSettled]);

  // Eingabetaste: Schätzung abgeben bzw. weiter – außer ein Button hat den Fokus.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.repeat) return;
      if (event.target instanceof Element && event.target.closest('button, a, dialog')) return;
      if (!result) submit();
      else if (settled) onNext();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const reveal = result ? { progress, settled } : undefined;

  return (
    <div className="flex flex-1 flex-col justify-center gap-2.5 sm:gap-5 wide:min-h-0 wide:flex-row wide:items-center wide:gap-[clamp(1.5rem,4vw,4rem)]">
      {/* Das Preisschild schwingt wie an einer Schnur herein. */}
      <motion.div
        className="flex max-h-[30rem] flex-1 flex-col sm:max-h-[34rem] wide:h-[min(32rem,100%)] wide:max-h-none"
        style={{ transformOrigin: '50% 0%' }}
        initial={{ opacity: 0, y: -36, rotate: -7 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        exit={{ opacity: 0, x: -48, rotate: -5, transition: { duration: 0.22, ease: 'easeIn' } }}
        transition={{ type: 'spring', stiffness: 170, damping: 13, mass: 0.9 }}
      >
        <QuestionCard
          question={question}
          counter={`${String(index + 1).padStart(2, '0')}/${String(roundCount).padStart(2, '0')}`}
          reveal={reveal && result ? { guess: result.guess, ...reveal } : undefined}
        />
      </motion.div>

      <motion.section
        aria-label="Schätzung"
        data-category={question.category}
        data-rating={settled ? result?.rating : undefined}
        className="shrink-0 rounded-[1.75rem] bg-white/[0.055] p-4 ring-1 ring-inset ring-white/10 short:p-3 sm:p-6 wide:w-full wide:max-w-md wide:flex-1"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16, transition: { duration: 0.2 } }}
        transition={{ duration: 0.45, ease: EASE_OUT, delay: 0.08 }}
      >
        <div className="relative h-[4.5rem] short:h-[3.75rem] sm:h-24">
          <AnimatePresence initial={false} mode="wait">
            {result && settled ? (
              <RevealPanel key="result" result={result} />
            ) : (
              <motion.div
                key="guess"
                className="absolute inset-0 flex flex-col items-center justify-center gap-1.5"
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <span className="label text-white/50">{result ? 'Dein Tipp' : 'Deine Schätzung'}</span>
                <output
                  aria-label={formatPrice(guess)}
                  className={`text-[clamp(2.25rem,11vw,3.5rem)] font-extrabold leading-none tracking-[-0.035em] transition-colors duration-300 short:text-4xl wide:text-[3.25rem] short:wide:text-4xl ${
                    result ? 'text-white/55' : 'text-white'
                  }`}
                >
                  <Digits text={formatPrice(guess)} />
                </output>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <PriceSlider
          range={range}
          value={guess}
          onChange={changeGuess}
          reveal={reveal ? { actual: question.price, ...reveal } : undefined}
        />

        {/* Unterste Zeile, gut mit dem Daumen erreichbar: Feinschritte und Abgabe. */}
        <div className="mt-3 flex h-14 items-center gap-2.5 short:mt-2 short:h-12">
          {!result ? (
            <>
              <NudgeButton label="Etwas weniger" onStep={() => changeGuess(nudgeValue(guess, -1, range))}>
                <MinusIcon />
              </NudgeButton>
              <Button onClick={submit} disabled={!touched} className="min-w-0 flex-1 px-3!">
                {touched ? 'Tipp abgeben' : 'Regler bewegen'}
              </Button>
              <NudgeButton label="Etwas mehr" onStep={() => changeGuess(nudgeValue(guess, 1, range))}>
                <PlusIcon />
              </NudgeButton>
            </>
          ) : settled ? (
            <motion.div
              className="w-full"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: EASE_OUT, delay: 0.2 }}
            >
              <Button onClick={onNext}>
                {isLastRound ? 'Ergebnis ansehen' : 'Weiter'}
                <ArrowRightIcon />
              </Button>
            </motion.div>
          ) : (
            <p className="w-full animate-[pulse-soft_1.2s_ease-in-out_infinite] text-center text-[0.9375rem] text-white/60">
              Der echte Preis ist …
            </p>
          )}
        </div>
      </motion.section>
    </div>
  );
}

interface NudgeButtonProps {
  label: string;
  onStep: () => void;
  children: ReactNode;
}

/** Feinschritt-Taste. Gedrückt halten wiederholt den Schritt. */
function NudgeButton({ label, onStep, children }: NudgeButtonProps) {
  const step = useRef(onStep);
  step.current = onStep;
  const timers = useRef<{ delay?: number; repeat?: number }>({});

  const stop = useCallback(() => {
    window.clearTimeout(timers.current.delay);
    window.clearInterval(timers.current.repeat);
    timers.current = {};
  }, []);

  useEffect(() => stop, [stop]);

  const start = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    stop();
    step.current();
    timers.current.delay = window.setTimeout(() => {
      timers.current.repeat = window.setInterval(() => step.current(), 55);
    }, 380);
  };

  return (
    <button
      type="button"
      aria-label={label}
      className="grid aspect-square h-full shrink-0 select-none place-items-center rounded-2xl bg-white/10 text-white ring-1 ring-inset ring-white/12 transition-colors hover:bg-white/16 active:bg-white/24"
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(event) => event.preventDefault()}
      // Tastatur (Enter/Leertaste) löst nur ein click-Ereignis ohne Zeigerdaten aus.
      onClick={(event) => {
        if (event.detail === 0) step.current();
      }}
    >
      {children}
    </button>
  );
}
