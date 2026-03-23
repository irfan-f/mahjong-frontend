import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Game as GameType, Tile, PlayerMeld } from '../../types';
import type { TutorialStep } from '../../tutorial/tutorialSteps';
import { TileView } from '../TileView';
import { tileToLabel } from '../../lib/tileAssets';
import { Spinner } from '../Spinner';
import { Icon } from '../Icon';
import { icons } from '../../icons';

import type { ScoringResult } from '../../types';

export interface GameBoardProps {
  game: GameType;
  /** When game ended after declaring Mahjong, the scoring result from the PUT response. */
  lastScoringResult?: ScoringResult | null;
  currentUserId: string | null;
  currentUserDisplayName?: string | null;
  error: string | null;
  acting: boolean;
  onRollAndDeal: () => void;
  onDraw: () => void;
  onDiscardTile: (tile: Tile) => void;
  onMahjong: () => void;
  onClaimPong: () => void;
  onClaimKong: () => void;
  onClaimChow: () => void;
  onPassClaim: () => void;
  onConcealedPong?: (tiles: Tile[]) => void | Promise<void>;
  onConcealedChow?: (tiles: Tile[]) => void | Promise<void>;
  onConcealedKong?: (tile: Tile) => void | Promise<void>;
  /** Open the What-if scorer modal (during game or after game end). Omit in tutorial. */
  onOpenWhatIf?: () => void;
  mode?: 'standard' | 'tutorial';
  /** When mode is tutorial, only these actions are shown. Omit to use game state. */
  tutorialAllowedActions?: TutorialStep['allowedActions'];
  /** When game has ended, called when the user toggles "Show my hand to others". Omit in tutorial. */
  onShowHandChange?: (showHand: boolean) => Promise<void>;
  /** In tutorial, when canDiscard is true: only this tile is clickable and is highlighted. */
  tutorialDiscardTile?: Tile | null;
}

