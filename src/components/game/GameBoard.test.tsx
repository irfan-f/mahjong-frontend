import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GameBoard } from './GameBoard';
import type { Game, Tile, PlayerMeld } from '../../types';

const baseTile: Tile = { _type: 'dot', value: 2, count: 4 };

function makeGame(overrides?: Partial<Game>): Game {
  const { private: privateOverride, ...rest } = overrides ?? {};
  const defaultLegalP1 = [{ kind: 'discard' as const, tileGroups: [baseTile] }];
  return {
    _id: 'g1',
    lobby_id: 'l1',
    playerIds: ['p1', 'p2', 'p3', 'p4'],
    startingPlayer: 'p1',
    playerDisplayNames: { p1: 'You', p2: 'P2', p3: 'P3', p4: 'P4' },
    playerHands: { p1: [baseTile], p2: [], p3: [], p4: [] },
    playerDiscards: { p1: [], p2: [], p3: [], p4: [] },
    playerMelds: { p1: [], p2: [], p3: [], p4: [] },
    turnState: {
      currentPhase: 'playing',
      playerTurn: 'p1',
      turn_number: 1,
      tileDrawn: true,
      tilesPlaced: false,
      tileDiscarded: false,
    },
    currentPlayer: 'p1',
    lastDiscardedTile: null,
    tilesLeft: 60,
    initialization: {
      playersReady: true,
      playerOrderDecided: true,
      tilesShuffled: true,
      tilesDealt: true,
    },
    private: {
      legalActions: {
        p1: privateOverride?.legalActions?.p1 !== undefined ? privateOverride.legalActions.p1 : defaultLegalP1,
        p2: privateOverride?.legalActions?.p2 !== undefined ? privateOverride.legalActions.p2 : [],
        p3: privateOverride?.legalActions?.p3 !== undefined ? privateOverride.legalActions.p3 : [],
        p4: privateOverride?.legalActions?.p4 !== undefined ? privateOverride.legalActions.p4 : [],
      },
    },
    ...rest,
  };
}

function makeMeld(overrides?: Partial<PlayerMeld>): PlayerMeld {
  return {
    meldId: 'm1',
    type: 'pong',
    tiles: [
      { _type: 'dot', value: 3, count: 4 },
      { _type: 'dot', value: 3, count: 4 },
      { _type: 'dot', value: 3, count: 4 },
    ],
    visibility: 'exposed',
    source: 'discard-claim',
    claimedFromPlayerId: 'p2',
    claimedTileIndex: 2,
    declaredAtTurn: 1,
    faceDown: false,
    ...overrides,
  };
}

