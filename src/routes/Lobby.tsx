import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getLobby, createGame } from '../api/endpoints';
import type { Lobby as LobbyType } from '../types';

export function Lobby() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getIdToken } = useAuth();
  const [lobby, setLobby] = useState<LobbyType | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getIdToken()
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

  const handleCreateGame = async () => {
    if (!id) return;
    const token = await getIdToken();
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

  if (loading) return <div className="p-4">Loading lobby...</div>;
  if (error || !lobby) return <div className="p-4 text-red-600">{error ?? 'Lobby not found'}</div>;

  const playerCount = Object.keys(lobby.players ?? {}).length;
  const canStart = playerCount === 4;

  return (
    <div className="p-4 flex flex-col gap-4">
      <h1 className="text-xl font-bold">Lobby {id}</h1>
      <p>Share this ID to invite players: {id}</p>
      <p>Players: {playerCount}/4</p>
      <ul className="list-disc pl-6">
        {Object.keys(lobby.players ?? {}).map((pid) => (
          <li key={pid}>{pid}</li>
        ))}
      </ul>
      {error && <p className="text-red-600">{error}</p>}
      <button
        onClick={handleCreateGame}
        disabled={!canStart || creating}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
      >
        Start Game {!canStart && '(need 4 players)'}
      </button>
    </div>
  );
}
