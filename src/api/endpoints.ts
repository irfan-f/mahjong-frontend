import type {
  Lobby,
  Game,
  Tile,
  UserLobbySummary,
  ScoringContext,
  ScoringResult,
  ScoringBreakdownEntry,
} from '../types';
import { apiFetch } from './client';

async function throwOnError(res: Response): Promise<void> {
  if (res.ok) return;
  const text = await res.text();
  let msg = text;
  try {
    const data = JSON.parse(text);
    if (data?.error) msg = data.error;
  } catch {
    /* ignore */
  }
  throw new Error(msg);
}

export async function userSetup(token: string | null): Promise<void> {
  const res = await apiFetch('/api/user/setup', {
    method: 'POST',
    body: JSON.stringify({}),
    token,
  });
  await throwOnError(res);
}

export async function getMyLobbies(token: string | null): Promise<{ lobbies: UserLobbySummary[] }> {
  const res = await apiFetch('/api/user/lobbies', { token });
  await throwOnError(res);
  return res.json();
}

export async function createLobby(token: string | null): Promise<{ lobbyId: string }> {
  const res = await apiFetch('/api/lobby/create', {
    method: 'POST',
    body: JSON.stringify({}),
    token,
  });
  await throwOnError(res);
  return res.json();
}

export async function getLobby(lobbyId: string, token: string | null): Promise<Lobby> {
  const res = await apiFetch(`/api/lobby/${lobbyId}`, { token });
  await throwOnError(res);
  return res.json();
}

export async function joinLobby(
  lobbyId: string,
  token: string | null
): Promise<{ lobbyId: string }> {
  const res = await apiFetch(`/api/lobby/${lobbyId}/join`, {
    method: 'PUT',
    body: JSON.stringify({}),
    token,
  });
  await throwOnError(res);
  return res.json();
}

export async function deleteLobby(lobbyId: string, token: string | null): Promise<{ lobbyId: string }> {
  const res = await apiFetch(`/api/lobby/${lobbyId}`, {
    method: 'DELETE',
    body: JSON.stringify({}),
    token,
  });
  await throwOnError(res);
  return res.json();
}

export async function createGame(
  lobbyId: string,
  token: string | null
): Promise<{ gameId: string }> {
  const res = await apiFetch(`/api/lobby/${lobbyId}/createGame`, {
    method: 'POST',
    body: JSON.stringify({}),
    token,
  });
  await throwOnError(res);
  return res.json();
}

export async function getGame(gameId: string, token: string | null): Promise<Game> {
  const res = await apiFetch(`/api/game/${gameId}`, { token });
  await throwOnError(res);
  return res.json();
}

export async function rollAndDealTiles(
  gameId: string,
  token: string | null
): Promise<{ gameId: string }> {
  const res = await apiFetch(`/api/game/${gameId}/rollAndDealTiles`, {
    method: 'PUT',
    token,
  });
  await throwOnError(res);
  return res.json();
}

export async function drawTile(
  gameId: string,
  token: string | null
): Promise<{ gameId: string }> {
  const res = await apiFetch(`/api/game/${gameId}/drawTile`, {
    method: 'PUT',
    body: JSON.stringify({}),
    token,
  });
  await throwOnError(res);
  return res.json();
}

export async function discardTile(
  gameId: string,
  tile: Tile,
  token: string | null
): Promise<{ gameId: string }> {
  const res = await apiFetch(`/api/game/${gameId}/discardTile`, {
    method: 'PUT',
    body: JSON.stringify({ tileDiscarded: tile }),
    token,
  });
  await throwOnError(res);
  return res.json();
}

export async function mahjong(
  gameId: string,
  token: string | null,
  scores?: Record<string, number>
): Promise<{ gameId: string; winnerId: string; scores?: Record<string, number>; points?: number; breakdown?: ScoringBreakdownEntry[] }> {
  const res = await apiFetch(`/api/game/${gameId}/mahjong`, {
    method: 'PUT',
    body: JSON.stringify({ scores: scores ?? {} }),
    token,
  });
  await throwOnError(res);
  return res.json();
}

export async function scoreHand(
  context: ScoringContext,
  token: string | null
): Promise<ScoringResult> {
  const res = await apiFetch('/api/scoring/score', {
    method: 'POST',
    body: JSON.stringify({ context }),
    token,
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try {
      const data = JSON.parse(text);
      if (data?.error) msg = data.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return res.json();
}

export async function claimPong(gameId: string, token: string | null): Promise<{ gameId: string }> {
  const res = await apiFetch(`/api/game/${gameId}/pong`, {
    method: 'PUT',
    body: JSON.stringify({}),
    token,
  });
  await throwOnError(res);
  return res.json();
}

export async function claimKong(gameId: string, token: string | null): Promise<{ gameId: string }> {
  const res = await apiFetch(`/api/game/${gameId}/kong`, {
    method: 'PUT',
    body: JSON.stringify({}),
    token,
  });
  await throwOnError(res);
  return res.json();
}

export async function claimChow(gameId: string, token: string | null): Promise<{ gameId: string }> {
  const res = await apiFetch(`/api/game/${gameId}/chow`, {
    method: 'PUT',
    body: JSON.stringify({}),
    token,
  });
  await throwOnError(res);
  return res.json();
}

export async function passClaim(gameId: string, token: string | null): Promise<{ gameId: string }> {
  const res = await apiFetch(`/api/game/${gameId}/pass`, {
    method: 'PUT',
    body: JSON.stringify({}),
    token,
  });
  await throwOnError(res);
  return res.json();
}

export async function concealedPong(
  gameId: string,
  tiles: Tile[],
  token: string | null
): Promise<{ gameId: string }> {
  const res = await apiFetch(`/api/game/${gameId}/concealedPong`, {
    method: 'PUT',
    body: JSON.stringify({ tiles }),
    token,
  });
  await throwOnError(res);
  return res.json();
}

export async function concealedChow(
  gameId: string,
  tiles: Tile[],
  token: string | null
): Promise<{ gameId: string }> {
  const res = await apiFetch(`/api/game/${gameId}/concealedChow`, {
    method: 'PUT',
    body: JSON.stringify({ tiles }),
    token,
  });
  await throwOnError(res);
  return res.json();
}

export async function concealedKong(
  gameId: string,
  tile: Tile,
  token: string | null
): Promise<{ gameId: string }> {
  const res = await apiFetch(`/api/game/${gameId}/concealedKong`, {
    method: 'PUT',
    body: JSON.stringify({ tile }),
    token,
  });
  await throwOnError(res);
  return res.json();
}

export async function setShowHand(
  gameId: string,
  showHand: boolean,
  token: string | null
): Promise<{ gameId: string }> {
  const res = await apiFetch(`/api/game/${gameId}/showHand`, {
    method: 'PUT',
    body: JSON.stringify({ showHand }),
    token,
  });
  await throwOnError(res);
  return res.json();
}
