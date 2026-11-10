import { useCallback, useEffect, useRef, useState } from 'react';
import { GameScreen } from './components/GameScreen';
import { RulesSheet } from './components/RulesSheet';
import { StartScreen } from './components/StartScreen';
import { SummaryScreen } from './components/SummaryScreen';
import { useGame } from './game/useGame';
import { useBackNavigation } from './lib/backNavigation';

export function App() {
  const game = useGame();
  const playing = game.phase === 'guessing' || game.phase === 'revealed';

  // Die Spielregeln lassen sich von jedem Bildschirm aus öffnen.
  const [rulesOpen, setRulesOpen] = useState(false);
  const openRules = useCallback(() => setRulesOpen(true), []);
  const closeRules = useCallback(() => setRulesOpen(false), []);

  // Zurück-Taste im Spiel und auf der Ergebnisseite: zur Startseite, das Spiel
  // bleibt gespeichert und lässt sich dort fortsetzen.
  useBackNavigation(game.phase !== 'start', game.leave);

  // Beim allerersten Laden bleibt der Fokus, wo der Browser ihn setzt. Danach
  // bekommt bei jedem Bildschirmwechsel die neue Überschrift den Fokus.
  const firstScreen = useRef(true);
  useEffect(() => {
    firstScreen.current = false;
  }, []);

  // Jeder Bildschirm beginnt oben – wichtig nach der scrollbaren Auswertung.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [game.phase === 'summary', playing]);

  return (
    <>
      {game.phase === 'start' && (
        <StartScreen
          best={game.best}
          resumable={game.resumable}
          focusHeading={!firstScreen.current}
          onStart={game.start}
          onResume={game.resume}
          onDiscard={game.discard}
          onHelp={openRules}
        />
      )}
      {playing && <GameScreen game={game} onHelp={openRules} />}
      {game.phase === 'summary' && (
        <SummaryScreen
          rounds={game.rounds}
          results={game.results}
          total={game.total}
          previousBest={game.previousBest}
          isNewBest={game.isNewBest}
          onReplay={game.start}
          onHome={game.quit}
          onHelp={openRules}
        />
      )}
      <RulesSheet open={rulesOpen} onClose={closeRules} />
    </>
  );
}
