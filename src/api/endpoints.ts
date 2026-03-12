import type { Lobby, Game, Tile, UserLobbySummary } from '../types';
import { apiFetch } from './client';
import {
  mockGetLobby,
  mockGetGame,
  mockCreateLobby,
  mockJoinLobby,
  mockCreateGame,
  mockGetMyLobbies,
  mockRollAndDeal,
  mockDrawTile,
  mockDiscardTile,
  mockMahjong,
  mockClaimPong,
  mockClaimKong,
  mockClaimChow,
  mockPassClaim,
} from './mock';

const useMock =
  typeof import.meta.env.VITE_USE_MOCK_API !== 'undefined' &&
  import.meta.env.VITE_USE_MOCK_API !== '';

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
  if (useMock) return;
  const res = await apiFetch('/api/user/setup', {
    method: 'POST',
    body: JSON.stringify({}),
    token,
  });
  await throwOnError(res);
}

export async function getMyLobbies(token: string | null): Promise<{ lobbies: UserLobbySummary[] }> {
  if (useMock) return mockGetMyLobbies();
  const res = await apiFetch('/api/user/lobbies', { token });
  await throwOnError(res);
  return res.json();
}

export async function createLobby(token: string | null): Promise<{ lobbyId: string }> {
  if (useMock) return mockCreateLobby();
  const res = await apiFetch('/api/lobby/create', {
    method: 'POST',
    body: JSON.stringify({}),
    token,
  });
  await throwOnError(res);
  return res.json();
}

export async function getLobby(lobbyId: string, token: string | null): Promise<Lobby> {
  if (useMock) return mockGetLobby(lobbyId);
  const res = await apiFetch(`/api/lobby/${lobbyId}`, { token });
  await throwOnError(res);
  return res.json();
}

export async function joinLobby(
  lobbyId: string,
  token: string | null
): Promise<{ lobbyId: string }> {
  if (useMock) return mockJoinLobby();
  const res = await apiFetch(`/api/lobby/${lobbyId}/join`, {
    method: 'PUT',
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
  if (useMock) return mockCreateGame();
  const res = await apiFetch(`/api/lobby/${lobbyId}/createGame`, {
    method: 'POST',
    body: JSON.stringify({}),
    token,
  });
  await throwOnError(res);
  return res.json();
}

export async function getGame(gameId: string, token: string | null): Promise<Game> {
  if (useMock) return mockGetGame(gameId);
  const res = await apiFetch(`/api/game/${gameId}`, { token });
  await throwOnError(res);
  return res.json();
}

export async function rollAndDealTiles(
  gameId: string,
  token: string | null
): Promise<{ gameId: string }> {
  if (useMock) return mockRollAndDeal();
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
  if (useMock) return mockDrawTile();
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
  if (useMock) return mockDiscardTile();
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
): Promise<{ gameId: string; winnerId: string }> {
  if (useMock) return mockMahjong();
  const res = await apiFetch(`/api/game/${gameId}/mahjong`, {
    method: 'PUT',
    body: JSON.stringify({ scores: scores ?? {} }),
    token,
  });
  await throwOnError(res);
  return res.json();
}

export async function claimPong(gameId: string, token: string | null): Promise<{ gameId: string }> {
  if (useMock) return mockClaimPong();
  const res = await apiFetch(`/api/game/${gameId}/pong`, {
    method: 'PUT',
    body: JSON.stringify({}),
    token,
  });
  await throwOnError(res);
  return res.json();
}

export async function claimKong(gameId: string, token: string | null): Promise<{ gameId: string }> {
  if (useMock) return mockClaimKong();
  const res = await apiFetch(`/api/game/${gameId}/kong`, {
    method: 'PUT',
    body: JSON.stringify({}),
    token,
  });
  await throwOnError(res);
  return res.json();
}

export async function claimChow(gameId: string, token: string | null): Promise<{ gameId: string }> {
  if (useMock) return mockClaimChow();
  const res = await apiFetch(`/api/game/${gameId}/chow`, {
    method: 'PUT',
    body: JSON.stringify({}),
    token,
  });
  await throwOnError(res);
  return res.json();
}

export async function passClaim(gameId: string, token: string | null): Promise<{ gameId: string }> {
  if (useMock) return mockPassClaim();
  const res = await apiFetch(`/api/game/${gameId}/pass`, {
    method: 'PUT',
    body: JSON.stringify({}),
    token,
  });
  await throwOnError(res);
  return res.json();
}
