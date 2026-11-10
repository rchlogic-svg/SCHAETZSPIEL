import { IconArrowRight, IconArrowsShuffle, IconCalendarEvent, IconChartBar } from '@tabler/icons-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { QUESTIONS } from '../data/questions';
import { formatPoints } from '../game/format';
import { ROUNDS_PER_GAME } from '../game/rounds';
import { MAX_POINTS } from '../game/scoring';
import { AppHeader } from './AppHeader';
import { Button } from './Button';

interface StartScreenProps {
  best: number;
  /** Beim Zurückkehren aus einem Spiel bekommt die Überschrift den Fokus. */
  focusHeading: boolean;
  onStart: () => void;
  onHelp: () => void;
}

export function StartScreen({ best, focusHeading, onStart, onHelp }: StartScreenProps) {
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (focusHeading) heading.current?.focus({ preventScroll: true });
  }, [focusHeading]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl animate-fade flex-col px-[max(1rem,env(safe-area-inset-left))] pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-6 sm:pb-8 sm:pt-4 lg:max-w-5xl lg:px-8">
      <AppHeader onHelp={onHelp} />

      <main className="flex flex-1 flex-col justify-center gap-5 py-3 short:gap-4 sm:gap-8 sm:py-5 lg:grid lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16">
        <section>
          <p className="label text-accent">Spielmodus</p>
          <h1 ref={heading} tabIndex={-1} className="mt-2 text-display">
            Was kostet das?
          </h1>
          <p className="mt-3 max-w-md text-pretty text-body-lg text-ink-2 short:mt-2">
            Schätze Preise vom Briefporto bis zum Bugatti. Jeder Preis ist mit Quelle und Datum belegt.
          </p>
        </section>

        <div className="flex flex-col gap-3">
          <section aria-label="Spiel wählen" className="flex flex-col gap-3">
            {/* Platzhalter: Die Tagesrunde ist beschlossen, aber noch nicht gebaut.
                Sie ist deshalb sichtbar als „bald verfügbar“ markiert und nicht anklickbar. */}
            <ModeCard
              icon={<IconCalendarEvent size={24} stroke={1.75} aria-hidden="true" />}
              title="Tagesrunde"
              description="5 Fragen täglich – für alle dieselben."
              badge="Bald verfügbar"
              muted
            />

            <ModeCard
              icon={<IconArrowsShuffle size={24} stroke={1.75} aria-hidden="true" />}
              title="Freies Spiel"
              description={`${ROUNDS_PER_GAME} zufällige Fragen aus ${QUESTIONS.length} Preisen.`}
            >
              <Button onClick={onStart}>
                Freies Spiel starten
                <IconArrowRight size={20} stroke={2} aria-hidden="true" />
              </Button>
            </ModeCard>
          </section>

          <section aria-labelledby="stats-title" className="card flex items-center gap-4 p-4 sm:p-5">
            <span className="grid size-11 shrink-0 place-items-center rounded-control bg-surface-2 text-ink-2">
              <IconChartBar size={24} stroke={1.75} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="stats-title" className="label text-ink-3">
                Deine Statistik
              </h2>
              {best > 0 ? (
                <p className="mt-1 text-body text-ink-2">
                  Bestwert{' '}
                  <span className="text-heading tabular-nums text-ink">{formatPoints(best)}</span>{' '}
                  <span className="text-small">von {formatPoints(ROUNDS_PER_GAME * MAX_POINTS)} Punkten</span>
                </p>
              ) : (
                <p className="mt-1 text-body text-ink-2">Noch kein Spiel gespielt. Dein Bestwert erscheint hier.</p>
              )}
              <p className="mt-0.5 text-small text-ink-3">Nur auf diesem Gerät gespeichert.</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

interface ModeCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  /** Kurzer Statushinweis oben rechts. */
  badge?: string;
  /** Zurückgenommene Darstellung für etwas, das noch nicht verfügbar ist. */
  muted?: boolean;
  /** Die Aktion der Karte, in der Regel ein Button. */
  children?: ReactNode;
}

/** Einstieg in eine Spielart. */
function ModeCard({ icon, title, description, badge, muted = false, children }: ModeCardProps) {
  return (
    <article
      className={`flex flex-col gap-4 p-4 sm:p-5 ${
        muted ? 'rounded-card shadow-[inset_0_0_0_1px_var(--line-strong)]' : 'card'
      }`}
    >
      <div className="flex items-start gap-4">
        <span
          className={`grid size-11 shrink-0 place-items-center rounded-control ${
            muted ? 'bg-surface-2 text-ink-2' : 'bg-accent-soft text-accent'
          }`}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <h2 className={`text-heading ${muted ? 'text-ink-2' : 'text-ink'}`}>{title}</h2>
            {badge && <span className="label rounded-chip bg-surface-2 px-2 py-1 text-ink-2">{badge}</span>}
          </div>
          <p className="mt-1 text-body text-ink-2">{description}</p>
        </div>
      </div>
      {children}
    </article>
  );
}
