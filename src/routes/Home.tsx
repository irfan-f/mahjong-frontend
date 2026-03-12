import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { createLobby, joinLobby, userSetup, getMyLobbies, deleteLobby } from '../api/endpoints';
import type { UserLobbySummary } from '../types';
import { useTheme } from '../hooks/useTheme';
import { ThemeToggle } from '../components/ThemeToggle';
import { AccountMenu } from '../components/AccountMenu';
import { Spinner } from '../components/Spinner';
import { Icon } from '../components/Icon';
import { icons } from '../icons';

export function Home() {
  const { user, loading: authLoading, signIn, signInAnonymous, signOut, getIdToken } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [joinId, setJoinId] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lobbies, setLobbies] = useState<UserLobbySummary[]>([]);
  const [lobbiesLoading, setLobbiesLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreateLobby = async () => {
    const token = await getIdToken(true);
    if (!token) return;
    setCreating(true);
    setError(null);
    try {
      await userSetup(token);
      const { lobbyId } = await createLobby(token);
      navigate(`/lobby/${lobbyId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create lobby');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinLobby = async () => {
    if (!joinId.trim()) return;
    const token = await getIdToken(true);
    if (!token) return;
    setJoining(true);
    setError(null);
    try {
      await userSetup(token);
      await joinLobby(joinId.trim(), token);
      navigate(`/lobby/${joinId.trim()}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to join lobby');
    } finally {
      setJoining(false);
    }
  };

  const handleDeleteLobby = async (lobbyId: string) => {
    if (!window.confirm('Delete this lobby? All players will be removed.')) return;
    const token = await getIdToken(true);
    if (!token) return;
    setDeletingId(lobbyId);
    setError(null);
    try {
      await deleteLobby(lobbyId, token);
      setLobbies((prev) => prev.filter((l) => l.lobbyId !== lobbyId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete lobby');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (!user) {
      setLobbies([]);
      return;
    }
    let cancelled = false;
    setLobbiesLoading(true);
    getIdToken(true)
      .then((token) => {
        if (!token || cancelled) return null;
        return getMyLobbies(token);
      })
      .then((data) => {
        if (!cancelled && data) setLobbies(data.lobbies);
      })
      .finally(() => {
        if (!cancelled) setLobbiesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, getIdToken]);

  if (authLoading) {
    return (
      <div className="h-screen flex flex-col bg-(--color-surface)">
        <header className="app-header shrink-0 px-4 py-3 flex items-center justify-between">
          <h1 className="brand-title text-xl">Mahjong with friends</h1>
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 min-h-0 flex flex-col items-center justify-center p-4"
        >
          <Spinner className="w-8 h-8 text-muted" aria-hidden />
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex flex-col bg-(--color-surface)">
        <header className="app-header shrink-0 px-4 py-3 flex items-center justify-between">
          <h1 className="brand-title text-xl">Mahjong with friends</h1>
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 min-h-0 flex flex-col items-center justify-center p-4 max-w-md mx-auto w-full gap-6"
        >
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-on-surface">Welcome</h2>
            <p className="text-muted text-sm">Sign in to create a game or join one with a code.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={signIn}
              className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
              aria-label="Sign in with Google"
            >
              <Icon src={icons.login} className="size-5 [&_.icon-svg]:size-5" aria-hidden />
              Sign in with Google
            </button>
            <button
              onClick={signInAnonymous}
              className="btn-secondary flex-1"
              aria-label="Sign in anonymously"
            >
              Play as guest
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-(--color-surface)">
      <header className="app-header shrink-0 flex items-center justify-between px-4 py-3">
        <h1 className="brand-title text-lg truncate">Mahjong with friends</h1>
        <AccountMenu theme={theme} setTheme={setTheme} onSignOut={signOut} />
      </header>

      <main id="main-content" tabIndex={-1} className="flex-1 min-h-0 overflow-auto p-4 max-w-md mx-auto w-full flex flex-col gap-5">
        {error && (
          <div className="panel px-4 py-3 text-danger text-sm rounded-xl" role="alert">
            {error}
          </div>
        )}

        <section className="panel p-4 rounded-xl flex flex-col gap-3" aria-labelledby="play-heading">
          <h2 id="play-heading" className="text-base font-semibold text-on-surface">Play with friends</h2>
          <button
            onClick={handleCreateLobby}
            disabled={creating}
            className="btn-primary w-full py-3 inline-flex items-center justify-center gap-2"
            aria-label={creating ? 'Creating game' : 'Create game'}
          >
            {creating && <Spinner />}
            {creating ? 'Creating…' : 'Create new game'}
          </button>
          <div className="flex flex-col sm:flex-row gap-2">
            <label htmlFor="lobby-code" className="sr-only">
              Lobby code
            </label>
            <input
              id="lobby-code"
              type="text"
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              placeholder="Lobby code"
              autoComplete="off"
              className="flex-1 border border-border rounded-lg px-3 py-2.5 bg-(--color-surface) text-on-surface min-h-[44px] text-sm placeholder:text-muted focus-visible:ring-2 focus-visible:ring-(--color-ring-focus) focus-visible:ring-offset-1"
              aria-label="Lobby code"
              aria-invalid={error ? 'true' : undefined}
            />
            <button
              onClick={handleJoinLobby}
              disabled={joining || !joinId.trim()}
              className="btn-secondary shrink-0 inline-flex items-center justify-center gap-2 min-h-[44px]"
              aria-label={joining ? 'Joining game' : 'Join game'}
            >
              {joining && <Spinner />}
              Join game
            </button>
          </div>
        </section>

        <section className="panel p-3 rounded-xl flex flex-row items-center justify-between gap-3" aria-labelledby="learn-heading">
          <div className="min-w-0">
            <h2 id="learn-heading" className="text-sm font-semibold text-on-surface">Learn to play</h2>
            <p className="text-muted text-xs mt-0.5">Single-player tutorial</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/learn')}
            className="btn-secondary shrink-0 text-sm py-2.5 px-4 min-h-[44px]"
            aria-label="Open learn to play tutorial"
          >
            Open tutorial
          </button>
        </section>

        <section className="panel p-3 rounded-xl" aria-labelledby="your-games-heading">
            <h2 id="your-games-heading" className="text-sm font-semibold text-muted mb-2">Your games</h2>
            {lobbiesLoading ? (
              <p className="text-muted text-sm inline-flex items-center gap-2">
                <Spinner className="w-4 h-4" aria-hidden />
                Loading…
              </p>
            ) : lobbies.length === 0 ? (
              <p className="text-muted text-sm">No games yet. Create one or join with a code above.</p>
            ) : (
            <ul className="space-y-1.5">
              {lobbies.map((l) => (
                <li key={l.lobbyId} className="flex items-center gap-2 group">
                  {l.currentGameId ? (
                    <Link
                      to={`/game/${l.currentGameId}`}
                      className="flex-1 min-w-0 text-primary hover:underline font-medium text-sm truncate"
                    >
                      Lobby {l.lobbyId.slice(0, 8)} — Game in progress
                    </Link>
                  ) : (
                    <Link
                      to={`/lobby/${l.lobbyId}`}
                      className="flex-1 min-w-0 text-primary hover:underline font-medium text-sm truncate"
                    >
                      Lobby {l.lobbyId.slice(0, 8)} — {l.playerCount}/4 players
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleDeleteLobby(l.lobbyId);
                    }}
                    disabled={deletingId === l.lobbyId}
                    className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg text-muted hover:text-danger hover:bg-surface-panel transition-colors disabled:opacity-50 min-w-[44px] min-h-[44px]"
                    aria-label={`Delete lobby ${l.lobbyId.slice(0, 8)}`}
                    title="Delete lobby"
                  >
                    {deletingId === l.lobbyId ? (
                      <Spinner className="w-4 h-4" aria-hidden />
                    ) : (
                      <Icon src={icons.delete} className="size-4 [&_.icon-svg]:size-4" aria-hidden />
                    )}
                  </button>
                </li>
              ))}
            </ul>
            )}
        </section>
      </main>
    </div>
  );
}
