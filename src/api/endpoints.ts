import type { Lobby, Game, Tile } from '../types';
import { apiFetch } from './client';

async function throwOnError(res: Response): Promise<void> {
  if (res.ok) return;
  const text = await res.text();
  let msg = text;
  try {
    const data = JSON.parse(text);
    if (data?.error) msg = data.error;
  } catch {
    /* use text as-is */
  }
  throw new Error(msg);
}

export async function userSetup(token: string | null): Promise<void> {
  const res = await apiFetch('/api/user/setup', {
    method: 'POST',
    body: JSON.stringify({ user: {} }),
    token,
  });
  await throwOnError(res);
}

export async function createLobby(token: string | null): Promise<{ lobbyId: string }> {
  const res = await apiFetch('/api/lobby/create', {
    method: 'POST',
    body: JSON.stringify({ user: {} }),
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
    body: JSON.stringify({ user: {} }),
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
    body: JSON.stringify({ user: {} }),
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
    body: JSON.stringify({ user: {} }),
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
    body: JSON.stringify({ user: {}, tileDiscarded: tile }),
    token,
  });
  await throwOnError(res);
  return res.json();
}

export async function mahjong(
  gameId: string,
  token: string | null,
  scores?: Record<string, number>
): Promise<{ gameId: string; winnerId: string }> {
  const res = await apiFetch(`/api/game/${gameId}/mahjong`, {
    method: 'PUT',
    body: JSON.stringify({ user: {}, scores: scores ?? {} }),
    token,
  });
  await throwOnError(res);
  return res.json();
}
