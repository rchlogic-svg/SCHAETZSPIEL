import {
  IconAerialLift,
  IconBallFootball,
  IconBeer,
  IconBlender,
  IconBooks,
  IconBottle,
  IconBuildingCastle,
  IconBuildingEiffelTower,
  IconBuildingStadium,
  IconBus,
  IconCar,
  IconCreditCard,
  IconCrystalBall,
  IconDeviceGamepad,
  IconDeviceGamepad2,
  IconDeviceMobile,
  IconDeviceMobileOff,
  IconDeviceNintendo,
  IconDeviceTv,
  IconDice5,
  IconFileCertificate,
  IconGauge,
  IconHeadphones,
  IconId,
  IconLego,
  IconMail,
  IconMovie,
  IconMusic,
  IconNumber,
  IconPiano,
  IconPyramid,
  IconRadio,
  IconRegistered,
  IconRoad,
  IconSeedling,
  IconShirtSport,
  IconSteeringWheel,
  IconTargetArrow,
  IconThumbUp,
  IconTicket,
  IconTicketOff,
  IconTrafficLights,
  IconTrain,
  IconTrophy,
  type TablerIcon,
} from '@tabler/icons-react';
import type { PictogramName } from '../data/pictograms';

/**
 * Zuordnung der Motivnamen zu den Zeichnungen (Tabler Icons, MIT-Lizenz).
 * Es werden nur die hier aufgeführten Symbole ins Spiel gepackt.
 */
const GLYPHS: Record<PictogramName, TablerIcon> = {
  mail: IconMail,
  bottle: IconBottle,
  radio: IconRadio,
  tv: IconDeviceTv,
  music: IconMusic,
  movie: IconMovie,
  books: IconBooks,
  shirt: IconShirtSport,
  beer: IconBeer,
  ticket: IconTicket,
  train: IconTrain,
  card: IconCreditCard,
  bus: IconBus,
  road: IconRoad,
  'cable-car': IconAerialLift,
  castle: IconBuildingCastle,
  'eiffel-tower': IconBuildingEiffelTower,
  pyramid: IconPyramid,
  phone: IconDeviceMobile,
  gamepad: IconDeviceGamepad2,
  handheld: IconDeviceNintendo,
  'game-console': IconDeviceGamepad,
  'steering-wheel': IconSteeringWheel,
  headphones: IconHeadphones,
  blender: IconBlender,
  brick: IconLego,
  'id-card': IconId,
  certificate: IconFileCertificate,
  number: IconNumber,
  registered: IconRegistered,
  'traffic-lights': IconTrafficLights,
  'phone-off': IconDeviceMobileOff,
  'ticket-off': IconTicketOff,
  car: IconCar,
  gauge: IconGauge,
  piano: IconPiano,
  football: IconBallFootball,
  stadium: IconBuildingStadium,
  'crystal-ball': IconCrystalBall,
  trophy: IconTrophy,
  target: IconTargetArrow,
  'thumb-up': IconThumbUp,
  seedling: IconSeedling,
  dice: IconDice5,
};

interface PictogramProps {
  name: PictogramName;
  className?: string;
  /** Strichstärke: große Darstellungen wirken mit dünnerem Strich ruhiger. */
  stroke?: number;
}

/** Ein einzelnes Piktogramm. Rein dekorativ – die Bedeutung steht immer im Text daneben. */
export function Pictogram({ name, className, stroke = 1.75 }: PictogramProps) {
  const Glyph = GLYPHS[name];
  return <Glyph className={className} stroke={stroke} aria-hidden="true" focusable="false" />;
}

/** Piktogramm auf einer ruhigen, quadratischen Kachel. Die Breite legt `className` fest. */
export function PictogramTile({ name, className = '' }: { name: PictogramName; className?: string }) {
  return (
    <span className={`grid aspect-square shrink-0 place-items-center rounded-control bg-surface-2 text-ink ${className}`}>
      <Pictogram name={name} stroke={1.5} className="size-[56%]" />
    </span>
  );
}
