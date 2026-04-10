import { describe, expect, it } from 'vitest';
import {
  handTilesFromChowMeld,
  multisetTilesEqual,
  resolveChowVariantId,
  tileEquals,
} from './chowClaim';
import type { Tile } from '../types';

describe('chowClaim', () => {
  const c3: Tile = { _type: 'character', value: 3, count: 4 };
  const c4: Tile = { _type: 'character', value: 4, count: 4 };
  const c5: Tile = { _type: 'character', value: 5, count: 4 };
  const c6: Tile = { _type: 'character', value: 6, count: 4 };

  it('tileEquals', () => {
    expect(tileEquals(c3, { ...c3 })).toBe(true);
    expect(tileEquals(c3, c4)).toBe(false);
  });

  it('multisetTilesEqual ignores order', () => {
    expect(multisetTilesEqual([c3, c4], [c4, c3])).toBe(true);
    expect(multisetTilesEqual([c3, c3], [c3, c4])).toBe(false);
  });

  it('handTilesFromChowMeld removes one discard from meld', () => {
    expect(handTilesFromChowMeld([c3, c4, c5], c5)).toEqual([c3, c4]);
    expect(handTilesFromChowMeld([c4, c5, c6], c5)).toEqual([c4, c6]);
  });

  it('resolveChowVariantId returns variant when selection matches exactly one legal chow', () => {
    const actions = [
      { kind: 'claimChow' as const, variantId: 'chow:character:3-4-5', meld: [c3, c4, c5] },
      { kind: 'claimChow' as const, variantId: 'chow:character:4-5-6', meld: [c4, c5, c6] },
    ];
    expect(resolveChowVariantId(c5, actions, [c3, c4])).toBe('chow:character:3-4-5');
    expect(resolveChowVariantId(c5, actions, [c4, c6])).toBe('chow:character:4-5-6');
    expect(resolveChowVariantId(c5, actions, [c3, c6])).toBeNull();
  });
});
