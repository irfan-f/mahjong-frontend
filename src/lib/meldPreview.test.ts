import { describe, expect, it } from 'vitest';
import { partitionMeldsForPreview } from './meldPreview';
import type { PlayerMeld } from '../types';

function m(id: string, tiles: number): PlayerMeld {
  return {
    meldId: id,
    type: 'pong',
    tiles: Array.from({ length: tiles }, (_, i) => ({
      _type: 'dot' as const,
      value: (i + 1) as 1,
      count: 4 as const,
    })),
    visibility: 'exposed',
    source: 'discard-claim',
    claimedFromPlayerId: null,
    claimedTileIndex: null,
    declaredAtTurn: 1,
    faceDown: false,
  };
}

describe('partitionMeldsForPreview', () => {
  it('fits melds until tile budget 4', () => {
    const melds = [m('a', 3), m('b', 3)];
    const { preview, rest } = partitionMeldsForPreview(melds, 4);
    expect(preview).toHaveLength(1);
    expect(preview[0]!.meldId).toBe('a');
    expect(rest).toHaveLength(1);
    expect(rest[0]!.meldId).toBe('b');
  });

  it('returns all when under budget', () => {
    const melds = [m('a', 2), m('b', 2)];
    const { preview, rest } = partitionMeldsForPreview(melds, 4);
    expect(preview).toHaveLength(2);
    expect(rest).toHaveLength(0);
  });
});
