const KEY = 'schaetzspiel:v1';

export interface SavedData {
  /** Bestes Gesamtergebnis auf diesem Gerät. */
  best: number;
  /** Bereits gespielte Fragen, damit neue Spiele frische Fragen bevorzugen. */
  seen: string[];
}

const EMPTY: SavedData = { best: 0, seen: [] };

/** Liest den Spielstand. Funktioniert auch, wenn der Browser keinen Speicher erlaubt. */
export function loadSaved(): SavedData {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const data: unknown = JSON.parse(raw);
    if (typeof data !== 'object' || data === null) return EMPTY;
    const { best, seen } = data as Partial<Record<keyof SavedData, unknown>>;
    return {
      best: typeof best === 'number' && Number.isFinite(best) && best > 0 ? best : 0,
      seen: Array.isArray(seen) ? seen.filter((id): id is string => typeof id === 'string') : [],
    };
  } catch {
    return EMPTY;
  }
}

export function saveData(data: SavedData): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Privater Modus oder voller Speicher: Das Spiel läuft ohne Speichern weiter.
  }
}
