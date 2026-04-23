import { describe, it, expect } from 'vitest';
import {
  computeWallCutIndex,
  opponentScreenSlots,
  wallTilesPerQuadrant,
  windSeatOrder,
} from './tableLayout';

describe('windSeatOrder', () => {
  it('rotates so East (dealer) is first', () => {
    expect(windSeatOrder(['p1', 'p2', 'p3', 'p4'], 'p3')).toEqual(['p3', 'p4', 'p1', 'p2']);
  });
});

describe('opponentScreenSlots', () => {
  it('places East viewer with North left, West across, South right', () => {
    const ids = ['p1', 'p2', 'p3', 'p4'];
    // East=p1, S=p2, W=p3, N=p4
    expect(opponentScreenSlots('p1', ids, 'p1')).toEqual({ top: 'p3', left: 'p4', right: 'p2' });
  });

  it('places South viewer with East left, North across, West right', () => {
    const ids = ['p1', 'p2', 'p3', 'p4'];
    expect(opponentScreenSlots('p2', ids, 'p1')).toEqual({ top: 'p4', left: 'p1', right: 'p3' });
  });
});

describe('computeWallCutIndex', () => {
  it('matches backend formula for 4p / 136 tiles', () => {
    const ids = ['p1', 'p2', 'p3', 'p4'];
    // idx=0, ((0+7)%4)*34=102, (102+14)%136=116
    expect(computeWallCutIndex(7, 'p1', ids, 136)).toBe(116);
    const tutorialLike = ['p1', 'p2', 'p3', 'p4'];
    // East at index 3, dice 7 → 82 (same as mock-user dealer layout)
    expect(computeWallCutIndex(7, 'p4', tutorialLike, 136)).toBe(82);
  });
});

describe('wallTilesPerQuadrant', () => {
  it('distributes remaining tiles along the wall ring from the cut', () => {
    const c = wallTilesPerQuadrant(10, 0, 136);
    expect(c.east + c.south + c.west + c.north).toBe(10);
    expect(c.east).toBe(10);
  });
});
