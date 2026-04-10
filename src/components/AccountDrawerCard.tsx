import { useState, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import type { Theme } from '../hooks/useTheme';
import { ThemeToggle } from './ThemeToggle';
import { Icon } from './Icon';
import { icons } from '../icons';

type AccountDrawerCardProps = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  onSignOut: () => void | Promise<void>;
  onClose: () => void;
};

export function AccountDrawerCard({ theme, setTheme, onSignOut, onClose }: AccountDrawerCardProps) {
  const { user, linkWithGoogle } = useAuth();
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);
  const showLinkToGoogle = user?.isAnonymous === true;

  const handleLinkWithGoogle = useCallback(async () => {
    setLinkError(null);
    setLinking(true);
    try {
      await linkWithGoogle();
    } catch (e) {
      setLinkError(e instanceof Error ? e.message : 'Could not link account');
    } finally {
      setLinking(false);
    }
  }, [linkWithGoogle]);

  return (
    <div className="panel rounded-xl border border-border p-3 shadow-md">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Account</h2>
      <div className="mt-2 space-y-3">
        <div className="space-y-1.5">
          <span className="text-xs text-muted">Theme</span>
          <ThemeToggle theme={theme} setTheme={setTheme} variant="inline" />
        </div>
        {showLinkToGoogle && (
          <button
            type="button"
            onClick={() => void handleLinkWithGoogle()}
            disabled={linking}
            className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-left text-sm font-medium text-on-surface transition-colors hover:bg-surface-panel-muted disabled:opacity-50"
            aria-label="Link to Google account"
          >
            <Icon src={icons.login} className="size-5 shrink-0 [&_.icon-svg]:size-5" aria-hidden />
            <span>{linking ? 'Linking…' : 'Link to Google'}</span>
          </button>
        )}
        {linkError && (
          <p className="text-sm text-danger" role="alert">
            {linkError}
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            void onSignOut();
            onClose();
          }}
          className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-left text-sm font-medium text-on-surface transition-colors hover:bg-surface-panel-muted"
          aria-label="Sign out"
        >
          <Icon src={icons.logout} className="size-5 shrink-0 [&_.icon-svg]:size-5" aria-hidden />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
}
