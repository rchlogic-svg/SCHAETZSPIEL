/**
 * Kurzes Vibrieren als Rückmeldung auf Geräten, die das unterstützen
 * (z. B. Android). iPhones erlauben Vibration im Browser nicht.
 */
export function haptic(pattern: number | number[] = 10): void {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // Nicht verfügbar – dann eben ohne.
  }
}
