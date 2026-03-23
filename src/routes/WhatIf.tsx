import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { AccountMenu } from '../components/AccountMenu';
import { WhatIfModal } from '../components/game/WhatIfModal';
import { Spinner } from '../components/Spinner';
import { Icon } from '../components/Icon';
import { icons } from '../icons';
import { getGame } from '../api/endpoints';
import type { Game as GameType } from '../types';

export function WhatIf() {
  const { gameId } = useParams<{ gameId?: string }>();
  const navigate = useNavigate();
  const { user, getIdToken, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [game, setGame] = useState<GameType | null>(null);
  const [loading, setLoading] = useState(Boolean(gameId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) {
      return;
    }
    let cancelled = false;
    getIdToken(true)
      .then((token) => (token ? getGame(gameId, token) : null))
      .then((data) => {
        if (!cancelled && data) setGame(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load game');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [gameId, getIdToken]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 text-muted" role="status" aria-live="polite" aria-busy="true">
        <Spinner className="w-8 h-8" />
        <p>Loading What-if…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-6 p-6">
        <p className="text-danger text-center">{error}</p>
        <Link to="/" className="btn-primary">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-(--color-surface)">
      <header className="app-header shrink-0 z-10 flex items-center justify-between gap-4 px-4 py-2">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-10 h-10 rounded-lg text-muted hover:text-text-primary hover:bg-surface-panel transition-colors shrink-0"
            aria-label="Back"
            title="Back"
          >
            <span className="inline-block scale-x-[-1]">
              <Icon src={icons.forwardArrow} className="size-5 [&_.icon-svg]:size-5" />
            </span>
          </button>
          <div className="min-w-0">
            <span className="font-semibold text-on-surface truncate block">What-if scorer</span>
            <span className="text-xs text-muted truncate block">Mahjong with friends</span>
          </div>
        </div>
        <AccountMenu theme={theme} setTheme={setTheme} onSignOut={signOut} />
      </header>

      <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col min-h-0">
        <WhatIfModal
          open
          onClose={() => navigate(-1)}
          currentUserId={user?.uid ?? null}
          game={game}
          getIdToken={getIdToken}
        />
      </main>
    </div>
  );
}
