import type { WindTileValue } from '../types';

/** Seat order from East (dealer) going counterclockwise: East → South → West → North. */
export function windSeatOrder(playerIds: string[], eastPlayerId: string): string[] {
  const n = playerIds.length;
  const eastIdx = playerIds.indexOf(eastPlayerId);
  if (eastIdx < 0) return [...playerIds];
  return Array.from({ length: n }, (_, i) => playerIds[(eastIdx + i) % n]!);
}

const WIND_FROM_INDEX: WindTileValue[] = ['east', 'south', 'west', 'north'];

export function windForSeatIndex(seatIndex: number): WindTileValue {
  return WIND_FROM_INDEX[seatIndex % 4]!;
}

/** Maps each player to their wind when `eastPlayerId` is East. */
export function playerWindMap(playerIds: string[], eastPlayerId: string): Record<string, WindTileValue> {
  const order = windSeatOrder(playerIds, eastPlayerId);
  const out: Record<string, WindTileValue> = {};
  order.forEach((pid, i) => {
    out[pid] = windForSeatIndex(i);
  });
  return out;
}

/**
 * Where to place the three opponent panels (you are always bottom; bird's-eye / map north-up).
 * Winds go counterclockwise: East (bottom) → South (right) → West (top) → North (left).
 * Across (top) = +2 seats in that order; screen left = North (+3); screen right = South (+1).
 */
export function opponentScreenSlots(
  currentUserId: string,
  playerIds: string[],
  eastPlayerId: string,
): { top: string; left: string; right: string } | null {
  if (playerIds.length !== 4) return null;
  const order = windSeatOrder(playerIds, eastPlayerId);
  const myIdx = order.indexOf(currentUserId);
  if (myIdx < 0) return null;
  const top = order[(myIdx + 2) % 4]!;
  const left = order[(myIdx + 3) % 4]!;
  const right = order[(myIdx + 1) % 4]!;
  if (top === currentUserId || left === currentUserId || right === currentUserId) return null;
  return { top, left, right };
}

/**
 * Wall break index after roll & deal — matches `mahjong-backend` `rollAndDealTiles`
 * (`TOTAL_TILES` 136, four equal segments).
 */
export function computeWallCutIndex(
  diceRoll: number,
  eastPlayerId: string,
  playerIds: string[],
  totalTiles = 136,
): number {
  const n = playerIds.length;
  const idx = playerIds.indexOf(eastPlayerId);
  if (idx < 0) return (diceRoll * 2) % totalTiles;
  const group = totalTiles / n;
  let start = ((idx + diceRoll) % n) * group;
  start = (start + diceRoll * 2) % totalTiles;
  return start;
}

export type WallQuadrantCounts = { east: number; south: number; west: number; north: number };

/**
 * Undrawn tiles sit in a single queue in draw order; map that arc onto the four walls
 * (quadrant 0 = East wall segment, then South, West, North clockwise around the table).
 */
export function wallTilesPerQuadrant(
  tilesRemaining: number,
  cutIndex: number,
  totalTiles = 136,
): WallQuadrantCounts {
  const quarter = totalTiles / 4;
  const c: WallQuadrantCounts = { east: 0, south: 0, west: 0, north: 0 };
  for (let i = 0; i < tilesRemaining; i++) {
    const pos = (cutIndex + i) % totalTiles;
    const q = Math.floor(pos / quarter);
    if (q === 0) c.east++;
    else if (q === 1) c.south++;
    else if (q === 2) c.west++;
    else c.north++;
  }
  return c;
}

