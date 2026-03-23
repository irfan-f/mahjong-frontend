export type NumericTileValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type NumericTileType = 'character' | 'dot' | 'stick';
export type WindTileValue = 'east' | 'south' | 'west' | 'north';
export type DragonTileValue = 'red' | 'green' | 'white';

export interface ScoringBreakdownEntry {
  pattern: string;
  points: number;
  patternNameEn?: string;
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

export interface Lobby {
  _id?: string;
  players: Record<string, boolean>;
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
  tilesLeft: number;
  initialization: {
    playersReady: boolean;
    playerOrderDecided: boolean;
    tilesShuffled: boolean;
    tilesDealt: boolean;
  };
  status?: 'active' | 'ended';
  winnerId?: string;
  scores?: Record<string, number>;
  points?: number;
  breakdown?: ScoringBreakdownEntry[];
  endedAt?: string;
  /** When ended, which players have chosen to show their hand to others. */
  playerShowHand?: Record<string, boolean>;
  private?: {
    playerHands?: Record<string, unknown>;
    potentialActions?: Record<string, string[]>;
  };
}
