import { useEffect, useMemo, useState } from 'react';
import type { Game as GameType, Lobby as LobbyType, LegalAction, PlayerMeld, Tile, WindTileValue } from '../../types';
import { TileView } from '../TileView';
import { TileLabelContext } from '../../contexts/TileLabelContext';
import { tileToLabel } from '../../lib/tileAssets';
import { Spinner } from '../Spinner';
import { meldDisplayTerm } from '../../terminology/rulesetTerminology';
import {
  opponentScreenSlots,
  playerWindMap,
} from '../../lib/tableLayout';
import { tileEquals } from '../../lib/chowClaim';
import { formatChowMeldShort, tileIdentity } from '../../lib/handOrderTokens';
import { isThirteenOrphansWin } from '../../lib/thirteenOrphans';
import type { ScoringResult } from '../../types';
import {
  GameTopCluster,
  isPreDealPhase,
  previousPlayerId,
  ScoreboardYouHudActionBar,
  ScoreboardYouIdentityBar,
  ScoreboardYouInflowStrips,
  windToDisplayName,
} from './layout/index.ts';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { ClaimPrompt } from './claim/ClaimPrompt';
import type { SelectedClaimGroup } from './claim/claimSelection';
import { EMPTY_DISCARDS, EMPTY_HAND, EMPTY_LEGAL, EMPTY_MELDS } from './gameBoardConstants';
import { GameEndSummary } from './GameEndSummary';
import { useClaimWindowCountdown } from '../../hooks/useClaimWindowCountdown';
import { HudActionButton } from './HudActionButton';

export interface GameBoardProps {
  game: GameType;
  lastScoringResult?: ScoringResult | null;
  currentUserId: string | null;
  currentUserDisplayName?: string | null;
  error: string | null;
  acting: boolean;
  waitingOnBot?: boolean;
  botStepCapMessage?: string | null;
  onNudgeBots?: () => void | Promise<void>;
  showNudgeBots?: boolean;
  onRollAndDeal: () => void;
  onDraw: () => void;
  onDiscardTile: (tile: Tile) => void;
  onMahjong: () => void;
  onClaimPong: () => void;
  onClaimKong: () => void;
  onClaimChow: (chowVariantId?: string) => void;
  onPassClaim: () => void;
  onConcealedPong?: (tiles: Tile[]) => void | Promise<void>;
  onConcealedChow?: (tiles: Tile[]) => void | Promise<void>;
  onConcealedKong?: (tile: Tile) => void | Promise<void>;
  onStartNewGame?: () => void;
  startingNewGame?: boolean;
  lobby?: LobbyType | null;
  onShowHandChange?: (showHand: boolean) => Promise<void>;
}

