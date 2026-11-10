import { IconTarget, IconTargetArrow, IconTargetOff, type TablerIcon } from '@tabler/icons-react';
import { formatPoints, formatPrice } from '../game/format';
import { RATING_LABEL, explainDeviation, toneFor, type Tone } from '../game/labels';
import type { RoundResult } from '../game/types';
import { AnimatedNumber } from './AnimatedNumber';

const formatGain = (points: number) => (points > 0 ? `+${formatPoints(points)}` : '0');

/** Die Bewertung zeigt sich nie nur über Farbe: Jede Stufe hat auch ein eigenes Symbol. */
const TONE_ICON: Record<Tone, TablerIcon> = {
  good: IconTargetArrow,
  mid: IconTarget,
  off: IconTargetOff,
};

/** Rückmeldung nach der Auflösung: Bewertung, Punkte und was der Tipp wert war. */
export function RevealPanel({ result }: { result: RoundResult }) {
  const ToneIcon = TONE_ICON[toneFor(result.rating)];

  return (
    <div className="flex animate-enter flex-col justify-center gap-1.5" role="status">
      <div className="flex items-center justify-between gap-3">
        <p className="flex min-w-0 items-center gap-2 text-heading text-tone">
          <ToneIcon size={26} stroke={1.75} className="shrink-0" aria-hidden="true" />
          <span className="text-balance">{RATING_LABEL[result.rating]}</span>
        </p>
        <p className="shrink-0 text-right">
          <AnimatedNumber
            value={result.points}
            from={0}
            format={formatGain}
            duration={800}
            className="text-figure-lg tabular-nums"
          />
          <span className="ml-1.5 text-small text-ink-3 max-[22rem]:sr-only">Punkte</span>
        </p>
      </div>
      <p className="text-small text-ink-2">
        Dein Tipp: <span className="font-semibold tabular-nums text-ink">{formatPrice(result.guess)}</span>.{' '}
        {explainDeviation(result)}
      </p>
    </div>
  );
}
