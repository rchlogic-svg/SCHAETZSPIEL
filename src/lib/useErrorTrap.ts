import { useCallback, useState } from 'react';

/**
 * React fängt nur Fehler ab, die beim Zeichnen entstehen. Fehler in
 * Klick-Handlern würden am Fehlerbildschirm vorbeilaufen und das Spiel in
 * einem halbfertigen Zustand zurücklassen.
 *
 * `trap` umhüllt eine Funktion: Wirft sie, wird der Fehler beim nächsten
 * Zeichnen erneut geworfen – und landet so zuverlässig im Fehlerbildschirm.
 */
export function useErrorTrap() {
  const [, setFailure] = useState<null>(null);

  return useCallback(
    <Args extends unknown[], Result>(fn: (...args: Args) => Result) =>
      (...args: Args): Result | undefined => {
        try {
          return fn(...args);
        } catch (error) {
          setFailure(() => {
            throw error;
          });
          return undefined;
        }
      },
    [],
  );
}
