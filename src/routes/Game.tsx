import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  getGame,
  rollAndDealTiles,
  drawTile,
  discardTile,
  mahjong,
} from '../api/endpoints';
import type { Game as GameType, Tile } from '../types';

export function Game() {
  const { gameId } = useParams<{ gameId: string }>();
  const { getIdToken, user } = useAuth();
  const [game, setGame] = useState<GameType | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    if (!gameId) return;
    getIdToken()
      .then((token) => (token ? getGame(gameId, token) : null))
      .then((data) => data && setGame(data))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load game'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!gameId) return;
    let cancelled = false;
    getIdToken()
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

  const handleRollAndDeal = async () => {
    if (!gameId) return;
    const token = await getIdToken();
    if (!token) return;
    setActing(true);
    setError(null);
    try {
      await rollAndDealTiles(gameId, token);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setActing(false);
    }
  };

  const handleDraw = async () => {
    if (!gameId) return;
    const token = await getIdToken();
    if (!token) return;
    setActing(true);
    setError(null);
    try {
      await drawTile(gameId, token);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setActing(false);
    }
  };

  const handleDiscard = async (tile: Tile) => {
    if (!gameId) return;
    const token = await getIdToken();
    if (!token) return;
    setActing(true);
    setError(null);
    try {
      await discardTile(gameId, tile, token);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setActing(false);
    }
  };

  const handleMahjong = async () => {
    if (!gameId) return;
    const token = await getIdToken();
    if (!token) return;
    setActing(true);
    setError(null);
    try {
      await mahjong(gameId, token);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setActing(false);
    }
  };

  if (loading) return <div className="p-4">Loading game...</div>;
  if (error && !game) return <div className="p-4 text-red-600">{error}</div>;
  if (!game) return <div className="p-4">Game not found</div>;

  const isMyTurn = game.currentPlayer === user?.uid;
  const myHand = game.playerHands?.[user?.uid ?? ''] ?? [];
  const init = game.initialization;

  return (
    <div className="p-4 flex flex-col gap-4">
      <h1 className="text-xl font-bold">Game {gameId}</h1>
      <p>Status: {game.status ?? 'active'}</p>
      <p>Current player: {game.currentPlayer}</p>
      <p>Tiles left: {game.tilesLeft}</p>
      {game.lastDiscardedTile && (
        <p>
          Last discarded: {game.lastDiscardedTile._type} {String(game.lastDiscardedTile.value)}
        </p>
      )}
      {!init.tilesDealt && (
        <button
          onClick={handleRollAndDeal}
          disabled={acting}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Roll & Deal
        </button>
      )}
      {init.tilesDealt && isMyTurn && game.turnState.tileDrawn && (
        <div className="flex flex-col gap-2">
          <p>Your turn. Discard a tile or declare Mahjong.</p>
          <div className="flex flex-wrap gap-2">
            {myHand.map((t, i) => (
              <button
                key={i}
                onClick={() => handleDiscard(t)}
                disabled={acting}
                className="px-2 py-1 border rounded text-sm"
              >
                {t._type} {String(t.value)}
              </button>
            ))}
          </div>
          <button
            onClick={handleMahjong}
            disabled={acting}
            className="px-4 py-2 bg-amber-600 text-white rounded"
          >
            Mahjong
          </button>
        </div>
      )}
      {init.tilesDealt && isMyTurn && !game.turnState.tileDrawn && (
        <button
          onClick={handleDraw}
          disabled={acting}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Draw Tile
        </button>
      )}
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}
