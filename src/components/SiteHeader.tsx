import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AccountMenu } from './AccountMenu';
import { ThemeToggle } from './ThemeToggle';
import { AppNav } from './AppNav';
import { AccountDrawerCard } from './AccountDrawerCard';
import { GuestAppearanceCard } from './GuestAppearanceCard';
import { MobileMenuShell } from './MobileMenuShell';
import { Icon } from './Icon';
import { icons } from '../icons';
import type { Theme } from '../hooks/useTheme';

export type SiteHeaderProps = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  /** When provided, desktop shows account menu and the mobile drawer includes the account card. */
  onSignOut?: () => void | Promise<void>;
};

export function SiteHeader({ theme, setTheme, onSignOut }: SiteHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const signedIn = Boolean(onSignOut);
  const menuTitleId = 'site-nav-menu-title';

  return (
    <>
      <header className="app-header shrink-0 z-30 px-2 py-1 sm:px-3 md:-1.5">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-[1fr_auto] items-center gap-x-2 gap-y-0.5 md:grid-cols-[1fr_auto_1fr] md:gap-x-4">
          <Link
            to="/"
            className="brand-title col-start-1 row-start-1 min-w-0 max-w-full justify-self-start truncate text-base transition-opacity hover:opacity-90"
            aria-label="Mahjong with Friends — Home"
          >
            Mahjong with Friends
          </Link>

          <div className="col-start-2 row-start-1 hidden min-w-0 justify-self-center md:col-start-2 md:flex">
            <AppNav variant="header" />
          </div>

          <div className="col-start-2 flex items-center justify-end gap-1 justify-self-end md:col-start-3">
            <div className="hidden md:flex md:items-center">
              {signedIn ? (
                <AccountMenu theme={theme} setTheme={setTheme} onSignOut={onSignOut!} />
              ) : (
                <ThemeToggle theme={theme} setTheme={setTheme} />
              )}
            </div>
            <button
              type="button"
              className="btn-nav-header md:hidden"
              aria-expanded={mobileOpen}
              aria-controls="site-nav-drawer"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              title={mobileOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMobileOpen((o) => !o)}
            >
              <Icon src={icons.menu} className="size-5 [&_.icon-svg]:size-5" aria-hidden />
            </button>
          </div>
        </div>
      </header>

      <MobileMenuShell open={mobileOpen} onClose={closeMobile} titleId={menuTitleId}>
        <div
          id="site-nav-drawer"
          className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto overscroll-contain p-4"
        >
          <AppNav variant="drawer" onItemClick={closeMobile} />

          {signedIn ? (
            <AccountDrawerCard
              theme={theme}
              setTheme={setTheme}
              onSignOut={onSignOut!}
              onClose={closeMobile}
            />
          ) : (
            <GuestAppearanceCard theme={theme} setTheme={setTheme} />
          )}
        </div>
      </MobileMenuShell>
    </>
  );
}
