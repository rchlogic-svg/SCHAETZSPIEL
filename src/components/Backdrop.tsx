import type { CategoryId } from '../game/types';

export type Mood = CategoryId | 'brand';

const LAYERS: readonly Mood[] = ['brand', 'alltag', 'unterwegs', 'technik', 'amtlich', 'luxus'];

/**
 * Farbiger Hintergrund, der mit der Kategorie der Frage wechselt.
 * Alle Ebenen liegen fertig übereinander; gewechselt wird nur per Deckkraft.
 */
export function Backdrop({ mood }: { mood: Mood }) {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink-950">
      {LAYERS.map((layer) => (
        <div
          key={layer}
          data-category={layer}
          className={`backdrop-glow absolute inset-0 transition-opacity duration-700 ease-out ${
            layer === mood ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
      <div className="backdrop-dots absolute inset-0" />
    </div>
  );
}