describe('GameBoard playerMelds and concealed actions', () => {
  it('renders melds from playerMelds', () => {
    const game = makeGame({
      playerMelds: {
        p1: [makeMeld()],
        p2: [],
        p3: [],
        p4: [],
      },
    });
    render(
      <GameBoard
        game={game}
        currentUserId="p1"
        currentUserDisplayName="You"
        error={null}
        acting={false}
        onRollAndDeal={() => {}}
        onDraw={() => {}}
        onDiscardTile={() => {}}
        onMahjong={() => {}}
        onClaimPong={() => {}}
        onClaimKong={() => {}}
        onClaimChow={() => {}}
        onPassClaim={() => {}}
        onConcealedPong={() => {}}
        onConcealedChow={() => {}}
        onConcealedKong={() => {}}
      />
    );

    expect(screen.getAllByTitle('pong').length).toBeGreaterThan(0);
  });

  it('hides concealed opponent meld tiles and shows placeholder count', () => {
    const hiddenMeld = makeMeld({
      visibility: 'concealed',
      faceDown: true,
      tiles: null,
      tileCount: 3,
    });
    const game = makeGame({
      playerMelds: {
        p1: [],
        p2: [hiddenMeld],
        p3: [],
        p4: [],
      },
    });
    const { container } = render(
      <GameBoard
        game={game}
        currentUserId="p1"
        currentUserDisplayName="You"
        error={null}
        acting={false}
        onRollAndDeal={() => {}}
        onDraw={() => {}}
        onDiscardTile={() => {}}
        onMahjong={() => {}}
        onClaimPong={() => {}}
        onClaimKong={() => {}}
        onClaimChow={() => {}}
        onPassClaim={() => {}}
        onConcealedPong={() => {}}
        onConcealedChow={() => {}}
        onConcealedKong={() => {}}
      />
    );

    // Decorative `<img alt="">` backs are excluded from `getByRole('img')` in Testing Library.
    expect(container.querySelectorAll('img[src*="tiles/back.svg"]').length).toBeGreaterThanOrEqual(3);
  });

  it('shows concealed buttons only from concealed action flags', () => {
    const c1: Tile = { _type: 'character', value: 1, count: 4 };
    const c2: Tile = { _type: 'character', value: 2, count: 4 };
    const c3: Tile = { _type: 'character', value: 3, count: 4 };
    const game = makeGame({
      private: {
        legalActions: {
          p1: [
            { kind: 'declareConcealedPong', tiles: [baseTile, baseTile, baseTile] },
            { kind: 'declareConcealedChow', tiles: [c1, c2, c3] },
            { kind: 'declareConcealedKong', tile: baseTile },
          ],
          p2: [],
          p3: [],
          p4: [],
        },
      },
    });
    render(
      <GameBoard
        game={game}
        currentUserId="p1"
        currentUserDisplayName="You"
        error={null}
        acting={false}
        onRollAndDeal={() => {}}
        onDraw={() => {}}
        onDiscardTile={() => {}}
        onMahjong={() => {}}
        onClaimPong={() => {}}
        onClaimKong={() => {}}
        onClaimChow={() => {}}
        onPassClaim={() => {}}
        onConcealedPong={() => {}}
        onConcealedChow={() => {}}
        onConcealedKong={() => {}}
      />
    );

    expect(screen.getByRole('button', { name: 'Pong' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Chow' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /gang|full set|fullset/i })).toBeInTheDocument();
  });

  it('supports constrained concealed pong tile selection', async () => {
    const user = userEvent.setup();
    const onConcealedPong = vi.fn();
    const game = makeGame({
      playerHands: {
        p1: [
          { _type: 'dot', value: 5, count: 4 },
          { _type: 'dot', value: 5, count: 4 },
          { _type: 'dot', value: 5, count: 4 },
          { _type: 'dot', value: 7, count: 4 },
        ],
        p2: [],
        p3: [],
        p4: [],
      },
      private: {
        legalActions: {
          p1: [
            {
              kind: 'declareConcealedPong',
              tiles: [
                { _type: 'dot', value: 5, count: 4 },
                { _type: 'dot', value: 5, count: 4 },
                { _type: 'dot', value: 5, count: 4 },
              ],
            },
          ],
          p2: [],
          p3: [],
          p4: [],
        },
      },
    });
    render(
      <GameBoard
        game={game}
        currentUserId="p1"
        currentUserDisplayName="You"
        error={null}
        acting={false}
        onRollAndDeal={() => {}}
        onDraw={() => {}}
        onDiscardTile={() => {}}
        onMahjong={() => {}}
        onClaimPong={() => {}}
        onClaimKong={() => {}}
        onClaimChow={() => {}}
        onPassClaim={() => {}}
        onConcealedPong={onConcealedPong}
        onConcealedChow={() => {}}
        onConcealedKong={() => {}}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Pong' }));
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Select Dot 5 for meld' }).length).toBeGreaterThan(0);
    });
    const dot5Buttons = screen.getAllByRole('button', { name: 'Select Dot 5 for meld' });
    await user.click(dot5Buttons[0]!);
    await user.click(dot5Buttons[1]!);
    await user.click(dot5Buttons[2]!);
    await user.click(screen.getByRole('button', { name: 'Claim pong' }));

    await waitFor(() => {
      expect(onConcealedPong).toHaveBeenCalledTimes(1);
      expect(onConcealedPong.mock.calls[0][0]).toHaveLength(3);
    });
  });

  it('chow claim: tile groups shown for each variant, selecting one and confirming passes variantId', async () => {
    const user = userEvent.setup();
    const onClaimChow = vi.fn();
    const c3: Tile = { _type: 'character', value: 3, count: 4 };
    const c4: Tile = { _type: 'character', value: 4, count: 4 };
    const c5: Tile = { _type: 'character', value: 5, count: 4 };
    const c6: Tile = { _type: 'character', value: 6, count: 4 };
    const game = makeGame({
      currentPlayer: 'p2',
      lastDiscardedTile: c5,
      turnState: {
        currentPhase: 'playing',
        playerTurn: 'p2',
        turn_number: 2,
        tileDrawn: false,
        tilesPlaced: false,
        tileDiscarded: false,
      },
      playerHands: { p1: [baseTile], p2: [c3, c4, c5, c6], p3: [], p4: [] },
      private: {
        legalActions: {
          p1: [],
          p2: [
            { kind: 'claimChow', variantId: 'chow:character:3-4-5', meld: [c3, c4, c5] },
            { kind: 'claimChow', variantId: 'chow:character:4-5-6', meld: [c4, c5, c6] },
            { kind: 'passClaim' },
          ],
          p3: [],
          p4: [],
        },
      },
    });
    render(
      <GameBoard
        game={game}
        currentUserId="p2"
        currentUserDisplayName="You"
        error={null}
        acting={false}
        onRollAndDeal={() => {}}
        onDraw={() => {}}
        onDiscardTile={() => {}}
        onMahjong={() => {}}
        onClaimPong={() => {}}
        onClaimKong={() => {}}
        onClaimChow={onClaimChow}
        onPassClaim={() => {}}
        onConcealedPong={() => {}}
        onConcealedChow={() => {}}
        onConcealedKong={() => {}}
      />
    );

    // Two chow variants shown as tile groups — select the [c4,c5,c6] group
    await user.click(
      screen.getByRole('button', { name: 'Chow: Character 4, Character 5, Character 6' }),
    );

    // Confirm button appears and fires the correct variantId
    await user.click(screen.getByRole('button', { name: 'Confirm Chow' }));
    expect(onClaimChow).toHaveBeenCalledWith('chow:character:4-5-6');
  });

  it('opens "Define winning melds" when calling Mahjong before declaring required melds', async () => {
    const user = userEvent.setup();
    const onMahjong = vi.fn();

    const game = makeGame({
      playerMelds: { p1: [], p2: [], p3: [], p4: [] },
      private: {
        legalActions: {
          p1: [{ kind: 'declareMahjong' }],
          p2: [],
          p3: [],
          p4: [],
        },
      },
    });

    render(
      <GameBoard
        game={game}
        currentUserId="p1"
        currentUserDisplayName="You"
        error={null}
        acting={false}
        onRollAndDeal={() => {}}
        onDraw={() => {}}
        onDiscardTile={() => {}}
        onMahjong={onMahjong}
        onClaimPong={() => {}}
        onClaimKong={() => {}}
        onClaimChow={() => {}}
        onPassClaim={() => {}}
        onConcealedPong={() => {}}
        onConcealedChow={() => {}}
        onConcealedKong={() => {}}
      />
    );

    await user.click(screen.getByRole('button', { name: /Define melds before Mahjong/i }));
    expect(onMahjong).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: /Define winning melds/i })).toBeInTheDocument();
  });

  it('calls onMahjong directly when 4 melds are declared', async () => {
    const user = userEvent.setup();
    const onMahjong = vi.fn();

    const melds = [1, 2, 3, 4].map((n) => makeMeld({ meldId: `m${n}` }));

    const game = makeGame({
      playerMelds: { p1: melds, p2: [], p3: [], p4: [] },
      private: {
        legalActions: {
          p1: [{ kind: 'declareMahjong' }],
          p2: [],
          p3: [],
          p4: [],
        },
      },
    });

    render(
      <GameBoard
        game={game}
        currentUserId="p1"
        currentUserDisplayName="You"
        error={null}
        acting={false}
        onRollAndDeal={() => {}}
        onDraw={() => {}}
        onDiscardTile={() => {}}
        onMahjong={onMahjong}
        onClaimPong={() => {}}
        onClaimKong={() => {}}
        onClaimChow={() => {}}
        onPassClaim={() => {}}
        onConcealedPong={() => {}}
        onConcealedChow={() => {}}
        onConcealedKong={() => {}}
      />
    );

    await user.click(screen.getByRole('button', { name: /Declare Mahjong/i }));
    expect(onMahjong).toHaveBeenCalledTimes(1);
  });

  it('allows Mahjong for Thirteen Orphans with no melds declared', async () => {
    const user = userEvent.setup();
    const onMahjong = vi.fn();

    const char = (v: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9): Tile => ({ _type: 'character', value: v, count: 4 });
    const dot = (v: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9): Tile => ({ _type: 'dot', value: v, count: 4 });
    const stick = (v: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9): Tile => ({ _type: 'stick', value: v, count: 4 });

    const e: Tile = { _type: 'wind', value: 'east', count: 4 };
    const s: Tile = { _type: 'wind', value: 'south', count: 4 };
    const w: Tile = { _type: 'wind', value: 'west', count: 4 };
    const n: Tile = { _type: 'wind', value: 'north', count: 4 };
    const r: Tile = { _type: 'dragon', value: 'red', count: 4 };
    const g: Tile = { _type: 'dragon', value: 'green', count: 4 };
    const wh: Tile = { _type: 'dragon', value: 'white', count: 4 };

    const orphanHand: Tile[] = [char(1), char(9), dot(1), dot(9), dot(9), stick(1), stick(9), e, s, w, n, r, g, wh];

    const game = makeGame({
      playerHands: { p1: orphanHand, p2: [], p3: [], p4: [] },
      playerMelds: { p1: [], p2: [], p3: [], p4: [] },
      private: {
        legalActions: {
          p1: [{ kind: 'declareMahjong' }],
          p2: [],
          p3: [],
          p4: [],
        },
      },
    });

    render(
      <GameBoard
        game={game}
        currentUserId="p1"
        currentUserDisplayName="You"
        error={null}
        acting={false}
        onRollAndDeal={() => {}}
        onDraw={() => {}}
        onDiscardTile={() => {}}
        onMahjong={onMahjong}
        onClaimPong={() => {}}
        onClaimKong={() => {}}
        onClaimChow={() => {}}
        onPassClaim={() => {}}
        onConcealedPong={() => {}}
        onConcealedChow={() => {}}
        onConcealedKong={() => {}}
      />
    );

    await user.click(screen.getByRole('button', { name: /Declare Mahjong/i }));
    expect(onMahjong).toHaveBeenCalledTimes(1);
  });
});
