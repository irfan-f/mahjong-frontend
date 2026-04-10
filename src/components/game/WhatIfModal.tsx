import { useEffect, useCallback, useState } from 'react';
import type { Game as GameType, Tile, ScoringContext, ScoringResult, PlayerMeld } from '../../types';
import {
  DEFAULT_RULESET_ID,
  RULESET_SELECT_OPTIONS,
  type RulesetId,
} from '../../terminology/rulesetTerminology';
import { scoreHand } from '../../api/endpoints';
import { ALL_TILE_TYPES } from '../../lib/allTiles';
import { TileView } from '../TileView';
import { tileToLabel } from '../../lib/tileAssets';

export interface WhatIfModalProps {
  open: boolean;
  onClose: () => void;
  /** Current user ID (winner and dealer in context). */
  currentUserId: string | null;
  /** When in a game, pass game for playerIds and optional hand prefill. */
  game?: GameType | null;
  /** Get auth token for scoreHand. */
  getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
  /** Inline layout for the /what-if route (no fullscreen backdrop). */
  embedded?: boolean;
}

function tileKey(t: Tile, index: number): string {
  return `${t._type}-${String(t.value)}-${index}`;
}

function isScorableMeld(meld: PlayerMeld): meld is PlayerMeld & { tiles: Tile[] } {
  return Array.isArray(meld.tiles);
}

const MAX_TOTAL_TILES = 18;
const MAX_TILE_COPIES = 4;

function tileIdentity(t: Tile): string {
  return `${t._type}:${String(t.value)}`;
}

