import type { ButtonHTMLAttributes, PropsWithChildren, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'soft' | 'softDanger';

export function HudActionButton({
  variant = 'primary',
  className = '',
  children,
  loading = false,
  loadingContent,
  ...props
}: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> & {
  variant?: Variant;
  loading?: boolean;
  loadingContent?: ReactNode;
}) {
  const base =
    'relative inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed';
  const tone =
    variant === 'primary'
      ? 'bg-(--color-primary) text-white hover:opacity-95'
      : variant === 'danger'
        ? 'bg-danger text-white hover:opacity-95'
        : 'bg-surface-panel text-on-surface border border-border hover:bg-surface-panel-muted/40';

  return (
    <button {...props} className={[base, tone, className].filter(Boolean).join(' ')}>
      <span className={loading ? 'invisible' : 'inline-flex items-center justify-center gap-2'}>{children}</span>
      {loading ? (
        <span className="absolute inset-0 inline-flex items-center justify-center" aria-hidden>
          {loadingContent ?? null}
        </span>
      ) : null}
    </button>
  );
}
