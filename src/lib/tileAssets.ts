import type { Tile } from '../types';

const BASE = import.meta.env.BASE_URL;

/** Face-down tile art; same dimensions and frame style as other `public/tiles/*.svg` assets. */
export function tileBackAssetPath(): string {
  return `${BASE}tiles/back.svg`;
}

/**
 * Asset path for a tile. Backend uses "stick"; assets use "bamboo" (same suit).
 * Uses BASE_URL so tiles work under Vite dev and under GitHub Pages (base /mahjong-frontend/).
 */
export function tileToAssetPath(tile: Tile): string {
  const v = String(tile.value);
  if (tile._type === 'character') return `${BASE}tiles/characters_${v}.svg`;
  if (tile._type === 'dot') return `${BASE}tiles/dots_${v}.svg`;
  if (tile._type === 'stick') return `${BASE}tiles/bamboo_${v}.svg`;
  if (tile._type === 'wind') return `${BASE}tiles/wind_${v}.svg`;
  if (tile._type === 'dragon') return `${BASE}tiles/dragon_${v}.svg`;
  return `${BASE}tiles/dots_1.svg`;
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
