import type { SliderRange } from './types';

/** Kleinster darstellbarer Preis: ein Cent. */
export const MIN_PRICE = 0.01;

/** Der Slider deckt pro Frage diesen Faktor zwischen kleinstem und größtem Wert ab. */
export const RANGE_FACTOR = 60;

/**
 * Der echte Preis liegt zufällig irgendwo zwischen 15 % und 85 % der
 * Sliderbreite – nie am Rand und nicht vorhersehbar in der Mitte.
 */
export const ACTUAL_POSITION_MIN = 0.15;
export const ACTUAL_POSITION_MAX = 0.85;

type RoundingMode = 'floor' | 'ceil' | 'round';

/** Entfernt Rundungsreste wie 0.30000000000000004. */
function clean(value: number): number {
  return Number(value.toPrecision(12));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function roundToSignificant(value: number, digits: number, mode: RoundingMode): number {
  if (!(value > 0)) return 0;
  const exponent = Math.floor(Math.log10(value)) - (digits - 1);
  const unit = 10 ** exponent;
  return clean(Math[mode](clean(value / unit)) * unit);
}

/**
 * Baut den Wertebereich des Sliders für einen Preis.
 * Garantie: min < actual < max – der echte Preis ist immer einstellbar.
 */
export function buildRange(actual: number, random: () => number = Math.random): SliderRange {
  if (!(actual >= MIN_PRICE)) {
    throw new RangeError(`Preis muss mindestens ${MIN_PRICE} € betragen, war: ${actual}`);
  }

  const span = Math.log(RANGE_FACTOR);
  const position = ACTUAL_POSITION_MIN + random() * (ACTUAL_POSITION_MAX - ACTUAL_POSITION_MIN);

  // Nach außen runden, damit der Bereich durch das Runden nie kleiner wird.
  let min = roundToSignificant(actual * Math.exp(-position * span), 2, 'floor');
  let max = roundToSignificant(actual * Math.exp((1 - position) * span), 2, 'ceil');
  min = Math.max(MIN_PRICE, min);

  // Sicherheitsnetz: Sollte die Garantie je verletzt sein, den Bereich
  // großzügig um den echten Preis legen, statt eine unlösbare Runde zu zeigen.
  if (!(min < actual)) min = Math.max(MIN_PRICE, roundToSignificant(actual / 4, 2, 'floor'));
  if (!(max > actual)) max = roundToSignificant(actual * 4, 2, 'ceil');
  if (!(min < actual)) min = actual / 2;

  return { min, max };
}

/** Sliderposition (0–1) → Preis, logarithmisch verteilt. */
export function positionToValue(position: number, range: SliderRange): number {
  const t = clamp(position, 0, 1);
  return range.min * Math.pow(range.max / range.min, t);
}

/** Preis → Sliderposition (0–1). */
export function valueToPosition(value: number, range: SliderRange): number {
  const v = clamp(value, range.min, range.max);
  return clamp(Math.log(v / range.min) / Math.log(range.max / range.min), 0, 1);
}

/** Schrittweite für runde Schätzwerte: drei geltende Stellen, mindestens ein Cent. */
export function stepFor(value: number): number {
  if (value < 10) return 0.01;
  return 10 ** (Math.floor(Math.log10(value)) - 2);
}

/** Rundet einen Rohwert vom Slider auf einen glatten Betrag innerhalb des Bereichs. */
export function snapValue(value: number, range: SliderRange): number {
  const step = stepFor(value);
  return clamp(clean(Math.round(value / step) * step), range.min, range.max);
}

/** Ein Feinschritt nach oben oder unten (für die Plus-/Minus-Tasten). */
export function nudgeValue(value: number, direction: 1 | -1, range: SliderRange): number {
  const step = stepFor(direction > 0 ? value : value * 0.999);
  return snapValue(clean(value + direction * step), range);
}

/** Startwert des Sliders: die Mitte der logarithmischen Skala. */
export function initialValue(range: SliderRange): number {
  return snapValue(positionToValue(0.5, range), range);
}

export interface Tick {
  value: number;
  position: number;
  /** Zehnerpotenzen sind Hauptmarken und werden beschriftet. */
  major: boolean;
}

/** Orientierungsmarken bei 1 / 2 / 5 × 10ⁿ innerhalb des Bereichs. */
export function ticksFor(range: SliderRange): Tick[] {
  const ticks: Tick[] = [];
  const first = Math.floor(Math.log10(range.min));
  const last = Math.ceil(Math.log10(range.max));
  for (let exponent = first; exponent <= last; exponent++) {
    for (const factor of [1, 2, 5]) {
      const value = clean(factor * 10 ** exponent);
      if (value <= range.min || value >= range.max) continue;
      ticks.push({ value, position: valueToPosition(value, range), major: factor === 1 });
    }
  }
  return ticks;
}
