import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { createLobby, joinLobby, userSetup } from '../api/endpoints';

export function Home() {
  const { user, signIn, signInAnonymous, signOut, getIdToken } = useAuth();
  const navigate = useNavigate();
  const [joinId, setJoinId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--color-surface)]">
        <header className="app-header px-4 py-3">
          <h1 className="text-xl font-semibold text-on-surface">Mahjong</h1>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center p-4 max-w-md mx-auto w-full gap-6">
          <p className="text-on-surface text-center">Sign in to create or join a game</p>
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
              Sign in anonymously
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-surface)]">
      <header className="app-header flex items-center justify-between px-4 py-3">
        <h1 className="text-xl font-semibold text-on-surface truncate">Mahjong</h1>
        <button
          onClick={signOut}
          className="text-sm text-muted hover:text-[var(--color-text-primary)] min-h-0 min-w-0 px-2"
          aria-label="Sign out"
        >
          Sign out
        </button>
      </header>

      <main className="flex-1 p-4 max-w-md mx-auto w-full flex flex-col gap-6">
        {error && (
          <div className="panel px-4 py-2 text-[var(--color-danger)] text-sm" role="alert">
            {error}
          </div>
        )}

        <section className="text-center">
          <p className="text-on-surface font-medium">Play with friends</p>
          <p className="text-muted text-sm mt-1">Create a lobby or join with a code</p>
        </section>

        <div className="flex flex-col gap-4">
          <button
            onClick={handleCreateLobby}
            disabled={loading}
            className="btn-primary w-full"
            aria-label="Create game"
          >
            Create game
          </button>
          <div className="panel p-4 flex flex-col sm:flex-row gap-2">
            <input
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              placeholder="Lobby code"
              className="flex-1 border border-[var(--color-border)] rounded px-3 py-2 bg-[var(--color-surface)] text-on-surface min-h-[44px]"
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

        <section className="panel p-4">
          <h2 className="text-sm font-medium text-muted mb-2">Your games</h2>
          <p className="text-muted text-sm">No games yet. Create or join a game above.</p>
        </section>
      </main>
    </div>
  );
}
