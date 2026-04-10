import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GameBoard } from './GameBoard';
import type { Game, Tile, PlayerMeld } from '../../types';

const baseTile: Tile = { _type: 'dot', value: 2, count: 4 };

function makeGame(overrides?: Partial<Game>): Game {
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
      potentialActions: { p1: [] },
    },
    ...overrides,
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

    expect(screen.getAllByText('Concealed x3').length).toBeGreaterThanOrEqual(1);
  });

  it('shows concealed buttons only from concealed action flags', () => {
    const game = makeGame({
      private: {
        potentialActions: {
          p1: ['concealedPong', 'concealedChow', 'concealedKong'],
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

    expect(screen.getByRole('button', { name: 'Concealed Pong' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Concealed Chow' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Concealed Gang' })).toBeInTheDocument();
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
        potentialActions: { p1: ['concealedPong'] },
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

    await user.click(screen.getByRole('button', { name: 'Concealed Pong' }));
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Select Dot 5 for concealed meld' }).length).toBeGreaterThan(0);
    });
    await user.click(screen.getAllByRole('button', { name: 'Select Dot 5 for concealed meld' })[0]);
    await user.click(screen.getAllByRole('button', { name: 'Select Dot 5 for concealed meld' })[0]);
    await user.click(screen.getAllByRole('button', { name: 'Select Dot 5 for concealed meld' })[0]);

    await waitFor(() => {
      expect(onConcealedPong).toHaveBeenCalledTimes(1);
      expect(onConcealedPong.mock.calls[0][0]).toHaveLength(3);
    });
  });

  it('chow claim: single Chow button, pick two hand tiles, confirm passes variantId', async () => {
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
        potentialActions: { p1: [], p2: ['chow'], p3: [], p4: [] },
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

    await user.click(screen.getByRole('button', { name: 'Chow — select two hand tiles' }));

    await user.click(screen.getByRole('button', { name: 'Select Character 4 for chow' }));
    await user.click(screen.getByRole('button', { name: 'Select Character 6 for chow' }));

    await user.click(screen.getByRole('button', { name: 'Confirm chow with selected tiles' }));
    expect(onClaimChow).toHaveBeenCalledWith('chow:character:4-5-6');
  });

  it('opens "Define winning melds" when calling Mahjong before declaring required melds', async () => {
    const user = userEvent.setup();
    const onMahjong = vi.fn();

    const game = makeGame({
      playerMelds: { p1: [], p2: [], p3: [], p4: [] },
      private: {
        potentialActions: { p1: ['mahjong'] },
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

    const melds = [makeMeld(), makeMeld(), makeMeld(), makeMeld()];

    const game = makeGame({
      playerMelds: { p1: melds, p2: [], p3: [], p4: [] },
      private: {
        potentialActions: { p1: ['mahjong'] },
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
        potentialActions: { p1: ['mahjong'] },
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
