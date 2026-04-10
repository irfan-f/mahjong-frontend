import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { createLobby, joinLobby, userSetup, getMyLobbies, deleteLobby } from '../api/endpoints';
import type { UserLobbySummary } from '../types';
import { useTheme } from '../hooks/useTheme';
import { SiteHeader } from '../components/SiteHeader';
import { Spinner } from '../components/Spinner';
import { Icon } from '../components/Icon';
import { icons } from '../icons';

export function Home() {
  const { user, loading: authLoading, signIn, signInAnonymous, signOut, getIdToken } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const joinInputRef = useRef<HTMLInputElement>(null);
  const [joinId, setJoinId] = useState('');
  const [joinExpanded, setJoinExpanded] = useState(false);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lobbies, setLobbies] = useState<UserLobbySummary[]>([]);
  const [lobbiesLoading, setLobbiesLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!joinExpanded) return;
    const id = requestAnimationFrame(() => joinInputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [joinExpanded]);

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

  const collapseJoin = () => {
    setJoinExpanded(false);
    setJoinId('');
    setError(null);
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
        <SiteHeader theme={theme} setTheme={setTheme} />
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
        <SiteHeader theme={theme} setTheme={setTheme} />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 min-h-0 flex flex-col items-center justify-center p-3 sm:p-4 max-w-md mx-auto w-full gap-4 sm:gap-6"
        >
          <div className="text-center space-y-1.5 sm:space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-on-surface">Welcome</h2>
            <p className="text-muted text-sm">Sign in to create a game or join with a code.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
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
      <SiteHeader theme={theme} setTheme={setTheme} onSignOut={signOut} />

      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 min-h-0 flex flex-col overflow-hidden p-3 sm:p-4 max-w-md mx-auto w-full gap-2 sm:gap-4"
      >
        {error && (
          <div className="panel px-3 py-2.5 sm:px-4 sm:py-3 text-danger text-sm rounded-xl shrink-0" role="alert">
            {error}
          </div>
        )}

        <section
          className="panel p-3 sm:p-4 rounded-xl flex flex-col gap-3 sm:gap-4 shrink-0"
          aria-labelledby="play-heading"
        >
          <h2 id="play-heading" className="sr-only">
            Play
          </h2>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <button
              onClick={handleCreateLobby}
              disabled={creating}
              className="btn-primary flex-1 py-3 inline-flex items-center justify-center gap-2"
              aria-label={creating ? 'Creating game' : 'Create game'}
            >
              {creating && <Spinner />}
              {creating ? 'Creating…' : 'Create new game'}
            </button>

            {!joinExpanded ? (
              <button
                type="button"
                onClick={() => setJoinExpanded(true)}
                className="btn-secondary flex-1 py-3"
                aria-expanded={joinExpanded}
                aria-controls="join-lobby-panel"
              >
                Join game
              </button>
            ) : null}
          </div>

          {joinExpanded ? (
            <div
              id="join-lobby-panel"
              className="flex flex-col gap-2 pt-2 sm:pt-3 mt-1 border-t border-border"
              role="region"
              aria-label="Join with lobby code"
            >
              <label htmlFor="lobby-code" className="text-sm font-medium text-on-surface">
                Lobby code
              </label>
              <div className="flex min-h-[44px] flex-col gap-2 sm:flex-row sm:flex-nowrap sm:items-stretch">
                <input
                  ref={joinInputRef}
                  id="lobby-code"
                  type="text"
                  value={joinId}
                  onChange={(e) => setJoinId(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && joinId.trim() && !joining) {
                      e.preventDefault();
                      void handleJoinLobby();
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      collapseJoin();
                    }
                  }}
                  placeholder="Paste or type the code"
                  autoComplete="off"
                  className="min-w-0 flex-1 rounded-lg border border-border bg-(--color-surface) px-3 py-2.5 text-sm text-on-surface placeholder:text-muted focus-visible:ring-2 focus-visible:ring-(--color-ring-focus) focus-visible:ring-offset-1"
                  aria-invalid={error ? 'true' : undefined}
                />
                <button
                  type="button"
                  onClick={handleJoinLobby}
                  disabled={joining || !joinId.trim()}
                  className="btn-primary inline-flex h-11 min-h-[44px] w-full shrink-0 items-center justify-center gap-2 px-4 py-2 sm:w-auto sm:self-stretch"
                  aria-label={joining ? 'Joining game' : 'Join game with this code'}
                >
                  {joining && <Spinner />}
                  Join
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <section
          className={`panel flex flex-col gap-2 rounded-xl p-3 sm:p-4 ${lobbies.length > 0 ? 'min-h-0 flex-1' : 'shrink-0'}`}
          aria-labelledby="your-games-heading"
        >
          <h2 id="your-games-heading" className="text-sm sm:text-base font-semibold text-on-surface">
            Your games
          </h2>
          {!lobbiesLoading && lobbies.length > 0 ? (
            <p className="text-muted text-xs sm:text-sm">Recently opened.</p>
          ) : null}

          {lobbiesLoading ? (
            <p className="text-muted text-sm inline-flex items-center gap-2">
              <Spinner className="w-4 h-4" aria-hidden />
              Fetching your lobbies…
            </p>
          ) : lobbies.length === 0 ? (
            <p className="text-muted text-sm leading-snug">
              No recent lobbies. Create one above or join with a code.
            </p>
          ) : (
            <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
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
