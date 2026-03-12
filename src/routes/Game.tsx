import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  getGame,
  rollAndDealTiles,
  drawTile,
  discardTile,
  mahjong,
  claimPong,
  claimKong,
  claimChow,
  passClaim,
} from '../api/endpoints';
import { TileView } from '../components/TileView';
import { tileToLabel } from '../lib/tileAssets';
import type { Game as GameType, Tile } from '../types';

export function Game() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { getIdToken, user } = useAuth();
  const [game, setGame] = useState<GameType | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    if (!gameId) return;
    getIdToken(true)
      .then((token) => (token ? getGame(gameId, token) : null))
      .then((data) => data && setGame(data))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load game'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!gameId) return;
    let cancelled = false;
    getIdToken(true)
      .then((token) => {
        if (!token || cancelled) return null;
        return getGame(gameId, token);
      })
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

  // Poll game state so all players see turns, discards, and phase changes
  useEffect(() => {
    if (!gameId) return;
    const interval = setInterval(() => {
      getIdToken(true)
        .then((token) => (token ? getGame(gameId, token) : null))
        .then((data) => {
          if (data) setGame(data);
        })
        .catch(() => {
          // Ignore poll errors; keep showing current game
        });
    }, 2000);
    return () => clearInterval(interval);
  }, [gameId, getIdToken]);

  const handleRollAndDeal = async () => {
    if (!gameId) return;
    const token = await getIdToken(true);
    if (!token) return;
    setActing(true);
    setError(null);
    try {
      const result = await rollAndDealTiles(gameId, token);
      if (result?.gameId && result.gameId !== gameId) {
        navigate(`/game/${result.gameId}`, { replace: true });
      } else {
        refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setActing(false);
    }
  };

  const handleDraw = async () => {
    if (!gameId) return;
    const token = await getIdToken(true);
    if (!token) return;
    setActing(true);
    setError(null);
    try {
      const result = await drawTile(gameId, token);
      if (result?.gameId && result.gameId !== gameId) {
        navigate(`/game/${result.gameId}`, { replace: true });
      } else {
        refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setActing(false);
    }
  };

  const handleDiscard = async (tile: Tile) => {
    if (!gameId) return;
    const token = await getIdToken(true);
    if (!token) return;
    setActing(true);
    setError(null);
    try {
      const result = await discardTile(gameId, tile, token);
      if (result?.gameId && result.gameId !== gameId) {
        navigate(`/game/${result.gameId}`, { replace: true });
      } else {
        refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setActing(false);
    }
  };

  const handleMahjong = async () => {
    if (!gameId) return;
    const token = await getIdToken(true);
    if (!token) return;
    setActing(true);
    setError(null);
    try {
      const result = await mahjong(gameId, token);
      if (result?.gameId && result.gameId !== gameId) {
        navigate(`/game/${result.gameId}`, { replace: true });
      } else {
        refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setActing(false);
    }
  };

  const handleClaimPong = async () => {
    if (!gameId) return;
    const token = await getIdToken(true);
    if (!token) return;
    setActing(true);
    setError(null);
    try {
      const result = await claimPong(gameId, token);
      if (result?.gameId && result.gameId !== gameId) {
        navigate(`/game/${result.gameId}`, { replace: true });
      } else {
        refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setActing(false);
    }
  };

  const handleClaimKong = async () => {
    if (!gameId) return;
    const token = await getIdToken(true);
    if (!token) return;
    setActing(true);
    setError(null);
    try {
      const result = await claimKong(gameId, token);
      if (result?.gameId && result.gameId !== gameId) {
        navigate(`/game/${result.gameId}`, { replace: true });
      } else {
        refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setActing(false);
    }
  };

  const handleClaimChow = async () => {
    if (!gameId) return;
    const token = await getIdToken(true);
    if (!token) return;
    setActing(true);
    setError(null);
    try {
      const result = await claimChow(gameId, token);
      if (result?.gameId && result.gameId !== gameId) {
        navigate(`/game/${result.gameId}`, { replace: true });
      } else {
        refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setActing(false);
    }
  };

  const handlePassClaim = async () => {
    if (!gameId) return;
    const token = await getIdToken(true);
    if (!token) return;
    setActing(true);
    setError(null);
    try {
      const result = await passClaim(gameId, token);
      if (result?.gameId && result.gameId !== gameId) {
        navigate(`/game/${result.gameId}`, { replace: true });
      } else {
        refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted">
        Loading game…
      </div>
    );
  }
  if (error && !game) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-[var(--color-danger)]">{error}</p>
        <Link to="/" className="btn-primary">
          Back to home
        </Link>
      </div>
    );
  }
  if (!game) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-muted">Game not found</p>
        <Link to="/" className="btn-primary">
          Back to home
        </Link>
      </div>
    );
  }

  const isMyTurn = game.currentPlayer === user?.uid;
  const myHand = game.playerHands?.[user?.uid ?? ''] ?? [];
  const init = game.initialization;
  const potentialActions = game.private?.potentialActions?.[user?.uid ?? ''] ?? [];
  const canClaimPong = potentialActions.includes('pong');
  const canClaimKong = potentialActions.includes('kong');
  const canClaimChow = potentialActions.includes('chow');
  const canDeclareMahjong = potentialActions.includes('mahjong');
  const showClaimButtons = canClaimPong || canClaimKong || canClaimChow;

  const opponentIds = (game.playerIds ?? []).filter((id) => id !== user?.uid);
  const currentPlayerLabel =
    game.currentPlayer === user?.uid
      ? 'Your turn'
      : opponentIds.includes(game.currentPlayer)
        ? `Opponent ${opponentIds.indexOf(game.currentPlayer) + 1}`
        : 'Current player';

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-surface)]">
      {/* Top bar */}
      <header className="app-header sticky top-0 z-10 flex items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/"
            className="text-muted hover:text-[var(--color-text-primary)] shrink-0"
            aria-label="Back to home"
          >
            ←
          </Link>
          <span className="font-semibold truncate">Game</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted shrink-0">
          {game.status === 'ended' && (
            <span className="text-[var(--color-primary)] font-medium">Ended</span>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-auto p-4 gap-4 flex flex-col max-w-4xl mx-auto w-full">
          {error && (
            <div className="panel px-4 py-2 text-[var(--color-danger)] text-sm" role="alert">
              {error}
            </div>
          )}

          {/* Players with discards under each */}
          <section aria-label="Players and discards" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {opponentIds.slice(0, 3).map((pid, idx) => {
              const hand = game.playerHands?.[pid] ?? [];
              const discards = game.playerDiscards?.[pid] ?? [];
              const isCurrent = pid === game.currentPlayer;
              return (
                <div
                  key={pid}
                  className={`panel p-3 flex flex-col items-center gap-2 ${
                    isCurrent ? 'ring-2 ring-[var(--color-primary)]' : ''
                  }`}
                >
                  <span className="text-sm font-medium truncate w-full text-center">
                    Opponent {idx + 1}
                  </span>
                  <span className="text-muted text-xs">{hand.length} tiles</span>
                  <button
                    type="button"
                    className="text-xs text-muted hover:underline"
                    aria-label={`View Opponent ${idx + 1} revealed tiles`}
                    title="View revealed tiles"
                  >
                    Revealed
                  </button>
                  <div className="w-full min-h-[2rem] flex flex-wrap justify-center gap-0.5 pt-1">
                    {discards.map((t, i) => (
                      <TileView key={i} tile={t} className="h-8 w-6" />
                    ))}
                  </div>
                </div>
              );
            })}
            {/* Game info: current player, tiles left, last discarded, your discards */}
            <div className="panel p-3 flex flex-col items-center gap-2">
              {init.tilesDealt && (
                <span className="text-sm font-medium text-on-surface">
                  Current: {currentPlayerLabel}
                </span>
              )}
              {init.tilesDealt && (
                <span className="text-muted text-xs">Tiles left: {game.tilesLeft}</span>
              )}
              {init.tilesDealt && game.lastDiscardedTile && (
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-xs text-muted">Last discarded</span>
                  <TileView tile={game.lastDiscardedTile} className="h-10 w-7" />
                </div>
              )}
              <div className="w-full min-h-[2rem] flex flex-wrap justify-center gap-0.5">
                {(game.playerDiscards?.[user?.uid ?? ''] ?? []).map((t, i) => (
                  <TileView key={i} tile={t} className="h-8 w-6" />
                ))}
              </div>
            </div>
          </section>

          {/* Roll & Deal (pre-game) - instruction only; button is in bottom bar */}
          {!init.tilesDealt && (
            <p className="text-muted text-sm">Ready to deal. Use the button below to start the round.</p>
          )}
        </div>

        {/* Fixed bottom: action buttons (centered, evenly spaced) then hand */}
        <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-panel)] p-4 flex flex-col gap-4 shrink-0">
          {/* Action buttons row - centered, evenly spaced */}
          <div className="flex flex-wrap justify-center items-center gap-3">
            {!init.tilesDealt && (
              <button
                onClick={handleRollAndDeal}
                disabled={acting}
                className="btn-primary"
                aria-label="Roll and deal tiles"
              >
                Roll & Deal
              </button>
            )}
            {init.tilesDealt && isMyTurn && !game.turnState.tileDrawn && (
              <button
                onClick={handleDraw}
                disabled={acting}
                className="btn-primary"
                aria-label="Draw a tile"
              >
                Draw
              </button>
            )}
            {init.tilesDealt && showClaimButtons && (
              <>
                {canClaimPong && (
                  <button
                    onClick={handleClaimPong}
                    disabled={acting}
                    className="btn-primary bg-[#7c3aed] hover:bg-[#6d28d9]"
                    aria-label="Claim Pong"
                  >
                    Pong
                  </button>
                )}
                {canClaimKong && (
                  <button
                    onClick={handleClaimKong}
                    disabled={acting}
                    className="btn-primary bg-[#4f46e5] hover:bg-[#4338ca]"
                    aria-label="Claim Kong"
                  >
                    Kong
                  </button>
                )}
                {canClaimChow && (
                  <button
                    onClick={handleClaimChow}
                    disabled={acting}
                    className="btn-primary bg-[#0d9488] hover:bg-[#0f766e]"
                    aria-label="Claim Chow"
                  >
                    Chow
                  </button>
                )}
                <button
                  onClick={handlePassClaim}
                  disabled={acting}
                  className="btn-secondary"
                  aria-label="Pass (do not claim)"
                >
                  Pass
                </button>
              </>
            )}
            {init.tilesDealt && canDeclareMahjong && (
              <button
                onClick={handleMahjong}
                disabled={acting}
                className="btn-primary bg-[var(--color-warning)] hover:bg-[#9a6b0f]"
                aria-label="Declare Mahjong"
              >
                Mahjong
              </button>
            )}
          </div>

          {/* Your hand - always at bottom, same position; tiles are buttons only when choosing discard */}
          {init.tilesDealt && myHand.length > 0 && (
            <section aria-label="Your hand" className="panel p-4">
              {isMyTurn && game.turnState.tileDrawn ? (
                <p className="text-sm text-muted mb-3 text-center">Choose a tile to discard</p>
              ) : (
                <h2 className="text-sm font-medium text-muted mb-3 text-center">Your hand</h2>
              )}
              <div className="flex flex-wrap justify-center gap-1 min-h-[3.5rem]">
                {myHand.map((t, i) =>
                  isMyTurn && game.turnState.tileDrawn ? (
                    <TileView
                      key={i}
                      tile={t}
                      asButton
                      onClick={() => handleDiscard(t)}
                      disabled={acting}
                      className="h-14 w-10"
                      aria-label={`Discard ${tileToLabel(t)}`}
                    />
                  ) : (
                    <TileView key={i} tile={t} className="h-14 w-10" />
                  )
                )}
              </div>
            </section>
          )}

        </div>
      </main>
    </div>
  );
}
