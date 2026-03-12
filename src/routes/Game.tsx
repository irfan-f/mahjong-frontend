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
import { useTheme } from '../hooks/useTheme';
import { ThemeToggle } from '../components/ThemeToggle';

export function Game() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { getIdToken, user } = useAuth();
  const { theme, setTheme } = useTheme();
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

  useEffect(() => {
    if (!gameId) return;
    const interval = setInterval(() => {
      getIdToken(true)
        .then((token) => (token ? getGame(gameId, token) : null))
        .then((data) => {
          if (data) setGame(data);
        })
        .catch(() => {});
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-muted" role="status" aria-live="polite" aria-busy="true">
        <span className="inline-block w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" aria-hidden />
        <p>Loading game…</p>
      </div>
    );
  }
  if (error && !game) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
        <p className="text-[var(--color-danger)] text-center">{error}</p>
        <Link to="/" className="btn-primary">
          Back to home
        </Link>
      </div>
    );
  }
  if (!game) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
        <p className="text-muted text-center">Game not found</p>
        <Link to="/" className="btn-primary">
          Back to home
        </Link>
      </div>
    );
  }

  const isMyTurn = game.currentPlayer === user?.uid;
  const myHand = game.playerHands?.[user?.uid ?? ''] ?? [];
  const myMelds = game.playerExposedMelds?.[user?.uid ?? ''] ?? [];
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

  const isEnded = game.status === 'ended';
  const winnerId = game.winnerId;
  const iWon = winnerId === user?.uid;
  const winnerLabel = winnerId === user?.uid
    ? 'You'
    : winnerId && opponentIds.includes(winnerId)
      ? `Opponent ${opponentIds.indexOf(winnerId) + 1}`
      : 'A player';

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-surface)]">
      <header className="app-header sticky top-0 z-10 flex items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/"
            className="flex items-center justify-center w-10 h-10 rounded-lg text-muted hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-panel)] transition-colors shrink-0"
            aria-label="Back to home"
            title="Back to home"
          >
            ←
          </Link>
          <div className="min-w-0">
            <span className="font-semibold text-on-surface truncate block">Game</span>
            <span className="text-xs text-muted truncate block">Mahjong with friends</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted shrink-0">
          <ThemeToggle theme={theme} setTheme={setTheme} />
          {isEnded && (
            <span className="text-[var(--color-primary)] font-semibold">Game over</span>
          )}
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-auto p-4 gap-4 flex flex-col max-w-4xl mx-auto w-full">
          {error && (
            <div
              className="panel px-4 py-3 text-[var(--color-danger)] text-sm rounded-xl"
              role="alert"
            >
              {error}
            </div>
          )}

          {isEnded && (
            <section
              aria-label="Game over"
              className="panel p-6 rounded-xl text-center flex flex-col gap-4 border-2 border-[var(--color-primary)] bg-[var(--color-surface-panel)]"
            >
              <h2 className="text-xl font-bold text-on-surface">
                {iWon ? 'You won!' : `${winnerLabel} won!`}
              </h2>
              {game.scores && game.playerIds && Object.keys(game.scores).length > 0 && (
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-muted">
                  {game.playerIds.map((pid) => {
                    const score = game.scores?.[pid];
                    const label = pid === user?.uid ? 'You' : `Opponent ${opponentIds.indexOf(pid) + 1}`;
                    return (
                      <span key={pid}>
                        {label}: <strong className="text-on-surface">{score ?? 0}</strong>
                      </span>
                    );
                  })}
                </div>
              )}
              <Link
                to="/"
                className="btn-primary inline-flex items-center justify-center max-w-xs mx-auto"
                aria-label="Back to home"
                title="Back to home"
              >
                Back to home
              </Link>
            </section>
          )}

          <section
            aria-label="Players and discards"
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            {opponentIds.slice(0, 3).map((pid, idx) => {
              const hand = game.playerHands?.[pid] ?? [];
              const discards = game.playerDiscards?.[pid] ?? [];
              const melds = game.playerExposedMelds?.[pid] ?? [];
              const isCurrent = pid === game.currentPlayer;
              return (
                <div
                  key={pid}
                  className={`panel p-3 flex flex-col items-center gap-2 rounded-xl ${
                    isCurrent ? 'ring-2 ring-[var(--color-primary)] ring-offset-2' : ''
                  }`}
                >
                  <span className="text-sm font-medium truncate w-full text-center">
                    Opponent {idx + 1}
                  </span>
                  <span className="text-muted text-xs">{hand.length} tiles</span>
                  {melds.length > 0 && (
                    <div className="w-full flex flex-col gap-1" aria-label={`Opponent ${idx + 1} melds`}>
                      {melds.map((meld, mi) => (
                        <div
                          key={mi}
                          className="flex flex-wrap justify-center gap-0.5"
                          title={meld.type}
                        >
                          {meld.tiles.map((t, ti) => (
                            <TileView key={ti} tile={t} className="h-7 w-5" />
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="w-full min-h-[2rem] flex flex-wrap justify-center gap-0.5 pt-1">
                    {discards.map((t, i) => (
                      <TileView key={i} tile={t} className="h-8 w-6" />
                    ))}
                  </div>
                </div>
              );
            })}
            <div className="panel p-3 flex flex-col items-center gap-2 rounded-xl">
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

          {!init.tilesDealt && (
            <p className="text-muted text-sm text-center py-2">
              Ready to deal. Tap the button below to start the round.
            </p>
          )}
        </div>

        <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-panel)] p-4 flex flex-col gap-4 shrink-0">
          <div className="flex flex-wrap justify-center items-center gap-3">
            {!init.tilesDealt && !isEnded && (
              <button
                onClick={handleRollAndDeal}
                disabled={acting}
                className="btn-primary"
                aria-label="Roll and deal tiles"
              >
                Roll & deal
              </button>
            )}
            {init.tilesDealt && !isEnded && isMyTurn && !game.turnState.tileDrawn && (
              <button
                onClick={handleDraw}
                disabled={acting}
                className="btn-primary"
                aria-label="Draw a tile"
              >
                Draw
              </button>
            )}
            {init.tilesDealt && !isEnded && showClaimButtons && (
              <>
                {canClaimPong && (
                  <button
                    onClick={handleClaimPong}
                    disabled={acting}
                    className="btn-primary btn-claim-pong"
                    aria-label="Claim Pong"
                  >
                    Pong
                  </button>
                )}
                {canClaimKong && (
                  <button
                    onClick={handleClaimKong}
                    disabled={acting}
                    className="btn-primary btn-claim-kong"
                    aria-label="Claim Kong"
                  >
                    Kong
                  </button>
                )}
                {canClaimChow && (
                  <button
                    onClick={handleClaimChow}
                    disabled={acting}
                    className="btn-primary btn-claim-chow"
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
            {init.tilesDealt && !isEnded && canDeclareMahjong && (
              <button
                onClick={handleMahjong}
                disabled={acting}
                className="btn-primary btn-claim-mahjong"
                aria-label="Declare Mahjong"
              >
                Mahjong
              </button>
            )}
          </div>

          {init.tilesDealt && !isEnded && myHand.length > 0 && (
            <section aria-label="Your hand" className="panel p-4 rounded-xl">
              {isMyTurn && game.turnState.tileDrawn ? (
                <p className="text-sm text-muted mb-3 text-center">Choose a tile to discard</p>
              ) : (
                <h2 className="text-sm font-medium text-muted mb-3 text-center">Your hand</h2>
              )}
              {myMelds.length > 0 && (
                <div className="flex flex-col gap-2 mb-3" aria-label="Your melds">
                  {myMelds.map((meld, mi) => (
                    <div
                      key={mi}
                      className="flex flex-wrap justify-center gap-1"
                      title={meld.type}
                    >
                      {meld.tiles.map((t, ti) => (
                        <TileView key={ti} tile={t} className="h-12 w-9" />
                      ))}
                    </div>
                  ))}
                </div>
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
