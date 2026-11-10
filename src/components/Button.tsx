import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'lg' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary: die eine Hauptaktion eines Bildschirms. secondary/ghost: alles andere. */
  variant?: Variant;
  size?: Size;
  ref?: Ref<HTMLButtonElement>;
  children: ReactNode;
}

const base =
  'inline-flex w-full select-none items-center justify-center gap-2 rounded-control px-5 text-center font-semibold leading-tight ' +
  'transition-[background-color,box-shadow,color,scale] duration-150 ease-out enabled:active:scale-[0.98]';

/* Höhen in rem, damit die Tippfläche mit vergrößerter Schrift mitwächst (56 bzw. 48 px). */
const sizes: Record<Size, string> = {
  lg: 'min-h-14 py-2 text-body-lg',
  md: 'min-h-12 py-2 text-body',
};

const variants: Record<Variant, string> = {
  primary:
    'bg-accent text-on-accent enabled:hover:bg-accent-hover ' +
    'disabled:bg-surface-2 disabled:text-ink-3 disabled:shadow-[inset_0_0_0_1px_var(--line-strong)]',
  secondary: 'bg-surface text-ink shadow-[inset_0_0_0_1px_var(--line-strong)] enabled:hover:bg-surface-2',
  ghost: 'text-ink-2 enabled:hover:bg-surface-2 enabled:hover:text-ink',
};

export function Button({ variant = 'primary', size = 'lg', className = '', children, ...props }: ButtonProps) {
  return (
    <button type="button" className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Beschriftung für Screenreader und als Tooltip – ein Symbol allein erklärt sich nicht. */
  label: string;
  children: ReactNode;
}

/** Quadratische Schaltfläche mit Symbol, 44 × 44 px Tippfläche. */
export function IconButton({ label, className = '', children, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`grid size-[44px] shrink-0 place-items-center rounded-control text-ink-2 transition-colors duration-150 enabled:hover:bg-surface-2 enabled:hover:text-ink disabled:opacity-45 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
