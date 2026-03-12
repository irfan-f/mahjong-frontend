import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getLobby, createGame } from '../api/endpoints';
import type { Lobby as LobbyType } from '../types';

export function Lobby() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getIdToken, user } = useAuth();
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

  // Poll lobby so host and others see when players join
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
        .catch(() => {
          // Ignore poll errors; keep showing current lobby
        });
    }, 2000);
    return () => clearInterval(interval);
  }, [id, lobby, getIdToken]);

  // When host starts a game, redirect other players (and host if they didn't navigate yet) to the game
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
      <div className="min-h-screen flex items-center justify-center text-muted">
        Loading lobby…
      </div>
    );
  }
  if (error || !lobby) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-[var(--color-danger)]">{error ?? 'Lobby not found'}</p>
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
            className="text-muted hover:text-[var(--color-text-primary)] shrink-0"
            aria-label="Back to home"
          >
            ←
          </Link>
          <span className="font-semibold truncate">Lobby</span>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-lg mx-auto w-full flex flex-col gap-6">
        {error && (
          <div className="panel px-4 py-2 text-[var(--color-danger)] text-sm" role="alert">
            {error}
          </div>
        )}

        <section className="panel p-4">
          <h2 className="text-sm font-medium text-muted mb-1">Lobby code</h2>
          <p className="text-xl font-mono font-semibold text-on-surface tracking-wide">{id}</p>
          <p className="text-muted text-sm mt-2">Share this code so others can join</p>
        </section>

        <section>
          <h2 className="text-sm font-medium text-muted mb-3">Players ({playerCount}/4)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((idx) => {
              const pid = playerIds[idx];
              const isMe = pid === user?.uid;
              return (
                <div
                  key={idx}
                  className={`panel p-4 flex flex-col items-center justify-center min-h-[80px] ${
                    isMe ? 'ring-2 ring-[var(--color-primary)]' : ''
                  }`}
                >
                  {pid ? (
                    <>
                      <span className="font-medium text-on-surface truncate w-full text-center">
                        {isMe ? 'You' : `Player ${idx + 1}`}
                      </span>
                      <span className="text-muted text-xs truncate w-full text-center">
                        {!isMe && pid}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted text-sm">Waiting for player…</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <div className="panel p-4 flex flex-col items-center gap-3 mt-auto">
          <button
            onClick={handleCreateGame}
            disabled={!canStart || creating}
            className="btn-primary w-full max-w-xs"
            aria-label={canStart ? 'Start game' : 'Need 4 players to start'}
          >
            {creating ? 'Starting…' : 'Start game'}
          </button>
          {!canStart && (
            <p className="text-muted text-sm">Need 4 players to start</p>
          )}
        </div>
      </main>
    </div>
  );
}
