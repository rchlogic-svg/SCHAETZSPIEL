import { useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { formatAxis, formatPrice } from '../game/format';
import { nudgeValue, positionToValue, snapValue, ticksFor, valueToPosition } from '../game/scale';
import type { SliderRange } from '../game/types';

export interface SliderReveal {
  /** Der echte Preis. */
  actual: number;
  settled: boolean;
}

interface PriceSliderProps {
  range: SliderRange;
  value: number;
  onChange: (value: number) => void;
  /**
   * Gesetzt, sobald der Tipp abgegeben ist – der Regler ist dann gesperrt und
   * zeigt Tipp und echten Preis. Wie weit die Enthüllung ist, liest er aus der
   * CSS-Variable `--reveal` (0–1), die die Runde auf einem Elternelement setzt.
   */
  reveal?: SliderReveal;
}

/** Trifft der Finger den Griff in diesem Umkreis (px), springt er beim Anfassen nicht. */
const GRAB_RADIUS = 32;

/** Beschriftete Marken halten diesen Abstand zu den Rändern und zueinander. */
const LABEL_GAP = 0.22;

/** Auflösung des unsichtbaren Standard-Reglers für Tastatur und Screenreader. */
const STEPS = 1000;

const percent = (position: number) => `${position * 100}%`;

export function PriceSlider({ range, value, onChange, reveal }: PriceSliderProps) {
  const rail = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
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
    // Danach lässt sich mit den Pfeiltasten weiterstellen.
    input.current?.focus({ preventScroll: true });
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (locked || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    moveToPointer(event.clientX);
  };

  const endDrag = () => setDragging(false);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
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
  const travel = actualPosition - position;
  const guessIsLeft = position <= actualPosition;

  return (
    <div className="slider @container select-none">
      <div
        data-testid="slider-track"
        className={`relative h-12 touch-none roomy:h-14 ${locked ? '' : 'cursor-pointer'}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
      >
        {/* Standard-Regler des Browsers: unsichtbar, aber die verlässliche Grundlage
            für Tastatur und Screenreader (z. B. VoiceOver auf dem iPhone). */}
        <input
          ref={input}
          type="range"
          className="sr-only"
          min={0}
          max={STEPS}
          step={1}
          value={Math.round(position * STEPS)}
          onChange={(event) => moveTo(Number(event.target.value) / STEPS)}
          onKeyDown={handleKeyDown}
          disabled={locked}
          aria-label="Dein Tipp"
          aria-valuetext={formatPrice(value)}
        />

        {/* Schiene: optisch etwas länger als der Wertebereich, damit der Griff nie übersteht. */}
        <div className="absolute inset-x-3 top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-full bg-surface-3 shadow-[inset_0_0_0_1px_var(--control)]">
          <div className="absolute inset-x-2 inset-y-0">
            <div
              className={`absolute inset-y-0 -left-2 transition-colors duration-300 ${locked ? 'bg-control' : 'bg-accent'}`}
              style={{ width: `calc(${percent(position)} + 0.5rem)` }}
            />
            {reveal && (
              // Strecke zwischen Tipp und echtem Preis; wächst mit der Enthüllung.
              <div
                className={`absolute inset-y-0 w-full origin-left transition-colors duration-300 ${
                  reveal.settled ? 'bg-tone' : 'bg-ink-3'
                }`}
                style={{ left: percent(position), transform: `scaleX(calc(${travel} * var(--reveal, 0)))` }}
              />
            )}
          </div>
        </div>

        <div ref={rail} className="pointer-events-none absolute inset-x-5 inset-y-0">
          {/* Teilstriche wie auf einem Lineal, unter der Schiene. */}
          {ticks.map((tick) => (
            <span
              key={tick.value}
              className={`absolute top-[calc(50%+0.5rem)] w-px -translate-x-1/2 ${
                tick.major ? 'h-2 bg-control' : 'h-1 bg-line-strong'
              }`}
              style={{ left: percent(tick.position) }}
            />
          ))}

          {/* Griff – nach der Abgabe schrumpft er zur Markierung „Du“. */}
          <span
            className={`slider-thumb absolute top-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full transition-[width,height,scale,box-shadow,background-color] duration-200 ease-out ${
              locked
                ? 'size-4 bg-ink shadow-[0_0_0_3px_var(--surface)]'
                : dragging
                  ? 'size-10 scale-110 bg-white shadow-[0_0_0_2px_var(--accent),0_0_0_10px_color-mix(in_srgb,var(--accent)_20%,transparent)]'
                  : 'size-10 bg-white shadow-[0_0_0_2px_var(--accent),0_2px_8px_rgb(14_17_22/0.22)]'
            }`}
            style={{ left: percent(position) }}
          >
            {!locked && <span className="size-2.5 rounded-full bg-accent" />}
          </span>

          {reveal && (
            // Markierung des echten Preises: startet auf dem Tipp und wandert zum Ziel.
            <span
              className="absolute top-1/2 size-0"
              style={{ left: `calc((${position} + ${travel} * var(--reveal, 0)) * 100%)` }}
            >
              <span className="absolute -left-2.5 -top-2.5 size-5 rotate-45 animate-pop rounded-[0.3rem] bg-tone shadow-[0_0_0_3px_var(--surface)] transition-colors duration-300" />
            </span>
          )}
        </div>
      </div>

      {/* Skala bzw. nach der Auflösung die Beschriftung der beiden Markierungen. */}
      <div className="relative mx-5 h-6 text-small tabular-nums text-ink-3" aria-hidden="true">
        {reveal ? (
          <>
            <span
              className="absolute top-0.5 whitespace-nowrap font-semibold text-ink"
              style={markerLabel(position, guessIsLeft, actualPosition)}
            >
              Du
            </span>
            <span
              className={`absolute top-0.5 whitespace-nowrap font-semibold text-tone transition-opacity duration-300 ${
                reveal.settled ? 'opacity-100' : 'opacity-0'
              }`}
              style={markerLabel(actualPosition, !guessIsLeft, position)}
            >
              Echt
            </span>
          </>
        ) : (
          <>
            <span className="absolute left-0 top-0.5 -translate-x-2 whitespace-nowrap">{formatAxis(range.min)}</span>
            {labelledTicks.map((tick) => (
              // Zwischenwerte nur, wenn genug Platz ist – auch bei vergrößerter Schrift.
              <span
                key={tick.value}
                className="absolute top-0.5 hidden -translate-x-1/2 whitespace-nowrap @min-[19rem]:block"
                style={{ left: percent(tick.position) }}
              >
                {formatAxis(tick.value)}
              </span>
            ))}
            <span className="absolute right-0 top-0.5 translate-x-2 whitespace-nowrap">{formatAxis(range.max)}</span>
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
