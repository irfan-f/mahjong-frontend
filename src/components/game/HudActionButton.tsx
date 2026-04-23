import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type Variant = 'primary' | 'secondary' | 'danger';

export function HudActionButton({
  variant = 'primary',
  className = '',
  children,
  ...props
}: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> & { variant?: Variant }) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed';
  const tone =
    variant === 'primary'
      ? 'bg-(--color-primary) text-white hover:opacity-95'
      : variant === 'danger'
        ? 'bg-danger text-white hover:opacity-95'
        : 'bg-surface-panel text-on-surface border border-border hover:bg-surface-panel-muted/40';

  return (
    <button {...props} className={[base, tone, className].filter(Boolean).join(' ')}>
      {children}
    </button>
  );
}
