import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getLobby, createGame, deleteLobby } from '../api/endpoints';
import type { Lobby as LobbyType } from '../types';
import { useTheme } from '../hooks/useTheme';
import { AccountMenu } from '../components/AccountMenu';
import { Spinner } from '../components/Spinner';
import { Icon } from '../components/Icon';
import { icons } from '../icons';

export function Lobby() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getIdToken, user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [lobby, setLobby] = useState<LobbyType | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
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

  const handleDeleteLobby = async () => {
    if (!id || !window.confirm('Delete this lobby? All players will be removed.')) return;
    const token = await getIdToken(true);
    if (!token) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteLobby(id, token);
      navigate('/', { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete lobby');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 text-muted" role="status" aria-live="polite" aria-busy="true">
        <Spinner className="w-8 h-8" />
        <p>Loading lobby…</p>
      </div>
    );
  }
  if (error || !lobby) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-6 p-6">
        <p className="text-danger text-center">{error ?? 'Lobby not found'}</p>
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
    <div className="h-screen flex flex-col bg-(--color-surface)">
      <header className="app-header shrink-0 flex items-center justify-between gap-4 px-4 py-2">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/"
            className="flex items-center justify-center w-10 h-10 rounded-lg text-muted hover:text-text-primary hover:bg-surface-panel transition-colors shrink-0"
            aria-label="Back to home"
            title="Back to home"
          >
            <span className="inline-block scale-x-[-1]">
              <Icon src={icons.forwardArrow} className="size-5 [&_.icon-svg]:size-5" />
            </span>
          </Link>
          <span className="font-semibold truncate text-on-surface">Lobby</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleDeleteLobby}
            disabled={deleting}
            className="flex items-center justify-center w-10 h-10 rounded-lg text-muted hover:text-danger hover:bg-surface-panel transition-colors disabled:opacity-50"
            aria-label="Delete lobby"
            title="Delete lobby"
          >
            <Icon src={icons.delete} className="size-5 [&_.icon-svg]:size-5" />
          </button>
          <AccountMenu theme={theme} setTheme={setTheme} onSignOut={signOut} />
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="flex-1 min-h-0 overflow-auto p-4 max-w-lg mx-auto w-full flex flex-col gap-4">
        {error && (
          <div className="panel px-4 py-3 text-danger text-sm rounded-xl" role="alert">
            {error}
          </div>
        )}

        <section className="panel p-3 rounded-xl">
          <h2 className="text-sm font-semibold text-muted mb-0.5">Lobby code</h2>
          <p className="text-xl font-mono font-bold text-on-surface tracking-wider select-all">
            {id}
          </p>
          <p className="text-muted text-xs mt-1">Share this code so friends can join</p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-muted mb-2">Players ({playerCount}/4)</h2>
          <div className="grid grid-cols-2 gap-2">
            {[0, 1, 2, 3].map((idx) => {
              const pid = playerIds[idx];
              const isMe = pid === user?.uid;
              return (
                <div
                  key={idx}
                  className={`panel p-3 flex flex-col items-center justify-center min-h-[72px] rounded-xl transition-shadow ${
                    isMe ? 'ring-2 ring-(--color-primary) ring-offset-2' : ''
                  }`}
                >
                  {pid ? (
                    <>
                      <span className="font-semibold text-on-surface truncate w-full text-center text-sm">
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

        <div className="panel p-3 flex flex-col items-center gap-2 mt-auto rounded-xl">
          <button
            onClick={handleCreateGame}
            disabled={!canStart || creating}
            className="btn-primary w-full max-w-xs py-3 inline-flex items-center justify-center gap-2"
            aria-label={creating ? 'Starting game' : canStart ? 'Start game' : 'Need 4 players to start'}
          >
            {creating && <Spinner />}
            {creating ? 'Starting…' : 'Start game'}
          </button>
          {!canStart && (
            <p className="text-muted text-xs">Get 4 players in the lobby to start.</p>
          )}
        </div>
      </main>
    </div>
  );
}