export function WhatIfModal({
  open,
  onClose,
  currentUserId,
  game,
  getIdToken,
  embedded = false,
}: WhatIfModalProps) {
  const [hand, setHand] = useState<Tile[]>([]);
  const selfDraw = false;
  const wonOnLastPiece = false;
  const [result, setResult] = useState<ScoringResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ruleSetId, setRuleSetId] = useState<RulesetId>(DEFAULT_RULESET_ID);

  const playerIds = game?.playerIds?.length ? game.playerIds : ['p1', 'p2', 'p3', 'p4'];
  const dealerId = currentUserId ?? playerIds[0];
  const winnerId = currentUserId ?? playerIds[0];

  const prefillFromGame = useCallback(() => {
    if (!game || !currentUserId) return;
    const myHand = game.playerHands?.[currentUserId] ?? [];
    if (myHand.length === 13) setHand([...myHand]);
  }, [game, currentUserId]);

  useEffect(() => {
    if (!open) return;
    setResult(null);
    setError(null);
    setRuleSetId(game?.ruleSetId ?? DEFAULT_RULESET_ID);
    const myHand = game?.playerHands?.[currentUserId ?? ''] ?? [];
    if (myHand.length === 13) {
      setHand([...myHand]);
    } else {
      setHand([]);
    }
  }, [open, game, currentUserId]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const addTile = (tile: Tile) => {
    if (hand.length >= MAX_TOTAL_TILES) return;
    const sameTileCount = hand.filter((h) => tileIdentity(h) === tileIdentity(tile)).length;
    if (sameTileCount >= MAX_TILE_COPIES) return;
    setHand((prev) => [...prev, { ...tile, count: 4 }]);
    setError(null);
  };

  const removeTile = (index: number) => {
    setHand((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  };

  const handleSubmit = async () => {
    if (hand.length < 2 || hand.length > MAX_TOTAL_TILES) {
      setError(`Hand must have between 2 and ${MAX_TOTAL_TILES} tiles.`);
      return;
    }
    const token = await getIdToken(true);
    if (!token) {
      setError('You must be signed in to score a hand.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const winnerMelds = (game?.playerMelds?.[winnerId] ?? []).filter(isScorableMeld);
      const gamePlayerIds = game?.playerIds?.length ? game.playerIds : playerIds;
      const playerMelds = Object.fromEntries(
        gamePlayerIds.map((pid) => [pid, pid === winnerId ? winnerMelds : []])
      );
      const playerDiscards = Object.fromEntries(
        gamePlayerIds.map((pid) => [pid, game?.playerDiscards?.[pid] ?? []])
      );

      const context: ScoringContext = {
        winnerId,
        winnerHand: hand,
        winnerMelds,
        playerMelds,
        playerDiscards,
        lastDiscardedTile: selfDraw ? null : (game?.lastDiscardedTile ?? null),
        winnerExposedMelds: [],
        selfDraw,
        discarderId: selfDraw ? null : playerIds[1] ?? null,
        dealerId,
        playerIds: gamePlayerIds,
        wonOnLastPiece,
      };
      const scoringResult = await scoreHand(context, token, ruleSetId);
      setResult(scoringResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to score hand');
    } finally {
      setSubmitting(false);
    }
  };

  const tryAnother = () => {
    setResult(null);
    setError(null);
    setHand([]);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!open) return null;

  const card = (
    <div
      className={`bg-surface-panel border border-border rounded-xl shadow-xl w-full max-w-lg flex flex-col ${
        embedded ? 'max-h-none min-h-0' : 'max-h-[90vh]'
      }`}
      onClick={embedded ? undefined : (e) => e.stopPropagation()}
    >
      {!embedded && (
        <div className="flex items-center justify-between gap-2 p-3 border-b border-border shrink-0">
          <h2 id="whatif-modal-title" className="text-lg font-semibold text-on-surface">
            What-if scorer
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-muted hover:text-on-surface hover:bg-(--btn-nav-hover) transition-colors"
            aria-label="Close"
            title="Close"
          >
            Close
          </button>
        </div>
      )}

      <div className="p-4 overflow-auto flex-1 flex flex-col gap-4 min-h-0">
          <label className="flex flex-col gap-1.5 text-xs text-muted" htmlFor="whatif-ruleset-select">
            Ruleset
            <select
              id="whatif-ruleset-select"
              value={ruleSetId}
              onChange={(e) => {
                const next = e.target.value as RulesetId;
                setRuleSetId(next);
                setResult(null);
                setError(null);
              }}
              className="w-full max-w-xs rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface"
              aria-label="Scoring ruleset"
            >
              {RULESET_SELECT_OPTIONS.map(({ id, label }) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <section aria-label="Your hand">
            <div className="flex flex-wrap items-center gap-1.5 min-h-12 p-2 rounded-lg bg-surface border border-border">
              {hand.length === 0 && (
                <span className="text-muted text-sm">No tiles yet — pick from below</span>
              )}
              {hand.map((t, i) => (
                <div key={tileKey(t, i)} className="relative group">
                  <TileView tile={t} className="h-10 w-7" />
                  <button
                    type="button"
                    onClick={() => removeTile(i)}
                    className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-danger text-white text-xs leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                    aria-label={`Remove ${tileToLabel(t)}`}
                    title={`Remove ${tileToLabel(t)}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <span className="text-xs text-muted">{hand.length} tiles</span>
          </section>

          <section aria-label="Add tiles">
            <p className="text-xs font-medium text-muted mb-1">Click a tile to add it</p>
            <div className="flex flex-wrap gap-1 max-h-48 overflow-auto p-1">
              {ALL_TILE_TYPES.map((tile, i) => (
                <button
                  key={tileKey(tile, i)}
                  type="button"
                  onClick={() => addTile(tile)}
                  disabled={
                    hand.length >= MAX_TOTAL_TILES ||
                    hand.filter((h) => tileIdentity(h) === tileIdentity(tile)).length >= MAX_TILE_COPIES
                  }
                  className="rounded hover:ring-2 ring-(--color-primary) transition-shadow disabled:opacity-50 disabled:pointer-events-none"
                  aria-label={`Add ${tileToLabel(tile)}`}
                  title={tileToLabel(tile)}
                >
                  <TileView tile={tile} className="h-8 w-6" />
                </button>
              ))}
            </div>
          </section>

          {error && (
            <div className="px-3 py-2 rounded-lg bg-danger/15 text-danger text-sm" role="alert">
              {error}
            </div>
          )}

          {result && (
            <section aria-label="Scoring result" className="flex flex-col gap-2">
              <p className="text-base font-semibold text-on-surface">
                Total: {result.points ?? 0} points
              </p>
              {result.breakdown && result.breakdown.length > 0 && (
                <ul className="list-none flex flex-col gap-1 text-sm text-muted">
                  {result.breakdown.map((entry, i) => {
                    const label = entry.patternNameRomanized
                      ? `${entry.patternNameEn ?? entry.pattern} (${entry.patternNameRomanized})`
                      : (entry.patternNameEn ?? entry.pattern);
                    return (
                      <li key={i} className="text-on-surface">
                        {label}: {entry.points} points
                      </li>
                    );
                  })}
                </ul>
              )}
              <button
                type="button"
                onClick={tryAnother}
                className="btn-secondary text-sm self-start"
              >
                Try another
              </button>
            </section>
          )}

          <div className="flex gap-2 shrink-0">
            {game && currentUserId && (game.playerHands?.[currentUserId]?.length === 13) && (
              <button
                type="button"
                onClick={prefillFromGame}
                className="btn-secondary text-sm"
              >
                Prefill from my hand
              </button>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={hand.length < 2 || hand.length > MAX_TOTAL_TILES || submitting}
              className="btn-primary"
            >
              {submitting ? 'Scoring…' : 'Score'}
            </button>
          </div>
        </div>
    </div>
  );

  if (embedded) {
    return (
      <section aria-label="What-if hand scoring tool" className="w-full flex justify-center">
        {card}
      </section>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="whatif-modal-title"
      onClick={handleBackdropClick}
    >
      {card}
    </div>
  );
}
