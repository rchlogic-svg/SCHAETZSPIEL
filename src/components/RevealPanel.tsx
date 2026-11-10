import { motion } from 'motion/react';
import { formatPoints, formatPrice } from '../game/format';
import { RATING_LABEL, describeDeviation } from '../game/labels';
import type { RoundResult } from '../game/types';
import { AnimatedNumber } from './AnimatedNumber';

const formatGain = (points: number) => (points > 0 ? `+${formatPoints(points)}` : '0');

/** Kopf des Bedienfelds nach der Auflösung: Bewertung links, Punkte rechts. */
export function RevealPanel({ result }: { result: RoundResult }) {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-between gap-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="min-w-0" role="status">
        <motion.p
          className="text-[clamp(1.35rem,6vw,2rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-tone short:text-2xl wide:text-[2rem]"
          initial={{ scale: 0.85 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 380, damping: 16 }}
          style={{ transformOrigin: 'left center' }}
        >
          {RATING_LABEL[result.rating]}
        </motion.p>
        <p className="numeric mt-1.5 text-[0.8125rem] leading-tight text-white/60 sm:text-sm">
          Dein Tipp: <span className="font-semibold text-white/90">{formatPrice(result.guess)}</span>
          <span className="mx-1.5 text-white/30">·</span>
          <span className="whitespace-nowrap font-semibold text-tone">{describeDeviation(result)}</span>
        </p>
      </div>

      <div className="shrink-0 text-right">
        <AnimatedNumber
          value={result.points}
          from={0}
          format={formatGain}
          duration={0.9}
          className="numeric block text-[clamp(1.9rem,8.5vw,2.75rem)] font-extrabold leading-none tracking-[-0.03em] short:text-3xl wide:text-[2.75rem]"
        />
        <p className="label mt-1.5 text-white/50">Punkte</p>
      </div>
    </motion.div>
  );
}
