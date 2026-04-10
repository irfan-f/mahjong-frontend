/**
 * Single source of truth for the Learn tutorial: starting hands, scripted discards,
 * and player hand progression so melds and the end screen match tiles the user saw.
 */
import type { Game, PlayerMeld, Tile } from '../types';

const t = (_type: Tile['_type'], value: Tile extends { value: infer V } ? V : never): Tile =>
  ({ _type, value, count: 4 }) as Tile;

/** Match mock.ts opponent ids + MOCK_USER_ID */
export const TN = {
  p1: 'opponent-1',
  p2: 'opponent-2',
  p3: 'opponent-3',
  me: 'mock-user',
} as const;

const d2 = t('dot', 2);
const d3 = t('dot', 3);
const d4 = t('dot', 4);
const d5 = t('dot', 5);
const d6 = t('dot', 6);
const c7 = t('character', 7);
const c8 = t('character', 8);
const c9 = t('character', 9);
const s1 = t('stick', 1);
const s5 = t('stick', 5);
const s6 = t('stick', 6);
const s7 = t('stick', 7);
const s9 = t('stick', 9);
const d8 = t('dot', 8);
const c1 = t('character', 1);
const c2 = t('character', 2);
const c3 = t('character', 3);

/** Generic filler for opponent hands (face-down / not inspected). */
export const TN_OPPONENT_PLACEHOLDER: Tile[] = [
  t('character', 1),
  t('character', 2),
  t('character', 3),
  t('dot', 4),
  t('dot', 5),
  t('dot', 6),
  t('stick', 8),
  t('stick', 9),
  t('wind', 'east'),
  t('wind', 'south'),
  t('dragon', 'red'),
  t('dragon', 'green'),
  t('dragon', 'white'),
];

function meld(
  type: PlayerMeld['type'],
  tiles: Tile[],
  turn: number,
  from: string | null,
): PlayerMeld {
  return {
    meldId: `tn-${type}-${turn}-${tiles.map((x) => `${x._type}-${String(x.value)}`).join('-')}`,
    type,
    tiles,
    visibility: 'exposed',
    source: 'discard-claim',
    claimedFromPlayerId: from,
    claimedTileIndex: tiles.length - 1,
    declaredAtTurn: turn,
    faceDown: false,
  };
}

/** Bob’s chow on Alice’s dot 3 (2–3–4); Bob then discards 5 dot. */
export const TN_BOB_CHOW = meld('chow', [d2, d3, d4], 2, TN.p1);

/** Player claims Bob’s 5 dot. */
export const TN_MY_PONG_D5 = meld('pong', [d5, d5, d5], 3, TN.p2);

/** Player claims next 6 dot. */
export const TN_MY_PONG_D6 = meld('pong', [d6, d6, d6], 5, TN.p2);

/** Chow 7–8–9 character on Carol’s discard. */
export const TN_MY_CHOW_CHARS = meld('chow', [c7, c8, c9], 6, TN.p3);

/** Chow 5–6–7 bamboo on Bob’s discard. */
export const TN_MY_CHOW_BAM = meld('chow', [s5, s6, s7], 7, TN.p2);

/**
 * After deal + draw: 14 tiles (drawn tile is bamboo 1 — user discards it first).
 * Tile multiset supports: pong d5×2+d5 discard, pong d6×2+d6 discard, chows, pair d8×2.
 */
export const TN_MY_HAND_FULL: Tile[] = [
  d5,
  d5,
  d6,
  d6,
  c7,
  c8,
  s5,
  s6,
  d8,
  d8,
  c1,
  c2,
  c3,
  s1,
];

function withoutOneTile(hand: Tile[], tile: Tile): Tile[] {
  const i = hand.findIndex((x) => x._type === tile._type && x.value === tile.value);
  if (i < 0) return [...hand];
  const out = [...hand];
  out.splice(i, 1);
  return out;
}

/** 13 tiles before first draw (no s1). */
export const TN_MY_HAND_BEFORE_DRAW: Tile[] = withoutOneTile(TN_MY_HAND_FULL, s1);

