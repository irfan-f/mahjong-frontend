import type { Game } from '../types';
import { getTutorialGameForStep } from '../api/mock';

export type TutorialStepId =
  | 'intro'
  | 'pre-deal'
  | 'first-draw'
  | 'first-discard'
  | 'watch-alice-turn'
  | 'watch-alice-discarded'
  | 'watch-bob-chow-done'
  | 'my-discard-after-pong'
  | 'watch-alice-turn-after-pong'
  | 'my-kong'
  | 'draw-then-win'
  | 'finished';

export type TutorialAnchor = 'action-bar' | 'hand';

export interface TutorialStep {
  id: TutorialStepId;
  title: string;
  description: string;
  /** When set, the tutorial info box is positioned near this element. */
  anchor?: TutorialAnchor | null;
  allowedActions: {
    canRollAndDeal?: boolean;
    canDraw?: boolean;
    canDiscard?: boolean;
    canClaimPong?: boolean;
    canClaimKong?: boolean;
    canClaimChow?: boolean;
    canDeclareMahjong?: boolean;
    canPassClaim?: boolean;
  };
}

export const tutorialSteps: TutorialStep[] = [
  { id: 'intro', title: 'Welcome', description: "You'll play as first player.", allowedActions: {} },
  { id: 'pre-deal', title: 'Deal', description: 'Roll & deal.', anchor: 'action-bar', allowedActions: { canRollAndDeal: true } },
  { id: 'first-draw', title: 'Your turn', description: 'Draw a tile to start.', anchor: 'action-bar', allowedActions: { canDraw: true } },
  { id: 'first-discard', title: 'Discard', description: 'Discard the highlighted tile.', anchor: 'hand', allowedActions: { canDiscard: true } },
  { id: 'watch-alice-turn', title: "Alice's turn", description: 'She draws, then discards.', allowedActions: {} },
  { id: 'watch-alice-discarded', title: "Alice discarded 3 dot", description: "Bob can Chow (run 2-3-4).", allowedActions: {} },
  { id: 'watch-bob-chow-done', title: "Bob Chows, discards 5 dot", description: "Take Bob's 5 dot for Pong.", anchor: 'action-bar', allowedActions: { canClaimPong: true } },
  { id: 'my-discard-after-pong', title: 'Discard', description: 'Discard one tile.', anchor: 'hand', allowedActions: { canDiscard: true } },
  { id: 'watch-alice-turn-after-pong', title: "Alice's turn", description: 'She draws, then discards.', allowedActions: {} },
  { id: 'my-kong', title: 'Your Kong', description: "Take Bob's 4 dot for a set of four.", anchor: 'action-bar', allowedActions: { canClaimKong: true } },
  { id: 'draw-then-win', title: 'Win', description: 'Declare Mahjong.', anchor: 'action-bar', allowedActions: { canDeclareMahjong: true } },
  { id: 'finished', title: 'Done', description: 'Back arrow to go home.', allowedActions: {} },
];

export function getTutorialStepById(id: TutorialStepId): TutorialStep {
  const step = tutorialSteps.find((s) => s.id === id);
  return step ?? tutorialSteps[0];
}

export function getTutorialAnchor(step: TutorialStep): TutorialAnchor | null {
  return step.anchor ?? null;
}

export function getInitialTutorialGame(): Game {
  const game = getTutorialGameForStep('pre-deal');
  if (!game) throw new Error('Tutorial pre-deal state is required');
  return game;
}
