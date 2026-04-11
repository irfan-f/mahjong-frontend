import { useCallback, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { userSetup } from '../api/endpoints';
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
  const { user, linkWithGoogle, updateDisplayName, getIdToken } = useAuth();
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);
  const showLinkToGoogle = user?.isAnonymous === true;

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

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

  const openNameEdit = () => {
    setNameInput(user?.displayName ?? '');
    setNameError(null);
    setEditingName(true);
    requestAnimationFrame(() => nameInputRef.current?.focus());
  };

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setNameError('Name cannot be empty');
      return;
    }
    setNameSaving(true);
    setNameError(null);
    try {
      await updateDisplayName(trimmed);
      const token = await getIdToken(true);
      if (token) await userSetup(token, trimmed);
      setEditingName(false);
    } catch (e) {
      setNameError(e instanceof Error ? e.message : 'Could not save name');
    } finally {
      setNameSaving(false);
    }
  };

  const currentName = user?.displayName;

  return (
    <div className="panel rounded-xl border border-border p-3 shadow-md">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Account</h2>
      <div className="mt-2 space-y-3">

        {/* Display name */}
        <div className="space-y-1.5">
          <span className="text-xs text-muted">Display name</span>
          {editingName ? (
            <div className="flex flex-col gap-1.5">
              <input
                ref={nameInputRef}
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleSaveName();
                  if (e.key === 'Escape') setEditingName(false);
                }}
                maxLength={32}
                className="w-full rounded-lg border border-border bg-surface-panel px-3 py-2 text-sm text-on-surface placeholder:text-muted focus:border-(--color-primary) focus:outline-none"
                placeholder="Your name"
                aria-label="Display name"
                disabled={nameSaving}
              />
              {nameError && (
                <p className="text-xs text-danger" role="alert">{nameError}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void handleSaveName()}
                  disabled={nameSaving}
                  className="flex-1 rounded-lg bg-(--color-primary) px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {nameSaving ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingName(false)}
                  disabled={nameSaving}
                  className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-on-surface hover:bg-surface-panel-muted disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={openNameEdit}
              className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-left text-sm text-on-surface transition-colors hover:bg-surface-panel-muted"
              aria-label="Edit display name"
            >
              <span className={`flex-1 truncate ${currentName ? '' : 'text-muted italic'}`}>
                {currentName ?? 'Set a name…'}
              </span>
              <Icon src={icons.edit} className="size-4 shrink-0 [&_.icon-svg]:size-4" aria-hidden />
            </button>
          )}
        </div>

        {/* Theme */}
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
          <p className="text-sm text-danger" role="alert">{linkError}</p>
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