/** After discarding s1 (13 tiles). */
export const TN_AFTER_DISCARD_S1: Tile[] = [
  d5,
  d5,
  d6,
  d6,
  c7,
  c8,
  s5,
  s6,
  d8,
  d8,
  c1,
  c2,
  c3,
];

/** After pong on d5 (11). */
export const TN_AFTER_PONG_D5: Tile[] = [d6, d6, c7, c8, s5, s6, d8, d8, c1, c2, c3];

/** After discarding c1 (10). */
export const TN_AFTER_DISCARD_C1: Tile[] = [d6, d6, c7, c8, s5, s6, d8, d8, c2, c3];

/** After pong on d6 (8). */
export const TN_AFTER_PONG_D6: Tile[] = [c7, c8, s5, s6, d8, d8, c2, c3];

/** After chow on c9 (6). */
export const TN_AFTER_CHOW_CHARS: Tile[] = [s5, s6, d8, d8, c2, c3];

/** After chow on s7 (4) — loose characters remain until discarded. */
export const TN_AFTER_BAM_CHOW: Tile[] = [d8, d8, c2, c3];

/** Closed hand at win (pair of 8-dot). */
export const TN_WINNING_HAND_CLOSED: Tile[] = [d8, d8];

/** Suggested discards (tile identity) for GameBoard highlighting. */
export function getNarrativeSuggestedDiscard(stepId: string): Tile | null {
  if (stepId === 'first-discard') return s1;
  if (stepId === 'my-discard-after-pong') return c1;
  if (stepId === 'discard-c2') return c2;
  if (stepId === 'discard-c3') return c3;
  return null;
}

/**
 * Partial game patches keyed by tutorial step (merged onto base game from mock).
 */
