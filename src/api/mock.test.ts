import { describe, expect, it } from 'vitest';
import { getMockGame, getTutorialGameForStep } from './mock';

describe('tutorial/mock playerMelds migration', () => {
  it('returns canonical playerMelds for tutorial chow/pong states', () => {
    const chowStep = getTutorialGameForStep('watch-bob-chow-done');
    expect(chowStep?.playerMelds?.['opponent-2']?.[0]?.type).toBe('chow');

    const pongStep = getTutorialGameForStep('my-discard-after-pong');
    expect(pongStep?.playerMelds?.['mock-user']?.[0]?.type).toBe('pong');

    const winStep = getTutorialGameForStep('draw-then-win');
    const mine = winStep?.playerMelds?.['mock-user'] ?? [];
    expect(mine).toHaveLength(4);
    expect(mine.some((m) => m.type === 'pong')).toBe(true);
    expect(mine.filter((m) => m.type === 'chow')).toHaveLength(2);
    expect(mine.some((m) => m.type === 'kong')).toBe(false);
  });

  it('keeps mock games on canonical playerMelds shape', () => {
    const game = getMockGame('claim');
    expect(game.playerMelds).toBeDefined();
    expect(game.playerExposedMelds).toBeUndefined();
  });
});
