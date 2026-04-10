import { useState, useCallback, type ReactNode } from 'react';
import { AccountMenu } from './AccountMenu';
import { AppNav } from './AppNav';
import { AccountDrawerCard } from './AccountDrawerCard';
import { MobileMenuShell } from './MobileMenuShell';
import { Icon } from './Icon';
import { icons } from '../icons';
import type { Theme } from '../hooks/useTheme';

export type PlaySessionHeaderProps = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  onSignOut: () => void | Promise<void>;
  title: string;
  subtitle?: string;
  /** Optional control before the title stack (e.g. home link). */
  leading?: ReactNode;
  /** Right-side cluster on large screens (e.g. What-if, status). */
  desktopActions?: ReactNode;
  /** Injected under main nav in the mobile drawer; receive `close` to dismiss after navigation. */
  mobileDrawerExtras?: ReactNode | ((close: () => void) => ReactNode);
  /** Shown between title and menu on small screens only (e.g. turn status). */
  mobileStatus?: ReactNode;
};

export function PlaySessionHeader({
  theme,
  setTheme,
  onSignOut,
  title,
  subtitle,
  leading,
  desktopActions,
  mobileDrawerExtras,
  mobileStatus,
}: PlaySessionHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const close = useCallback(() => setMobileOpen(false), []);
  const menuTitleId = 'play-session-menu-title';

  const extras =
    typeof mobileDrawerExtras === 'function' ? mobileDrawerExtras(close) : mobileDrawerExtras;

  return (
    <>
      <header className="app-header shrink-0 z-30 px-2 py-1 sm:px-3 lg:py-1.5">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
            {leading}
            <div className="min-w-0">
              <span className="block truncate text-sm font-semibold text-on-surface sm:text-base">
                {title}
              </span>
              {subtitle ? (
                <span className="hidden truncate text-xs text-muted sm:block">{subtitle}</span>
              ) : null}
            </div>
          </div>

          {mobileStatus ? (
            <div className="flex max-w-[38%] shrink-0 items-center justify-end truncate lg:hidden">{mobileStatus}</div>
          ) : null}

          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            {desktopActions}
            <AccountMenu theme={theme} setTheme={setTheme} onSignOut={onSignOut} />
          </div>

          <button
            type="button"
            className="btn-nav-header shrink-0 lg:hidden"
            aria-expanded={mobileOpen}
            aria-controls="play-session-drawer"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            title={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen((o) => !o)}
          >
            <Icon src={icons.menu} className="size-5 [&_.icon-svg]:size-5" aria-hidden />
          </button>
        </div>
      </header>

      <MobileMenuShell open={mobileOpen} onClose={close} titleId={menuTitleId}>
        <div
          id="play-session-drawer"
          className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto overscroll-contain p-4"
        >
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border pb-3">
            <h2 id={menuTitleId} className="text-base font-semibold text-on-surface">
              Menu
            </h2>
            <button
              type="button"
              onClick={close}
              className="rounded-lg px-2 py-1.5 text-sm font-medium text-muted hover:bg-surface-panel hover:text-on-surface"
              aria-label="Close menu"
            >
              Done
            </button>
          </div>

          <AppNav variant="drawer" onItemClick={close} />

          {extras ? <div className="flex flex-col gap-1">{extras}</div> : null}

          <AccountDrawerCard
            theme={theme}
            setTheme={setTheme}
            onSignOut={onSignOut}
            onClose={close}
          />
        </div>
      </MobileMenuShell>
    </>
  );
}
