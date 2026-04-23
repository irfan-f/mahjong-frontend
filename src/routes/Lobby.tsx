import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getLobby, createGame, deleteLobby, addBotToLobbySeat, removeBotFromLobbySeat, renameBotInLobbySeat, userSetup } from '../api/endpoints';
import type { Lobby as LobbyType } from '../types';
import { useTheme } from '../hooks/useTheme';
import { PlaySessionHeader } from '../components/PlaySessionHeader';
import { Spinner } from '../components/Spinner';
import { Icon } from '../components/Icon';
import { icons } from '../icons';
import { DEFAULT_RULESET_ID } from '../terminology/rulesetTerminology';

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
  const [addingBotSeat, setAddingBotSeat] = useState<number | null>(null);
  const [removingBotSeat, setRemovingBotSeat] = useState<number | null>(null);
  const [editingBotSeat, setEditingBotSeat] = useState<number | null>(null);
  const [editingBotName, setEditingBotName] = useState<string>('');
  const [renamingBotSeat, setRenamingBotSeat] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopyCode = () => {
    if (!id) return;
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  const displaySeats = (lobbyData: LobbyType): (string | null)[] => {
    if (Array.isArray(lobbyData.seats)) {
      const next: (string | null)[] = [null, null, null, null];
      for (let i = 0; i < 4; i++) {
        const v = lobbyData.seats[i];
        next[i] = typeof v === 'string' && v !== '' ? v : null;
      }
      return next;
    }
    const keys = Object.keys(lobbyData.players ?? {}).sort();
    const out: (string | null)[] = [null, null, null, null];
    for (let i = 0; i < keys.length && i < 4; i++) out[i] = keys[i]!;
    return out;
  };

  const seatLabel = (lobbyData: LobbyType, pid: string | null, idx: number): string => {
    if (!pid) return '';
    if (pid === user?.uid) return 'You';
    if (pid.startsWith('ai:')) return lobbyData.aiProfiles?.[pid]?.displayName ?? 'Bot';
    return `Player ${idx + 1}`;
  };

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
      await userSetup(token, user?.displayName);
      const { gameId } = await createGame(id, token, DEFAULT_RULESET_ID);
      navigate(`/game/${gameId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create game');
    } finally {
      setCreating(false);
    }
  };

  const handleAddBot = async (seatIndex: number) => {
    if (!id) return;
    const token = await getIdToken(true);
    if (!token) return;
    setAddingBotSeat(seatIndex);
    setError(null);
    try {
      const defaults = ['Bot 1', 'Carol', 'Bob', 'Botty'] as const;
      await addBotToLobbySeat(id, seatIndex, token, { displayName: defaults[seatIndex] ?? `Bot ${seatIndex + 1}` });
      const next = await getLobby(id, token);
      setLobby(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add bot');
    } finally {
      setAddingBotSeat(null);
    }
  };

  const handleRemoveBot = async (seatIndex: number) => {
    if (!id) return;
    const token = await getIdToken(true);
    if (!token) return;
    setRemovingBotSeat(seatIndex);
    setError(null);
    try {
      await removeBotFromLobbySeat(id, seatIndex, token);
      const next = await getLobby(id, token);
      setLobby(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to remove bot');
    } finally {
      setRemovingBotSeat(null);
    }
  };

  const beginInlineRenameBot = (seatIndex: number, currentName: string) => {
    setEditingBotSeat(seatIndex);
    setEditingBotName(currentName);
  };

  const cancelInlineRenameBot = () => {
    setEditingBotSeat(null);
    setEditingBotName('');
  };

  const commitInlineRenameBot = async (seatIndex: number) => {
    if (!id) return;
    if (renamingBotSeat !== null) return;
    const token = await getIdToken(true);
    if (!token) return;
    const pid = seats?.[seatIndex] ?? null;
    if (!pid || !pid.startsWith('ai:')) return;
    const current = lobby?.aiProfiles?.[pid]?.displayName ?? `Bot ${seatIndex + 1}`;
    const nextName = editingBotName.trim();
    if (!nextName || nextName === current) {
      cancelInlineRenameBot();
      return;
    }
    setError(null);
    setRenamingBotSeat(seatIndex);
    try {
      await renameBotInLobbySeat(id, seatIndex, nextName, token);
      const next = await getLobby(id, token);
      setLobby(next);
      cancelInlineRenameBot();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to rename bot');
    } finally {
      setRenamingBotSeat(null);
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
      <div className="h-screen flex flex-col bg-(--color-surface)">
        <PlaySessionHeader theme={theme} setTheme={setTheme} onSignOut={signOut} title="Lobby" />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4 p-6 text-muted"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <Spinner className="w-8 h-8" />
          <p>Loading lobby…</p>
        </main>
      </div>
    );
  }
  if (error || !lobby) {
    return (
      <div className="h-screen flex flex-col bg-(--color-surface)">
        <PlaySessionHeader theme={theme} setTheme={setTheme} onSignOut={signOut} title="Lobby" />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4 p-4 sm:gap-6 sm:p-6"
        >
          <p className="text-center text-danger text-sm sm:text-base">{error ?? 'Lobby not found'}</p>
          <Link to="/" className="btn-primary">
            Back to home
          </Link>
        </main>
      </div>
    );
  }

  const seats = displaySeats(lobby);
  const playerCount = seats.filter(Boolean).length;
  const canStart = playerCount === 4;
  const isHost = lobby.hostUserId != null && lobby.hostUserId === user?.uid;
  const seatBasedLobby = Array.isArray(lobby.seats);
  const canManageBots = isHost && !lobby.currentGameId && seatBasedLobby;

  return (
    <div className="h-screen flex flex-col bg-(--color-surface)">
      <PlaySessionHeader
        theme={theme}
        setTheme={setTheme}
        onSignOut={signOut}
        title="Lobby"
        leading={
          <Link
            to="/"
            className="flex min-h-9 min-w-9 shrink-0 items-center justify-center rounded-lg p-1 text-muted hover:bg-surface-panel hover:text-text-primary sm:min-h-10 sm:min-w-10"
            aria-label="Back to home"
            title="Back to home"
          >
            <span className="inline-block scale-x-[-1]">
              <Icon src={icons.forwardArrow} className="size-4.5 sm:size-5 [&_.icon-svg]:size-4.5 sm:[&_.icon-svg]:size-5" aria-hidden />
            </span>
          </Link>
        }
        desktopActions={
          <button
            type="button"
            onClick={handleDeleteLobby}
            disabled={deleting}
            className="btn-nav-header text-muted hover:text-danger disabled:opacity-50"
            aria-label="Delete lobby"
            title="Delete lobby"
          >
            <Icon src={icons.delete} className="size-5 [&_.icon-svg]:size-5" aria-hidden />
          </button>
        }
        mobileDrawerExtras={
          <button
            type="button"
            onClick={() => void handleDeleteLobby()}
            disabled={deleting}
            className="flex min-h-12 w-full items-center gap-2 rounded-lg border border-danger/25 px-4 py-3 text-left text-base font-semibold text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
            aria-label="Delete lobby"
          >
            <Icon src={icons.delete} className="size-5 shrink-0 [&_.icon-svg]:size-5" aria-hidden />
            <span>Delete lobby</span>
          </button>
        }
      />

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-lg flex-1 min-h-0 flex-col gap-2 overflow-hidden p-3 sm:gap-3 sm:p-4"
      >
        {error && (
          <div className="panel shrink-0 rounded-xl px-3 py-2.5 text-danger text-sm sm:px-4 sm:py-3" role="alert">
            {error}
          </div>
        )}

        <section className="panel shrink-0 rounded-xl p-2.5 sm:p-3">
          <h2 className="mb-0.5 text-xs font-semibold text-muted sm:text-sm">Lobby code</h2>
          <button
            type="button"
            onClick={handleCopyCode}
            className="group flex items-center gap-2 rounded-lg px-0 py-1 text-left transition-colors hover:text-(--color-primary) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-primary)"
            aria-label={copied ? 'Copied!' : 'Copy lobby code'}
            title={copied ? 'Copied!' : 'Click to copy'}
          >
            <span className="select-all font-mono text-lg font-bold tracking-wider text-on-surface group-hover:text-(--color-primary) sm:text-xl">
              {id}
            </span>
            <span className="text-xs font-medium text-muted transition-colors group-hover:text-(--color-primary)" aria-hidden>
              {copied ? '✓ Copied' : 'Copy'}
            </span>
          </button>
          <p className="mt-0.5 text-muted text-[11px] sm:text-xs">Share so friends can join</p>
        </section>

        <section className="flex min-h-0 flex-1 flex-col gap-1.5 sm:gap-2">
          <h2 className="shrink-0 text-xs font-semibold text-muted sm:text-sm">Players ({playerCount}/4)</h2>
          <div className="grid min-h-0 flex-1 grid-cols-2 gap-1.5 sm:gap-2">
            {[0, 1, 2, 3].map((idx) => {
              const pid = seats[idx] ?? null;
              const isMe = pid === user?.uid;
              const label = seatLabel(lobby, pid, idx);
              const isBot = Boolean(pid && pid.startsWith('ai:'));
              const botName = pid && pid.startsWith('ai:') ? (lobby.aiProfiles?.[pid]?.displayName ?? `Bot ${idx + 1}`) : null;
              const editingThisBot = Boolean(isBot && editingBotSeat === idx);
              return (
                <div
                  key={idx}
                  className={`panel flex min-h-[60px] flex-col items-center justify-center gap-0.5 rounded-xl p-2 transition-shadow sm:min-h-[68px] sm:gap-1 sm:p-3 ${
                    isMe ? 'ring-2 ring-(--color-primary) ring-offset-2' : ''
                  }`}
                >
                  {pid ? (
                    <>
                      {editingThisBot ? (
                        <input
                          value={editingBotName}
                          onChange={(e) => setEditingBotName(e.target.value)}
                          onBlur={() => void commitInlineRenameBot(idx)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') void commitInlineRenameBot(idx);
                            if (e.key === 'Escape') cancelInlineRenameBot();
                          }}
                          disabled={renamingBotSeat !== null || addingBotSeat !== null || removingBotSeat !== null}
                          autoFocus
                          className="w-full rounded-lg border border-border bg-surface-panel px-2 py-1 text-center text-sm font-semibold text-on-surface outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-primary) disabled:opacity-50"
                          aria-label={`Bot name for seat ${idx + 1}`}
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (canManageBots && isBot && botName) beginInlineRenameBot(idx, botName);
                          }}
                          disabled={!canManageBots || !isBot || renamingBotSeat !== null || addingBotSeat !== null || removingBotSeat !== null}
                          className={`w-full truncate text-center text-sm font-semibold ${
                            canManageBots && isBot ? 'text-on-surface hover:text-(--color-primary)' : 'text-on-surface'
                          }`}
                          aria-label={canManageBots && isBot ? `Edit bot name in seat ${idx + 1}` : undefined}
                          title={canManageBots && isBot ? 'Click to rename' : undefined}
                        >
                          {label}
                        </button>
                      )}
                      {!isMe && !pid.startsWith('ai:') && (
                        <span className="text-muted text-xs truncate w-full text-center mt-0.5">
                          {pid}
                        </span>
                      )}
                      {canManageBots && isBot && (
                        <div className="mt-1 inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => void handleRemoveBot(idx)}
                            disabled={removingBotSeat !== null || addingBotSeat !== null}
                            className="btn-secondary text-xs py-1 px-2 text-danger hover:text-danger"
                            aria-label={`Remove bot from seat ${idx + 1}`}
                            title={`Remove bot from seat ${idx + 1}`}
                          >
                            {removingBotSeat === idx ? 'Removing…' : 'Remove'}
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="text-muted text-sm">Empty seat</span>
                      {canManageBots ? (
                        <button
                          type="button"
                          onClick={() => void handleAddBot(idx)}
                          disabled={addingBotSeat !== null || removingBotSeat !== null}
                          className="btn-secondary text-xs py-1 px-2 mt-1"
                          aria-label={`Add bot to seat ${idx + 1}`}
                          title={`Add bot to seat ${idx + 1}`}
                        >
                          {addingBotSeat === idx ? 'Adding…' : 'Add bot'}
                        </button>
                      ) : (
                        <span className="text-muted text-xs">Waiting…</span>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <div className="panel mt-auto flex shrink-0 flex-col items-center gap-1.5 rounded-xl p-2.5 sm:gap-2 sm:p-3">
          <button
            onClick={handleCreateGame}
            disabled={!canStart || creating}
            className="btn-primary inline-flex w-full max-w-xs items-center justify-center gap-2 py-3"
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
