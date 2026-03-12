import type { Game, Lobby, Tile } from '../types';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Placeholder UID used in fixtures when VITE_USE_MOCK_API is true. AuthContext can expose this as current user when mock + no Firebase user. */
export const MOCK_USER_ID = 'mock-user';

/**
 * Mock API scenario flow (use with VITE_USE_MOCK_API=true):
 *
 * 1. Start: Create game from Lobby → lands on /game/pre-deal
 * 2. pre-deal: [Roll & Deal] → my-turn-draw
 * 3. my-turn-draw: [Draw] → my-turn-discard
 * 4. my-turn-discard: [Discard a tile] → claim
 * 5. claim: [Pong] or [Kong] or [Chow] → my-turn-discard
 * 6. my-turn-discard: [Mahjong] → ended
 *
 * Manual URLs to test specific UI:
 * - /game/pre-deal — Roll & Deal button
 * - /game/my-turn-draw — Draw button
 * - /game/my-turn-discard — Hand + Mahjong + discard tiles
 * - /game/claim — Pong / Kong / Chow buttons
 * - /game/opponent-turn — Read-only hand (not your turn)
 * - /game/ended — Game over
 */

const p1 = 'opponent-1';
const p2 = 'opponent-2';
const p3 = 'opponent-3';
const me = MOCK_USER_ID;

const tile = (
  _type: Tile['_type'],
  value: Tile extends { value: infer V } ? V : never
): Tile =>
  ({ _type, value, count: 4 }) as Tile;

/** Valid 14-tile winning hand (4 chows + 1 pair) for mock states where Mahjong is an option. */
const winningHand: Tile[] = [
  tile('character', 1),
  tile('character', 2),
  tile('character', 3),
  tile('character', 4),
  tile('character', 5),
  tile('character', 6),
  tile('character', 7),
  tile('character', 8),
  tile('character', 9),
  tile('dot', 1),
  tile('dot', 2),
  tile('dot', 3),
  tile('dot', 4),
  tile('dot', 4),
];

/** Generic 13-tile hand for opponents (not a winning hand). */
const opponentHand: Tile[] = [
  tile('character', 1),
  tile('character', 2),
  tile('character', 3),
  tile('dot', 4),
  tile('dot', 5),
  tile('dot', 6),
  tile('stick', 7),
  tile('stick', 8),
  tile('stick', 9),
  tile('wind', 'east'),
  tile('wind', 'south'),
  tile('dragon', 'red'),
  tile('dragon', 'green'),
];

const baseTurnState = {
  currentPhase: 'playing',
  playerTurn: me,
  turn_number: 1,
  tileDrawn: false,
  tilesPlaced: false,
  tileDiscarded: false,
};

export const mockLobby: Lobby = {
  players: { [p1]: true, [p2]: true, [p3]: true, [me]: true },
};

