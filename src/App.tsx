import { AnimatePresence, MotionConfig } from 'motion/react';
import { useEffect } from 'react';
import { Backdrop, type Mood } from './components/Backdrop';
import { GameScreen } from './components/GameScreen';
import { StartScreen } from './components/StartScreen';
import { SummaryScreen } from './components/SummaryScreen';
import { useGame } from './game/useGame';

export function App() {
  const game = useGame();
  const playing = game.phase === 'guessing' || game.phase === 'revealed';
  const mood: Mood = playing && game.round ? game.round.question.category : 'brand';

  // Jeder Bildschirm beginnt oben – wichtig nach der scrollbaren Auswertung.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [game.phase === 'summary', playing]);

  return (
    // „reducedMotion=user“ respektiert die Systemeinstellung „Bewegung reduzieren“.
    <MotionConfig reducedMotion="user">
      <Backdrop mood={mood} />
      <AnimatePresence mode="wait">
        {game.phase === 'start' && <StartScreen key="start" best={game.best} onStart={game.start} />}
        {playing && <GameScreen key="game" game={game} />}
        {game.phase === 'summary' && (
          <SummaryScreen
            key="summary"
            rounds={game.rounds}
            results={game.results}
            total={game.total}
            previousBest={game.previousBest}
            isNewBest={game.isNewBest}
            onReplay={game.start}
            onHome={game.home}
          />
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
