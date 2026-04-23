import type { Game, MeldType, PlayerMeld, Tile, WindTileValue } from '../../../types';

export type SeatLetter = 'E' | 'S' | 'W' | 'N';

export function windToLetter(wind: WindTileValue | undefined): SeatLetter | '?' {
  if (!wind) return '?';
  switch (wind) {
    case 'east':
      return 'E';
    case 'south':
      return 'S';
    case 'west':
      return 'W';
    case 'north':
      return 'N';
  }
}

/** Full seat wind label for HUD pills (prototype G3). */
export function windToDisplayName(wind: WindTileValue | undefined): string {
  if (!wind) return '—';
  return wind.charAt(0).toUpperCase() + wind.slice(1);
}

/** Semantic wind color for UI labels (text/icons). */
export function windToColorClass(wind: WindTileValue | undefined): string {
  switch (wind) {
    case 'east':
      return 'text-emerald-400 dark:text-emerald-300';
    case 'south':
      return 'text-amber-400 dark:text-amber-300';
    case 'west':
      return 'text-sky-400 dark:text-sky-300';
    case 'north':
      return 'text-fuchsia-400 dark:text-fuchsia-300';
    default:
      return 'text-muted';
  }
}

export function meldTypeToLabel(t: MeldType): string {
  switch (t) {
    case 'pong':
      return 'Pon';
    case 'kong':
      return 'Kan';
    case 'chow':
      return 'Chii';
  }
}

export function isPreDealPhase(game: Game): boolean {
  return game.initialization?.tilesDealt !== true;
}

export function previousPlayerId(game: Game): string | null {
  const pids = game.playerIds ?? [];
  if (pids.length !== 4) return null;
  const cur = game.currentPlayer;
  const idx = pids.indexOf(cur);
  if (idx < 0) return null;
  return pids[(idx + 3) % 4] ?? null;
}

function tileEq(a: Tile, b: Tile): boolean {
  return a._type === b._type && JSON.stringify(a.value) === JSON.stringify(b.value);
}

/** Mirrors backend `resolveDiscarderIdFromGameSnapshot` for the face-up discard. */
export function resolveDiscarderIdFromGame(game: Game): string | null {
  if (game.lastDiscarderId) return game.lastDiscarderId;
  const t = game.lastDiscardedTile;
  const hist = game.discardHistory;
  if (t && hist && hist.length > 0) {
    for (let i = hist.length - 1; i >= 0; i--) {
      if (tileEq(hist[i]!.tile, t)) return hist[i]!.playerId;
    }
  }
  if (t && game.playerDiscards) {
    for (const pid of game.playerIds ?? []) {
      const pile = game.playerDiscards[pid] ?? [];
      const top = pile[pile.length - 1];
      if (top && tileEq(top, t)) return pid;
    }
  }
  return null;
}

/** Sort key from `meldId` (suffix is `Date.now()` for server-built melds). */
function meldRecencyWeight(meldId: string): number {
  const tail = meldId.split('-').pop() ?? '';
  const n = Number(tail);
  if (Number.isFinite(n) && n > 1e9) return n;
  const legacy = Number.parseInt(tail, 10);
  return Number.isFinite(legacy) ? legacy : 0;
}

function collectDiscardClaimMelds(game: Game): { actorId: string; meld: PlayerMeld }[] {
  const out: { actorId: string; meld: PlayerMeld }[] = [];
  const seen = new Set<string>();
  for (const [pid, melds] of Object.entries(game.playerMelds ?? {})) {
    for (const meld of melds ?? []) {
      if (meld.source !== 'discard-claim' || !meld.claimedFromPlayerId) continue;
      if (seen.has(meld.meldId)) continue;
      seen.add(meld.meldId);
      out.push({ actorId: pid, meld });
    }
  }
  return out;
}

/**
 * The last actor who materially changed the table.
 * Returns null until an action has actually happened (pre-deal / no discards / no claims),
 * so we don't incorrectly highlight a "previous" player at round start.
 */