export function getNarrativeAugment(stepId: string): Partial<Game> | null {
  const { p1, p2, p3, me } = TN;
  const opp = TN_OPPONENT_PLACEHOLDER;

  switch (stepId) {
    case 'first-draw':
      return {
        playerHands: { [p1]: opp, [p2]: opp, [p3]: opp, [me]: TN_MY_HAND_BEFORE_DRAW },
        turnState: {
          currentPhase: 'playing',
          playerTurn: me,
          turn_number: 1,
          tileDrawn: false,
          tilesPlaced: false,
          tileDiscarded: false,
        },
        private: { potentialActions: {} },
      };
    case 'first-discard':
      return {
        playerHands: { [p1]: opp, [p2]: opp, [p3]: opp, [me]: TN_MY_HAND_FULL },
        turnState: {
          currentPhase: 'playing',
          playerTurn: me,
          turn_number: 1,
          tileDrawn: true,
          tilesPlaced: false,
          tileDiscarded: false,
        },
        private: { potentialActions: {} },
      };
    case 'watch-alice-turn':
      return {
        playerHands: { [p1]: opp, [p2]: opp, [p3]: opp, [me]: TN_AFTER_DISCARD_S1 },
        playerDiscards: { [me]: [s1] },
        currentPlayer: p1,
        lastDiscardedTile: s1,
        turnState: {
          currentPhase: 'playing',
          playerTurn: p1,
          turn_number: 2,
          tileDrawn: false,
          tilesPlaced: false,
          tileDiscarded: false,
        },
        private: { potentialActions: {} },
      };
    case 'watch-alice-discarded':
      return {
        playerHands: { [p1]: opp, [p2]: opp, [p3]: opp, [me]: TN_AFTER_DISCARD_S1 },
        playerDiscards: { [me]: [s1], [p1]: [d3] },
        currentPlayer: p2,
        lastDiscardedTile: d3,
        turnState: {
          currentPhase: 'playing',
          playerTurn: p2,
          turn_number: 2,
          tileDrawn: false,
          tilesPlaced: false,
          tileDiscarded: false,
        },
        private: { potentialActions: {} },
      };
    case 'watch-bob-chow-done':
      return {
        playerHands: { [p1]: opp, [p2]: opp.slice(0, 10), [p3]: opp, [me]: TN_AFTER_DISCARD_S1 },
        playerDiscards: { [me]: [s1], [p1]: [], [p2]: [d5] },
        playerMelds: { [p2]: [TN_BOB_CHOW] },
        currentPlayer: p3,
        lastDiscardedTile: d5,
        turnState: {
          currentPhase: 'playing',
          playerTurn: p3,
          turn_number: 3,
          tileDrawn: true,
          tilesPlaced: false,
          tileDiscarded: false,
        },
        private: { potentialActions: { [me]: ['pong'] } },
      };
    case 'my-discard-after-pong':
      return {
        playerHands: { [p1]: opp, [p2]: opp.slice(0, 10), [p3]: opp, [me]: TN_AFTER_PONG_D5 },
        playerMelds: { [p2]: [TN_BOB_CHOW], [me]: [TN_MY_PONG_D5] },
        playerDiscards: { [me]: [s1], [p1]: [], [p2]: [], [p3]: [] },
        currentPlayer: me,
        lastDiscardedTile: null,
        turnState: {
          currentPhase: 'playing',
          playerTurn: me,
          turn_number: 4,
          tileDrawn: true,
          tilesPlaced: false,
          tileDiscarded: false,
        },
        private: { potentialActions: {} },
      };
    case 'watch-alice-turn-after-pong':
      return {
        playerHands: { [p1]: opp, [p2]: opp.slice(0, 10), [p3]: opp, [me]: TN_AFTER_DISCARD_C1 },
        playerMelds: { [p2]: [TN_BOB_CHOW], [me]: [TN_MY_PONG_D5] },
        playerDiscards: { [me]: [s1, c1], [p1]: [s9], [p2]: [], [p3]: [] },
        currentPlayer: p2,
        lastDiscardedTile: s9,
        turnState: {
          currentPhase: 'playing',
          playerTurn: p2,
          turn_number: 5,
          tileDrawn: false,
          tilesPlaced: false,
          tileDiscarded: false,
        },
        private: { potentialActions: {} },
      };
    case 'my-second-pong':
      return {
        playerHands: { [p1]: opp, [p2]: opp.slice(0, 10), [p3]: opp, [me]: TN_AFTER_DISCARD_C1 },
        playerMelds: { [p2]: [TN_BOB_CHOW], [me]: [TN_MY_PONG_D5] },
        playerDiscards: { [me]: [s1, c1], [p1]: [], [p2]: [d6], [p3]: [] },
        currentPlayer: me,
        lastDiscardedTile: d6,
        turnState: {
          currentPhase: 'playing',
          playerTurn: me,
          turn_number: 6,
          tileDrawn: true,
          tilesPlaced: false,
          tileDiscarded: false,
        },
        private: { potentialActions: { [me]: ['pong'] } },
      };
    case 'my-second-chow':
      return {
        playerHands: { [p1]: opp, [p2]: opp.slice(0, 10), [p3]: opp, [me]: TN_AFTER_PONG_D6 },
        playerMelds: { [p2]: [TN_BOB_CHOW], [me]: [TN_MY_PONG_D5, TN_MY_PONG_D6] },
        playerDiscards: { [me]: [s1, c1], [p1]: [], [p2]: [], [p3]: [c9] },
        currentPlayer: me,
        lastDiscardedTile: c9,
        turnState: {
          currentPhase: 'playing',
          playerTurn: me,
          turn_number: 7,
          tileDrawn: true,
          tilesPlaced: false,
          tileDiscarded: false,
        },
        private: { potentialActions: { [me]: ['chow'] } },
      };
    case 'bamboo-chow':
      return {
        playerHands: { [p1]: opp, [p2]: opp.slice(0, 10), [p3]: opp, [me]: TN_AFTER_CHOW_CHARS },
        playerMelds: { [p2]: [TN_BOB_CHOW], [me]: [TN_MY_PONG_D5, TN_MY_PONG_D6, TN_MY_CHOW_CHARS] },
        playerDiscards: { [me]: [s1, c1], [p1]: [], [p2]: [s7], [p3]: [c9] },
        currentPlayer: me,
        lastDiscardedTile: s7,
        turnState: {
          currentPhase: 'playing',
          playerTurn: me,
          turn_number: 8,
          tileDrawn: true,
          tilesPlaced: false,
          tileDiscarded: false,
        },
        private: { potentialActions: { [me]: ['chow'] } },
      };
    case 'discard-c2':
      return {
        playerHands: { [p1]: opp, [p2]: opp.slice(0, 10), [p3]: opp, [me]: TN_AFTER_BAM_CHOW },
        playerMelds: {
          [p2]: [TN_BOB_CHOW],
          [me]: [TN_MY_PONG_D5, TN_MY_PONG_D6, TN_MY_CHOW_CHARS, TN_MY_CHOW_BAM],
        },
        playerDiscards: { [me]: [s1, c1], [p1]: [], [p2]: [s7], [p3]: [c9] },
        currentPlayer: me,
        lastDiscardedTile: null,
        turnState: {
          currentPhase: 'playing',
          playerTurn: me,
          turn_number: 9,
          tileDrawn: true,
          tilesPlaced: false,
          tileDiscarded: false,
        },
        private: { potentialActions: {} },
      };
    case 'discard-c3':
      return {
        playerHands: { [p1]: opp, [p2]: opp.slice(0, 10), [p3]: opp, [me]: [d8, d8, c3] },
        playerMelds: {
          [p2]: [TN_BOB_CHOW],
          [me]: [TN_MY_PONG_D5, TN_MY_PONG_D6, TN_MY_CHOW_CHARS, TN_MY_CHOW_BAM],
        },
        playerDiscards: { [me]: [s1, c1, c2], [p1]: [], [p2]: [s7], [p3]: [c9] },
        currentPlayer: me,
        lastDiscardedTile: null,
        turnState: {
          currentPhase: 'playing',
          playerTurn: me,
          turn_number: 10,
          tileDrawn: true,
          tilesPlaced: false,
          tileDiscarded: false,
        },
        private: { potentialActions: {} },
      };
    case 'draw-then-win':
      return {
        playerHands: { [p1]: opp, [p2]: opp.slice(0, 10), [p3]: opp, [me]: TN_WINNING_HAND_CLOSED },
        playerMelds: {
          [p2]: [TN_BOB_CHOW],
          [me]: [TN_MY_PONG_D5, TN_MY_PONG_D6, TN_MY_CHOW_CHARS, TN_MY_CHOW_BAM],
        },
        playerDiscards: {
          [me]: [s1, c1, c2, c3],
          [p1]: [],
          [p2]: [s7],
          [p3]: [c9],
        },
        currentPlayer: me,
        lastDiscardedTile: null,
        turnState: {
          currentPhase: 'playing',
          playerTurn: me,
          turn_number: 11,
          tileDrawn: true,
          tilesPlaced: false,
          tileDiscarded: false,
        },
        private: { potentialActions: { [me]: ['mahjong'] } },
      };
    case 'finished':
      return {
        playerHands: { [p1]: opp, [p2]: opp.slice(0, 10), [p3]: opp, [me]: TN_WINNING_HAND_CLOSED },
        playerMelds: {
          [p2]: [TN_BOB_CHOW],
          [me]: [TN_MY_PONG_D5, TN_MY_PONG_D6, TN_MY_CHOW_CHARS, TN_MY_CHOW_BAM],
        },
        playerDiscards: {
          [me]: [s1, c1, c2, c3],
          [p1]: [],
          [p2]: [s7],
          [p3]: [c9],
        },
        currentPlayer: me,
        lastDiscardedTile: null,
        status: 'ended',
        winnerId: me,
        scores: { [me]: 20, [p1]: 0, [p2]: 0, [p3]: 0 },
        turnState: {
          currentPhase: 'playing',
          playerTurn: me,
          turn_number: 12,
          tileDrawn: true,
          tilesPlaced: false,
          tileDiscarded: false,
        },
        private: { potentialActions: {} },
      };
    default:
      return null;
  }
}
