export type NumericTileValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type NumericTileType = 'character' | 'dot' | 'stick';
export type WindTileValue = 'east' | 'south' | 'west' | 'north';
export type DragonTileValue = 'red' | 'green' | 'white';

export type Tile =
  | { _type: NumericTileType; value: NumericTileValue; count: 4 }
  | { _type: 'wind'; value: WindTileValue; count: 4 }
  | { _type: 'dragon'; value: DragonTileValue; count: 4 };

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
  playerHands?: Record<string, Tile[]>;
  /** All discards per player, in chronological order. Display grouped by player. */
  playerDiscards?: Record<string, Tile[]>;
  /** Each player's face-up melds (Pong/Kong/Chow), shown inline per player. */
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
  endedAt?: string;
  private?: {
    playerHands?: Record<string, unknown>;
    potentialActions?: Record<string, string[]>;
  };
}
