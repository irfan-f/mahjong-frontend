import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { SiteHeader } from '../components/SiteHeader';
import { WhatIfModal } from '../components/game/WhatIfModal';
import { Spinner } from '../components/Spinner';
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
      <div className="h-screen flex flex-col bg-(--color-surface)">
        <SiteHeader theme={theme} setTheme={setTheme} onSignOut={user ? signOut : undefined} />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 flex flex-col items-center justify-center gap-4 text-muted"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <Spinner className="w-8 h-8" />
          <p>Loading What-if…</p>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col bg-(--color-surface)">
        <SiteHeader theme={theme} setTheme={setTheme} onSignOut={user ? signOut : undefined} />
        <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
          <p className="text-danger text-center max-w-md">{error}</p>
          <Link to="/" className="btn-primary">
            Back to home
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-(--color-surface)">
      <SiteHeader theme={theme} setTheme={setTheme} onSignOut={user ? signOut : undefined} />

      <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col min-h-0 overflow-auto">
        <div className="shrink-0 px-4 pt-4 pb-2 max-w-lg mx-auto w-full">
          <h1 className="text-xl font-semibold text-on-surface">What-if scorer</h1>
          <p className="text-sm text-muted mt-1.5">
            Build a winning hand, choose a ruleset, then score it. Sign in to run the scorer.{' '}
            {gameId && game
              ? 'Your hand from this game can be prefilled when it has 13 tiles.'
              : 'During a game, use the what-if control on the table to open this page with your hand ready to prefill.'}
          </p>
        </div>

        <div className="flex-1 min-h-0 px-4 pb-6 max-w-lg mx-auto w-full">
          <WhatIfModal
            open
            embedded
            onClose={() => navigate('/')}
            currentUserId={user?.uid ?? null}
            game={game}
            getIdToken={getIdToken}
          />
        </div>
      </main>
    </div>
  );
}
