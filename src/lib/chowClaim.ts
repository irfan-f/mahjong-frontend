import type { Tile } from '../types';

export function tileEquals(a: Tile, b: Tile): boolean {
  return a._type === b._type && a.value === b.value;
}

function tileKey(t: Tile): string {
  return `${t._type}:${String(t.value)}`;
}

function multisetCounts(tiles: Tile[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of tiles) {
    const k = tileKey(t);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

export function multisetTilesEqual(a: Tile[], b: Tile[]): boolean {
  const ma = multisetCounts(a);
  const mb = multisetCounts(b);
  if (ma.size !== mb.size) return false;
  for (const [k, v] of ma) {
    if (mb.get(k) !== v) return false;
  }
  return true;
}

/** The two tiles taken from the hand for a discard-claim chow (meld minus the claimed discard). */
export function handTilesFromChowMeld(meld: Tile[], discard: Tile): Tile[] | null {
  const idx = meld.findIndex((t) => tileEquals(t, discard));
  if (idx < 0) return null;
  const rest = meld.filter((_, i) => i !== idx);
  return rest.length === 2 ? rest : null;
}

export type ClaimChowLegalAction = { kind: 'claimChow'; variantId: string; meld: Tile[] };

/**
 * When exactly one legal chow's hand tiles match the two selected tiles (given the last discard), returns its variantId.
 */
export function resolveChowVariantId(
  lastDiscardedTile: Tile | null | undefined,
  chowClaimActions: ClaimChowLegalAction[],
  selectedTiles: Tile[]
): string | null {
  if (!lastDiscardedTile || selectedTiles.length !== 2) return null;
  const matches: string[] = [];
  for (const a of chowClaimActions) {
    const handPart = handTilesFromChowMeld(a.meld, lastDiscardedTile);
    if (!handPart) continue;
    if (multisetTilesEqual(handPart, selectedTiles)) {
      matches.push(a.variantId);
    }
  }
  if (matches.length !== 1) return null;
  return matches[0]!;
}
