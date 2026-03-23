import type { Game, Lobby, Tile, UserLobbySummary, PlayerMeld, MeldType } from '../types';

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

const c1 = tile('character', 1);
const c2 = tile('character', 2);
const c3 = tile('character', 3);
const d4 = tile('dot', 4);
const d5 = tile('dot', 5);
const d6 = tile('dot', 6);
const d7 = tile('dot', 7);
const d8 = tile('dot', 8);
const east = tile('wind', 'east');
const s1 = tile('stick', 1);
const s2 = tile('stick', 2);

const tutorialStartHand: Tile[] = [c1, c2, c3, d4, d4, d5, d5, d6, d7, east, east, east, s1, s2];

/** First player has 13 tiles and must draw; this is the hand before that draw. */
const tutorialHandBeforeFirstDraw: Tile[] = [c1, c2, c3, d4, d4, d5, d5, d6, d7, east, east, east, s2];

const tutorialHandAfterFirstDiscard: Tile[] = [c1, c2, c3, d4, d4, d5, d5, d6, d7, east, east, east, s2];

const tutorialHandAfterPong: Tile[] = [c1, c2, c3, d4, d4, d6, d7, east, east, east, s2];

const tutorialHandAfterPongDiscard: Tile[] = [c1, c2, c3, d4, d4, d6, d7, east, east, east];

const tutorialHandDrawThenWin: Tile[] = [c1, c2, c3, d4, d4, d6, d7, d8];

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

function tutorialMeld(type: MeldType, tiles: Tile[], declaredAtTurn: number, claimedFromPlayerId: string | null): PlayerMeld {
  return {
    meldId: `tutorial-${type}-${declaredAtTurn}-${String(tiles[0]?._type)}-${String(tiles[0]?.value)}`,
    type,
    tiles,
    visibility: 'exposed',
    source: 'discard-claim',
    claimedFromPlayerId,
    claimedTileIndex: tiles.length - 1,
    declaredAtTurn,
    faceDown: false,
  };
}

export const mockLobby: Lobby = {
  players: { [p1]: true, [p2]: true, [p3]: true, [me]: true },
};

const mockPlayerDisplayNames: Record<string, string> = {
  [me]: 'Me',
  [p1]: 'Alice',
  [p2]: 'Bob',
  [p3]: 'Carol',
};

function getTutorialBaseGame(): Game {
  const playerIds = [p1, p2, p3, me];
  return {
    lobby_id: 'mock-lobby',
    playerIds,
    startingPlayer: me,
    playerDisplayNames: mockPlayerDisplayNames,
    playerHands: {
      [p1]: opponentHand,
      [p2]: opponentHand,
      [p3]: opponentHand,
      [me]: tutorialStartHand,
    },
    playerDiscards: {},
    playerMelds: {},
    currentPlayer: me,
    lastDiscardedTile: null,
    tilesLeft: 82,
    initialization: {
      playersReady: true,
      playerOrderDecided: true,
      tilesShuffled: true,
      tilesDealt: true,
    },
    status: 'active',
    turnState: {
      currentPhase: 'playing',
      playerTurn: me,
      turn_number: 1,
      tileDrawn: true,
      tilesPlaced: false,
      tileDiscarded: false,
    },
    private: { playerHands: {}, potentialActions: {} },
  };
}

type TutorialStepId = string;

