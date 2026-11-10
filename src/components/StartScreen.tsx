import { motion } from 'motion/react';
import { useState, type CSSProperties } from 'react';
import { QUESTIONS } from '../data/questions';
import { formatPoints } from '../game/format';
import { ROUNDS_PER_GAME } from '../game/rounds';
import type { CategoryId } from '../game/types';
import { Button } from './Button';
import { ArrowRightIcon, InfoIcon, LogoMark } from './Icons';
import { RulesSheet } from './RulesSheet';

interface StartScreenProps {
  best: number;
  onStart: () => void;
}

interface HeroTag {
  emoji: string;
  name: string;
  category: CategoryId;
  /** Ruhelage: Versatz und Drehung im Fächer. */
  x: string;
  y: string;
  rotate: number;
  float: number;
}

const HERO_TAGS: readonly HeroTag[] = [
  { emoji: '🚆', name: 'Bahnticket', category: 'unterwegs', x: '-80%', y: '7%', rotate: -11, float: 4.2 },
  { emoji: '🍺', name: 'Wiesn-Maß', category: 'alltag', x: '80%', y: '9%', rotate: 12, float: 4.8 },
  { emoji: '📱', name: 'iPhone 18 Pro', category: 'technik', x: '0%', y: '-5%', rotate: 2, float: 3.6 },
];

const miniTag = {
  '--stub': '2.7rem',
  '--hole': '0.3rem',
  '--hole-y': '0.95rem',
  '--notch': '0.4rem',
  borderRadius: '1.25rem 1.25rem 1rem 1rem',
} as CSSProperties;

export function StartScreen({ best, onStart }: StartScreenProps) {
  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <motion.main
      className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-[max(1.25rem,env(safe-area-inset-left))] pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-8 sm:pb-10 sm:pt-8 wide:max-w-6xl wide:px-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
    >
      <header className="flex h-10 shrink-0 items-center justify-between">
        <p className="flex items-center gap-2.5 text-lg font-bold tracking-[-0.02em]">
          <LogoMark />
          Schätzspiel
        </p>
        {best > 0 && (
          <p className="flex h-9 items-baseline gap-2 rounded-full bg-white/8 px-3.5 leading-9 ring-1 ring-inset ring-white/10">
            <span className="label text-white/50">Bestwert</span>
            <span className="numeric font-bold">{formatPoints(best)}</span>
          </p>
        )}
      </header>

      <div className="flex flex-1 flex-col justify-center gap-[clamp(1.25rem,3.5dvh,3rem)] py-3 wide:flex-row-reverse wide:items-center wide:gap-16">
        {/* Fächer aus Preisschildern */}
        <div
          aria-hidden="true"
          className="relative mx-auto max-h-64 min-h-40 w-full max-w-sm flex-1 short:hidden sm:max-h-80 sm:min-h-72 sm:max-w-md wide:h-80 wide:flex-1"
        >
          {HERO_TAGS.map((tag, index) => (
            <motion.div
              key={tag.name}
              className="absolute left-1/2 top-1/2 -ml-[3.25rem] -mt-[4.4rem] w-[6.5rem] sm:-ml-[4.75rem] sm:-mt-[6.5rem] sm:w-[9.5rem]"
              initial={{ opacity: 0, x: '0%', y: '-70%', rotate: 0, scale: 0.7 }}
              animate={{ opacity: 1, x: tag.x, y: tag.y, rotate: tag.rotate, scale: 1 }}
              transition={{ type: 'spring', stiffness: 140, damping: 13, delay: 0.15 + index * 0.1 }}
            >
              <motion.div
                className="tag-shadow"
                animate={{ y: [0, -7, 0], rotate: [0, index % 2 ? 1.5 : -1.5, 0] }}
                transition={{ duration: tag.float, repeat: Infinity, ease: 'easeInOut', delay: 1 + index * 0.3 }}
              >
                <div className="tag flex h-[8.8rem] flex-col sm:h-[13rem]" data-category={tag.category} style={miniTag}>
                  <div className="flex flex-1 flex-col items-center justify-end gap-1 px-2 pb-2 pt-7">
                    <span className="text-[2.5rem] leading-none sm:text-6xl">{tag.emoji}</span>
                    <span className="max-w-full truncate text-[0.6875rem] font-bold tracking-[-0.01em] text-paper-ink sm:text-sm">
                      {tag.name}
                    </span>
                  </div>
                  <div className="tag-stub mx-2! flex items-center justify-center">
                    <span className="numeric text-xl font-extrabold text-accent-ink sm:text-3xl">?&thinsp;€</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="shrink-0 wide:flex-1"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        >
          <p className="label text-brand">Spielmodus 01</p>
          <h1 className="mt-3 text-[clamp(3.25rem,15.5vw,6rem)] font-extrabold leading-[0.9] tracking-[-0.045em] short:mt-2 short:text-5xl wide:text-[clamp(4.5rem,8vw,7.5rem)] wide:tracking-[-0.035em] short:wide:text-5xl">
            Was kostet
            <br />
            das<span className="text-brand">?</span>
          </h1>
          <p className="mt-5 max-w-md text-pretty text-[1.0625rem] leading-relaxed text-white/65 short:mt-2 short:max-w-xl short:text-[0.9375rem] short:leading-snug sm:text-lg short:sm:text-[0.9375rem]">
            Zehn Dinge, zehn Schätzungen. Vom Briefporto bis zum Bugatti – wie gut ist dein Preisgefühl?
          </p>

          <div className="mt-8 hidden max-w-sm flex-col gap-2 short:mt-3 short:max-w-lg short:flex-row sm:flex">
            <StartActions onStart={onStart} onRules={() => setRulesOpen(true)} />
          </div>
        </motion.div>
      </div>

      <motion.footer
        className="flex shrink-0 flex-col gap-1.5 sm:hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
      >
        <StartActions onStart={onStart} onRules={() => setRulesOpen(true)} />
      </motion.footer>

      <p className="label mt-3 shrink-0 text-center text-white/40 short:mt-2 sm:text-left">
        {ROUNDS_PER_GAME} Runden · 3 Min. · {QUESTIONS.length} belegte Preise
      </p>

      <RulesSheet open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </motion.main>
  );
}

function StartActions({ onStart, onRules }: { onStart: () => void; onRules: () => void }) {
  return (
    <>
      <Button onClick={onStart}>
        Spiel starten
        <ArrowRightIcon />
      </Button>
      <Button variant="ghost" onClick={onRules} className="h-12!">
        <InfoIcon width={18} height={18} />
        So wird gewertet
      </Button>
    </>
  );
}