export function GameBoard({
  game,
  lastScoringResult,
  currentUserId,
  currentUserDisplayName,
  error,
  acting,
  waitingOnBot = false,
  botStepCapMessage = null,
  onNudgeBots,
  showNudgeBots = false,
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
  onStartNewGame,
  startingNewGame = false,
  lobby = null,
  onShowHandChange,
}: GameBoardProps) {
  const { claimSecondsLeft, claimWindowTotalSeconds } = useClaimWindowCountdown(game.claimWindowEndsAt);

  const isEnded = game.status === 'ended';

  const isMyTurn = game.currentPlayer === currentUserId;
  const myHand = useMemo((): Tile[] => {
    const h = game.playerHands?.[currentUserId ?? ''];
    return h ?? EMPTY_HAND;
  }, [game.playerHands, currentUserId]);
  const myMelds = useMemo((): PlayerMeld[] => {
    const m = game.playerMelds?.[currentUserId ?? ''];
    return m ?? EMPTY_MELDS;
  }, [game.playerMelds, currentUserId]);
  const myDiscards = useMemo((): Tile[] => {
    const d = game.playerDiscards?.[currentUserId ?? ''];
    return d ?? EMPTY_DISCARDS;
  }, [game.playerDiscards, currentUserId]);
  const init = game.initialization;
  const legalActionsRoot = game.private?.legalActions;
  const myLegal = useMemo((): LegalAction[] => {
    if (!legalActionsRoot) return EMPTY_LEGAL;
    return legalActionsRoot[currentUserId ?? ''] ?? EMPTY_LEGAL;
  }, [legalActionsRoot, currentUserId]);

  const chowClaimActions = useMemo(
    () => myLegal.filter((a): a is Extract<LegalAction, { kind: 'claimChow' }> => a.kind === 'claimChow'),
    [myLegal],
  );

  const canClaimPong = myLegal.some((a) => a.kind === 'claimPong');
  const canClaimKong = myLegal.some((a) => a.kind === 'claimKong');
  const canClaimChow = chowClaimActions.length > 0;
  const canDeclareMahjong = myLegal.some((a) => a.kind === 'declareMahjong');
  const tileDrawn = game.turnState.tileDrawn;
  const canDefineMelds = tileDrawn;
  const standardMeldsReady = myMelds.length === 4;
  const orphanMeldsReady = myMelds.length === 0 && isThirteenOrphansWin(myHand);
  const meldCallReady = standardMeldsReady || orphanMeldsReady;
  const declaredMeldsCount = myMelds.length;

  const [selectedDiscardIndex, setSelectedDiscardIndex] = useState<number | null>(null);
  const [handSorted, setHandSorted] = useState<boolean>(() => localStorage.getItem('mahjong-hand-sort') === '1');

  const sortedHandIndices = useMemo((): number[] => {
    const idx = myHand.map((_, i) => i);
    if (!handSorted) return idx;
    const typeWeight = (t: Tile): number => {
      if (t._type === 'character') return 0;
      if (t._type === 'dot') return 1;
      if (t._type === 'stick') return 2;
      if (t._type === 'wind') return 3;
      return 4; // dragon
    };
    const valueWeight = (t: Tile): number => {
      if (t._type === 'character' || t._type === 'dot' || t._type === 'stick') return t.value as number;
      if (t._type === 'wind') {
        const m: Record<string, number> = { east: 1, south: 2, west: 3, north: 4 };
        return m[String(t.value)] ?? 99;
      }
      if (t._type === 'dragon') {
        const m: Record<string, number> = { red: 1, green: 2, white: 3 };
        return m[String(t.value)] ?? 99;
      }
      return 99;
    };
    idx.sort((ai, bi) => {
      const a = myHand[ai]!;
      const b = myHand[bi]!;
      const tw = typeWeight(a) - typeWeight(b);
      if (tw !== 0) return tw;
      const vw = valueWeight(a) - valueWeight(b);
      if (vw !== 0) return vw;
      return ai - bi;
    });
    return idx;
  }, [handSorted, myHand]);

  const displayHand = useMemo(() => sortedHandIndices.map((i) => myHand[i]!).filter(Boolean), [sortedHandIndices, myHand]);

  const remainingMeldsNeeded = orphanMeldsReady ? 0 : Math.max(0, 4 - declaredMeldsCount);
  const canDraw = myLegal.some((a) => a.kind === 'draw');
  const canDiscard = myLegal.some((a) => a.kind === 'discard');
  const canPassClaim = myLegal.some((a) => a.kind === 'passClaim');
  const canConcealedPong = myLegal.some((a) => a.kind === 'declareConcealedPong');
  const canConcealedChow = myLegal.some((a) => a.kind === 'declareConcealedChow');
  const canConcealedKong = myLegal.some((a) => a.kind === 'declareConcealedKong');

  const showClaimButtons = canClaimPong || canClaimKong || canClaimChow;

  const mobileDrawCta =
    init.tilesDealt && !isEnded && canDraw && isMyTurn && !game.turnState.tileDrawn;

  const opponentIds = (game.playerIds ?? []).filter((id) => id !== currentUserId);
  const opponentSlotsResolved = useMemo(() => {
    const pids = game.playerIds ?? [];
    if (!currentUserId || pids.length !== 4) return null;
    return opponentScreenSlots(currentUserId, pids, game.startingPlayer);
  }, [currentUserId, game.playerIds, game.startingPlayer]);

  const windByPlayer = useMemo((): Record<string, WindTileValue> => {
    const pids = game.playerIds ?? [];
    if (pids.length !== 4) return {};
    return playerWindMap(pids, game.startingPlayer);
  }, [game.playerIds, game.startingPlayer]);

  const scoreboardHudLayout = Boolean(currentUserId && game.playerIds?.length === 4);
  const [showHandUpdating, setShowHandUpdating] = useState(false);
  const [showTileLabel, setShowTileLabel] = useState<boolean>(() => localStorage.getItem('mahjong-tile-labels') === '1');
  const [concealedMode, setConcealedMode] = useState<'pong' | 'chow' | 'kong' | null>(null);
  const [concealedSelectedIndices, setConcealedSelectedIndices] = useState<number[]>([]);
  const [selectedClaimGroup, setSelectedClaimGroup] = useState<SelectedClaimGroup | null>(null);
  const mobileDiscardCta =
    init.tilesDealt &&
    !isEnded &&
    isMyTurn &&
    game.turnState.tileDrawn &&
    canDiscard &&
    concealedMode == null &&
    selectedClaimGroup == null;
  const [winMeldModalOpen, setWinMeldModalOpen] = useState(false);

  const isMobileScreen = useMediaQuery('(max-width: 639px)');
  const [claimPromptDismissedUntil, setClaimPromptDismissedUntil] = useState<string | null>(null);

  useEffect(() => {
    if (!game.claimWindowEndsAt) {
      setClaimPromptDismissedUntil(null);
      return;
    }
    setClaimPromptDismissedUntil((prev) => (prev === game.claimWindowEndsAt ? prev : null));
  }, [game.claimWindowEndsAt]);

  useEffect(() => {
    const canSelectDiscard =
      !isEnded &&
      isMyTurn &&
      game.turnState.tileDrawn &&
      canDiscard &&
      concealedMode == null &&
      selectedClaimGroup == null;
    if (!canSelectDiscard) {
      if (selectedDiscardIndex != null) setSelectedDiscardIndex(null);
      return;
    }
    if (selectedDiscardIndex != null && !myHand[selectedDiscardIndex]) {
      setSelectedDiscardIndex(null);
    }
  }, [
    canDiscard,
    selectedClaimGroup,
    concealedMode,
    game.turnState.tileDrawn,
    isEnded,
    isMyTurn,
    myHand,
    selectedDiscardIndex,
  ]);

  const selectedDiscardTile = useMemo(() => {
    if (selectedDiscardIndex == null) return null;
    return myHand[selectedDiscardIndex] ?? null;
  }, [myHand, selectedDiscardIndex]);

  useEffect(() => {
    if (!showClaimButtons) setSelectedClaimGroup(null);
  }, [showClaimButtons]);

  const pongMeldPreview = useMemo((): Tile[] | null => {
    if (!canClaimPong || !game.lastDiscardedTile) return null;
    const discard = game.lastDiscardedTile;
    const matches = myHand.filter((t) => tileEquals(t, discard));
    if (matches.length < 2) return null;
    return [matches[0]!, matches[1]!, discard];
  }, [canClaimPong, game.lastDiscardedTile, myHand]);

  const kongMeldPreview = useMemo((): Tile[] | null => {
    if (!canClaimKong || !game.lastDiscardedTile) return null;
    const discard = game.lastDiscardedTile;
    const matches = myHand.filter((t) => tileEquals(t, discard));
    if (matches.length < 3) return null;
    return [matches[0]!, matches[1]!, matches[2]!, discard];
  }, [canClaimKong, game.lastDiscardedTile, myHand]);

  const claimSelectGroupCount = (canClaimPong ? 1 : 0) + (canClaimKong ? 1 : 0) + chowClaimActions.length;
  const useGroupSelectMode = claimSelectGroupCount > 1;
  const isNumericSuit = (tile: Tile) =>
    tile._type === 'dot' || tile._type === 'character' || tile._type === 'stick';

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

  const selectConcealedTile = (index: number) => {
    if (!concealedMode) return;
    if (concealedMode !== 'kong' && concealedSelectedIndices.includes(index)) {
      setConcealedSelectedIndices((prev) => prev.filter((i) => i !== index));
      return;
    }
    if (!concealedSelectableIndices.has(index)) return;
    if (concealedMode === 'kong') {
      const tile = myHand[index];
      if (!tile) return;
      void onConcealedKong(tile);
      resetConcealedSelection();
      return;
    }
    setConcealedSelectedIndices((prev) => {
      if (prev.includes(index)) return prev.filter((i) => i !== index);
      if (prev.length >= 3) return prev;
      return [...prev, index];
    });
  };

  const confirmConcealedAction = () => {
    const tiles = concealedSelectedIndices.map((i) => myHand[i]).filter((t): t is Tile => t != null);
    if (concealedMode === 'pong') {
      void onConcealedPong(tiles);
      resetConcealedSelection();
      return;
    }
    if (concealedMode === 'chow') {
      void onConcealedChow(tiles);
      resetConcealedSelection();
    }
  };

  const getPlayerLabel = (pid: string, fallbackIndex?: number) => {
    if (pid === currentUserId) {
      return currentUserDisplayName ?? 'You';
    }
    const name = game.playerDisplayNames?.[pid];
    if (name) return name;
    if (fallbackIndex !== undefined && opponentIds.includes(pid)) return `Opponent ${fallbackIndex + 1}`;
    return 'Player';
  };

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

  const placeGameOverOnTable =
    Boolean(isEnded && init.tilesDealt && opponentSlotsResolved != null);

  const isExhaustiveDraw = isEnded && !winnerId && game.endReason === 'exhaustive-draw';

  const concealedConfirmReady =
    concealedMode !== null && concealedMode !== 'kong' && concealedSelectedIndices.length >= 3;

  const prevTurnPlayerId = previousPlayerId(game);
  const youWerePreviousTurn = Boolean(currentUserId && prevTurnPlayerId === currentUserId);

  const claimPromptKey =
    init.tilesDealt && !isEnded && showClaimButtons
      ? (game.claimWindowEndsAt ?? (game.lastDiscardedTile ? tileIdentity(game.lastDiscardedTile) : 'open'))
      : null;
  const showClaimPrompt =
    claimPromptKey !== null &&
    (claimPromptDismissedUntil == null || claimPromptDismissedUntil !== claimPromptKey);

  const dismissClaimPrompt = () => {
    setClaimPromptDismissedUntil(claimPromptKey);
  };

  const canRestoreClaimPrompt = claimPromptKey !== null && !showClaimPrompt;

  const actionRailBaseClass =
    'flex w-full flex-col items-stretch gap-2 [&_button]:w-full [&_button]:justify-center';

  const actionRailClassName = [
    actionRailBaseClass,
    init.tilesDealt && 'border-t border-border/40 pt-3',
    init.tilesDealt ? 'max-sm:hidden' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const showActionRail = (!init.tilesDealt && !isEnded) || (init.tilesDealt && !isEnded && canDeclareMahjong);

  return (
    <TileLabelContext.Provider value={showTileLabel}>
      <div className="flex min-h-0 flex-1 flex-col gap-(--game-hud-v-gap)">
        <div
          className="mx-auto flex w-full max-w-4xl flex-1 min-h-0 flex-col gap-(--game-hud-v-gap) overflow-y-auto overscroll-y-contain px-(--game-hud-v-pad) pt-(--game-hud-v-pad) pb-1 sm:pb-2 lg:max-w-6xl xl:max-w-none xl:px-8"
          aria-label="Table"
        >
          {error && (
            <div
              className="panel motion-safe:animate-[notice-enter_220ms_ease-out_both] motion-reduce:animate-none rounded-xl px-4 py-3 text-danger text-sm"
              role="alert"
            >
              {error}
            </div>
          )}

          {botStepCapMessage && !isEnded && (
            <div
              className="panel motion-safe:animate-[notice-enter_220ms_ease-out_both] motion-reduce:animate-none rounded-xl border border-(--color-primary)/30 bg-surface-panel px-4 py-3 text-sm"
              role="status"
              aria-live="polite"
            >
              <p className="text-muted text-xs m-0">{botStepCapMessage}</p>
            </div>
          )}

        {isEnded && !placeGameOverOnTable && (
          <section
            aria-label="Game over"
            className="panel flex flex-col gap-4 rounded-xl border-2 border-(--color-primary) bg-surface-panel p-6 text-center"
          >
            <GameEndSummary
              isExhaustiveDraw={isExhaustiveDraw}
              iWon={iWon}
              winnerLabel={winnerLabel}
              lastScoringResult={lastScoringResult}
              gamePoints={game.points}
              gameBreakdown={game.breakdown}
              currentUserId={currentUserId}
              playerIds={game.playerIds}
              playerShowHand={game.playerShowHand}
              gameScores={game.scores}
              lobbyWins={lobby?.wins}
              winnerId={winnerId}
              getPlayerLabel={getPlayerLabel}
              opponentIds={opponentIds}
              showHandUpdating={showHandUpdating}
              onShowHandChange={onShowHandChange}
              setShowHandUpdating={setShowHandUpdating}
              onStartNewGame={onStartNewGame}
              startingNewGame={startingNewGame}
            />
          </section>
        )}

        {scoreboardHudLayout ? (
          <GameTopCluster
            game={game}
            currentUserId={currentUserId!}
            windByPlayer={windByPlayer}
            previousTurnPlayerId={prevTurnPlayerId}
            isEnded={isEnded}
            getPlayerLabel={(pid: string) => getPlayerLabel(pid, opponentIds.indexOf(pid))}
          />
        ) : null}
      </div>

      <div
        className={[
          'game-hud-dock w-full shrink-0 px-2 sm:px-4 lg:px-6',
          showClaimPrompt && isMobileScreen
            ? 'pb-[max(9rem,env(safe-area-inset-bottom))]'
            : 'pb-[max(0.75rem,env(safe-area-inset-bottom))]',
          'sm:pb-[max(1rem,env(safe-area-inset-bottom))]',
        ].join(' ')}
      >
        <div
          className={[
            'mx-auto flex min-h-0 w-full min-w-0 max-w-4xl max-h-[min(75dvh,52rem)] flex-col overflow-y-auto overflow-x-hidden rounded-2xl border border-border bg-surface p-(--game-hud-v-pad) shadow-sm max-[520px]:p-3 sm:gap-3 lg:max-w-6xl xl:max-w-none',
            !isEnded && isMyTurn ? 'hud-panel-your-turn' : '',
            !isEnded && youWerePreviousTurn && !isMyTurn ? 'hud-panel-prev-turn' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
        {scoreboardHudLayout && currentUserId ? (
          <ScoreboardYouIdentityBar
            displayName={currentUserDisplayName ?? 'You'}
            windLabel={
              windByPlayer[currentUserId] ? windToDisplayName(windByPlayer[currentUserId]) : undefined
            }
            wind={windByPlayer[currentUserId]}
            showDealerBadge={isPreDealPhase(game) && game.startingPlayer === currentUserId}
            inlineStatus={
              !isEnded && isMyTurn && game.turnState.tileDrawn
                ? (selectedDiscardIndex != null ? 'Tap Discard' : 'Pick a tile')
                : !isEnded && isMyTurn && !game.turnState.tileDrawn && canDraw
                  ? 'Tap Draw'
                  : null
            }
            acting={acting}
            waitingOnBot={waitingOnBot}
            isMyTurn={isMyTurn}
            isEnded={isEnded}
          />
        ) : null}
        {canRestoreClaimPrompt ? (
          <div className="flex w-full items-center justify-center pt-2">
            <HudActionButton
              variant="secondary"
              onClick={() => setClaimPromptDismissedUntil(null)}
              aria-label="Show claim options"
              title="Show claim options"
            >
              Show claim options
            </HudActionButton>
          </div>
        ) : null}
        {init.tilesDealt && !isEnded && canDeclareMahjong && isMyTurn && (
          <p className="text-center text-sm md:text-base lg:text-lg font-semibold text-on-surface" role="status">
            {meldCallReady || !canDefineMelds
              ? 'You can win!'
              : `You can win, but declare your melds first (${declaredMeldsCount}/4)`}
          </p>
        )}
        <div
          className="flex w-full min-w-0 flex-col gap-(--game-hud-v-gap) overflow-x-hidden"
        >
          <div className="flex min-w-0 flex-1 flex-col">
        {init.tilesDealt && (myHand.length > 0 || myMelds.length > 0) && (
          <section
            aria-label={isEnded ? 'Your winning hand' : 'Your hand'}
            className="flex min-w-0 flex-col gap-2 overflow-x-hidden sm:gap-0"
          >
            <div
              className={`flex min-h-14 max-sm:order-5 min-w-0 flex-col items-center justify-center gap-1 overflow-x-hidden overflow-y-visible pt-1.5 pb-1 sm:gap-1.5 sm:pt-3 sm:pb-2 lg:gap-2 lg:rounded-xl lg:border lg:border-border/30 lg:bg-surface-panel-muted/25 lg:px-4 lg:pt-5 lg:pb-5 xl:gap-2.5 xl:px-6 xl:pt-7 xl:pb-6 ${
                'border-0 bg-transparent p-0 lg:border-0 lg:bg-transparent lg:p-0 xl:p-0'
              }`}
              style={{ width: '100%' }}
              id="panel-hand"
              role="tabpanel"
              aria-label="Your tiles"
            >
              <div className="flex w-full items-center justify-between gap-2 text-xs font-black text-muted">
                <button
                  type="button"
                  onClick={() => {
                    setShowTileLabel((cur) => {
                      const next = !cur;
                      localStorage.setItem('mahjong-tile-labels', next ? '1' : '0');
                      return next;
                    });
                  }}
                  className="inline-flex min-h-0 min-w-0 items-center justify-center rounded-md border border-border bg-surface-panel px-2 py-1 text-xs font-black text-muted hover:bg-surface-panel-muted/40"
                  aria-label={showTileLabel ? 'Hide tile labels' : 'Show tile labels'}
                  aria-pressed={showTileLabel}
                  title={showTileLabel ? 'Hide labels' : 'Show labels'}
                >
                  {showTileLabel ? 'Labels: On' : 'Labels: Off'}
                </button>
                <span className="min-w-0 flex-1 text-center">Hand ({myHand.length})</span>
                <button
                  type="button"
                  onClick={() => {
                    setHandSorted((cur) => {
                      const next = !cur;
                      localStorage.setItem('mahjong-hand-sort', next ? '1' : '0');
                      return next;
                    });
                  }}
                  className="inline-flex min-h-0 min-w-0 items-center justify-center rounded-md border border-border bg-surface-panel px-2 py-1 text-xs font-black text-muted hover:bg-surface-panel-muted/40"
                  aria-label={handSorted ? 'Show hand in original order' : 'Sort hand'}
                  aria-pressed={handSorted}
                  title={handSorted ? 'Unsort hand' : 'Sort hand'}
                >
                  {handSorted ? 'Unsort' : 'Sort'}
                </button>
              </div>
              <div className="flex w-full min-w-0 max-w-full justify-center overflow-x-auto overflow-y-visible">
                <ul
                  className="flex w-max min-w-0 max-w-full flex-wrap content-center justify-center gap-1.5 sm:gap-2"
                  role="list"
                  aria-label={`Hand tiles, ${myHand.length} total`}
                >
                  {displayHand.map((t, displayIndex) => {
                    const i = sortedHandIndices[displayIndex] ?? displayIndex;
                    const canDiscardThisTurn =
                      !isEnded &&
                      isMyTurn &&
                      game.turnState.tileDrawn &&
                      canDiscard &&
                      concealedMode == null &&
                      selectedClaimGroup == null;
                    const canSelectDiscard = canDiscardThisTurn;
                    const isConcealedSelected = concealedSelectedIndices.includes(i);
                    const isConcealedSelectable = concealedMode != null && concealedSelectableIndices.has(i);
                    const isConcealedInPlay =
                      concealedMode != null && (isConcealedSelectable || isConcealedSelected);
                    const isDiscardSelected = canSelectDiscard && selectedDiscardIndex === i;
                    const tileEl = canSelectDiscard ? (
                      <TileView
                        tile={t}
                        asButton
                        onClick={() => {
                          setSelectedDiscardIndex((cur) => (cur === i ? null : i));
                        }}
                        disabled={acting}
                        selected={isDiscardSelected}
                        selectedTone="danger"
                        className="tile-hand"
                        aria-label={`Select ${tileToLabel(t)} to discard`}
                        title="Select tile to discard"
                      />
                    ) : isConcealedInPlay ? (
                      <TileView
                        tile={t}
                        asButton
                        onClick={() => selectConcealedTile(i)}
                        disabled={acting}
                        selected={isConcealedSelected}
                        selectedTone={isConcealedSelected ? 'primary' : 'default'}
                        className="tile-hand"
                        aria-label={
                          isConcealedSelected
                            ? `${tileToLabel(t)} selected for meld — press again to deselect`
                            : `Select ${tileToLabel(t)} for meld`
                        }
                        title={isConcealedSelected ? 'Press again to deselect' : 'Select tile for meld'}
                      />
                    ) : (
                      <TileView tile={t} className="tile-hand" />
                    );
                    const dimmedTileEl =
                      concealedMode !== null && !isConcealedInPlay ? (
                        <div className="opacity-35 pointer-events-none select-none" aria-hidden>
                          {tileEl}
                        </div>
                      ) : tileEl;
                    return (
                      <li
                        key={`${tileIdentity(t)}-${i}`}
                        className="list-none inline-flex shrink-0 flex-col items-center select-none relative"
                      >
                        <span className="inline-flex flex-col items-center">
                          {dimmedTileEl}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
              {scoreboardHudLayout && init.tilesDealt ? (
                <ScoreboardYouInflowStrips myDiscards={myDiscards} myMelds={myMelds} />
              ) : null}
            </div>
          </section>
        )}
          </div>
        {showActionRail ? (
        <div className={actionRailClassName}>
          {!init.tilesDealt && !isEnded && (
            <HudActionButton
              variant="primary"
              onClick={onRollAndDeal}
              disabled={acting}
              loading={acting}
              loadingContent={<Spinner className="w-4 h-4" aria-hidden />}
              aria-label={acting ? 'Rolling and dealing' : 'Roll and deal tiles'}
            >
              Roll & deal
            </HudActionButton>
          )}
          {init.tilesDealt && !isEnded && canDeclareMahjong && (
            meldCallReady || !canDefineMelds ? (
              <HudActionButton
                variant="primary"
                onClick={onMahjong}
                disabled={acting}
                loading={acting}
                loadingContent={<Spinner className="w-4 h-4" aria-hidden />}
                className="btn-claim-mahjong"
                aria-label={acting ? 'Declaring Mahjong' : 'Declare Mahjong'}
              >
                Mahjong
              </HudActionButton>
            ) : (
              <HudActionButton
                variant="primary"
                onClick={() => setWinMeldModalOpen(true)}
                disabled={acting}
                loading={acting}
                loadingContent={<Spinner className="w-4 h-4" aria-hidden />}
                className="btn-claim-mahjong"
                aria-label={acting ? 'Opening meld declaration' : 'Define melds before Mahjong'}
                title={`Declare ${remainingMeldsNeeded} more meld(s)`}
              >
                Define melds to win
              </HudActionButton>
            )
          )}
        </div>
        ) : null}
        </div>
        {scoreboardHudLayout && init.tilesDealt && currentUserId ? (
          <ScoreboardYouHudActionBar
            acting={acting}
            mobileDrawCta={mobileDrawCta}
            mobileDiscardCta={mobileDiscardCta}
            onDraw={onDraw}
            selectedDiscardTile={selectedDiscardTile}
            onDiscardSelected={() => {
              if (selectedDiscardTile != null) {
                onDiscardTile(selectedDiscardTile);
              }
              setSelectedDiscardIndex(null);
            }}
            showNudgeBots={showNudgeBots}
            onNudgeBots={onNudgeBots ?? null}
            canConcealedChow={init.tilesDealt && !isEnded && canConcealedChow}
            concealedChowActive={concealedMode === 'chow'}
            concealedChowClaimReady={concealedMode === 'chow' && concealedConfirmReady}
            onToggleConcealedChow={() => {
              if (concealedMode === 'chow') {
                resetConcealedSelection();
                return;
              }
              setSelectedClaimGroup(null);
              setConcealedMode('chow');
              setConcealedSelectedIndices([]);
            }}
            onClaimChow={confirmConcealedAction}
            canConcealedPong={init.tilesDealt && !isEnded && canConcealedPong}
            concealedPongActive={concealedMode === 'pong'}
            concealedPongClaimReady={concealedMode === 'pong' && concealedConfirmReady}
            onToggleConcealedPong={() => {
              if (concealedMode === 'pong') {
                resetConcealedSelection();
                return;
              }
              setSelectedClaimGroup(null);
              setConcealedMode('pong');
              setConcealedSelectedIndices([]);
            }}
            onClaimPong={confirmConcealedAction}
            canConcealedKong={init.tilesDealt && !isEnded && canConcealedKong}
            concealedKongActive={concealedMode === 'kong'}
            kongButtonLabel={meldDisplayTerm(game.ruleSetId, 'fullSet')}
            onToggleConcealedKong={() => {
              if (concealedMode === 'kong') {
                resetConcealedSelection();
                return;
              }
              setSelectedClaimGroup(null);
              setConcealedMode('kong');
              setConcealedSelectedIndices([]);
            }}
          />
        ) : null}
        </div>
      </div>

      {winMeldModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="win-meld-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setWinMeldModalOpen(false);
          }}
        >
          <div
            className="bg-surface-panel border border-border rounded-xl shadow-xl max-h-[90vh] w-full max-w-lg flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 p-3 border-b border-border shrink-0">
              <h2 id="win-meld-modal-title" className="text-lg font-semibold text-on-surface">
                Define winning melds
              </h2>
              <button
                type="button"
                onClick={() => setWinMeldModalOpen(false)}
                className="p-2 rounded-lg text-muted hover:text-on-surface hover:bg-(--btn-nav-hover) transition-colors"
                aria-label="Close"
                title="Close"
              >
                Close
              </button>
            </div>

            <div className="p-4 overflow-auto flex-1 flex flex-col gap-4">
              <section aria-label="Melds progress">
                <p className="text-sm text-muted">
                  Declared melds: <span className="text-on-surface font-semibold">{declaredMeldsCount}</span>/4
                  {orphanMeldsReady
                    ? ' (Thirteen Orphans mode)'
                    : remainingMeldsNeeded > 0
                      ? `, remaining: ${remainingMeldsNeeded}`
                      : ''}
                </p>
              </section>

              <section aria-label="Declare melds">
                {(() => {
                  type ConcealedDeclareAction = Extract<
                    LegalAction,
                    {
                      kind: 'declareConcealedPong' | 'declareConcealedChow' | 'declareConcealedKong';
                    }
                  >;

                  const candidateActions = myLegal.filter(
                    (a): a is ConcealedDeclareAction =>
                      a.kind === 'declareConcealedPong' || a.kind === 'declareConcealedChow' || a.kind === 'declareConcealedKong',
                  );

                  if (candidateActions.length === 0) {
                    return (
                      <p className="text-xs text-muted">
                        No meld declarations are available right now. If the server still allows Mahjong, you can call it anyway.
                      </p>
                    );
                  }

                  return (
                    <div className="flex flex-wrap gap-2">
                      {candidateActions.map((a) => {
                        switch (a.kind) {
                          case 'declareConcealedPong': {
                            const label = tileToLabel(a.tiles[0]!);
                            return (
                              <button
                                key={`pong-${label}`}
                                type="button"
                                onClick={() => void onConcealedPong(a.tiles)}
                                disabled={acting}
                                className="btn-secondary border-(--color-claim-pong) text-(--color-claim-pong) hover:bg-(--color-claim-pong)/10 inline-flex items-center justify-center gap-2"
                                aria-label={acting ? `Declaring pong for ${label}` : `Declare pong for ${label}`}
                                title={`Pong ${label}`}
                              >
                                {acting && <Spinner className="w-4 h-4" />}
                                Pong {label}
                              </button>
                            );
                          }
                          case 'declareConcealedKong': {
                            const label = tileToLabel(a.tile);
                            return (
                              <button
                                key={`kong-${label}`}
                                type="button"
                                onClick={() => void onConcealedKong(a.tile)}
                                disabled={acting}
                                className="btn-secondary border-(--color-claim-kong) text-(--color-claim-kong) hover:bg-(--color-claim-kong)/10 inline-flex items-center justify-center gap-2"
                                aria-label={
                                  acting
                                    ? `Declaring ${meldDisplayTerm(game.ruleSetId, 'fullSet')} for ${label}`
                                    : `Declare ${meldDisplayTerm(game.ruleSetId, 'fullSet')} for ${label}`
                                }
                                title={`${meldDisplayTerm(game.ruleSetId, 'fullSet')} ${label}`}
                              >
                                {acting && <Spinner className="w-4 h-4" />}
                                {meldDisplayTerm(game.ruleSetId, 'fullSet')} {label}
                              </button>
                            );
                          }
                          case 'declareConcealedChow': {
                            const label = formatChowMeldShort(a.tiles);
                            return (
                              <button
                                key={`chow-${label}`}
                                type="button"
                                onClick={() => void onConcealedChow(a.tiles)}
                                disabled={acting}
                                className="btn-secondary border-(--color-claim-chow) text-(--color-claim-chow) hover:bg-(--color-claim-chow)/10 inline-flex items-center justify-center gap-2"
                                aria-label={acting ? `Declaring chow ${label}` : `Declare chow ${label}`}
                                title={`Chow ${label}`}
                              >
                                {acting && <Spinner className="w-4 h-4" />}
                                Chow {label}
                              </button>
                            );
                          }
                          default:
                            return null;
                        }
                      })}
                    </div>
                  );
                })()}
              </section>

              <section aria-label="Mahjong call">
                <button
                  type="button"
                  onClick={() => {
                    if (!meldCallReady) return;
                    setWinMeldModalOpen(false);
                    onMahjong();
                  }}
                  disabled={acting || !meldCallReady}
                  className="btn-primary inline-flex items-center justify-center gap-2 w-full"
                  aria-label={acting ? 'Declaring Mahjong' : 'Mahjong now'}
                  title={meldCallReady ? 'Call Mahjong' : 'Declare required melds first'}
                >
                  {acting && <Spinner className="w-4 h-4" />}
                  Mahjong now
                </button>

                {canDeclareMahjong &&
                  canDefineMelds &&
                  !meldCallReady &&
                  myLegal.filter(
                    (a) =>
                      a.kind === 'declareConcealedPong' || a.kind === 'declareConcealedChow' || a.kind === 'declareConcealedKong',
                  ).length === 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setWinMeldModalOpen(false);
                        onMahjong();
                      }}
                      disabled={acting}
                      className="btn-secondary inline-flex items-center justify-center gap-2 w-full mt-2"
                      aria-label={acting ? 'Calling Mahjong' : 'Call Mahjong anyway'}
                      title="Call Mahjong anyway"
                    >
                      Call Mahjong anyway
                    </button>
                  )}
              </section>
            </div>
          </div>
        </div>
      )}

      {showClaimPrompt ? (
        <ClaimPrompt
          layout={isMobileScreen ? 'sheet' : 'modal'}
          headline={
            game.lastDiscardedTile
              ? `${tileToLabel(game.lastDiscardedTile)} discarded — claim?`
              : 'Claim available'
          }
          claimSecondsLeft={claimSecondsLeft}
          claimWindowTotalSeconds={claimWindowTotalSeconds}
          onDismiss={dismissClaimPrompt}
          acting={acting}
          useGroupSelectMode={useGroupSelectMode}
          selectedClaimGroup={selectedClaimGroup}
          setSelectedClaimGroup={setSelectedClaimGroup}
          canClaimPong={canClaimPong}
          pongMeldPreview={pongMeldPreview}
          canClaimKong={canClaimKong}
          kongMeldPreview={kongMeldPreview}
          kongSetLabel={meldDisplayTerm(game.ruleSetId, 'fullSet')}
          canClaimChow={canClaimChow}
          chowClaimActions={chowClaimActions}
          lastDiscardedTile={game.lastDiscardedTile}
          onClaimPong={onClaimPong}
          onClaimKong={onClaimKong}
          onClaimChow={onClaimChow}
          canPassClaim={canPassClaim}
          onPassClaim={onPassClaim}
        />
      ) : null}
    </div>
    </TileLabelContext.Provider>
  );
}

