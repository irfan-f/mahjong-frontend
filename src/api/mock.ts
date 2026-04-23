import type { Game, LegalAction, Lobby, Tile, UserLobbySummary } from '../types';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const MOCK_USER_ID = 'mock-user';

const p1 = 'opponent-1';
const p2 = 'opponent-2';
const p3 = 'opponent-3';
const me = MOCK_USER_ID;

const tile = (
  _type: Tile['_type'],
  value: Tile extends { value: infer V } ? V : never
): Tile =>
  ({ _type, value, count: 4 }) as Tile;

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

const handBeforeDraw: Tile[] = winningHand.slice(0, -1);

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

const mockPlayerDisplayNames: Record<string, string> = {
  [me]: 'Me',
  [p1]: 'Alice',
  [p2]: 'Bob',
  [p3]: 'Carol',
};

function emptyLegalActions(playerIds: readonly string[]): Record<string, LegalAction[]> {
  return Object.fromEntries(playerIds.map((id) => [id, [] as LegalAction[]]));
}

export function getMockGame(gameId: string): Game {
  const playerIds = [p1, p2, p3, me];
  const base = {
    lobby_id: 'mock-lobby',
    playerIds,
    startingPlayer: p1,
    playerDisplayNames: mockPlayerDisplayNames,
    playerHands: {
      [p1]: opponentHand,
      [p2]: opponentHand,
      [p3]: opponentHand,
      [me]: winningHand,
    },
    playerDiscards: {} as Record<string, Tile[]>,
    playerMelds: {},
    currentPlayer: me,
    lastDiscardedTile: null as Tile | null,
    tilesLeft: 82,
    wallDiceTotal: 7,
    wallTotalTiles: 136,
    initialization: {
      playersReady: true,
      playerOrderDecided: true,
      tilesShuffled: true,
      tilesDealt: true,
    },
    status: 'active' as const,
    turnState: { ...baseTurnState },
    private: {
      legalActions: {
        ...emptyLegalActions(playerIds),
        [me]: [{ kind: 'draw' as const }],
      },
    },
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
        private: {
          legalActions: emptyLegalActions(playerIds),
        },
      };
    case 'my-turn-draw':
      return {
        ...base,
        playerHands: {
          ...base.playerHands,
          [me]: handBeforeDraw,
        },
        turnState: { ...baseTurnState, playerTurn: me, tileDrawn: false },
        currentPlayer: me,
      };
    case 'my-turn-discard':
      return {
        ...base,
        turnState: { ...baseTurnState, playerTurn: me, tileDrawn: true },
        currentPlayer: me,
        private: {
          legalActions: {
            ...emptyLegalActions(playerIds),
            [me]: [{ kind: 'declareMahjong' as const }],
          },
        },
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
          legalActions: {
            ...emptyLegalActions(playerIds),
            [me]: [
              {
                kind: 'claimChow' as const,
                variantId: 'chow:dot:3-4-5',
                meld: [tile('dot', 3), tile('dot', 4), tile('dot', 5)],
              },
              { kind: 'passClaim' as const },
            ],
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
        private: {
          legalActions: emptyLegalActions(playerIds),
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

export async function mockGetMyLobbies(): Promise<{ lobbies: UserLobbySummary[] }> {
  await delay(200);
  return {
    lobbies: [
      { lobbyId: 'mock-lobby', currentGameId: 'pre-deal', playerCount: 4 },
    ],
  };
}

export async function mockCreateGame(): Promise<{ gameId: string }> {
  await delay(200);
  return { gameId: 'pre-deal' };
}

export async function mockRollAndDeal(): Promise<{ gameId: string }> {
  await delay(400);
  return { gameId: 'my-turn-discard' };
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
