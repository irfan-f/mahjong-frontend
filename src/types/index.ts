export type NumericTileValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type NumericTileType = 'character' | 'dot' | 'stick';
export type WindTileValue = 'east' | 'south' | 'west' | 'north';
export type DragonTileValue = 'red' | 'green' | 'white';

export interface ScoringBreakdownEntry {
  pattern: string;
  points: number;
  patternNameEn?: string;
  /** PDF third column: romanized name with tone digits, e.g. Ping(2)-hu(2). */
  patternNameRomanized?: string;
  patternNameZh?: string;
}

export interface ScoringResult {
  scores: Record<string, number>;
  points?: number;
  breakdown?: ScoringBreakdownEntry[];
}

export interface ScoringContext {
  winnerId: string;
  winnerHand: Tile[];
  winnerMelds?: PlayerMeld[];
  playerMelds?: Record<string, PlayerMeld[]>;
  playerDiscards?: Record<string, Tile[]>;
  discardHistory?: { playerId: string; tile: Tile }[];
  lastDiscardedTile?: Tile | null;
  /** Compatibility for deferred callers. */
  winnerExposedMelds?: { type: 'pong' | 'kong' | 'chow'; tiles: Tile[] }[];
  selfDraw: boolean;
  discarderId: string | null;
  dealerId: string;
  playerIds: string[];
  roundWind?: WindTileValue;
  wonOnLastPiece: boolean;
  flowers?: Tile[];
  /** PDF row 14 (ma-jiang): win on the only possible completing tile. */
  winsOnOnlyPossibleTile?: boolean;
  /** PDF row 18 (ma-jiang): win on the 5 completing 4-5-6. */
  winsOnMiddleFiveOfFourFiveSixRun?: boolean;
  /** PDF rows 22–24 (ma-jiang): special win sources. */
  wonOnFourthTileOfRank?: boolean;
  wonByRobbingKong?: boolean;
  wonFromOwnKongReplacement?: boolean;
}

export type Tile =
  | { _type: NumericTileType; value: NumericTileValue; count: 4 }
  | { _type: 'wind'; value: WindTileValue; count: 4 }
  | { _type: 'dragon'; value: DragonTileValue; count: 4 };

export type MeldType = 'pong' | 'kong' | 'chow';
export type MeldVisibility = 'exposed' | 'concealed';
export type MeldSource = 'discard-claim' | 'self-formed';

export interface PlayerMeld {
  meldId: string;
  type: MeldType;
  tiles: Tile[] | null;
  visibility: MeldVisibility;
  source: MeldSource;
  claimedFromPlayerId: string | null;
  claimedTileIndex: number | null;
  declaredAtTurn: number;
  faceDown: boolean;
  /** Populated when concealed meld tiles are hidden for non-owners. */
  tileCount?: number;
}

/** Fixed East→South→West→North when backend sends `seats` (new lobbies). */
export type LobbySeatOrder = [string | null, string | null, string | null, string | null];

export interface Lobby {
  _id?: string;
  players: Record<string, boolean>;
  hostUserId?: string;
  seats?: LobbySeatOrder;
  aiProfiles?: Record<string, { displayName: string; difficulty?: string }>;
  currentGameId?: string;
  wins?: Record<string, number>;
  highestScore?: Record<string, number>;
  leaderboard?: { playerId: string; wins: number; highestScore: number }[];
}

export interface UserLobbySummary {
  lobbyId: string;
  currentGameId?: string;
  playerCount: number;
}

export interface Game {
  _id?: string;
  lobby_id: string;
  playerIds: string[];
  startingPlayer: string;
  /** Display names per player ID (from backend GET game). */
  playerDisplayNames?: Record<string, string>;
  playerHands?: Record<string, Tile[]>;
  /** All discards per player, in chronological order. Display grouped by player. */
  playerDiscards?: Record<string, Tile[]>;
  /** Canonical meld model for both exposed and concealed melds. */
  playerMelds?: Record<string, PlayerMeld[]>;
  /** Compatibility-only legacy field for deferred modules. */
  playerExposedMelds?: Record<string, { type: 'pong' | 'kong' | 'chow'; tiles: Tile[] }[]>;
  turnState: {
    currentPhase: string;
    playerTurn: string;
    turn_number: number;
    tileDrawn: boolean;
    tilesPlaced: boolean;
    tileDiscarded: boolean;
  };
  currentPlayer: string;
  lastDiscardedTile: Tile | null;
  ruleSetId?: 'default-v1' | 'ma-jiang';
  tilesLeft: number;
  /** Sum of two dice from roll & deal; drives wall break visualization. Omit → UI defaults (e.g. 7). */
  wallDiceTotal?: number;
  /** Total tiles in the wall set (backend HK ruleset uses 136). */
  wallTotalTiles?: number;
  initialization: {
    playersReady: boolean;
    playerOrderDecided: boolean;
    tilesShuffled: boolean;
    tilesDealt: boolean;
  };
  /** ISO-8601 instant when the current discard-claim response window closes. Null when no window is active. */
  claimWindowEndsAt?: string | null;
  status?: 'active' | 'ended';
  winnerId?: string;
  /** Backend: `declare-mahjong` (winner set) or `exhaustive-draw` (no winner). */
  endReason?: 'exhaustive-draw' | 'declare-mahjong';
  scores?: Record<string, number>;
  points?: number;
  breakdown?: ScoringBreakdownEntry[];
  endedAt?: string;
  /** When ended, which players have chosen to show their hand to others. */
  playerShowHand?: Record<string, boolean>;
  private?: {
    playerHands?: Record<string, unknown>;
    /** Coarse claim / mahjong flags (legacy); prefer legalActions when present. */
    potentialActions?: Record<string, string[]>;
    /** Canonical per-seat actions from the server (draw, discard groups, claims with chow variants, etc.). */
    legalActions?: Record<string, LegalAction[]>;
  };
}

/** Mirrors mahjong-backend `domain/legal-actions` discriminated union. */
export type LegalAction =
  | { kind: 'draw' }
  | { kind: 'discard'; tileGroups: Tile[] }
  | { kind: 'passClaim' }
  | { kind: 'claimPong' }
  | { kind: 'claimKong' }
  | { kind: 'claimChow'; variantId: string; meld: Tile[] }
  | { kind: 'declareMahjong' }
  | { kind: 'declareConcealedKong'; tile: Tile }
  | { kind: 'declareConcealedPong'; tiles: Tile[] }
  | { kind: 'declareConcealedChow'; tiles: Tile[] };