export function previousActorId(game: Game): string | null {
  if (isPreDealPhase(game)) return null;

  const cur = game.currentPlayer;
  const hasDiscarded = (game.playerDiscards?.[cur]?.length ?? 0) > 0;
  if (!hasDiscarded && game.turnState?.tileDrawn && !game.turnState?.tileDiscarded) {
    return cur;
  }

  const claims = collectDiscardClaimMelds(game);
  let bestClaim: { actorId: string; meld: PlayerMeld } | null = null;
  for (const c of claims) {
    if (!bestClaim || meldRecencyWeight(c.meld.meldId) > meldRecencyWeight(bestClaim.meld.meldId)) {
      bestClaim = c;
    }
  }
  if (bestClaim) return bestClaim.actorId;

  if (game.lastDiscardedTile) {
    return (
      resolveDiscarderIdFromGame(game)
      ?? previousPlayerId(game)
      ?? game.turnState?.playerTurn
      ?? game.currentPlayer
      ?? null
    );
  }

  const hist = game.discardHistory ?? [];
  if (hist.length > 0) return hist[hist.length - 1]!.playerId;

  return null;
}

export type RecentAction =
  | { kind: 'discard'; actorId: string; actorWind?: WindTileValue; tile: Tile }
  | {
      kind: 'claim';
      actorId: string;
      actorWind?: WindTileValue;
      fromId: string;
      fromWind?: WindTileValue;
      meldType: MeldType;
      claimedTile?: Tile | null;
    };

export function buildRecentActions(game: Game, windByPlayer: Record<string, WindTileValue>): RecentAction[] {
  if (isPreDealPhase(game)) {
    return [];
  }

  const hist = game.discardHistory ?? [];

  type TimedAction = {
    sortKey: number;
    action: RecentAction;
  };

  const timed: TimedAction[] = [];

  // Discards: use `discardHistory` indices as stable ordering keys.
  // Keep enough tail so a discard that gets claimed doesn't push the discard out of view.
  const tailStart = Math.max(0, hist.length - 12);
  for (let i = tailStart; i < hist.length; i++) {
    const e = hist[i]!;
    timed.push({
      sortKey: i,
      action: {
        kind: 'discard',
        actorId: e.playerId,
        actorWind: windByPlayer[e.playerId],
        tile: e.tile,
      },
    });
  }

  // If the backend provides `lastDiscardedTile` but it isn't yet in `discardHistory`,
  // include it as the newest discard. (Do not let a subsequent claim "replace" it.)
  if (game.lastDiscardedTile) {
    const did = resolveDiscarderIdFromGame(game);
    const last = hist[hist.length - 1];
    const matchesLast =
      Boolean(did && last && last.playerId === did && tileEq(last.tile, game.lastDiscardedTile));
    if (did && !matchesLast) {
      timed.push({
        sortKey: hist.length,
        action: {
          kind: 'discard',
          actorId: did,
          actorWind: windByPlayer[did],
          tile: game.lastDiscardedTile,
        },
      });
    }
  }

  // Claims: place immediately after the discard they claim (same fromId + claimedTile match).
  // When we can't confidently match, fall back to an ordering *after* the newest discard.
  const claims = collectDiscardClaimMelds(game).sort(
    (a, b) => meldRecencyWeight(b.meld.meldId) - meldRecencyWeight(a.meld.meldId),
  );

  for (const { actorId, meld } of claims) {
    const claimedTile =
      meld.tiles && meld.claimedTileIndex != null ? meld.tiles[meld.claimedTileIndex] ?? null : null;

    let claimedDiscardIndex: number | null = null;
    if (claimedTile) {
      for (let i = hist.length - 1; i >= 0; i--) {
        const e = hist[i]!;
        if (e.playerId !== meld.claimedFromPlayerId) continue;
        if (tileEq(e.tile, claimedTile)) {
          claimedDiscardIndex = i;
          break;
        }
      }
    }

    const baseKey = claimedDiscardIndex ?? hist.length;
    const claimKey = baseKey + 0.5 + Math.min(0.49, meldRecencyWeight(meld.meldId) / 1e16);

    timed.push({
      sortKey: claimKey,
      action: {
        kind: 'claim',
        actorId,
        actorWind: windByPlayer[actorId],
        fromId: meld.claimedFromPlayerId!,
        fromWind: windByPlayer[meld.claimedFromPlayerId!],
        meldType: meld.type,
        claimedTile,
      },
    });
  }

  timed.sort((a, b) => b.sortKey - a.sortKey);

  // Only de-dupe exact duplicate consecutive discards (can happen when lastDiscardedTile races the history).
  const out: RecentAction[] = [];
  for (const { action } of timed) {
    const prev = out[out.length - 1];
    if (
      prev &&
      action.kind === 'discard' &&
      prev.kind === 'discard' &&
      prev.actorId === action.actorId &&
      tileEq(prev.tile, action.tile)
    ) {
      continue;
    }
    out.push(action);
  }

  // `RecentActionsCard` controls visible length; keep the builder as a full ordered stream.
  return out;
}
