import type { PictogramName } from '../data/pictograms';

export type CategoryId = 'alltag' | 'unterwegs' | 'technik' | 'amtlich' | 'luxus';

export interface Source {
  /** Herausgeber der Preisangabe, so wie er im Spiel angezeigt wird. */
  name: string;
  /** Link, unter dem sich der Preis nachprüfen lässt. */
  url: string;
  /** Stand der Preisangabe im Format JJJJ-MM. */
  asOf: string;
}

export interface PriceQuestion {
  id: string;
  /** Kurzname für Auswertung und Kassenbon. */
  title: string;
  category: CategoryId;
  /** Piktogramm, das die Frage bebildert. */
  icon: PictogramName;
  question: string;
  /** Präzisiert, was genau gemeint ist (Variante, Tarif, Größe …). */
  detail: string;
  /** Tatsächlicher Preis in Euro. */
  price: number;
  source: Source;
}

/** Wertebereich des Sliders für eine Runde (logarithmische Skala). */
export interface SliderRange {
  min: number;
  max: number;
}

export interface Round {
  question: PriceQuestion;
  range: SliderRange;
}

export type Rating = 'perfect' | 'great' | 'good' | 'ok' | 'far' | 'miss';

export type Direction = 'low' | 'high' | 'exact';

export interface RoundResult {
  guess: number;
  /** Symmetrische relative Abweichung: 0 = exakt, 1 = doppelt oder halb so viel. */
  deviation: number;
  direction: Direction;
  points: number;
  rating: Rating;
}
