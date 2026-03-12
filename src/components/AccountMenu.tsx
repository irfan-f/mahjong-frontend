import { useState, useRef, useCallback } from 'react';
import { useClickOutside } from '../hooks/useClickOutside';
import { ThemeToggle } from './ThemeToggle';
import type { Theme } from '../hooks/useTheme';
import { Icon } from './Icon';
import { icons } from '../icons';
import { useAuth } from '../auth/AuthContext';

export function AccountMenu({
  theme,
  setTheme,
  onSignOut,
  className,
}: {
  theme: Theme;
  setTheme: (t: Theme) => void;
  onSignOut: () => void | Promise<void>;
  className?: string;
}) {
  const { user, linkWithGoogle } = useAuth();
  const [open, setOpen] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    setOpen(false);
    setLinkError(null);
  }, []);

  useClickOutside(ref, handleClose, open);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false);
  }, []);

  const handleLinkWithGoogle = useCallback(async () => {
    setLinkError(null);
    setLinking(true);
    try {
      await linkWithGoogle();
      setOpen(false);
    } catch (e) {
      setLinkError(e instanceof Error ? e.message : 'Could not link account');
    } finally {
      setLinking(false);
    }
  }, [linkWithGoogle]);

  const menuId = 'account-menu';
  const showLinkToGoogle = user?.isAnonymous === true;

  return (
    <div ref={ref} className={`relative ${className ?? ''}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleKeyDown}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        aria-label="Account menu"
        title="Account menu"
        className="btn-nav-header min-h-[44px] min-w-[44px] text-text-primary"
      >
        <Icon src={icons.accountManage} className="size-5 [&_.icon-svg]:size-5" aria-hidden />
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Account options"
          className="absolute right-0 top-full z-50 mt-1 min-w-48 rounded-lg border border-border bg-surface-panel py-1 shadow-lg"
          onKeyDown={handleKeyDown}
        >
          <div role="none" className="px-1">
            <ThemeToggle theme={theme} setTheme={setTheme} variant="menu" />
          </div>
          {showLinkToGoogle && (
            <button
              type="button"
              role="menuitem"
              onClick={() => void handleLinkWithGoogle()}
              disabled={linking}
              className="flex w-full cursor-pointer items-center gap-3 rounded px-4 py-2.5 text-left text-sm text-text-primary hover:bg-surface-panel-muted focus:outline-none focus-visible:ring-1 focus-visible:ring-ring-focus disabled:opacity-50"
              aria-label="Link to Google account"
              title="Link to Google account"
            >
              <Icon src={icons.login} className="size-5 [&_.icon-svg]:size-5" aria-hidden />
              <span>{linking ? 'Linking…' : 'Link to Google account'}</span>
            </button>
          )}
          {linkError && (
            <div role="alert" className="px-4 py-2 text-sm text-danger">
              {linkError}
            </div>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              void onSignOut();
              setOpen(false);
            }}
            className="flex w-full cursor-pointer items-center gap-3 rounded px-4 py-2.5 text-left text-sm text-text-primary hover:bg-surface-panel-muted focus:outline-none focus-visible:ring-1 focus-visible:ring-ring-focus"
            aria-label="Sign out"
          >
            <Icon src={icons.logout} className="size-5 [&_.icon-svg]:size-5" aria-hidden />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
}
