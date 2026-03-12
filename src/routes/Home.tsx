import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { createLobby, joinLobby, userSetup, getMyLobbies } from '../api/endpoints';
import type { UserLobbySummary } from '../types';
import { useTheme } from '../hooks/useTheme';
import { ThemeToggle } from '../components/ThemeToggle';

export function Home() {
  const { user, signIn, signInAnonymous, signOut, getIdToken } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [joinId, setJoinId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lobbies, setLobbies] = useState<UserLobbySummary[]>([]);
  const [lobbiesLoading, setLobbiesLoading] = useState(false);

  const handleCreateLobby = async () => {
    const token = await getIdToken(true);
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      await userSetup(token);
      const { lobbyId } = await createLobby(token);
      navigate(`/lobby/${lobbyId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create lobby');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinLobby = async () => {
    if (!joinId.trim()) return;
    const token = await getIdToken(true);
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      await userSetup(token);
      await joinLobby(joinId.trim(), token);
      navigate(`/lobby/${joinId.trim()}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to join lobby');
    } finally {
      setLoading(false);
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

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--color-surface)]">
        <header className="app-header px-4 py-4 flex items-center justify-between">
          <h1 className="brand-title text-xl">Mahjong with friends</h1>
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </header>
        <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full gap-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-on-surface">Welcome</h2>
            <p className="text-muted">Sign in to create a game or join one with a code.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={signIn}
              className="btn-primary flex-1"
              aria-label="Sign in with Google"
            >
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
    <div className="min-h-screen flex flex-col bg-[var(--color-surface)]">
      <header className="app-header flex items-center justify-between px-4 py-3">
        <h1 className="brand-title text-lg truncate">Mahjong with friends</h1>
        <div className="flex items-center gap-1 shrink-0">
          <ThemeToggle theme={theme} setTheme={setTheme} />
          <button
          onClick={signOut}
          className="text-sm text-muted hover:text-[var(--color-text-primary)] min-h-0 min-w-0 px-3 py-2 rounded-lg hover:bg-[var(--color-surface-panel)] transition-colors"
          aria-label="Sign out"
        >
          Sign out
        </button>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="flex-1 p-6 max-w-md mx-auto w-full flex flex-col gap-8">
        {error && (
          <div
            className="panel px-4 py-3 text-[var(--color-danger)] text-sm rounded-xl"
            role="alert"
          >
            {error}
          </div>
        )}

        <section className="text-center space-y-1">
          <h2 className="text-xl font-bold text-on-surface">Play with friends</h2>
          <p className="text-muted">Create a lobby and share the code, or enter a code to join.</p>
        </section>

        <div className="flex flex-col gap-6">
          <button
            onClick={handleCreateLobby}
            disabled={loading}
            className="btn-primary w-full text-base py-3"
            aria-label="Create game"
          >
            {loading ? 'Creating…' : 'Create new game'}
          </button>
          <div className="panel p-4 rounded-xl flex flex-col sm:flex-row gap-3">
            <input
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              placeholder="Enter lobby code"
              className="flex-1 border border-[var(--color-border)] rounded-lg px-4 py-3 bg-[var(--color-surface)] text-on-surface min-h-[48px] placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--color-ring-focus)] focus:ring-offset-1"
              aria-label="Lobby code"
            />
            <button
              onClick={handleJoinLobby}
              disabled={loading || !joinId.trim()}
              className="btn-secondary shrink-0"
              aria-label="Join game"
            >
              Join game
            </button>
          </div>
        </div>

        <section className="panel p-4 rounded-xl mt-auto">
          <h2 className="text-sm font-semibold text-muted mb-1">Your games</h2>
          {lobbiesLoading ? (
            <p className="text-muted text-sm">Loading…</p>
          ) : lobbies.length === 0 ? (
            <p className="text-muted text-sm">Create or join a game above to get started.</p>
          ) : (
            <ul className="space-y-2">
              {lobbies.map((l) => (
                <li key={l.lobbyId}>
                  {l.currentGameId ? (
                    <Link
                      to={`/game/${l.currentGameId}`}
                      className="text-primary hover:underline font-medium"
                    >
                      Lobby {l.lobbyId.slice(0, 8)} — Game in progress
                    </Link>
                  ) : (
                    <Link
                      to={`/lobby/${l.lobbyId}`}
                      className="text-primary hover:underline font-medium"
                    >
                      Lobby {l.lobbyId.slice(0, 8)} — {l.playerCount}/4 players
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
