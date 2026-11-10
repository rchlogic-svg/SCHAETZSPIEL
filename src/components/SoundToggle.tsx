import { IconVolume } from '@tabler/icons-react';
import { IconButton } from './Button';

/**
 * Platz für den Ton-Schalter.
 *
 * Beschlossen ist: Töne sind standardmäßig an, lassen sich hier mit einem
 * Tipp abschalten, und die Einstellung bleibt auf dem Gerät gespeichert.
 * Die Töne selbst gibt es noch nicht. Bis dahin ist der Schalter sichtbar
 * deaktiviert, damit er nicht so tut, als würde er etwas bewirken.
 */
export function SoundToggle() {
  return (
    <IconButton label="Töne – noch nicht verfügbar" disabled>
      <IconVolume size={22} stroke={1.75} aria-hidden="true" />
    </IconButton>
  );
}
