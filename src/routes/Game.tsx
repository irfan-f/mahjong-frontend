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
  concealedPong,
  concealedChow,
  concealedKong,
  setShowHand,
} from '../api/endpoints';
import type { Game as GameType, Tile, ScoringResult } from '../types';
import { useTheme } from '../hooks/useTheme';
import { AccountMenu } from '../components/AccountMenu';
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

  const handleConcealedPong = async (tiles: Tile[]) => {
    if (!gameId) return;
    const token = await getIdToken(true);
    if (!token) return;
    setActing(true);
    setError(null);
    try {
      const result = await concealedPong(gameId, tiles, token);
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

  const handleConcealedChow = async (tiles: Tile[]) => {
    if (!gameId) return;
    const token = await getIdToken(true);
    if (!token) return;
    setActing(true);
    setError(null);
    try {
      const result = await concealedChow(gameId, tiles, token);
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

  const handleConcealedKong = async (tile: Tile) => {
    if (!gameId) return;
    const token = await getIdToken(true);
    if (!token) return;
    setActing(true);
    setError(null);
    try {
      const result = await concealedKong(gameId, tile, token);
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

  return (
    <div className="h-screen flex flex-col bg-(--color-surface)">
      <header className="app-header shrink-0 z-10 flex items-center justify-between gap-4 px-4 py-2">
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
          <div className="min-w-0">
            <span className="font-semibold text-on-surface truncate block">Game</span>
            <span className="text-xs text-muted truncate block">Mahjong with friends</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted shrink-0">
          {gameId && (
            <button
              type="button"
              onClick={() => navigate(`/what-if/${gameId}`)}
              className="btn-secondary text-sm py-2 px-3"
              aria-label="Open What-if scorer"
              title="Open What-if scorer"
            >
              What-if
            </button>
          )}
          <AccountMenu theme={theme} setTheme={setTheme} onSignOut={signOut} />
          {isEnded && (
            <span className="text-(--color-primary) font-semibold">Game over</span>
          )}
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col min-h-0">
        <GameBoard
          game={game}
          lastScoringResult={lastScoringResult}
          currentUserId={user?.uid ?? null}
          currentUserDisplayName={user?.displayName ?? null}
          error={error}
          acting={acting}
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
            refresh();
          }}
        />
      </main>
    </div>
  );
}
