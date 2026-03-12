import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getLobby, createGame } from '../api/endpoints';
import type { Lobby as LobbyType } from '../types';
import { useTheme } from '../hooks/useTheme';
import { ThemeToggle } from '../components/ThemeToggle';

export function Lobby() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getIdToken, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [lobby, setLobby] = useState<LobbyType | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getIdToken(true)
      .then((token) => {
        if (!token || cancelled) return null;
        return getLobby(id, token);
      })
      .then((data) => {
        if (!cancelled && data) setLobby(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load lobby');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, getIdToken]);

  useEffect(() => {
    if (!id || !lobby) return;
    const interval = setInterval(() => {
      getIdToken(true)
        .then((token) => {
          if (!token) return null;
          return getLobby(id, token);
        })
        .then((data) => {
          if (data) setLobby(data);
        })
        .catch(() => {});
    }, 2000);
    return () => clearInterval(interval);
  }, [id, lobby, getIdToken]);

  useEffect(() => {
    if (lobby?.currentGameId) {
      navigate(`/game/${lobby.currentGameId}`, { replace: true });
    }
  }, [lobby?.currentGameId, navigate]);

  const handleCreateGame = async () => {
    if (!id) return;
    const token = await getIdToken(true);
    if (!token) return;
    setCreating(true);
    setError(null);
    try {
      const { gameId } = await createGame(id, token);
      navigate(`/game/${gameId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create game');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-muted" role="status" aria-live="polite" aria-busy="true">
        <span className="inline-block w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" aria-hidden />
        <p>Loading lobby…</p>
      </div>
    );
  }
  if (error || !lobby) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
        <p className="text-[var(--color-danger)] text-center">{error ?? 'Lobby not found'}</p>
        <Link to="/" className="btn-primary">
          Back to home
        </Link>
      </div>
    );
  }

  const playerIds = Object.keys(lobby.players ?? {});
  const playerCount = playerIds.length;
  const canStart = playerCount === 4;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-surface)]">
      <header className="app-header flex items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/"
            className="flex items-center justify-center w-10 h-10 rounded-lg text-muted hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-panel)] transition-colors shrink-0"
            aria-label="Back to home"
            title="Back to home"
          >
            ←
          </Link>
          <span className="font-semibold truncate text-on-surface">Lobby</span>
        </div>
        <ThemeToggle theme={theme} setTheme={setTheme} />
      </header>

      <main id="main-content" tabIndex={-1} className="flex-1 p-6 max-w-lg mx-auto w-full flex flex-col gap-6">
        {error && (
          <div
            className="panel px-4 py-3 text-[var(--color-danger)] text-sm rounded-xl"
            role="alert"
          >
            {error}
          </div>
        )}

        <section className="panel p-5 rounded-xl">
          <h2 className="text-sm font-semibold text-muted mb-1">Lobby code</h2>
          <p className="text-2xl font-mono font-bold text-on-surface tracking-wider select-all">
            {id}
          </p>
          <p className="text-muted text-sm mt-2">Share this code so friends can join</p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-muted mb-3">Players ({playerCount}/4)</h2>
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((idx) => {
              const pid = playerIds[idx];
              const isMe = pid === user?.uid;
              return (
                <div
                  key={idx}
                  className={`panel p-4 flex flex-col items-center justify-center min-h-[88px] rounded-xl transition-shadow ${
                    isMe ? 'ring-2 ring-[var(--color-primary)] ring-offset-2' : ''
                  }`}
                >
                  {pid ? (
                    <>
                      <span className="font-semibold text-on-surface truncate w-full text-center">
                        {isMe ? 'You' : `Player ${idx + 1}`}
                      </span>
                      {!isMe && (
                        <span className="text-muted text-xs truncate w-full text-center mt-0.5">
                          {pid}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-muted text-sm">Waiting…</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <div className="panel p-5 flex flex-col items-center gap-3 mt-auto rounded-xl">
          <button
            onClick={handleCreateGame}
            disabled={!canStart || creating}
            className="btn-primary w-full max-w-xs py-3"
            aria-label={canStart ? 'Start game' : 'Need 4 players to start'}
          >
            {creating ? 'Starting…' : 'Start game'}
          </button>
          {!canStart && (
            <p className="text-muted text-sm">Get 4 players in the lobby to start.</p>
          )}
        </div>
      </main>
    </div>
  );
}
