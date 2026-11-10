/**
 * Namen aller Piktogramme, die Fragen und Ergebnisse verwenden dürfen.
 *
 * Die Namen beschreiben das Motiv, nicht die Symbolbibliothek. Welche
 * Zeichnung dahintersteckt, legt `components/Pictogram.tsx` fest – TypeScript
 * meldet dort sofort, wenn für einen neuen Namen noch kein Symbol hinterlegt ist.
 */
export const PICTOGRAMS = [
  // Alltag
  'mail',
  'bottle',
  'radio',
  'tv',
  'music',
  'movie',
  'books',
  'shirt',
  'beer',
  'ticket',
  // Unterwegs
  'train',
  'card',
  'bus',
  'road',
  'cable-car',
  'castle',
  'eiffel-tower',
  'pyramid',
  // Technik
  'phone',
  'gamepad',
  'handheld',
  'game-console',
  'steering-wheel',
  'headphones',
  'blender',
  'brick',
  // Amtlich
  'id-card',
  'certificate',
  'number',
  'registered',
  'traffic-lights',
  'phone-off',
  'ticket-off',
  // Luxus
  'car',
  'gauge',
  'piano',
  'football',
  'stadium',
  // Ergebnis-Titel
  'crystal-ball',
  'trophy',
  'target',
  'thumb-up',
  'seedling',
  'dice',
] as const;

export type PictogramName = (typeof PICTOGRAMS)[number];
