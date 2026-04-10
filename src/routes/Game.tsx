import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  getGame,
  stepBot,
  rollAndDealTiles,
  drawTile,
  discardTile,
  mahjong,
  claimPong,
  claimKong,
  claimChow,
  passClaim,
  concealedPong,
  concealedChow,
  concealedKong,
  setShowHand,
} from '../api/endpoints';
import type { Game as GameType, Tile, ScoringResult } from '../types';
import { useTheme } from '../hooks/useTheme';
import { PlaySessionHeader } from '../components/PlaySessionHeader';
import { GameBoard } from '../components/game/GameBoard';
import { Spinner } from '../components/Spinner';
import { Icon } from '../components/Icon';
import { icons } from '../icons';

export function Game() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { getIdToken, user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [game, setGame] = useState<GameType | null>(null);
  const [lastScoringResult, setLastScoringResult] = useState<ScoringResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [botStepCapMessage] = useState<string | null>(null);
  const fetchSeqRef = useRef(0);
  const actingRef = useRef(false);
  const gameIdRef = useRef(gameId);
  gameIdRef.current = gameId;

  const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

  /** Fetch the latest game state and commit it if still the freshest request. */
  const refreshGameState = useCallback(
    async (options?: { finishLoading?: boolean }) => {
      if (!gameId) return;
      const targetGameId = gameId;
      const mySeq = ++fetchSeqRef.current;
      const token = await getIdToken(true);
      if (!token) {
        if (options?.finishLoading) setLoading(false);
        return;
      }
      if (mySeq !== fetchSeqRef.current) return;

      let data: GameType | null;
      try {
        data = await getGame(targetGameId, token);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load game');
        if (options?.finishLoading) setLoading(false);
        return;
      }
      if (!data || mySeq !== fetchSeqRef.current || gameIdRef.current !== targetGameId) {
        if (options?.finishLoading) setLoading(false);
        return;
      }

      setGame(data);
      if (options?.finishLoading) setLoading(false);
    },
    [gameId, getIdToken]
  );

  /**
   * After a user mutation, drive bot turns one-at-a-time so each action is visible.
   * Each step: call stepBot → refresh UI → wait BOT_STEP_DELAY ms → repeat.
   * Stops when stepBot returns `stepped: false` (human's turn or game ended).
   */
  const BOT_STEP_DELAY_MS = 500;
  const MAX_BOT_STEPS = 20;

  const driveBotSteps = useCallback(async () => {
    if (!gameId) return;
    const targetGameId = gameId;
    let stepsDriven = 0;
    while (stepsDriven < MAX_BOT_STEPS && actingRef.current) {
      if (gameIdRef.current !== targetGameId) break;
      let stepped = false;
      try {
        const token = await getIdToken(true);
        if (!token) break;
        const result = await stepBot(targetGameId, token);
        stepped = result.stepped;
      } catch {
        break;
      }
      if (!stepped) break;
      await refreshGameState();
      await sleep(BOT_STEP_DELAY_MS);
      stepsDriven += 1;
    }
    await refreshGameState();
  }, [gameId, getIdToken, refreshGameState]);

  const refreshGameStateRef = useRef(refreshGameState);
  refreshGameStateRef.current = refreshGameState;
  const driveBotStepsRef = useRef(driveBotSteps);
  driveBotStepsRef.current = driveBotSteps;

  useEffect(() => {
    if (!gameId) return;
    setLoading(true);
    setError(null);
    void refreshGameStateRef.current({ finishLoading: true });
  }, [gameId]);

  useEffect(() => {
    if (!gameId) return;
    const interval = setInterval(() => {
      if (actingRef.current) return;
      void refreshGameState();
    }, 3000);
    return () => clearInterval(interval);
  }, [gameId, refreshGameState]);

  const handleRollAndDeal = async () => {
    if (!gameId) return;
    const token = await getIdToken(true);
    if (!token) return;
    actingRef.current = true;
    setActing(true);
    setError(null);
    try {
      const result = await rollAndDealTiles(gameId, token);
      if (result?.gameId && result.gameId !== gameId) {
        navigate(`/game/${result.gameId}`, { replace: true });
      } else {
        await refreshGameState();
        await driveBotSteps();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      actingRef.current = false;
      setActing(false);
    }
  };

  const handleDraw = async () => {
    if (!gameId) return;
    const token = await getIdToken(true);
    if (!token) return;
    actingRef.current = true;
    setActing(true);
    setError(null);
    try {
      const result = await drawTile(gameId, token);
      if (result?.gameId && result.gameId !== gameId) {
        navigate(`/game/${result.gameId}`, { replace: true });
      } else {
        await refreshGameState();
        await driveBotSteps();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      actingRef.current = false;
      setActing(false);
    }
  };

  const handleDiscard = async (tile: Tile) => {
    if (!gameId) return;
    const token = await getIdToken(true);
    if (!token) return;
    actingRef.current = true;
    setActing(true);
    setError(null);
    try {
      const result = await discardTile(gameId, tile, token);
      if (result?.gameId && result.gameId !== gameId) {
        navigate(`/game/${result.gameId}`, { replace: true });
      } else {
        await refreshGameState();
        await driveBotSteps();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      actingRef.current = false;
      setActing(false);
    }
  };

  const handleMahjong = async () => {
    if (!gameId) return;
    const token = await getIdToken(true);
    if (!token) return;
    actingRef.current = true;
    setActing(true);
    setError(null);
    try {
      const result = await mahjong(gameId, token);
      if (result?.points != null || result?.breakdown != null) {
        setLastScoringResult({
          scores: result.scores ?? {},
          points: result.points,
          breakdown: result.breakdown,
        });
      }
      if (result?.gameId && result.gameId !== gameId) {
        navigate(`/game/${result.gameId}`, { replace: true });
      } else {
        await refreshGameState();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      actingRef.current = false;
      setActing(false);
    }
  };

  const handleClaimPong = async () => {
    if (!gameId) return;
    const token = await getIdToken(true);
    if (!token) return;
    actingRef.current = true;
    setActing(true);
    setError(null);
    try {
      const result = await claimPong(gameId, token);
      if (result?.gameId && result.gameId !== gameId) {
        navigate(`/game/${result.gameId}`, { replace: true });
      } else {
        await refreshGameState();
        await driveBotSteps();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      actingRef.current = false;
      setActing(false);
    }
  };

  const handleClaimKong = async () => {
    if (!gameId) return;
    const token = await getIdToken(true);
    if (!token) return;
    actingRef.current = true;
    setActing(true);
    setError(null);
    try {
      const result = await claimKong(gameId, token);
      if (result?.gameId && result.gameId !== gameId) {
        navigate(`/game/${result.gameId}`, { replace: true });
      } else {
        await refreshGameState();
        await driveBotSteps();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      actingRef.current = false;
      setActing(false);
    }
  };

  const handleClaimChow = async (chowVariantId?: string) => {
    if (!gameId) return;
    const token = await getIdToken(true);
    if (!token) return;
    actingRef.current = true;
    setActing(true);
    setError(null);
    try {
      const result = await claimChow(gameId, token, chowVariantId);
      if (result?.gameId && result.gameId !== gameId) {
        navigate(`/game/${result.gameId}`, { replace: true });
      } else {
        await refreshGameState();
        await driveBotSteps();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      actingRef.current = false;
      setActing(false);
    }
  };

  const handlePassClaim = async () => {
    if (!gameId) return;
    const token = await getIdToken(true);
    if (!token) return;
    actingRef.current = true;
    setActing(true);
    setError(null);
    try {
      const result = await passClaim(gameId, token);
      if (result?.gameId && result.gameId !== gameId) {
        navigate(`/game/${result.gameId}`, { replace: true });
      } else {
        await refreshGameState();
        await driveBotSteps();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      actingRef.current = false;
      setActing(false);
    }
  };

  const handleConcealedPong = async (tiles: Tile[]) => {
    if (!gameId) return;
    const token = await getIdToken(true);
    if (!token) return;
    actingRef.current = true;
    setActing(true);
    setError(null);
    try {
      const result = await concealedPong(gameId, tiles, token);
      if (result?.gameId && result.gameId !== gameId) {
        navigate(`/game/${result.gameId}`, { replace: true });
      } else {
        await refreshGameState();
        await driveBotSteps();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      actingRef.current = false;
      setActing(false);
    }
  };

  const handleConcealedChow = async (tiles: Tile[]) => {
    if (!gameId) return;
    const token = await getIdToken(true);
    if (!token) return;
    actingRef.current = true;
    setActing(true);
    setError(null);
    try {
      const result = await concealedChow(gameId, tiles, token);
      if (result?.gameId && result.gameId !== gameId) {
        navigate(`/game/${result.gameId}`, { replace: true });
      } else {
        await refreshGameState();
        await driveBotSteps();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      actingRef.current = false;
      setActing(false);
    }
  };

  const handleConcealedKong = async (tile: Tile) => {
    if (!gameId) return;
    const token = await getIdToken(true);
    if (!token) return;
    actingRef.current = true;
    setActing(true);
    setError(null);
    try {
      const result = await concealedKong(gameId, tile, token);
      if (result?.gameId && result.gameId !== gameId) {
        navigate(`/game/${result.gameId}`, { replace: true });
      } else {
        await refreshGameState();
        await driveBotSteps();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      actingRef.current = false;
      setActing(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 text-muted" role="status" aria-live="polite" aria-busy="true">
        <Spinner className="w-8 h-8" />
        <p>Loading game…</p>
      </div>
    );
  }
  if (error && !game) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-6 p-6">
        <p className="text-danger text-center">{error}</p>
        <Link to="/" className="btn-primary">
          Back to home
        </Link>
      </div>
    );
  }
  if (!game) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-6 p-6">
        <p className="text-muted text-center">Game not found</p>
        <Link to="/" className="btn-primary">
          Back to home
        </Link>
      </div>
    );
  }

  const isEnded = game.status === 'ended';
  const botTurn = Boolean(game.currentPlayer?.startsWith('ai:'));
  const waitingOnBot = !isEnded && (acting || botTurn);
  const isMyTurn = !isEnded && game.currentPlayer === user?.uid;

  const mobileSessionStatus =
    isEnded ? null : waitingOnBot ? (
      <span className="inline-flex items-center gap-1 text-xs text-muted">
        <Spinner className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Bot…
      </span>
    ) : isMyTurn ? (
      <span className="text-xs font-semibold text-(--color-primary)">Your turn</span>
    ) : (
      <span className="text-xs text-muted">Waiting</span>
    );

  return (
    <div className="h-screen flex flex-col bg-(--color-surface)">
      <PlaySessionHeader
        theme={theme}
        setTheme={setTheme}
        onSignOut={signOut}
        title="Game"
        subtitle="Mahjong with Friends"
        mobileStatus={mobileSessionStatus}
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
          <>
            {gameId ? (
              <button
                type="button"
                onClick={() => navigate(`/what-if/${gameId}`)}
                className="btn-secondary shrink-0 py-1.5 px-2.5 text-sm"
                aria-label="Open What-if scorer"
                title="Open What-if scorer"
              >
                What-if
              </button>
            ) : null}
            {isEnded ? (
              <span className="shrink-0 text-sm font-semibold text-(--color-primary)">Game over</span>
            ) : null}
          </>
        }
        mobileDrawerExtras={
          gameId
            ? (close) => (
                <NavLink
                  to={`/what-if/${gameId}`}
                  onClick={close}
                  className={({ isActive }) =>
                    [
                      'flex min-h-12 w-full items-center rounded-lg px-4 py-3 text-left text-base font-semibold transition-colors',
                      isActive
                        ? 'bg-secondary text-(--color-primary)'
                        : 'text-on-surface hover:bg-surface-panel-muted',
                    ].join(' ')
                  }
                >
                  What-if (this game)
                </NavLink>
              )
            : undefined
        }
      />

      <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col min-h-0">
        <GameBoard
          game={game}
          lastScoringResult={lastScoringResult}
          currentUserId={user?.uid ?? null}
          currentUserDisplayName={user?.displayName ?? null}
          error={error}
          acting={acting}
          waitingOnBot={waitingOnBot}
          botStepCapMessage={botStepCapMessage}
          onRollAndDeal={handleRollAndDeal}
          onDraw={handleDraw}
          onDiscardTile={handleDiscard}
          onMahjong={handleMahjong}
          onClaimPong={handleClaimPong}
          onClaimKong={handleClaimKong}
          onClaimChow={handleClaimChow}
          onPassClaim={handlePassClaim}
          onConcealedPong={handleConcealedPong}
          onConcealedChow={handleConcealedChow}
          onConcealedKong={handleConcealedKong}
          mode="standard"
          onShowHandChange={async (showHand) => {
            if (!gameId) return;
            const token = await getIdToken(true);
            if (!token) return;
            await setShowHand(gameId, showHand, token);
            await refreshGameState();
          }}
        />
      </main>
    </div>
  );
}
