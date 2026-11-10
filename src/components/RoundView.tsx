import { IconArrowRight, IconMinus, IconPlus } from '@tabler/icons-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { formatPrice } from '../game/format';
import { toneFor } from '../game/labels';
import { initialValue, nudgeValue } from '../game/scale';
import type { Round, RoundResult } from '../game/types';
import { haptic } from '../lib/effects';
import { createSignal, easeOutQuint, tween } from '../lib/tween';
import { useReducedMotion } from '../lib/useReducedMotion';
import { Button } from './Button';
import { PriceSlider } from './PriceSlider';
import { QuestionCard } from './QuestionCard';
import { RevealPanel } from './RevealPanel';

interface RoundViewProps {
  round: Round;
  /** Vorhanden, sobald der Tipp abgegeben wurde. */
  result: RoundResult | undefined;
  /** Wahr, sobald die Enthüllung zu Ende gelaufen ist. */
  settled: boolean;
  isLastRound: boolean;
  onSubmit: (guess: number) => void;
  onSettled: () => void;
  onNext: () => void;
}

/**
 * Eine Spielrunde. Von oben nach unten beantwortet der Bildschirm vier Fragen:
 * Was wird geschätzt (Preisschild), was ist zu tun (Hinweis über dem Betrag),
 * wie weit ist man (Kopfzeile) und wie gibt man ab (Button ganz unten).
 */
export function RoundView({ round, result, settled, isLastRound, onSubmit, onSettled, onNext }: RoundViewProps) {
  const { question, range } = round;
  const [guess, setGuess] = useState(() => initialValue(range));
  const [touched, setTouched] = useState(false);
  const reduceMotion = useReducedMotion();

  const root = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  /** Fortschritt der Enthüllung, 0–1. */
  const progress = useMemo(() => createSignal(0), []);

  const changeGuess = useCallback((value: number) => {
    setGuess(value);
    setTouched(true);
  }, []);

  const submit = () => {
    if (!touched || result) return;
    haptic(12);
    onSubmit(guess);
  };

  // Neue Frage: Fokus auf die Überschrift, damit Screenreader sie vorlesen
  // und die Tabulatortaste beim Regler weitermacht.
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);

  // Der Regler liest den Fortschritt als CSS-Variable – ohne React-Render pro Bild.
  useEffect(() => {
    return progress.subscribe((value) => root.current?.style.setProperty('--reveal', String(value)));
  }, [progress]);

  // Enthüllung: Der Preis zählt vom Tipp zum echten Wert. Je weiter der Tipp
  // daneben liegt, desto länger dauert es – das hält die Spannung.
  useEffect(() => {
    if (!result) return;

    if (reduceMotion) {
      progress.set(1);
      onSettled();
      return;
    }

    const distance = Math.abs(Math.log(question.price / result.guess));
    return tween({
      delay: 300,
      duration: 700 + Math.min(1300, distance * 750),
      ease: easeOutQuint,
      onUpdate: progress.set,
      onComplete: onSettled,
    });
  }, [result, question.price, progress, reduceMotion, onSettled]);

  // Nach der Auflösung liegt der Fokus auf „Weiter“ – Tastatur und Screenreader
  // landen direkt bei der nächsten Aktion.
  useEffect(() => {
    if (settled) nextButton.current?.focus({ preventScroll: true });
  }, [settled]);

  // Eingabetaste: Tipp abgeben bzw. weiter – außer ein Button oder Link hat den
  // Fokus, denn der reagiert selbst auf die Taste.
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

  const tone = result && settled ? toneFor(result.rating) : undefined;

  return (
    <div
      ref={root}
      className="flex flex-1 flex-col justify-center gap-2.5 sm:gap-4 split:flex-row split:items-center lg:split:gap-8"
      style={{ '--reveal': 0 } as CSSProperties}
    >
      {/* Außen: nimmt den freien Platz. Innen: wächst nur bis zu einer angenehmen Höhe. */}
      <div className="flex max-h-[32rem] flex-1 animate-enter flex-col split:max-h-none split:justify-center split:self-stretch">
        <div className="flex flex-1 flex-col split:max-h-[30rem]">
          <QuestionCard
            question={question}
            headingRef={heading}
            reveal={result ? { guess: result.guess, progress, settled } : undefined}
          />
        </div>
      </div>

      <section
        aria-label="Dein Tipp"
        data-tone={tone}
        className="card @container flex shrink-0 animate-enter flex-col gap-2 p-4 short:gap-1.5 short:p-3 sm:gap-3 sm:p-6 short:sm:gap-1.5 short:sm:p-3 split:flex-1"
      >
        <div className="flex min-h-[4.5rem] flex-col justify-center short:min-h-14 sm:min-h-20 short:sm:min-h-14">
          {result && settled ? (
            <RevealPanel result={result} />
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-center">
              {touched || result ? (
                <p className="label text-ink-3">Dein Tipp</p>
              ) : (
                // Die Anweisung steht dort, wo der Blick zuerst hinfällt.
                <p className="text-small font-medium text-ink-2">Zieh den Regler auf deinen Tipp</p>
              )}
              <output
                className={`text-figure-xl tabular-nums transition-colors duration-300 short:text-figure-lg ${result ? 'text-ink-3' : 'text-ink'}`}
              >
                {formatPrice(guess)}
              </output>
            </div>
          )}
        </div>

        <PriceSlider
          range={range}
          value={guess}
          onChange={changeGuess}
          reveal={result ? { actual: question.price, settled } : undefined}
        />

        {/* Unterste Zeile, gut mit dem Daumen erreichbar: Feinschritte und Abgabe. */}
        <div className="flex min-h-14 items-stretch gap-2 short:min-h-12">
          {!result ? (
            <>
              <NudgeButton label="Etwas weniger" onStep={() => changeGuess(nudgeValue(guess, -1, range))}>
                <IconMinus size={22} stroke={2} aria-hidden="true" />
              </NudgeButton>
              <Button onClick={submit} disabled={!touched} className="min-w-0 flex-1 px-3 short:min-h-12">
                Tipp abgeben
              </Button>
              <NudgeButton label="Etwas mehr" onStep={() => changeGuess(nudgeValue(guess, 1, range))}>
                <IconPlus size={22} stroke={2} aria-hidden="true" />
              </NudgeButton>
            </>
          ) : (
            settled && (
              <Button ref={nextButton} onClick={onNext} className="animate-enter short:min-h-12">
                {isLastRound ? 'Ergebnis ansehen' : 'Nächste Frage'}
                <IconArrowRight size={20} stroke={2} aria-hidden="true" />
              </Button>
            )
          )}
        </div>
      </section>
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
      title={label}
      className="grid w-14 shrink-0 select-none place-items-center rounded-control bg-surface text-ink shadow-[inset_0_0_0_1px_var(--line-strong)] transition-colors duration-150 hover:bg-surface-2 active:bg-surface-3 short:w-12 @max-[17rem]:w-11"
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
