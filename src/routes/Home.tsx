import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { createLobby, joinLobby, userSetup } from '../api/endpoints';

export function Home() {
  const { user, signIn, signInAnonymous, signOut, getIdToken } = useAuth();
  const navigate = useNavigate();
  const [joinId, setJoinId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateLobby = async () => {
    const token = await getIdToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      await userSetup(token);
      const { lobbyId } = await createLobby(token);
      navigate(`/lobby/${lobbyId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create lobby');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinLobby = async () => {
    if (!joinId.trim()) return;
    const token = await getIdToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      await userSetup(token);
      await joinLobby(joinId.trim(), token);
      navigate(`/lobby/${joinId.trim()}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to join lobby');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-4 flex flex-col gap-4">
        <h1 className="text-xl font-bold">Mahjong</h1>
        <p>Sign in to create or join a lobby</p>
        <div className="flex gap-2">
          <button
            onClick={signIn}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Sign in with Google
          </button>
          <button
            onClick={signInAnonymous}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Sign in anonymously
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Mahjong</h1>
        <button onClick={signOut} className="text-sm text-gray-600 hover:underline">
          Sign out
        </button>
      </div>
      {error && <p className="text-red-600">{error}</p>}
      <div className="flex flex-col gap-2">
        <button
          onClick={handleCreateLobby}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          Create Lobby
        </button>
        <div className="flex gap-2">
          <input
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
            placeholder="Lobby ID"
            className="border rounded px-3 py-2 flex-1"
          />
          <button
            onClick={handleJoinLobby}
            disabled={loading || !joinId.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Join Lobby
          </button>
        </div>
      </div>
    </div>
  );
}
