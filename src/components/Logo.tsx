/** Markenzeichen: ein Preisschild. Die Farben folgen dem hellen bzw. dunklen Design. */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false" className="shrink-0">
      <rect width="32" height="32" rx="9" fill="var(--accent)" />
      <path
        d="M9 15.2V10a1 1 0 0 1 1-1h5.2a2 2 0 0 1 1.4.6l6.6 6.6a2 2 0 0 1 0 2.8l-4.2 4.2a2 2 0 0 1-2.8 0L9.6 16.6a2 2 0 0 1-.6-1.4Z"
        fill="var(--on-accent)"
      />
      <circle cx="13" cy="13" r="1.7" fill="var(--accent)" />
    </svg>
  );
}