export function getMockGame(gameId: string): Game {
  const playerIds = [p1, p2, p3, me];
  const base = {
    lobby_id: 'mock-lobby',
    playerIds,
    startingPlayer: p1,
    playerHands: {
      [p1]: opponentHand,
      [p2]: opponentHand,
      [p3]: opponentHand,
      [me]: winningHand,
    },
    playerDiscards: {} as Record<string, Tile[]>,
    playerExposedMelds: {},
    currentPlayer: me,
    lastDiscardedTile: null as Tile | null,
    tilesLeft: 82,
    initialization: {
      playersReady: true,
      playerOrderDecided: true,
      tilesShuffled: true,
      tilesDealt: true,
    },
    status: 'active' as const,
    turnState: { ...baseTurnState },
  };

  switch (gameId) {
    case 'pre-deal':
      return {
        ...base,
        playerHands: {},
        playerDiscards: {},
        tilesLeft: 144,
        turnState: {
          currentPhase: 'init',
          playerTurn: p1,
          turn_number: 0,
          tileDrawn: false,
          tilesPlaced: false,
          tileDiscarded: false,
        },
        initialization: {
          playersReady: true,
          playerOrderDecided: true,
          tilesShuffled: true,
          tilesDealt: false,
        },
      };
    case 'my-turn-draw':
      return {
        ...base,
        turnState: { ...baseTurnState, playerTurn: me, tileDrawn: false },
        currentPlayer: me,
      };
    case 'my-turn-discard':
      return {
        ...base,
        turnState: { ...baseTurnState, playerTurn: me, tileDrawn: true },
        currentPlayer: me,
      };
    case 'claim': {
      // Only Chow is valid: hand has dot 3 & 4, last discarded dot 5 → chow (3,4,5). Real backend computes this per hand.
      const claimHand: Tile[] = [
        tile('character', 1),
        tile('character', 2),
        tile('dot', 3),
        tile('dot', 4),
        tile('dot', 6),
        tile('dot', 7),
        tile('stick', 7),
        tile('stick', 8),
        tile('wind', 'east'),
        tile('wind', 'south'),
        tile('dragon', 'red'),
        tile('dragon', 'green'),
        tile('dragon', 'white'),
      ];
      return {
        ...base,
        playerHands: {
          ...base.playerHands,
          [me]: claimHand,
        },
        lastDiscardedTile: tile('dot', 5),
        playerDiscards: {
          [p1]: [tile('dot', 1), tile('dot', 2), tile('dot', 5)],
        },
        turnState: { ...baseTurnState, playerTurn: p1, tileDrawn: true },
        currentPlayer: p1,
        private: {
          playerHands: {},
          potentialActions: {
            [me]: ['chow'],
          },
        },
      };
    }
    case 'ended':
      return {
        ...base,
        status: 'ended',
        winnerId: me,
        scores: { [me]: 20, [p1]: 0, [p2]: 0, [p3]: 0 },
      };
    case 'opponent-turn':
      return {
        ...base,
        turnState: { ...baseTurnState, playerTurn: p1, tileDrawn: true },
        currentPlayer: p1,
        lastDiscardedTile: tile('dot', 3),
        playerDiscards: {
          [p1]: [tile('dot', 1), tile('dot', 2), tile('dot', 3)],
        },
      };
    default:
      return { ...base };
  }
}

export async function mockGetLobby(_lobbyId: string): Promise<Lobby> {
  await delay(300);
  return mockLobby;
}

export async function mockGetGame(gameId: string): Promise<Game> {
  await delay(300);
  return getMockGame(gameId);
}

export async function mockCreateLobby(): Promise<{ lobbyId: string }> {
  await delay(200);
  return { lobbyId: 'mock-lobby' };
}

export async function mockJoinLobby(): Promise<{ lobbyId: string }> {
  await delay(200);
  return { lobbyId: 'mock-lobby' };
}

export async function mockCreateGame(): Promise<{ gameId: string }> {
  await delay(200);
  return { gameId: 'pre-deal' };
}

export async function mockRollAndDeal(): Promise<{ gameId: string }> {
  await delay(400);
  return { gameId: 'my-turn-draw' };
}

export async function mockDrawTile(): Promise<{ gameId: string }> {
  await delay(200);
  return { gameId: 'my-turn-discard' };
}

export async function mockDiscardTile(): Promise<{ gameId: string }> {
  await delay(200);
  return { gameId: 'claim' };
}

export async function mockMahjong(): Promise<{ gameId: string; winnerId: string }> {
  await delay(200);
  return { gameId: 'ended', winnerId: MOCK_USER_ID };
}

export async function mockClaimPong(): Promise<{ gameId: string }> {
  await delay(200);
  return { gameId: 'my-turn-discard' };
}

export async function mockClaimKong(): Promise<{ gameId: string }> {
  await delay(200);
  return { gameId: 'my-turn-discard' };
}

export async function mockClaimChow(): Promise<{ gameId: string }> {
  await delay(200);
  return { gameId: 'my-turn-discard' };
}

export async function mockPassClaim(): Promise<{ gameId: string }> {
  await delay(200);
  return { gameId: 'my-turn-draw' };
}
