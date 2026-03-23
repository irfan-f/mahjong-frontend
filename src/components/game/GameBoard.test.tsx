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

    expect(screen.getByText('Concealed x3')).toBeInTheDocument();
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
    expect(screen.getByRole('button', { name: 'Concealed Kong' })).toBeInTheDocument();
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
});
