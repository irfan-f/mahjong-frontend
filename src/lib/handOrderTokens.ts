import type { Tile } from '../types';

export function tileIdentity(tile: Tile): string {
  return `${tile._type}:${String(tile.value)}`;
}

export function formatChowMeldShort(tiles: Tile[]): string {
  if (tiles.length === 0) return '';
  const suit = tiles[0]._type;
  const values = tiles
    .filter((t) => typeof t.value === 'number')
    .map((t) => t.value as number)
    .sort((a, b) => a - b);
  return `${String(suit)} ${values.join('-')}`;
}

