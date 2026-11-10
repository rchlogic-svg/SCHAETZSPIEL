import { IconX } from '@tabler/icons-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { formatPoints } from '../game/format';
import { MAX_POINTS, POINTS_PER_PERCENT, ZERO_POINTS_DEVIATION, pointsFor } from '../game/scoring';
import { Button, IconButton } from './Button';

interface RulesSheetProps {
  open: boolean;
  onClose: () => void;
}

const EXAMPLES: ReadonlyArray<readonly [deviation: number, note: string]> = [
  [0, 'Volltreffer'],
  [0.1, 'knapp daneben'],
  [0.5, 'die Hälfte drüber'],
  [1, 'doppelt oder halb so viel'],
  [ZERO_POINTS_DEVIATION, 'dreimal so viel oder ein Drittel'],
];

/** Erklärt die Wertung. Nutzt die Konstanten der Spiellogik, bleibt also immer aktuell. */
export function RulesSheet({ open, onClose }: RulesSheetProps) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      className="sheet"
      aria-labelledby="rules-title"
      onClose={onClose}
      // Ein Klick auf den abgedunkelten Hintergrund trifft das dialog-Element selbst.
      onClick={(event) => {
        if (event.target === dialog.current) onClose();
      }}
    >
      <div className="flex flex-col gap-6 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="label text-accent">Spielregeln</p>
            <h2 id="rules-title" className="mt-1.5 text-title">
              So wird gewertet
            </h2>
          </div>
          <IconButton label="Schließen" onClick={onClose} className="-mr-2 -mt-1">
            <IconX size={22} stroke={1.75} aria-hidden="true" />
          </IconButton>
        </header>

        <Rule number="1" title="Schätzen">
          Zieh den Regler auf den Preis, den du für richtig hältst. Mit − und + stellst du fein nach. Der echte
          Preis liegt immer irgendwo auf dem Regler. Die Skala wächst nach rechts immer schneller: So passen
          Centbeträge und Millionen auf denselben Regler.
        </Rule>

        <Rule number="2" title="Punkte sammeln">
          Ein Volltreffer bringt {formatPoints(MAX_POINTS)} Punkte. Jedes Prozent Abweichung kostet{' '}
          {POINTS_PER_PERCENT} Punkte – gleichmäßig, bis bei {ZERO_POINTS_DEVIATION * 100}&nbsp;% nichts mehr
          übrig ist.
          <table className="mt-4 w-full border-separate border-spacing-0 overflow-hidden rounded-control text-left text-body tabular-nums shadow-[inset_0_0_0_1px_var(--line)]">
            <thead className="label text-ink-3">
              <tr>
                <th className="px-4 py-3 font-semibold">Abweichung</th>
                <th className="px-4 py-3 text-right font-semibold">Punkte</th>
              </tr>
            </thead>
            <tbody>
              {EXAMPLES.map(([deviation, note]) => (
                <tr key={deviation}>
                  <td className="border-t border-line px-4 py-3">
                    <span className="font-semibold text-ink">{Math.round(deviation * 100)}&nbsp;%</span>
                    <span className="ml-2 text-small text-ink-2">{note}</span>
                  </td>
                  <td className="border-t border-line px-4 py-3 text-right font-semibold text-ink">
                    {formatPoints(pointsFor(deviation))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Rule>

        <Rule number="3" title="Fair in beide Richtungen">
          Gemessen wird immer vom kleineren der beiden Werte aus. Halb so viel und doppelt so viel zählen
          deshalb gleich – es lohnt sich nicht, grundsätzlich zu tief zu stapeln.
        </Rule>

        <Rule number="4" title="Belegte Preise">
          Jeder Preis hat eine Quelle mit Datum. Nach jeder Frage und in der Auswertung kannst du sie öffnen
          und nachprüfen.
        </Rule>

        <Button onClick={onClose}>Alles klar</Button>
      </div>
    </dialog>
  );
}

function Rule({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return (
    <section className="flex gap-4">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft text-small font-semibold tabular-nums text-accent">
        {number}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-heading leading-8">{title}</h3>
        <div className="mt-1 text-body text-ink-2">{children}</div>
      </div>
    </section>
  );
}
