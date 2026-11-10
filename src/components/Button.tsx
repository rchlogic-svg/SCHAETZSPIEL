import { motion, type HTMLMotionProps } from 'motion/react';
import type { ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: Variant;
  children: ReactNode;
}

const base =
  'inline-flex h-14 short:h-12 w-full select-none items-center justify-center gap-2 rounded-2xl px-6 ' +
  'text-[1.0625rem] font-bold tracking-[-0.01em] transition-[background-color,color,box-shadow,opacity] duration-200';

const variants: Record<Variant, string> = {
  primary:
    'bg-brand text-ink-950 shadow-[0_12px_32px_-10px_rgb(255_214_10/0.55),inset_0_-3px_0_rgb(0_0_0/0.14)] ' +
    'hover:bg-[#ffe03d] disabled:bg-white/10 disabled:text-white/45 disabled:shadow-none',
  secondary:
    'bg-white/10 text-white ring-1 ring-inset ring-white/15 hover:bg-white/16 disabled:opacity-40',
  ghost: 'text-white/70 hover:bg-white/8 hover:text-white disabled:opacity-40',
};

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  return (
    <motion.button
      type="button"
      whileTap={props.disabled ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