export function GameBoard({
  game,
  lastScoringResult,
  currentUserId,
  currentUserDisplayName,
  error,
  acting,
  onRollAndDeal,
  onDraw,
  onDiscardTile,
  onMahjong,
  onClaimPong,
  onClaimKong,
  onClaimChow,
  onPassClaim,
  onConcealedPong = async () => {},
  onConcealedChow = async () => {},
  onConcealedKong = async () => {},
  onOpenWhatIf,
  mode = 'standard',
  tutorialAllowedActions,
  onShowHandChange,
  tutorialDiscardTile,
}: GameBoardProps) {
  const isEnded = game.status === 'ended';

  const isMyTurn = game.currentPlayer === currentUserId;
  const myHand = game.playerHands?.[currentUserId ?? ''] ?? [];
  const myMelds = game.playerMelds?.[currentUserId ?? ''] ?? [];
  const init = game.initialization;
  const potentialActions = game.private?.potentialActions?.[currentUserId ?? ''] ?? [];
  const isTutorial = mode === 'tutorial' && tutorialAllowedActions != null;
  const canClaimPong = isTutorial ? Boolean(tutorialAllowedActions.canClaimPong) : potentialActions.includes('pong');
  const canClaimKong = isTutorial ? Boolean(tutorialAllowedActions.canClaimKong) : potentialActions.includes('kong');
  const canClaimChow = isTutorial ? Boolean(tutorialAllowedActions.canClaimChow) : potentialActions.includes('chow');
  const canDeclareMahjong = isTutorial ? Boolean(tutorialAllowedActions.canDeclareMahjong) : potentialActions.includes('mahjong');
  const canRollAndDeal = isTutorial ? Boolean(tutorialAllowedActions.canRollAndDeal) : true;
  const canDraw = isTutorial ? Boolean(tutorialAllowedActions.canDraw) : true;
  const canDiscard = isTutorial ? Boolean(tutorialAllowedActions.canDiscard) : true;
  const canPassClaim = isTutorial ? Boolean(tutorialAllowedActions.canPassClaim) : true;
  const canConcealedPong = potentialActions.includes('concealedPong');
  const canConcealedChow = potentialActions.includes('concealedChow');
  const canConcealedKong = potentialActions.includes('concealedKong');
  const showClaimButtons = canClaimPong || canClaimKong || canClaimChow;
  const claimGroupCount = (canClaimPong ? 1 : 0) + (canClaimKong ? 1 : 0) + (canClaimChow ? 1 : 0) + (canPassClaim ? 1 : 0);
  const showClaimDivider = showClaimButtons && claimGroupCount >= 2;

  const opponentIds = (game.playerIds ?? []).filter((id) => id !== currentUserId);
  const [discardsPopoverPid, setDiscardsPopoverPid] = useState<string | null>(null);
  const [meldsPopoverPid, setMeldsPopoverPid] = useState<string | null>(null);
  const [showHandUpdating, setShowHandUpdating] = useState(false);
  const [concealedMode, setConcealedMode] = useState<'pong' | 'chow' | 'kong' | null>(null);
  const [concealedSelectedIndices, setConcealedSelectedIndices] = useState<number[]>([]);
  const panelPopoverRef = useRef<HTMLDivElement>(null);

  const tileEquals = (a: Tile, b: Tile) => a._type === b._type && a.value === b.value;
  const isNumericSuit = (tile: Tile) =>
    tile._type === 'dot' || tile._type === 'character' || tile._type === 'stick';
  const getMeldCountParts = (melds: PlayerMeld[]) => {
    const base = melds.reduce((sum, meld) => {
      const tileCount = meld.tileCount ?? meld.tiles?.length ?? 0;
      return sum + Math.min(tileCount, 3);
    }, 0);
    const kongBonus = melds.reduce((sum, meld) => {
      const tileCount = meld.tileCount ?? meld.tiles?.length ?? 0;
      return sum + (tileCount >= 4 || meld.type === 'kong' ? 1 : 0);
    }, 0);
    return { base, kongBonus };
  };

  const canCompleteChow = (selected: Tile[], candidate: Tile): boolean => {
    const next = [...selected, candidate];
    if (!next.every(isNumericSuit)) return false;
    const suit = next[0]._type;
    if (!next.every((t) => t._type === suit)) return false;
    const values = next.map((t) => t.value as number).sort((a, b) => a - b);
    if (next.length === 1) return true;
    if (next.length === 2) {
      for (const tile of myHand) {
        if (!isNumericSuit(tile) || tile._type !== suit) continue;
        const tryValues = [...values, tile.value as number].sort((a, b) => a - b);
        if (tryValues[0] + 1 === tryValues[1] && tryValues[1] + 1 === tryValues[2]) {
          return true;
        }
      }
      return false;
    }
    if (next.length === 3) {
      return values[0] + 1 === values[1] && values[1] + 1 === values[2];
    }
    return false;
  };

  const getSelectableConcealedIndices = (): Set<number> => {
    if (!concealedMode) return new Set();
    const selectedTiles = concealedSelectedIndices.map((idx) => myHand[idx]).filter(Boolean);
    const out = new Set<number>();
    if (concealedMode === 'kong') {
      const counts = new Map<string, number>();
      myHand.forEach((tile) => {
        const key = `${tile._type}:${String(tile.value)}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      });
      myHand.forEach((tile, index) => {
        const key = `${tile._type}:${String(tile.value)}`;
        if ((counts.get(key) ?? 0) >= 4) out.add(index);
      });
      return out;
    }
    myHand.forEach((candidate, index) => {
      if (concealedSelectedIndices.includes(index)) return;
      if (concealedMode === 'pong') {
        if (selectedTiles.length === 0) {
          const count = myHand.filter((t) => tileEquals(t, candidate)).length;
          if (count >= 3) out.add(index);
          return;
        }
        if (selectedTiles.every((t) => tileEquals(t, candidate))) out.add(index);
        return;
      }
      if (concealedMode === 'chow' && concealedSelectedIndices.length < 3) {
        if (canCompleteChow(selectedTiles, candidate)) out.add(index);
      }
    });
    return out;
  };

  const concealedSelectableIndices = getSelectableConcealedIndices();

  const resetConcealedSelection = () => {
    setConcealedMode(null);
    setConcealedSelectedIndices([]);
  };

  const selectConcealedTile = async (index: number) => {
    if (!concealedMode || !concealedSelectableIndices.has(index)) return;
    if (concealedMode === 'kong') {
      const tile = myHand[index];
      if (!tile) return;
      await onConcealedKong(tile);
      resetConcealedSelection();
      return;
    }
    const nextIndices = [...concealedSelectedIndices, index];
    const needed = 3;
    if (nextIndices.length >= needed) {
      const tiles = nextIndices.map((i) => myHand[i]).filter(Boolean);
      if (concealedMode === 'pong') await onConcealedPong(tiles);
      if (concealedMode === 'chow') await onConcealedChow(tiles);
      resetConcealedSelection();
      return;
    }
    setConcealedSelectedIndices(nextIndices);
  };

  const renderMeldTiles = (meld: PlayerMeld, isOwner: boolean) => {
    if (meld.tiles && (isOwner || meld.visibility !== 'concealed')) {
      return meld.tiles.map((t, ti) => <TileView key={ti} tile={t} className="h-7 w-5" />);
    }
    const count = meld.tileCount ?? meld.tiles?.length ?? 0;
    return (
      <>
        {Array.from({ length: count }).map((_, idx) => (
          <span key={idx} className="h-7 w-5 rounded-sm bg-border/70 border border-border" aria-hidden />
        ))}
        <span className="text-[10px] text-muted w-full text-center">Concealed x{count}</span>
      </>
    );
  };

  useEffect(() => {
    if (discardsPopoverPid == null && meldsPopoverPid == null) return;
    const handleClick = (e: MouseEvent) => {
      if (panelPopoverRef.current?.contains(e.target as Node)) return;
      setDiscardsPopoverPid(null);
      setMeldsPopoverPid(null);
    };
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [discardsPopoverPid, meldsPopoverPid]);

  const getPlayerLabel = (pid: string, fallbackIndex?: number) => {
    if (pid === currentUserId) {
      return currentUserDisplayName ?? 'You';
    }
    const name = game.playerDisplayNames?.[pid];
    if (name) return name;
    if (fallbackIndex !== undefined && opponentIds.includes(pid)) return `Opponent ${fallbackIndex + 1}`;
    return 'Player';
  };

  const currentPlayerLabel =
    game.currentPlayer === currentUserId
      ? 'Your turn'
      : opponentIds.includes(game.currentPlayer)
        ? getPlayerLabel(game.currentPlayer, opponentIds.indexOf(game.currentPlayer))
        : 'Current player';

  const winnerId = game.winnerId;
  const iWon = winnerId === currentUserId;
  const winnerLabel =
    winnerId === currentUserId
      ? currentUserDisplayName ?? 'You'
      : winnerId && opponentIds.includes(winnerId)
        ? getPlayerLabel(winnerId, opponentIds.indexOf(winnerId))
        : winnerId
          ? getPlayerLabel(winnerId)
          : 'A player';

  return (
    <>
      <div className="flex-1 min-h-0 overflow-auto p-3 gap-3 flex flex-col max-w-4xl mx-auto w-full">
        {error && (
          <div className="panel px-4 py-3 text-danger text-sm rounded-xl" role="alert">
            {error}
          </div>
        )}

        {isEnded && (
          <section
            aria-label="Game over"
            className="panel p-6 rounded-xl text-center flex flex-col gap-4 border-2 border-(--color-primary) bg-surface-panel"
          >
            <h2 className="text-xl font-bold text-on-surface">
              {iWon ? 'You won!' : `${winnerLabel} won!`}
            </h2>
            {(lastScoringResult?.points != null || game.points != null) && (
              <p className="text-base font-semibold text-on-surface">
                Total: {(lastScoringResult?.points ?? game.points) ?? 0} points
              </p>
            )}
            {(lastScoringResult?.breakdown ?? game.breakdown) && (lastScoringResult?.breakdown ?? game.breakdown)!.length > 0 && (
              <ul className="list-none flex flex-col gap-1 text-sm text-muted text-center px-2" aria-label="Scoring breakdown">
                {(lastScoringResult?.breakdown ?? game.breakdown)!.map((entry, i) => (
                  <li key={i} className="text-on-surface">
                    {entry.patternNameEn ?? entry.pattern}: {entry.points} points
                  </li>
                ))}
              </ul>
            )}
            {game.scores && game.playerIds && Object.keys(game.scores).length > 0 && (
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-muted">
                {game.playerIds.map((pid) => {
                  const score = game.scores?.[pid];
                  const label = getPlayerLabel(pid, opponentIds.indexOf(pid));
                  return (
                    <span key={pid}>
                      {label}: <strong className="text-on-surface">{score ?? 0}</strong>
                    </span>
                  );
                })}
              </div>
            )}
            {mode === 'standard' && currentUserId && onShowHandChange && (
              <label className="flex items-center justify-center gap-2 text-sm text-on-surface cursor-pointer">
                <input
                  type="checkbox"
                  checked={game.playerShowHand?.[currentUserId] === true}
                  disabled={showHandUpdating}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setShowHandUpdating(true);
                    onShowHandChange(checked).finally(() => setShowHandUpdating(false));
                  }}
                  className="rounded border-border"
                  aria-label="Show my hand to other players"
                />
                <span>Show my hand to other players</span>
              </label>
            )}
            {mode === 'standard' && (
              <Link
                to="/"
                className="btn-primary inline-flex items-center justify-center max-w-xs mx-auto"
                aria-label="Back to home"
                title="Back to home"
              >
                Back to home
              </Link>
            )}
          </section>
        )}

        {init.tilesDealt && (
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-muted" role="status">
            <span>{isEnded ? 'Game over' : `Current: ${currentPlayerLabel}`}</span>
            <span>Tiles left: {game.tilesLeft}</span>
            {game.lastDiscardedTile && (
              <span className="inline-flex items-center gap-1.5">
                Last discard: <TileView tile={game.lastDiscardedTile} className="h-6 w-4 inline-block" />
              </span>
            )}
          </div>
        )}

        <section aria-label="Players and discards" className="grid grid-cols-1 sm:grid-cols-3 gap-3 overflow-visible">
          {opponentIds.slice(0, 3).map((pid, idx) => {
            const hand = game.playerHands?.[pid] ?? [];
            const discards = game.playerDiscards?.[pid] ?? [];
            const melds = game.playerMelds?.[pid] ?? [];
            const meldCounts = getMeldCountParts(melds);
            const isCurrent = pid === game.currentPlayer;
            const latestDiscard = discards.length > 0 ? discards[discards.length - 1] : null;
            const olderDiscards = discards.length > 1 ? discards.slice(0, -1).reverse() : [];
            const latestMeld = melds.length > 0 ? melds[melds.length - 1] : null;
            const olderMelds = melds.length > 1 ? melds.slice(0, -1).reverse() : [];
            const isDiscardsPopoverOpen = discardsPopoverPid === pid;
            const isMeldsPopoverOpen = meldsPopoverPid === pid;
            const isAnyPopoverOpen = isDiscardsPopoverOpen || isMeldsPopoverOpen;
            const label = getPlayerLabel(pid, idx);
            return (
              <div
                key={pid}
                ref={isAnyPopoverOpen ? panelPopoverRef : undefined}
                className={`panel p-3 flex flex-col gap-2 rounded-xl relative overflow-visible ${
                  isCurrent ? 'ring-2 ring-(--color-primary) ring-offset-2' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2 min-h-8">
                  <div className="relative flex flex-col items-start gap-1 min-w-0 flex-1">
                    <span className="text-xs text-muted font-medium">
                      Melds ({meldCounts.base}{meldCounts.kongBonus > 0 ? ` +${meldCounts.kongBonus}` : ''})
                    </span>
                    {melds.length === 0 && <span className="text-muted text-xs">None</span>}
                    {melds.length === 1 && (
                      latestMeld && (
                        <div className="flex flex-wrap justify-center gap-0.5" title={latestMeld.type}>
                          {renderMeldTiles(latestMeld, false)}
                        </div>
                      )
                    )}
                    {melds.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setMeldsPopoverPid(isMeldsPopoverOpen ? null : pid)}
                          className="flex items-center gap-1 rounded-lg border border-border bg-surface-panel px-2 py-1.5 text-left hover:bg-(--btn-nav-hover) transition-colors"
                          aria-label={`Latest meld, ${olderMelds.length} older; click to view all melds`}
                          title={`View all ${melds.length} melds`}
                        >
                          {latestMeld && (
                            <div className="flex flex-wrap justify-center gap-0.5" title={latestMeld.type}>
                              {renderMeldTiles(latestMeld, false)}
                            </div>
                          )}
                          <span
                            className={`text-muted text-xs shrink-0 transition-transform inline-flex ${isMeldsPopoverOpen ? 'rotate-180' : ''}`}
                            aria-hidden
                          >
                            <Icon src={icons.chevronDown} className="size-3 [&_.icon-svg]:size-3" />
                          </span>
                        </button>
                        {isMeldsPopoverOpen && olderMelds.length > 0 && (
                          <div
                            className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-border bg-surface-panel p-2 shadow-lg flex flex-col gap-1 max-h-[min(12rem,35vh)] overflow-auto"
                            role="dialog"
                            aria-label={`Meld history for ${label}`}
                          >
                            {olderMelds.map((meld, i) => (
                              <div key={i} className="flex flex-wrap justify-center gap-0.5" title={meld.type}>
                                {renderMeldTiles(meld, false)}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-0.5 shrink-0">
                    <span className="text-sm font-medium truncate text-center max-w-[100px]">
                      {label}
                    </span>
                    <span className="text-muted text-xs">Hand ({hand.length})</span>
                  </div>
                  <div className="relative flex flex-col items-end gap-1 min-w-0 flex-1">
                    <span className="text-xs text-muted font-medium">Discards ({discards.length})</span>
                    {discards.length === 0 && <span className="text-muted text-xs">None</span>}
                    {discards.length === 1 && latestDiscard && (
                      <TileView tile={latestDiscard} className="h-7 w-5" />
                    )}
                    {discards.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setDiscardsPopoverPid(isDiscardsPopoverOpen ? null : pid)}
                          className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-panel px-2 py-1.5 text-left hover:bg-(--btn-nav-hover) transition-colors min-h-8"
                          aria-label={`Latest discard, ${olderDiscards.length} older; click to view all discards`}
                          title={`View all ${discards.length} discards`}
                        >
                          <TileView tile={latestDiscard!} className="h-7 w-5" />
                          <span
                            className={`text-muted text-xs shrink-0 transition-transform inline-flex ${isDiscardsPopoverOpen ? 'rotate-180' : ''}`}
                            aria-hidden
                          >
                            <Icon src={icons.chevronDown} className="size-3 [&_.icon-svg]:size-3" />
                          </span>
                        </button>
                        {isDiscardsPopoverOpen && olderDiscards.length > 0 && (
                          <div
                            className="absolute right-0 top-full z-10 mt-1 rounded-lg border border-border bg-surface-panel p-2 shadow-lg flex flex-wrap justify-center gap-1 max-h-[min(12rem,35vh)] overflow-auto min-w-16"
                            role="dialog"
                            aria-label={`Discard history for ${label}`}
                          >
                            {olderDiscards.map((t, i) => (
                              <TileView key={i} tile={t} className="h-7 w-5" />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
                {isEnded && hand.length > 0 && (
                  <div className="w-full flex flex-col gap-1 pt-1 border-t border-border" aria-label={`${label} hand`}>
                    <span className="text-xs text-muted font-medium">Hand</span>
                    <div className="flex flex-wrap justify-center gap-0.5">
                      {hand.map((t, i) => (
                        <TileView key={i} tile={t} className="h-7 w-5" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {!init.tilesDealt && (
          <p className="text-muted text-sm text-center py-2">
            Ready to deal. Tap the button below to start the round.
          </p>
        )}
      </div>

      <div className="border-t border-border bg-surface-panel p-3 flex flex-col gap-3 shrink-0">
        {init.tilesDealt && !isEnded && canDeclareMahjong && isMyTurn && (
          <p className="text-center text-sm font-semibold text-(--color-primary)" role="status">
            You can win!
          </p>
        )}
        <div className="flex flex-wrap justify-center items-center gap-2" data-tutorial-anchor="action-bar">
          {init.tilesDealt && onOpenWhatIf && (
            <button
              type="button"
              onClick={onOpenWhatIf}
              className="btn-secondary inline-flex items-center justify-center gap-2"
              aria-label="Open What-if scorer"
              title="Score a hand (what-if)"
            >
              What-if
            </button>
          )}
          {!init.tilesDealt && !isEnded && canRollAndDeal && (
            <button
              onClick={onRollAndDeal}
              disabled={acting}
              className="btn-primary inline-flex items-center justify-center gap-2"
              aria-label={acting ? 'Rolling and dealing' : 'Roll and deal tiles'}
            >
              {acting && <Spinner className="w-4 h-4" />}
              Roll & deal
            </button>
          )}
          {init.tilesDealt && !isEnded && canDeclareMahjong && (
            <button
              onClick={onMahjong}
              disabled={acting}
              className="btn-primary btn-claim-mahjong inline-flex items-center justify-center gap-2"
              aria-label={acting ? 'Declaring Mahjong' : 'Declare Mahjong'}
            >
              {acting && <Spinner className="w-4 h-4" />}
              Mahjong
            </button>
          )}
          {init.tilesDealt && !isEnded && canDraw && isMyTurn && !game.turnState.tileDrawn && (
            <button
              onClick={onDraw}
              disabled={acting}
              className="btn-primary inline-flex items-center justify-center gap-2"
              aria-label={acting ? 'Drawing' : 'Draw a tile'}
            >
              {acting && <Spinner className="w-4 h-4" />}
              Draw
            </button>
          )}
          {init.tilesDealt && !isEnded && showClaimButtons && (
            <>
              {showClaimDivider && <span className="w-px h-5 bg-border" aria-hidden />}
              {canClaimPong && (
                <button
                  onClick={onClaimPong}
                  disabled={acting}
                  className="btn-primary btn-claim-pong inline-flex items-center justify-center gap-2"
                  aria-label={acting ? 'Claiming Pong' : 'Claim Pong'}
                >
                  {acting && <Spinner className="w-4 h-4" />}
                  Pong
                </button>
              )}
              {canClaimKong && (
                <button
                  onClick={onClaimKong}
                  disabled={acting}
                  className="btn-primary btn-claim-kong inline-flex items-center justify-center gap-2"
                  aria-label={acting ? 'Claiming Kong' : 'Claim Kong'}
                >
                  {acting && <Spinner className="w-4 h-4" />}
                  Kong
                </button>
              )}
              {canClaimChow && (
                <button
                  onClick={onClaimChow}
                  disabled={acting}
                  className="btn-primary btn-claim-chow inline-flex items-center justify-center gap-2"
                  aria-label={acting ? 'Claiming Chow' : 'Claim Chow'}
                >
                  {acting && <Spinner className="w-4 h-4" />}
                  Chow
                </button>
              )}
              {canPassClaim && (
                <button
                  onClick={onPassClaim}
                  disabled={acting}
                  className="btn-secondary inline-flex items-center justify-center gap-2"
                  aria-label={acting ? 'Passing' : 'Pass (do not claim)'}
                >
                  {acting && <Spinner className="w-4 h-4" />}
                  Pass
                </button>
              )}
            </>
          )}
          {init.tilesDealt && !isEnded && canConcealedPong && (
            <button
              onClick={() => {
                setConcealedMode('pong');
                setConcealedSelectedIndices([]);
              }}
              disabled={acting}
              className="btn-secondary inline-flex items-center justify-center gap-2"
              aria-label="Concealed Pong"
            >
              Concealed Pong
            </button>
          )}
          {init.tilesDealt && !isEnded && canConcealedChow && (
            <button
              onClick={() => {
                setConcealedMode('chow');
                setConcealedSelectedIndices([]);
              }}
              disabled={acting}
              className="btn-secondary inline-flex items-center justify-center gap-2"
              aria-label="Concealed Chow"
            >
              Concealed Chow
            </button>
          )}
          {init.tilesDealt && !isEnded && canConcealedKong && (
            <button
              onClick={() => {
                setConcealedMode('kong');
                setConcealedSelectedIndices([]);
              }}
              disabled={acting}
              className="btn-secondary inline-flex items-center justify-center gap-2"
              aria-label="Concealed Kong"
            >
              Concealed Kong
            </button>
          )}
          {concealedMode && (
            <button
              onClick={resetConcealedSelection}
              disabled={acting}
              className="btn-secondary inline-flex items-center justify-center gap-2"
              aria-label="Cancel concealed selection"
            >
              Cancel select
            </button>
          )}
        </div>

        {init.tilesDealt && (myHand.length > 0 || myMelds.length > 0) && (
          <section aria-label={isEnded ? 'Your winning hand' : 'Your hand'} className="panel p-3 rounded-xl" data-tutorial-anchor="hand">
            <div className="flex items-start justify-between gap-2 min-h-8 mb-2">
              <div className="flex flex-col items-start gap-1 min-w-0 flex-1" aria-label="Your melds">
                {(() => {
                  const myMeldCounts = getMeldCountParts(myMelds);
                  return (
                    <span className="text-xs text-muted font-medium">
                      Melds ({myMeldCounts.base}{myMeldCounts.kongBonus > 0 ? ` +${myMeldCounts.kongBonus}` : ''})
                    </span>
                  );
                })()}
                {myMelds.length > 0 ? (
                  <div className="flex flex-wrap justify-center gap-0.5">
                    {myMelds.map((meld, mi) => (
                      <div key={mi} className="flex flex-wrap justify-center gap-0.5" title={meld.type}>
                        {renderMeldTiles(meld, true)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted text-xs">None</span>
                )}
              </div>
              <div className="flex flex-col items-center gap-0.5 shrink-0">
                {isEnded ? (
                  <span className="text-sm font-medium text-on-surface text-center">
                    {iWon ? 'Your winning hand' : 'Your hand'}
                  </span>
                ) : isMyTurn && game.turnState.tileDrawn ? (
                <p className="text-sm text-center inline-flex items-center gap-2">
                  {acting && <Spinner className="w-4 h-4" />}
                  {isTutorial && tutorialDiscardTile != null ? (
                    <span className="text-(--color-primary) font-medium">Tap the tile marked “Discard” below</span>
                  ) : (
                    <span className="text-muted">Choose a tile to discard</span>
                  )}
                </p>
                ) : (
                  <span className="text-sm font-medium text-muted text-center">Your hand</span>
                )}
              <span className="text-muted text-xs">Tiles ({myHand.length})</span>
              </div>
              <div className="flex flex-col items-end gap-1 min-w-0 flex-1" aria-label="Your discards">
                <span className="text-xs text-muted font-medium">
                  Discards ({(game.playerDiscards?.[currentUserId ?? ''] ?? []).length})
                </span>
                {(game.playerDiscards?.[currentUserId ?? ''] ?? []).length > 0 ? (
                  <div className="flex flex-wrap justify-center gap-0.5">
                    {(game.playerDiscards?.[currentUserId ?? ''] ?? []).map((t, i) => (
                      <TileView key={i} tile={t} className="h-10 w-7" />
                    ))}
                  </div>
                ) : (
                  <span className="text-muted text-xs">None</span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap justify-center items-end gap-1 min-h-14 overflow-visible">
              {myHand.map((t, i) => {
                const canDiscardThisTurn = !isEnded && isMyTurn && game.turnState.tileDrawn && canDiscard && concealedMode == null;
                const isTutorialSuggested =
                  isTutorial && canDiscard && tutorialDiscardTile != null &&
                  t._type === tutorialDiscardTile._type && t.value === tutorialDiscardTile.value;
                const isClickable = canDiscardThisTurn && (!isTutorial || isTutorialSuggested);
                const isConcealedSelectable = concealedMode != null && concealedSelectableIndices.has(i);
                const isConcealedSelected = concealedSelectedIndices.includes(i);
                const tileEl = isClickable ? (
                  <TileView
                    key={i}
                    tile={t}
                    asButton
                    onClick={() => onDiscardTile(t)}
                    disabled={acting}
                    selected={isTutorialSuggested}
                    className="h-14 w-10"
                    aria-label={isTutorialSuggested ? 'Discard this tile' : `Discard ${tileToLabel(t)}`}
                    title={isTutorialSuggested ? 'Discard this tile' : undefined}
                  />
                ) : isConcealedSelectable ? (
                  <TileView
                    key={i}
                    tile={t}
                    asButton
                    onClick={() => {
                      void selectConcealedTile(i);
                    }}
                    disabled={acting}
                    selected={isConcealedSelected}
                    className="h-14 w-10"
                    aria-label={`Select ${tileToLabel(t)} for concealed meld`}
                    title="Select tile for concealed meld"
                  />
                ) : (
                  <TileView key={i} tile={t} className="h-14 w-10" />
                );
                if (isTutorialSuggested) {
                  return (
                    <div key={i} className="flex flex-col items-center gap-1">
                      {tileEl}
                      <span className="text-xs font-semibold text-(--color-primary) px-2 py-0.5 rounded bg-(--color-primary)/15">
                        Discard
                      </span>
                    </div>
                  );
                }
                return tileEl;
              })}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

