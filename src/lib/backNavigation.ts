import { useEffect, useRef } from 'react';

/** Kennzeichnet den Verlaufseintrag, den das Spiel beim Betreten anlegt. */
const MARK = 'schaetzspiel-im-spiel';

const isMarked = (state: unknown) =>
  typeof state === 'object' && state !== null && (state as Record<string, unknown>)[MARK] === true;

const pushMark = () => history.pushState({ [MARK]: true }, '');

/**
 * Lässt die Zurück-Taste (und auf dem iPhone die Wischgeste vom linken Rand)
 * innerhalb der App wirken, statt die Seite zu verlassen.
 *
 * Regel: Solange ein Spiel oder die Ergebnisseite zu sehen ist, liegt genau ein
 * eigener Eintrag im Browserverlauf; auf der Startseite keiner. „Zurück“
 * entfernt diesen Eintrag – der Browser bleibt auf der Seite, und `onBack`
 * bringt das Spiel zur Startseite. Verlässt man das Spiel über die App selbst,
 * baut die App den Eintrag mit `history.back()` wieder ab.
 *
 * Nach dem Neuladen steht der Browser noch auf dem Spiel-Eintrag, die App zeigt
 * aber die Startseite. Auch dann tritt sie einmal selbst zurück – sonst bräuchte
 * die erste Zurück-Taste auf der Startseite einen zweiten Druck.
 */
export function useBackNavigation(inGame: boolean, onBack: () => void): void {
  const handler = useRef(onBack);
  handler.current = onBack;
  const inGameRef = useRef(inGame);
  inGameRef.current = inGame;
  /** Gesetzt, solange ein von der App selbst ausgelöstes `history.back()` unterwegs ist. */
  const expectingPop = useRef(false);

  const stepBack = () => {
    expectingPop.current = true;
    history.back();
  };

  // Verlauf und Bildschirm in Einklang bringen – beim Start der App (auch nach
  // dem Neuladen) und bei jedem Wechsel zwischen Startseite und Spiel.
  useEffect(() => {
    // Ein Rückschritt ist noch unterwegs: Der popstate-Handler gleicht danach ab.
    if (expectingPop.current) return;
    const marked = isMarked(history.state);
    if (inGame && !marked) pushMark();
    else if (!inGame && marked) stepBack();
  }, [inGame]);

  useEffect(() => {
    const onPopState = () => {
      if (expectingPop.current) {
        expectingPop.current = false;
        // Wurde inzwischen ein Spiel gestartet, braucht es seinen Eintrag wieder.
        if (inGameRef.current && !isMarked(history.state)) pushMark();
        return;
      }
      if (inGameRef.current) {
        // Zurück im Spiel: zur Startseite, das Spiel bleibt gespeichert.
        handler.current();
      } else if (isMarked(history.state)) {
        // „Vorwärts“ auf der Startseite landet auf einem alten Spiel-Eintrag.
        // Das Spiel öffnet sich nur über die Karte – also wieder zurück.
        stepBack();
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
}
