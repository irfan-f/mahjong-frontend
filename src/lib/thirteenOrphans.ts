import type { Tile } from '../types';

const REQUIRED: Array<{ _type: Tile['_type']; value: Tile['value'] }> = [
  { _type: 'character', value: 1 },
  { _type: 'character', value: 9 },
  { _type: 'dot', value: 1 },
  { _type: 'dot', value: 9 },
  { _type: 'stick', value: 1 },
  { _type: 'stick', value: 9 },
  { _type: 'wind', value: 'east' },
  { _type: 'wind', value: 'south' },
  { _type: 'wind', value: 'west' },
  { _type: 'wind', value: 'north' },
  { _type: 'dragon', value: 'red' },
  { _type: 'dragon', value: 'green' },
  { _type: 'dragon', value: 'white' },
];

function key(t: { _type: Tile['_type']; value: Tile['value'] }): string {
  return `${t._type}:${String(t.value)}`;
}

export function isThirteenOrphansWin(hand: Tile[]): boolean {
  if (hand.length !== 14) return false;

  const counts = new Map<string, number>();
  for (const t of hand) {
    const k = key(t);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }

  // Must contain each required tile at least once.
  for (const req of REQUIRED) {
    if ((counts.get(key(req)) ?? 0) < 1) return false;
  }

  // And exactly one duplicate among the 13 required.
  let duplicateCount = 0;
  for (const req of REQUIRED) {
    const c = counts.get(key(req)) ?? 0;
    if (c === 2) duplicateCount += 1;
    else if (c !== 1) return false;
  }

  // No extra tiles beyond the required set.
  if (counts.size !== REQUIRED.length) return false;
  return duplicateCount === 1;
}

