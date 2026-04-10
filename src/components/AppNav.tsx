import { NavLink } from 'react-router-dom';

function navLinkClassName(isActive: boolean, variant: 'header' | 'drawer'): string {
  if (variant === 'header') {
    return [
      'inline-flex items-center whitespace-nowrap rounded-lg border px-2.5 py-1 text-sm font-medium transition-colors min-h-9',
      isActive
        ? 'border-(--color-primary)/25 bg-(--color-secondary) text-(--color-primary)'
        : 'border-transparent text-muted hover:bg-(--btn-nav-hover) hover:text-on-surface',
    ].join(' ');
  }
  return [
    'flex w-full rounded-lg px-4 py-3 text-left text-base font-semibold transition-colors min-h-12 items-center',
    isActive
      ? 'bg-(--color-secondary) text-(--color-primary)'
      : 'text-on-surface hover:bg-surface-panel-muted',
  ].join(' ');
}

export type AppNavProps = {
  onItemClick?: () => void;
  variant?: 'header' | 'drawer';
  className?: string;
};

export function AppNav({ onItemClick, variant = 'header', className }: AppNavProps) {
  const navClass = [
    variant === 'header'
      ? 'flex flex-wrap items-center justify-center gap-0.5 lg:gap-1'
      : 'flex flex-col gap-0.5',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <nav className={navClass} aria-label="Main">
      <NavLink
        to="/"
        end
        onClick={onItemClick}
        className={({ isActive }) => navLinkClassName(isActive, variant)}
      >
        Home
      </NavLink>
      <NavLink
        to="/learn"
        onClick={onItemClick}
        className={({ isActive }) => navLinkClassName(isActive, variant)}
      >
        Learn (WIP)
      </NavLink>
      <NavLink
        to="/what-if"
        onClick={onItemClick}
        className={({ isActive }) => navLinkClassName(isActive, variant)}
      >
        Scorer
      </NavLink>
    </nav>
  );
}
