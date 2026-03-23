import { describe, it, expect, vi, beforeEach } from 'vitest';
import { concealedChow, concealedKong, concealedPong } from './endpoints';
import type { Tile } from '../types';

const okResponse = new Response(JSON.stringify({ gameId: 'g1' }), {
  status: 200,
  headers: { 'Content-Type': 'application/json' },
});

describe('concealed action endpoints', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(okResponse.clone());
    vi.stubGlobal('fetch', fetchMock);
  });

  it('calls concealedPong with tiles payload', async () => {
    const tiles: Tile[] = [
      { _type: 'dot', value: 3, count: 4 },
      { _type: 'dot', value: 3, count: 4 },
      { _type: 'dot', value: 3, count: 4 },
    ];
    await concealedPong('g1', tiles, 'token-1');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/api/game/g1/concealedPong');
    expect(init.method).toBe('PUT');
    expect(init.body).toBe(JSON.stringify({ tiles }));
  });

  it('calls concealedChow with tiles payload', async () => {
    const tiles: Tile[] = [
      { _type: 'character', value: 4, count: 4 },
      { _type: 'character', value: 5, count: 4 },
      { _type: 'character', value: 6, count: 4 },
    ];
    await concealedChow('g1', tiles, 'token-1');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/api/game/g1/concealedChow');
    expect(init.method).toBe('PUT');
    expect(init.body).toBe(JSON.stringify({ tiles }));
  });

  it('calls concealedKong with tile payload', async () => {
    const tile: Tile = { _type: 'wind', value: 'east', count: 4 };
    await concealedKong('g1', tile, 'token-1');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/api/game/g1/concealedKong');
    expect(init.method).toBe('PUT');
    expect(init.body).toBe(JSON.stringify({ tile }));
  });
});
