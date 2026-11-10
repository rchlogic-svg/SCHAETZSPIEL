import { motion, useTransform, type MotionValue } from 'motion/react';
import {
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import { formatAxis, formatPrice } from '../game/format';
import { nudgeValue, positionToValue, snapValue, ticksFor, valueToPosition } from '../game/scale';
import type { SliderRange } from '../game/types';

export interface SliderReveal {
  /** Der echte Preis. */
  actual: number;
  /** Läuft von 0 nach 1, während der echte Preis enthüllt wird. */
  progress: MotionValue<number>;
  settled: boolean;
}

interface PriceSliderProps {
  range: SliderRange;
  value: number;
  onChange: (value: number) => void;
  /** Gesetzt, sobald die Schätzung abgegeben ist – der Slider ist dann gesperrt. */
  reveal?: SliderReveal;
}

/** Trifft der Finger den Griff in diesem Umkreis (px), springt er beim Anfassen nicht. */
const GRAB_RADIUS = 30;

/** Beschriftete Marken halten diesen Abstand zu den Rändern und zueinander. */
const LABEL_GAP = 0.17;

const percent = (position: number) => `${position * 100}%`;

export function PriceSlider({ range, value, onChange, reveal }: PriceSliderProps) {
  const rail = useRef<HTMLDivElement>(null);
  const grabOffset = useRef(0);
  const [dragging, setDragging] = useState(false);

  const locked = reveal !== undefined;
  const position = valueToPosition(value, range);
  const ticks = useMemo(() => ticksFor(range), [range]);

  const labelledTicks = useMemo(() => {
    const kept: typeof ticks = [];
    for (const tick of ticks) {
      if (!tick.major) continue;
      const previous = kept[kept.length - 1]?.position ?? 0;
      if (tick.position - previous < LABEL_GAP || 1 - tick.position < LABEL_GAP) continue;
      kept.push(tick);
    }
    return kept;
  }, [ticks]);

  const moveTo = (nextPosition: number) => {
    onChange(snapValue(positionToValue(nextPosition, range), range));
  };

  const moveToPointer = (clientX: number) => {
    const rect = rail.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    moveTo((clientX - grabOffset.current - rect.left) / rect.width);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (locked || (event.pointerType === 'mouse' && event.button !== 0)) return;
    const rect = rail.current?.getBoundingClientRect();
    if (!rect) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    // Wer den Griff anfasst, zieht ihn von dort weiter; ein Tipp daneben holt ihn heran.
    const distance = event.clientX - (rect.left + position * rect.width);
    grabOffset.current = Math.abs(distance) <= GRAB_RADIUS ? distance : 0;
    setDragging(true);
    moveToPointer(event.clientX);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (locked || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    moveToPointer(event.clientX);
  };

  const endDrag = () => setDragging(false);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (locked) return;
    const fine = event.shiftKey;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        if (fine) onChange(nudgeValue(value, 1, range));
        else moveTo(position + 0.01);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        if (fine) onChange(nudgeValue(value, -1, range));
        else moveTo(position - 0.01);
        break;
      case 'PageUp':
        moveTo(position + 0.1);
        break;
      case 'PageDown':
        moveTo(position - 0.1);
        break;
      case 'Home':
        onChange(range.min);
        break;
      case 'End':
        onChange(range.max);
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  const actualPosition = reveal ? valueToPosition(reveal.actual, range) : position;
  const guessIsLeft = position <= actualPosition;

  return (
    <div className="select-none">
      <div
        role="slider"
        tabIndex={locked ? -1 : 0}
        aria-label="Deine Schätzung"
        aria-orientation="horizontal"
        aria-valuemin={range.min}
        aria-valuemax={range.max}
        aria-valuenow={value}
        aria-valuetext={formatPrice(value)}
        aria-disabled={locked}
        className="relative h-12 touch-none rounded-full"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
        onKeyDown={handleKeyDown}
      >
        {/* Schiene: optisch etwas breiter als der Wertebereich, damit der Griff nie übersteht. */}
        <div className="absolute inset-x-2 top-1/2 h-3 -translate-y-1/2 overflow-hidden rounded-full bg-white/12">
          <div className="absolute inset-x-2 inset-y-0">
            <div
              className={`absolute inset-y-0 -left-2 bg-linear-to-r from-accent to-brand transition-opacity duration-500 ${
                locked ? 'opacity-25' : 'opacity-100'
              }`}
              style={{ width: `calc(${percent(position)} + 0.5rem)` }}
            />
            {reveal && (
              <RevealGap from={position} to={actualPosition} progress={reveal.progress} settled={reveal.settled} />
            )}
          </div>
        </div>

        <div ref={rail} className="pointer-events-none absolute inset-x-4 inset-y-0">
          {ticks.map((tick) => (
            <span
              key={tick.value}
              className={`absolute top-1/2 w-px -translate-x-1/2 -translate-y-1/2 rounded-full ${
                tick.major ? 'h-3 bg-white/45' : 'h-1.5 bg-white/25'
              }`}
              style={{ left: percent(tick.position) }}
            />
          ))}

          {/* Griff – nach der Abgabe schrumpft er zur Markierung „Du“. */}
          <div
            className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white transition-[width,height,box-shadow] duration-300 ease-out ${
              locked
                ? 'size-4 shadow-[0_0_0_4px_var(--color-ink-900)]'
                : dragging
                  ? 'size-9 shadow-[0_0_0_10px_rgb(255_255_255/0.14),0_6px_16px_rgb(0_0_0/0.5)]'
                  : 'size-8 shadow-[0_0_0_5px_rgb(255_255_255/0.1),0_6px_16px_rgb(0_0_0/0.5)]'
            }`}
            style={{ left: percent(position) }}
          >
            {!locked && <span className="absolute inset-0 m-auto size-2.5 rounded-full bg-ink-950" />}
          </div>

          {reveal && <RevealMarker from={position} to={actualPosition} progress={reveal.progress} />}
        </div>
      </div>

      {/* Skala bzw. nach der Auflösung die Beschriftung der beiden Markierungen. */}
      <div className="label relative mx-4 h-5 text-white/45">
        {reveal ? (
          <>
            <span className="absolute top-1 whitespace-nowrap text-white/80" style={markerLabel(position, guessIsLeft, actualPosition)}>
              Du
            </span>
            <span
              className={`absolute top-1 whitespace-nowrap text-tone transition-opacity duration-300 ${
                reveal.settled ? 'opacity-100' : 'opacity-0'
              }`}
              style={markerLabel(actualPosition, !guessIsLeft, position)}
            >
              Echt
            </span>
          </>
        ) : (
          <>
            <span className="absolute left-0 top-1 -translate-x-2">{formatAxis(range.min)}</span>
            {labelledTicks.map((tick) => (
              <span key={tick.value} className="absolute top-1 -translate-x-1/2" style={{ left: percent(tick.position) }}>
                {formatAxis(tick.value)}
              </span>
            ))}
            <span className="absolute right-0 top-1 translate-x-2">{formatAxis(range.max)}</span>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Position einer Markierungs-Beschriftung. Liegen beide Markierungen dicht
 * beieinander, weichen die Texte nach außen aus, statt sich zu überlagern.
 */
function markerLabel(position: number, isLeft: boolean, other: number): CSSProperties {
  if (Math.abs(position - other) >= 0.24) {
    return { left: percent(position), transform: 'translateX(-50%)' };
  }
  return isLeft
    ? { right: percent(1 - position), paddingRight: '0.75rem' }
    : { left: percent(position), paddingLeft: '0.75rem' };
}

interface RevealMotionProps {
  from: number;
  to: number;
  progress: MotionValue<number>;
}

/** Farbige Strecke zwischen Schätzung und echtem Preis, wächst mit der Enthüllung. */
function RevealGap({ from, to, progress, settled }: RevealMotionProps & { settled: boolean }) {
  const scaleX = useTransform(progress, (p) => (to - from) * p);
  return (
    <motion.div
      className={`absolute inset-y-0 w-full origin-left transition-colors duration-500 ${
        settled ? 'bg-tone' : 'bg-white/70'
      }`}
      style={{ left: percent(from), scaleX }}
    />
  );
}

/** Markierung des echten Preises: startet auf der Schätzung und wandert zum Ziel. */
function RevealMarker({ from, to, progress }: RevealMotionProps) {
  const left = useTransform(progress, (p) => percent(from + (to - from) * p));
  return (
    <motion.div className="absolute top-1/2 size-0" style={{ left }}>
      <motion.div
        className="absolute -left-3 -top-3 size-6 rotate-45 rounded-md bg-tone shadow-[0_0_0_4px_var(--color-ink-900),0_0_22px_var(--tone)] transition-colors duration-500"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 22, delay: 0.1 }}
      />
    </motion.div>
  );
}
