import { IconAlertTriangle } from '@tabler/icons-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './Button';
import { LogoMark } from './Logo';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  failed: boolean;
}

/**
 * Fängt Programmfehler in der Oberfläche ab. Ohne diese Grenze bliebe die
 * Seite nach einem Fehler einfach leer; so gibt es eine Erklärung und einen
 * Weg zurück ins Spiel.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Schätzspiel: Fehler in der Oberfläche', error, info.componentStack);
  }

  render(): ReactNode {
    return this.state.failed ? <ErrorScreen /> : this.props.children;
  }
}

function ErrorScreen() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-[max(1rem,env(safe-area-inset-left))] pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-6 sm:pt-4">
      <header className="flex min-h-11 items-center gap-2.5">
        <LogoMark />
        <span className="text-heading">Schätzspiel</span>
      </header>

      <main className="flex flex-1 flex-col justify-center gap-5 py-8" role="alert">
        <span
          data-tone="off"
          className="grid size-14 place-items-center rounded-control bg-tone-soft text-tone"
          aria-hidden="true"
        >
          <IconAlertTriangle size={30} stroke={1.75} />
        </span>
        <div>
          <h1 className="text-title">Da ist etwas schiefgelaufen</h1>
          <p className="mt-2 max-w-md text-body-lg text-ink-2">
            Das Spiel konnte nicht weiterlaufen. Dein Bestwert ist gespeichert. Lade die Seite neu, um
            weiterzuspielen.
          </p>
        </div>
        <Button onClick={() => window.location.reload()} className="sm:w-auto sm:self-start sm:px-8">
          Seite neu laden
        </Button>
      </main>
    </div>
  );
}