function getTutorialAugment(stepId: TutorialStepId): Partial<Game> | null {
  const bobChow = tutorialMeld('chow', [tile('dot', 2), tile('dot', 3), tile('dot', 4)], 3, p1);
  const myPong = tutorialMeld('pong', [d5, d5, d5], 4, p2);
  const myKong = tutorialMeld('kong', [d4, d4, d4, d4], 7, p2);
  const myMelds = [myPong, myKong];

  switch (stepId) {
    case 'first-draw':
      return {
        playerHands: {
          [p1]: opponentHand,
          [p2]: opponentHand,
          [p3]: opponentHand,
          [me]: tutorialHandBeforeFirstDraw,
        },
        turnState: {
          currentPhase: 'playing',
          playerTurn: me,
          turn_number: 1,
          tileDrawn: false,
          tilesPlaced: false,
          tileDiscarded: false,
        },
        private: { playerHands: {}, potentialActions: {} },
      };
    case 'first-discard':
      return {};
    case 'watch-alice-turn':
      return {
        playerHands: {
          [p1]: opponentHand,
          [p2]: opponentHand,
          [p3]: opponentHand,
          [me]: tutorialHandAfterFirstDiscard,
        },
        playerDiscards: { [me]: [s1] },
        currentPlayer: p1,
        lastDiscardedTile: s1,
        turnState: { currentPhase: 'playing', playerTurn: p1, turn_number: 2, tileDrawn: false, tilesPlaced: false, tileDiscarded: false },
        private: { playerHands: {}, potentialActions: {} },
      };
    case 'watch-alice-discarded':
      return {
        playerHands: {
          [p1]: opponentHand,
          [p2]: opponentHand,
          [p3]: opponentHand,
          [me]: tutorialHandAfterFirstDiscard,
        },
        playerDiscards: {
          [me]: [s1],
          [p1]: [tile('dot', 3)],
        },
        currentPlayer: p2,
        lastDiscardedTile: tile('dot', 3),
        turnState: { currentPhase: 'playing', playerTurn: p2, turn_number: 2, tileDrawn: false, tilesPlaced: false, tileDiscarded: false },
        private: { playerHands: {}, potentialActions: {} },
      };
    case 'watch-bob-chow-done':
      return {
        playerHands: {
          [p1]: opponentHand,
          [p2]: opponentHand.slice(0, 10),
          [p3]: opponentHand,
          [me]: tutorialHandAfterFirstDiscard,
        },
        playerDiscards: {
          [me]: [s1],
          [p1]: [],
          [p2]: [d5],
        },
        playerMelds: { [p2]: [bobChow] },
        currentPlayer: p3,
        lastDiscardedTile: d5,
        turnState: { currentPhase: 'playing', playerTurn: p3, turn_number: 3, tileDrawn: true, tilesPlaced: false, tileDiscarded: false },
        private: { playerHands: {}, potentialActions: { [me]: ['pong'] } },
      };
    case 'my-discard-after-pong':
      return {
        playerHands: {
          [p1]: opponentHand,
          [p2]: opponentHand.slice(0, 10),
          [p3]: opponentHand,
          [me]: tutorialHandAfterPong,
        },
        playerMelds: { [p2]: [bobChow], [me]: [myPong] },
        playerDiscards: {
          [me]: [s1],
          [p1]: [],
          [p2]: [],
          [p3]: [],
        },
        currentPlayer: me,
        lastDiscardedTile: null,
        turnState: { currentPhase: 'playing', playerTurn: me, turn_number: 4, tileDrawn: true, tilesPlaced: false, tileDiscarded: false },
        private: { playerHands: {}, potentialActions: {} },
      };
    case 'watch-alice-turn-after-pong':
      return {
        playerHands: {
          [p1]: opponentHand,
          [p2]: opponentHand.slice(0, 10),
          [p3]: opponentHand,
          [me]: tutorialHandAfterPongDiscard,
        },
        playerMelds: { [p2]: [bobChow], [me]: [myPong] },
        playerDiscards: {
          [me]: [s1, s2],
          [p1]: [tile('stick', 9)],
          [p2]: [],
          [p3]: [],
        },
        currentPlayer: p2,
        lastDiscardedTile: tile('stick', 9),
        turnState: { currentPhase: 'playing', playerTurn: p2, turn_number: 5, tileDrawn: false, tilesPlaced: false, tileDiscarded: false },
        private: { playerHands: {}, potentialActions: {} },
      };
    case 'my-kong':
      return {
        playerHands: {
          [p1]: opponentHand,
          [p2]: opponentHand.slice(0, 10),
          [p3]: opponentHand,
          [me]: tutorialHandAfterPongDiscard,
        },
        playerMelds: { [p2]: [bobChow], [me]: [myPong] },
        playerDiscards: {
          [me]: [s1, s2],
          [p1]: [],
          [p2]: [d4],
          [p3]: [],
        },
        currentPlayer: p3,
        lastDiscardedTile: d4,
        turnState: { currentPhase: 'playing', playerTurn: p3, turn_number: 6, tileDrawn: true, tilesPlaced: false, tileDiscarded: false },
        private: { playerHands: {}, potentialActions: { [me]: ['kong'] } },
      };
    case 'draw-then-win':
      return {
        playerHands: {
          [p1]: opponentHand,
          [p2]: opponentHand.slice(0, 10),
          [p3]: opponentHand,
          [me]: tutorialHandDrawThenWin,
        },
        playerMelds: { [p2]: [bobChow], [me]: myMelds },
        playerDiscards: {
          [me]: [s1, s2],
          [p1]: [],
          [p2]: [d4],
          [p3]: [],
        },
        currentPlayer: me,
        lastDiscardedTile: null,
        turnState: { currentPhase: 'playing', playerTurn: me, turn_number: 7, tileDrawn: true, tilesPlaced: false, tileDiscarded: false },
        private: { playerHands: {}, potentialActions: { [me]: ['mahjong'] } },
      };
    case 'finished':
      return {
        playerHands: {
          [p1]: opponentHand,
          [p2]: opponentHand.slice(0, 10),
          [p3]: opponentHand,
          [me]: tutorialHandDrawThenWin,
        },
        playerMelds: { [p2]: [bobChow], [me]: myMelds },
        playerDiscards: {
          [me]: [s1, s2],
          [p1]: [],
          [p2]: [d4],
          [p3]: [],
        },
        currentPlayer: me,
        lastDiscardedTile: null,
        status: 'ended',
        winnerId: me,
        scores: { [me]: 20, [p1]: 0, [p2]: 0, [p3]: 0 },
      };
    default:
      return null;
  }
}

function getTutorialPreDealGame(): Game {
  const base = getTutorialBaseGame();
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
}

export function getTutorialGameForStep(stepId: TutorialStepId): Game | null {
  if (stepId === 'intro') return null;
  if (stepId === 'pre-deal') return getTutorialPreDealGame();
  const base = getTutorialBaseGame();
  const augment = getTutorialAugment(stepId);
  if (augment == null) return base;
  return { ...base, ...augment };
}

/** For discard steps, the single tile the tutorial expects the user to discard. */
export function getTutorialSuggestedDiscard(stepId: TutorialStepId): Tile | null {
  if (stepId === 'first-discard') return s1;
  if (stepId === 'my-discard-after-pong') return s2;
  return null;
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
          playerHands: {},
          potentialActions: { [me]: ['mahjong'] },
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
