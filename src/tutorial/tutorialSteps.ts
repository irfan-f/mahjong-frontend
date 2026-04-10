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
  | 'my-second-pong'
  | 'my-second-chow'
  | 'bamboo-chow'
  | 'discard-c2'
  | 'discard-c3'
  | 'draw-then-win'
  | 'finished';

export type TutorialAnchor =
  /** Whole bottom player card (hand + actions); avoids overlapping when actions are a narrow column. */
  | 'player-dock'
  | 'hand'
  | 'opponent-north'
  | 'opponent-south'
  | 'opponent-west'
  | 'opponent-east'
  /** Legacy grid slots when fewer than four players */
  | 'opponent-0'
  | 'opponent-1'
  | 'opponent-2'
  | 'learn-intro'
  | 'site-home';

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
  {
    id: 'intro',
    title: 'Welcome',
    description: "You'll play as first player.",
    anchor: 'learn-intro',
    allowedActions: {},
  },
  { id: 'pre-deal', title: 'Deal', description: 'Roll & deal.', anchor: 'player-dock', allowedActions: { canRollAndDeal: true } },
  { id: 'first-draw', title: 'Your turn', description: 'Draw a tile to start.', anchor: 'player-dock', allowedActions: { canDraw: true } },
  { id: 'first-discard', title: 'Discard', description: 'Discard the highlighted tile.', anchor: 'hand', allowedActions: { canDiscard: true } },
  { id: 'watch-alice-turn', title: "Alice's turn", description: 'She draws, then discards.', anchor: 'opponent-south', allowedActions: {} },
  {
    id: 'watch-alice-discarded',
    title: 'Alice discarded 3 dot',
    description: 'Bob claims a Chow (2–3–4 of dots) using that tile.',
    anchor: 'opponent-west',
    allowedActions: {},
  },
  {
    id: 'watch-bob-chow-done',
    title: 'Bob chowed and discarded 5 dot',
    description: 'Claim Pong with your two 5-dot tiles and Bob’s discard.',
    anchor: 'player-dock',
    allowedActions: { canClaimPong: true },
  },
  {
    id: 'my-discard-after-pong',
    title: 'Discard',
    description: 'Discard a tile you no longer need (highlighted).',
    anchor: 'hand',
    allowedActions: { canDiscard: true },
  },
  {
    id: 'watch-alice-turn-after-pong',
    title: "Alice's turn",
    description: 'She discards 9 bamboo.',
    anchor: 'opponent-south',
    allowedActions: {},
  },
  {
    id: 'my-second-pong',
    title: 'Your Pong',
    description: 'Bob discarded 6 dot — take it with your pair of 6-dot tiles.',
    anchor: 'player-dock',
    allowedActions: { canClaimPong: true },
  },
  {
    id: 'my-second-chow',
    title: 'Your Chow (characters)',
    description: 'Carol discarded 9 character — complete 7–8–9 with your 7 and 8.',
    anchor: 'player-dock',
    allowedActions: { canClaimChow: true },
  },
  {
    id: 'bamboo-chow',
    title: 'Your Chow (bamboo)',
    description: 'Bob discarded 7 bamboo — complete 5–6–7 with your 5 and 6.',
    anchor: 'player-dock',
    allowedActions: { canClaimChow: true },
  },
  {
    id: 'discard-c2',
    title: 'Discard',
    description: 'Discard the highlighted loose tile (Character 2).',
    anchor: 'hand',
    allowedActions: { canDiscard: true },
  },
  {
    id: 'discard-c3',
    title: 'Discard',
    description: 'Discard the highlighted loose tile (Character 3).',
    anchor: 'hand',
    allowedActions: { canDiscard: true },
  },
  {
    id: 'draw-then-win',
    title: 'Win',
    description: 'Your hand is now four melds plus the pair of 8-dot tiles — declare Mahjong.',
    anchor: 'player-dock',
    allowedActions: { canDeclareMahjong: true },
  },
  {
    id: 'finished',
    title: 'Done',
    description: 'Tap the Mahjong with Friends link in the header to go home.',
    anchor: 'site-home',
    allowedActions: {},
  },
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
