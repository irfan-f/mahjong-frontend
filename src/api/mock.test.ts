import { describe, expect, it } from 'vitest';
import { getMockGame, getTutorialGameForStep } from './mock';

describe('tutorial/mock playerMelds migration', () => {
  it('returns canonical playerMelds for tutorial chow/pong/kong states', () => {
    const chowStep = getTutorialGameForStep('watch-bob-chow-done');
    expect(chowStep?.playerMelds?.['opponent-2']?.[0]?.type).toBe('chow');

    const pongStep = getTutorialGameForStep('my-discard-after-pong');
    expect(pongStep?.playerMelds?.['mock-user']?.[0]?.type).toBe('pong');

    const kongStep = getTutorialGameForStep('draw-then-win');
    expect(kongStep?.playerMelds?.['mock-user']?.some((m) => m.type === 'kong')).toBe(true);
  });

  it('keeps mock games on canonical playerMelds shape', () => {
    const game = getMockGame('claim');
    expect(game.playerMelds).toBeDefined();
    expect(game.playerExposedMelds).toBeUndefined();
  });
});
