import { describe, expect, it } from 'vitest';
import { getMockGame } from './mock';

describe('getMockGame', () => {
  it('uses canonical playerMelds shape for claim scenario', () => {
    const game = getMockGame('claim');
    expect(game.playerMelds).toBeDefined();
  });
});
