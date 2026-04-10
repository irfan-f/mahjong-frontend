import type { PlayerMeld } from '../types';

/** Max individual tile faces/backs to show in compact meld preview strips. */
export const MAX_PREVIEW_TILES = 4;

export function countMeldTiles(m: PlayerMeld): number {
  return m.tileCount ?? m.tiles?.length ?? 0;
}

/**
 * Take melds in order until adding the next would exceed `maxTiles` (by {@link countMeldTiles}).
 * Does not split a single meld; remaining melds go to `rest`.
 */
export function partitionMeldsForPreview(melds: PlayerMeld[], maxTiles = MAX_PREVIEW_TILES): {
  preview: PlayerMeld[];
  rest: PlayerMeld[];
} {
  let used = 0;
  const preview: PlayerMeld[] = [];
  let i = 0;
  for (; i < melds.length; i++) {
    const m = melds[i]!;
    const c = countMeldTiles(m);
    if (c === 0) {
      preview.push(m);
      continue;
    }
    if (used + c <= maxTiles) {
      preview.push(m);
      used += c;
    } else {
      break;
    }
  }
  return { preview, rest: melds.slice(i) };
}
