import { IconHelp } from '@tabler/icons-react';
import { IconButton } from './Button';
import { LogoMark } from './Logo';
import { SoundToggle } from './SoundToggle';

interface HeaderActionsProps {
  onHelp: () => void;
}

/** Die Aktionen oben rechts – auf jedem Bildschirm an derselben Stelle. */
export function HeaderActions({ onHelp }: HeaderActionsProps) {
  return (
    <div className="flex shrink-0 items-center">
      <SoundToggle />
      <IconButton label="So wird gewertet" onClick={onHelp}>
        <IconHelp size={22} stroke={1.75} aria-hidden="true" />
      </IconButton>
    </div>
  );
}

interface AppHeaderProps extends HeaderActionsProps {
  /** Gesetzt, wenn das Logo zur Startseite führen soll. */
  onHome?: () => void;
}

/** Kopfzeile für Start- und Ergebnisseite. */
export function AppHeader({ onHome, onHelp }: AppHeaderProps) {
  const brand = (
    <>
      <LogoMark />
      <span className="truncate text-heading">Schätzspiel</span>
    </>
  );

  return (
    <header className="flex min-h-[44px] shrink-0 items-center justify-between gap-3">
      {onHome ? (
        <button
          type="button"
          onClick={onHome}
          aria-label="Schätzspiel – zur Startseite"
          className="-ml-1.5 flex min-h-[44px] min-w-0 items-center gap-2.5 rounded-control px-1.5 transition-colors duration-150 hover:bg-surface-2"
        >
          {brand}
        </button>
      ) : (
        <p className="flex min-h-[44px] min-w-0 items-center gap-2.5">{brand}</p>
      )}
      <HeaderActions onHelp={onHelp} />
    </header>
  );
}
