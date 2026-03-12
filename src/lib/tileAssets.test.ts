import { describe, it, expect } from 'vitest';
import { tileToAssetPath, tileToLabel } from './tileAssets';
import type { Tile } from '../types';

describe('tileToAssetPath', () => {
  const base = import.meta.env.BASE_URL;

  it('maps character tiles to characters_N.svg', () => {
    expect(tileToAssetPath({ _type: 'character', value: 5, count: 4 } as Tile)).toBe(
      `${base}tiles/characters_5.svg`
    );
  });

  it('maps dot tiles to dots_N.svg', () => {
    expect(tileToAssetPath({ _type: 'dot', value: 9, count: 4 } as Tile)).toBe(
      `${base}tiles/dots_9.svg`
    );
  });

  it('maps stick tiles to bamboo_N.svg', () => {
    expect(tileToAssetPath({ _type: 'stick', value: 1, count: 4 } as Tile)).toBe(
      `${base}tiles/bamboo_1.svg`
    );
  });

  it('maps wind tiles to wind_value.svg', () => {
    expect(tileToAssetPath({ _type: 'wind', value: 'east', count: 4 } as Tile)).toBe(
      `${base}tiles/wind_east.svg`
    );
  });

  it('maps dragon tiles to dragon_value.svg', () => {
    expect(tileToAssetPath({ _type: 'dragon', value: 'red', count: 4 } as Tile)).toBe(
      `${base}tiles/dragon_red.svg`
    );
  });
});

describe('tileToLabel', () => {
  it('returns readable label for character', () => {
    expect(tileToLabel({ _type: 'character', value: 3, count: 4 } as Tile)).toBe('Character 3');
  });

  it('returns readable label for dot', () => {
    expect(tileToLabel({ _type: 'dot', value: 7, count: 4 } as Tile)).toBe('Dot 7');
  });

  it('returns readable label for stick (Bamboo)', () => {
    expect(tileToLabel({ _type: 'stick', value: 2, count: 4 } as Tile)).toBe('Bamboo 2');
  });

  it('returns readable label for wind', () => {
    expect(tileToLabel({ _type: 'wind', value: 'south', count: 4 } as Tile)).toBe('Wind south');
  });

  it('returns readable label for dragon', () => {
    expect(tileToLabel({ _type: 'dragon', value: 'green', count: 4 } as Tile)).toBe(
      'Dragon green'
    );
  });
});
