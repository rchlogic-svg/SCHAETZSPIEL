const NBSP = ' ';

const withCents = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const whole = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat('de-DE', { maximumSignificantDigits: 3 });

function hasCents(value: number): boolean {
  return Math.abs(value - Math.round(value)) > 0.004;
}

/**
 * Preis in deutscher Schreibweise.
 * Unter 100 € immer mit Cent, darüber nur wenn nötig, ab einer Million gekürzt.
 */
export function formatPrice(value: number): string {
  if (value >= 1e9) return `${compact.format(value / 1e9)}${NBSP}Mrd.${NBSP}€`;
  if (value >= 1e6) return `${compact.format(value / 1e6)}${NBSP}Mio.${NBSP}€`;
  if (value < 100 || (value < 10_000 && hasCents(value))) {
    return `${withCents.format(value)}${NBSP}€`;
  }
  return `${whole.format(value)}${NBSP}€`;
}

/** Kurze Beschriftung für die Slider-Skala (ohne überflüssige Nullen). */
export function formatAxis(value: number): string {
  if (value >= 1e9) return `${compact.format(value / 1e9)}${NBSP}Mrd.`;
  if (value >= 1e6) return `${compact.format(value / 1e6)}${NBSP}Mio.`;
  if (hasCents(value)) return `${withCents.format(value)}${NBSP}€`;
  return `${whole.format(value)}${NBSP}€`;
}

export function formatPoints(points: number): string {
  return whole.format(points);
}

/** Abweichung als ganze Prozentzahl, sehr große Werte gedeckelt. */
export function formatDeviation(deviation: number): string {
  if (!Number.isFinite(deviation) || deviation > 9.99) return `über${NBSP}999${NBSP}%`;
  const percent = Math.round(deviation * 100);
  if (percent === 0 && deviation > 0) return `unter${NBSP}1${NBSP}%`;
  return `${whole.format(percent)}${NBSP}%`;
}

const monthYear = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' });

/** „2026-11“ → „November 2026“. */
export function formatAsOf(asOf: string): string {
  const [year, month] = asOf.split('-').map(Number);
  if (!year || !month) return asOf;
  return monthYear.format(new Date(year, month - 1, 1));
}
