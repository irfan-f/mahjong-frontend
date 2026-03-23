import type { Tile } from '../types';

/** All 34 unique tile types (one of each for pickers). Count is 4 for API compatibility. */
export const ALL_TILE_TYPES: Tile[] = [
  ...([1, 2, 3, 4, 5, 6, 7, 8, 9] as const).map((value) => ({
    _type: 'character' as const,
    value,
    count: 4 as const,
  })),
  ...([1, 2, 3, 4, 5, 6, 7, 8, 9] as const).map((value) => ({
    _type: 'dot' as const,
    value,
    count: 4 as const,
  })),
  ...([1, 2, 3, 4, 5, 6, 7, 8, 9] as const).map((value) => ({
    _type: 'stick' as const,
    value,
    count: 4 as const,
  })),
  ...(['east', 'south', 'west', 'north'] as const).map((value) => ({
    _type: 'wind' as const,
    value,
    count: 4 as const,
  })),
  ...(['red', 'green', 'white'] as const).map((value) => ({
    _type: 'dragon' as const,
    value,
    count: 4 as const,
  })),
];
