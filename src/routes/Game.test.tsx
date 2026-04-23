import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Game } from './Game';

const mockGetGame = vi.fn();
const mockConcealedPong = vi.fn();
const mockConcealedChow = vi.fn();
const mockConcealedKong = vi.fn();

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'p1', displayName: 'You' },
    getIdToken: vi.fn().mockResolvedValue('token-1'),
    signOut: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock('../hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'dark', setTheme: vi.fn() }),
}));

vi.mock('../components/AccountMenu', () => ({
  AccountMenu: () => <div>AccountMenu</div>,
}));

vi.mock('../api/endpoints', () => ({
  getGame: (...args: unknown[]) => mockGetGame(...args),
  rollAndDealTiles: vi.fn(),
  drawTile: vi.fn(),
  discardTile: vi.fn(),
  mahjong: vi.fn(),
  claimPong: vi.fn(),
  claimKong: vi.fn(),
  claimChow: vi.fn(),
  passClaim: vi.fn(),
  setShowHand: vi.fn(),
  concealedPong: (...args: unknown[]) => mockConcealedPong(...args),
  concealedChow: (...args: unknown[]) => mockConcealedChow(...args),
  concealedKong: (...args: unknown[]) => mockConcealedKong(...args),
}));

vi.mock('../components/game/GameBoard', () => ({
  GameBoard: (props: {
    onConcealedPong: (tiles: unknown[]) => Promise<void>;
    onConcealedChow: (tiles: unknown[]) => Promise<void>;
    onConcealedKong: (tile: unknown) => Promise<void>;
  }) => {
    void props.onConcealedPong([{ _type: 'dot', value: 3, count: 4 }]);
    void props.onConcealedChow([
      { _type: 'character', value: 2, count: 4 },
      { _type: 'character', value: 3, count: 4 },
      { _type: 'character', value: 4, count: 4 },
    ]);
    void props.onConcealedKong({ _type: 'wind', value: 'east', count: 4 });
    return <div>GameBoardMock</div>;
  },
}));

describe('Game route concealed action wiring', () => {
  beforeEach(() => {
    mockGetGame.mockReset();
    mockConcealedPong.mockReset();
    mockConcealedChow.mockReset();
    mockConcealedKong.mockReset();

    mockGetGame.mockResolvedValue({
      _id: 'g1',
      lobby_id: 'l1',
      playerIds: ['p1', 'p2', 'p3', 'p4'],
      startingPlayer: 'p1',
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
      tilesLeft: 10,
      initialization: {
        playersReady: true,
        playerOrderDecided: true,
        tilesShuffled: true,
        tilesDealt: true,
      },
      playerMelds: { p1: [], p2: [], p3: [], p4: [] },
    });
    mockConcealedPong.mockResolvedValue({ gameId: 'g1' });
    mockConcealedChow.mockResolvedValue({ gameId: 'g1' });
    mockConcealedKong.mockResolvedValue({ gameId: 'g1' });
  });

  it('calls concealed endpoint methods from GameBoard handlers', async () => {
    render(
      <MemoryRouter
        initialEntries={['/game/g1']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/game/:gameId" element={<Game />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockConcealedPong).toHaveBeenCalledTimes(1);
      expect(mockConcealedChow).toHaveBeenCalledTimes(1);
      expect(mockConcealedKong).toHaveBeenCalledTimes(1);
    });
  });
});
