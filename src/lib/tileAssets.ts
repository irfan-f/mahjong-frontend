import type { Tile } from '../types';

/**
 * Asset filename for a tile. Backend uses "stick"; assets use "bamboo" (same suit).
 * Public tiles are at /tiles/*.svg (Vite serves public at root).
 */
export function tileToAssetPath(tile: Tile): string {
  const v = String(tile.value);
  if (tile._type === 'character') return `/tiles/characters_${v}.svg`;
  if (tile._type === 'dot') return `/tiles/dots_${v}.svg`;
  if (tile._type === 'stick') return `/tiles/bamboo_${v}.svg`;
  if (tile._type === 'wind') return `/tiles/wind_${v}.svg`;
  if (tile._type === 'dragon') return `/tiles/dragon_${v}.svg`;
  return `/tiles/dots_1.svg`;
}

/** Human-readable label for accessibility (e.g. "Bamboo 3", "Wind East"). */
export function tileToLabel(tile: Tile): string {
  if (tile._type === 'character') return `Character ${tile.value}`;
  if (tile._type === 'dot') return `Dot ${tile.value}`;
  if (tile._type === 'stick') return `Bamboo ${tile.value}`;
  if (tile._type === 'wind') return `Wind ${String(tile.value)}`;
  if (tile._type === 'dragon') return `Dragon ${String(tile.value)}`;
  return 'Tile';
}
