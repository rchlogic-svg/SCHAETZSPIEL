import { describe, expect, it } from 'vitest';
import { formatAsOf, formatAxis, formatDeviation, formatPoints, formatPrice, formatSavedAgo } from './format';

/** Geschützte Leerzeichen für lesbare Erwartungswerte durch normale ersetzen. */
const plain = (text: string) => text.replace(/ /g, ' ');

describe('formatPrice', () => {
  it('zeigt kleine Beträge immer mit Cent', () => {
    expect(plain(formatPrice(0.25))).toBe('0,25 €');
    expect(plain(formatPrice(0.95))).toBe('0,95 €');
    expect(plain(formatPrice(63))).toBe('63,00 €');
    expect(plain(formatPrice(15.9))).toBe('15,90 €');
  });

  it('zeigt Cent ab 100 € nur, wenn es welche gibt', () => {
    expect(plain(formatPrice(249))).toBe('249 €');
    expect(plain(formatPrice(649.99))).toBe('649,99 €');
    expect(plain(formatPrice(106.8))).toBe('106,80 €');
  });

  it('setzt Tausenderpunkte', () => {
    expect(plain(formatPrice(1449))).toBe('1.449 €');
    expect(plain(formatPrice(136_300))).toBe('136.300 €');
  });

  it('kürzt Millionen und Milliarden', () => {
    expect(plain(formatPrice(3_800_000))).toBe('3,8 Mio. €');
    expect(plain(formatPrice(866_000_000))).toBe('866 Mio. €');
    expect(plain(formatPrice(1_250_000_000))).toBe('1,25 Mrd. €');
  });

  it('verwendet geschützte Leerzeichen, damit Betrag und Währung zusammenbleiben', () => {
    expect(formatPrice(5)).toBe('5,00 €');
  });
});

describe('formatAxis', () => {
  it('lässt überflüssige Nullen weg', () => {
    expect(plain(formatAxis(0.12))).toBe('0,12 €');
    expect(plain(formatAxis(5))).toBe('5 €');
    expect(plain(formatAxis(1000))).toBe('1.000 €');
    expect(plain(formatAxis(2_000_000))).toBe('2 Mio.');
  });
});

describe('formatDeviation', () => {
  it('rundet auf ganze Prozent', () => {
    expect(plain(formatDeviation(0.164))).toBe('16 %');
    expect(plain(formatDeviation(1))).toBe('100 %');
    expect(plain(formatDeviation(0))).toBe('0 %');
  });

  it('beschreibt sehr kleine und sehr große Abweichungen in Worten', () => {
    expect(plain(formatDeviation(0.002))).toBe('unter 1 %');
    expect(plain(formatDeviation(25))).toBe('über 999 %');
    expect(plain(formatDeviation(Number.POSITIVE_INFINITY))).toBe('über 999 %');
  });
});

describe('formatSavedAgo', () => {
  const now = Date.UTC(2026, 10, 10, 12, 0, 0);
  const minute = 60_000;

  it('beschreibt, wie lange ein Spielstand her ist', () => {
    expect(formatSavedAgo(now - 20_000, now)).toBe('gerade eben');
    expect(formatSavedAgo(now - minute, now)).toBe('vor 1 Minute');
    expect(formatSavedAgo(now - 5 * minute, now)).toBe('vor 5 Minuten');
    expect(formatSavedAgo(now - 59 * minute, now)).toBe('vor 59 Minuten');
    expect(formatSavedAgo(now - 60 * minute, now)).toBe('vor 1 Stunde');
    expect(formatSavedAgo(now - 23 * 60 * minute, now)).toBe('vor 23 Stunden');
  });

  it('kommt mit Zeitpunkten in der Zukunft zurecht', () => {
    expect(formatSavedAgo(now + 3 * minute, now)).toBe('gerade eben');
  });
});

describe('formatPoints und formatAsOf', () => {
  it('formatiert Punkte mit Tausenderpunkt', () => {
    expect(formatPoints(7420)).toBe('7.420');
    expect(formatPoints(950)).toBe('950');
  });

  it('schreibt den Stand als Monat und Jahr aus', () => {
    expect(formatAsOf('2026-11')).toBe('November 2026');
    expect(formatAsOf('2017-08')).toBe('August 2017');
    expect(formatAsOf('unbekannt')).toBe('unbekannt');
  });
});
