import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { Link } from 'react-router-dom';
import type { Game as GameType, LegalAction, PlayerMeld, Tile, WindTileValue } from '../../types';
import type { TutorialStep } from '../../tutorial/tutorialSteps';
import {
  DndContext,
  PointerSensor,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TileBackView, TileView } from '../TileView';
import { tileToLabel } from '../../lib/tileAssets';
import { Spinner } from '../Spinner';
import { meldDisplayTerm } from '../../terminology/rulesetTerminology';
import {
  computeWallCutIndex,
  opponentScreenSlots,
  playerWindMap,
  tutorialAnchorForOpponentWind,
} from '../../lib/tableLayout';
import { MAX_PREVIEW_TILES, partitionMeldsForPreview } from '../../lib/meldPreview';
import { resolveChowVariantId, tileEquals } from '../../lib/chowClaim';

import type { ScoringResult } from '../../types';
import { WallTable } from './WallTable';
import { MobileWallSection } from './MobileWallSection';
import { AnimateExpand } from './AnimateExpand';
import { OpponentSeatCard } from './OpponentSeatCard';
import { OpponentCompactRow } from './OpponentCompactRow';
import { AllTilesButton, TilePopover } from './ExpandableTileOverlay';
import { Icon } from '../Icon';
import { icons } from '../../icons';

function formatChowMeldShort(meld: Tile[]): string {
  return meld.map((t) => tileToLabel(t)).join('–');
}

function tileIdentity(t: Tile): string {
  return `${t._type}:${String(t.value)}`;
}

function tokenBase(token: string): string {
  const idx = token.lastIndexOf('#');
  return idx >= 0 ? token.slice(0, idx) : token;
}

function makeHandTokens(hand: Tile[]): string[] {
  const counts: Record<string, number> = {};
  return hand.map((t) => {
    const base = tileIdentity(t);
    const next = (counts[base] ?? 0) + 1;
    counts[base] = next;
    return `${base}#${next}`;
  });
}

function resolveOrderToIndices(hand: Tile[], order: string[]): number[] {
  const byBase: Record<string, number[]> = {};
  for (let i = 0; i < hand.length; i++) {
    const base = tileIdentity(hand[i]!);
    (byBase[base] ??= []).push(i);
  }

  const out: number[] = [];
  const used = new Set<number>();
  for (const tok of order) {
    const base = tokenBase(tok);
    const list = byBase[base];
    if (!list || list.length === 0) continue;
    const idx = list.shift()!;
    if (used.has(idx)) continue;
    used.add(idx);
    out.push(idx);
  }

  for (let i = 0; i < hand.length; i++) {
    if (!used.has(i)) out.push(i);
  }
  return out;
}

function reconcileOrder(prevOrder: string[], nextHand: Tile[]): string[] {
  const nextTokens = makeHandTokens(nextHand);
  const remainingByBase: Record<string, number> = {};
  for (const tok of nextTokens) {
    const base = tokenBase(tok);
    remainingByBase[base] = (remainingByBase[base] ?? 0) + 1;
  }

  const kept: string[] = [];
  for (const tok of prevOrder) {
    const base = tokenBase(tok);
    const n = remainingByBase[base] ?? 0;
    if (n <= 0) continue;
    remainingByBase[base] = n - 1;
    kept.push(tok);
  }

  const added: string[] = [];
  const takenByBase: Record<string, number> = {};
  for (const tok of kept) {
    const base = tokenBase(tok);
    takenByBase[base] = (takenByBase[base] ?? 0) + 1;
  }
  const seen: Record<string, number> = {};
  for (const tok of nextTokens) {
    const base = tokenBase(tok);
    seen[base] = (seen[base] ?? 0) + 1;
    if ((seen[base] ?? 0) <= (takenByBase[base] ?? 0)) continue;
    added.push(tok);
  }

  return [...kept, ...added];
}

function tileSortKey(t: Tile): string {
  const suitOrder: Record<Tile['_type'], number> = {
    character: 0,
    dot: 1,
    stick: 2,
    wind: 3,
    dragon: 4,
  };
  const windOrder: Record<string, number> = { east: 0, south: 1, west: 2, north: 3 };
  const dragonOrder: Record<string, number> = { red: 0, green: 1, white: 2 };

  const suit = suitOrder[t._type];
  const v =
    t._type === 'wind'
      ? windOrder[String(t.value)] ?? 99
      : t._type === 'dragon'
        ? dragonOrder[String(t.value)] ?? 99
        : (t.value as number);

  return `${String(suit).padStart(2, '0')}-${String(v).padStart(2, '0')}`;
}

function SortableHandTile({
  id,
  disabled,
  children,
}: {
  id: string;
  disabled: boolean;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: 'manipulation',
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'opacity-80' : undefined}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}

function tileKeyForOrphans(t: Tile): string {
  return `${t._type}:${String(t.value)}`;
}

const THIRTEEN_ORPHANS_KEYS = new Set<string>([
  'character:1',
  'character:9',
  'dot:1',
  'dot:9',
  'stick:1',
  'stick:9',
  'wind:east',
  'wind:south',
  'wind:west',
  'wind:north',
  'dragon:red',
  'dragon:green',
  'dragon:white',
]);

function isThirteenOrphansWin(hand: Tile[]): boolean {
  // Ma-Jiang rule: 14 tiles, exactly these 13 kinds, with exactly one kind duplicated as the pair.
  if (hand.length !== 14) return false;
  const counts: Record<string, number> = {};
  for (const t of hand) {
    const k = tileKeyForOrphans(t);
    counts[k] = (counts[k] ?? 0) + 1;
  }
  const keys = Object.keys(counts);
  if (keys.length !== 13) return false;

  let pairs = 0;
  for (const k of keys) {
    if (!THIRTEEN_ORPHANS_KEYS.has(k)) return false;
    const n = counts[k]!;
    if (n !== 1 && n !== 2) return false;
    if (n === 2) pairs++;
  }
  return pairs === 1;
}

export interface GameBoardProps {
  game: GameType;
  /** When game ended after declaring Mahjong, the scoring result from the PUT response. */
  lastScoringResult?: ScoringResult | null;
  currentUserId: string | null;
  currentUserDisplayName?: string | null;
  error: string | null;
  acting: boolean;
  /** True while the server may be stepping AI seats (or it is an AI seat's turn in live state). */
  waitingOnBot?: boolean;
  /** Shown when the last mutation hit the per-request AI step cap. */
  botStepCapMessage?: string | null;
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
  waitingOnBot = false,
  botStepCapMessage = null,
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
  const myDiscards = game.playerDiscards?.[currentUserId ?? ''] ?? [];
  const myMeldPreviewSplit = useMemo(
    () => partitionMeldsForPreview(myMelds, MAX_PREVIEW_TILES),
    [myMelds],
  );
  const myDiscardPreviewTiles = useMemo(
    () => myDiscards.slice(-MAX_PREVIEW_TILES),
    [myDiscards],
  );
  const init = game.initialization;
  const potentialActions = game.private?.potentialActions?.[currentUserId ?? ''] ?? [];
  const isTutorial = mode === 'tutorial' && tutorialAllowedActions != null;
  const legalActionsRoot = game.private?.legalActions;
  const useStructuredLegal = !isTutorial && legalActionsRoot != null;
  const myLegal: LegalAction[] = useStructuredLegal
    ? (legalActionsRoot[currentUserId ?? ''] ?? [])
    : [];

  const chowClaimActions = useStructuredLegal
    ? myLegal.filter((a): a is Extract<LegalAction, { kind: 'claimChow' }> => a.kind === 'claimChow')
    : [];

  const canClaimPong = isTutorial
    ? Boolean(tutorialAllowedActions.canClaimPong)
    : useStructuredLegal
      ? myLegal.some((a) => a.kind === 'claimPong')
      : potentialActions.includes('pong');
  const canClaimKong = isTutorial
    ? Boolean(tutorialAllowedActions.canClaimKong)
    : useStructuredLegal
      ? myLegal.some((a) => a.kind === 'claimKong')
      : potentialActions.includes('kong');
  const canClaimChow = isTutorial
    ? Boolean(tutorialAllowedActions.canClaimChow)
    : useStructuredLegal
      ? chowClaimActions.length > 0
      : potentialActions.includes('chow');
  const canDeclareMahjong = isTutorial
    ? Boolean(tutorialAllowedActions.canDeclareMahjong)
    : useStructuredLegal
      ? myLegal.some((a) => a.kind === 'declareMahjong')
      : potentialActions.includes('mahjong');
  const tileDrawn = game.turnState.tileDrawn;
  const canDefineMelds = tileDrawn && !isTutorial;
  const standardMeldsReady = myMelds.length === 4;
  const orphanMeldsReady = myMelds.length === 0 && isThirteenOrphansWin(myHand);
  const meldCallReady = standardMeldsReady || orphanMeldsReady;
  const declaredMeldsCount = myMelds.length;

  const [lastDrawnTile, setLastDrawnTile] = useState<{ pid: string; identity: string; turn: number } | null>(null);
  const prevHandsRef = useRef<Record<string, Tile[]>>({});
  const [selectedDiscardIndex, setSelectedDiscardIndex] = useState<number | null>(null);

  useEffect(() => {
    const hands = game.playerHands ?? {};
    const pid = currentUserId ?? '';
    if (!pid) {
      prevHandsRef.current = hands;
      setLastDrawnTile(null);
      return;
    }

    const prev = prevHandsRef.current[pid] ?? [];
    const next = hands[pid] ?? [];
    const sameTurn = lastDrawnTile?.pid === pid && lastDrawnTile.turn === game.turnState.turn_number;

    if (!game.turnState.tileDrawn) {
      if (lastDrawnTile != null) setLastDrawnTile(null);
    } else if (!sameTurn && next.length === prev.length + 1) {
      const prevCounts: Record<string, number> = {};
      for (const t of prev) {
        const k = tileIdentity(t);
        prevCounts[k] = (prevCounts[k] ?? 0) + 1;
      }
      const nextCounts: Record<string, number> = {};
      for (const t of next) {
        const k = tileIdentity(t);
        nextCounts[k] = (nextCounts[k] ?? 0) + 1;
      }

      let drawnIdentity: string | null = null;
      for (const k of Object.keys(nextCounts)) {
        if ((nextCounts[k] ?? 0) > (prevCounts[k] ?? 0)) {
          drawnIdentity = k;
          break;
        }
      }
      if (drawnIdentity) {
        setLastDrawnTile({ pid, identity: drawnIdentity, turn: game.turnState.turn_number });
      }
    }

    prevHandsRef.current = hands;
  }, [game.playerHands, game.turnState.tileDrawn, game.turnState.turn_number, currentUserId, lastDrawnTile]);

  const remainingMeldsNeeded = orphanMeldsReady ? 0 : Math.max(0, 4 - declaredMeldsCount);
  const canRollAndDeal = isTutorial ? Boolean(tutorialAllowedActions.canRollAndDeal) : true;
  const canDraw = isTutorial
    ? Boolean(tutorialAllowedActions.canDraw)
    : useStructuredLegal
      ? myLegal.some((a) => a.kind === 'draw')
      : true;
  const canDiscard = isTutorial
    ? Boolean(tutorialAllowedActions.canDiscard)
    : useStructuredLegal
      ? myLegal.some((a) => a.kind === 'discard')
      : true;
  const canPassClaim = isTutorial
    ? Boolean(tutorialAllowedActions.canPassClaim)
    : useStructuredLegal
      ? myLegal.some((a) => a.kind === 'passClaim')
      : true;
  const canConcealedPong = useStructuredLegal
    ? myLegal.some((a) => a.kind === 'declareConcealedPong')
    : potentialActions.includes('concealedPong');
  const canConcealedChow = useStructuredLegal
    ? myLegal.some((a) => a.kind === 'declareConcealedChow')
    : potentialActions.includes('concealedChow');
  const canConcealedKong = useStructuredLegal
    ? myLegal.some((a) => a.kind === 'declareConcealedKong')
    : potentialActions.includes('concealedKong');

  const showClaimButtons = canClaimPong || canClaimKong || canClaimChow;
  const useChowTilePickFlow = useStructuredLegal && chowClaimActions.length > 0;
  const chowUiSlots = isTutorial
    ? (tutorialAllowedActions?.canClaimChow ? 1 : 0)
    : useChowTilePickFlow
      ? 1
      : potentialActions.includes('chow')
        ? 1
        : 0;
  const claimGroupCount =
    (canClaimPong ? 1 : 0) + (canClaimKong ? 1 : 0) + chowUiSlots + (canPassClaim ? 1 : 0);
  const showClaimDivider = showClaimButtons && claimGroupCount >= 2;

  const opponentIds = (game.playerIds ?? []).filter((id) => id !== currentUserId);
  const playerIdsFull = game.playerIds ?? [];

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

  const wallCutIndex = useMemo(() => {
    const pids = game.playerIds ?? [];
    const dice = game.wallDiceTotal ?? 7;
    const total = game.wallTotalTiles ?? 136;
    return computeWallCutIndex(dice, game.startingPlayer, pids, total);
  }, [game.wallDiceTotal, game.wallTotalTiles, game.startingPlayer, game.playerIds]);

  const wallTableInput = useMemo(
    () => ({
      tilesLeft: game.tilesLeft,
      diceTotal: game.wallDiceTotal ?? 7,
      cutIndex: wallCutIndex,
      totalWallTiles: game.wallTotalTiles ?? 136,
    }),
    [game.tilesLeft, game.wallDiceTotal, wallCutIndex, game.wallTotalTiles],
  );

  const [myMeldsOverlayOpen, setMyMeldsOverlayOpen] = useState(false);
  const [myDiscardsOverlayOpen, setMyDiscardsOverlayOpen] = useState(false);
  const myMeldsBtnRef = useRef<HTMLButtonElement>(null);
  const myDiscardsBtnRef = useRef<HTMLButtonElement>(null);
  const [showHandUpdating, setShowHandUpdating] = useState(false);
  const [concealedMode, setConcealedMode] = useState<'pong' | 'chow' | 'kong' | null>(null);
  const [concealedSelectedIndices, setConcealedSelectedIndices] = useState<number[]>([]);
  const [chowPickMode, setChowPickMode] = useState(false);
  const [chowPickIndices, setChowPickIndices] = useState<number[]>([]);
  const [winMeldModalOpen, setWinMeldModalOpen] = useState(false);
  const [mobileWallOpen, setMobileWallOpen] = useState(false);
  const [mobileFocusMode, setMobileFocusMode] = useState<'normal' | 'table'>('normal');
  const [mobileExpandedOpponentPid, setMobileExpandedOpponentPid] = useState<string | null>(null);
  const [mobileDockSection, setMobileDockSection] = useState<'none' | 'melds' | 'discards'>('none');

  const handleOpponentAccordionToggle = useCallback((pid: string) => {
    setMobileExpandedOpponentPid((cur) => (cur === pid ? null : pid));
  }, []);

  const toggleMobileWall = useCallback(() => {
    setMobileWallOpen((o) => !o);
  }, []);

  const myHandSignature = useMemo(() => myHand.map(tileIdentity).join('|'), [myHand]);
  const [handOrder, setHandOrder] = useState<string[]>(() => makeHandTokens(myHand));
  const orderedHandIndices = useMemo(() => resolveOrderToIndices(myHand, handOrder), [myHand, handOrder]);

  useEffect(() => {
    setHandOrder((prev) => reconcileOrder(prev, myHand));
  }, [myHandSignature]);

  useEffect(() => {
    if (!init.tilesDealt) setMobileWallOpen(false);
  }, [init.tilesDealt]);

  useEffect(() => {
    const canSelectDiscard =
      !isEnded &&
      isMyTurn &&
      game.turnState.tileDrawn &&
      canDiscard &&
      concealedMode == null &&
      !chowPickMode &&
      !isTutorial;
    if (!canSelectDiscard) {
      if (selectedDiscardIndex != null) setSelectedDiscardIndex(null);
      return;
    }
    if (selectedDiscardIndex != null && !myHand[selectedDiscardIndex]) {
      setSelectedDiscardIndex(null);
    }
  }, [
    canDiscard,
    chowPickMode,
    concealedMode,
    game.turnState.tileDrawn,
    isEnded,
    isMyTurn,
    isTutorial,
    myHand,
    selectedDiscardIndex,
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 250, tolerance: 6 },
    })
  );

  const dragDisabled =
    acting ||
    chowPickMode ||
    concealedMode != null ||
    (isTutorial && tutorialDiscardTile != null) ||
    (isMyTurn && game.turnState.tileDrawn && selectedDiscardIndex != null);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const a = String(active.id);
    const b = String(over.id);
    if (!a || !b || a === b) return;
    setHandOrder((items) => {
      const oldIndex = items.indexOf(a);
      const newIndex = items.indexOf(b);
      if (oldIndex < 0 || newIndex < 0) return items;
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  useEffect(() => {
    if (!canClaimChow || chowClaimActions.length === 0) {
      setChowPickMode(false);
      setChowPickIndices([]);
    }
  }, [canClaimChow, chowClaimActions.length]);

  const chowPickSelectedTiles = useMemo(
    () => chowPickIndices.map((i) => myHand[i]).filter((t): t is Tile => t != null),
    [chowPickIndices, myHand],
  );

  const resolvedChowVariantId = useMemo(
    () =>
      chowPickMode && chowPickSelectedTiles.length === 2
        ? resolveChowVariantId(game.lastDiscardedTile, chowClaimActions, chowPickSelectedTiles)
        : null,
    [chowPickMode, chowPickSelectedTiles, game.lastDiscardedTile, chowClaimActions],
  );

  const toggleChowPickIndex = (index: number) => {
    setChowPickIndices((prev) => {
      if (prev.includes(index)) return prev.filter((i) => i !== index);
      if (prev.length >= 2) return prev;
      return [...prev, index];
    });
  };
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
          <TileBackView key={idx} className="h-7 w-5" aria-hidden />
        ))}
        <span className="text-[10px] text-muted w-full text-center">Concealed x{count}</span>
      </>
    );
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

  const currentPlayerLabel =
    game.currentPlayer === currentUserId
      ? 'Your turn'
      : opponentIds.includes(game.currentPlayer)
        ? getPlayerLabel(game.currentPlayer, opponentIds.indexOf(game.currentPlayer))
        : 'Current player';

  const winnerId = game.winnerId;
  const iWon = winnerId === currentUserId;
  const myLastDrawnIndex = useMemo(() => {
    if (!currentUserId) return null;
    if (lastDrawnTile?.pid !== currentUserId) return null;
    if (lastDrawnTile.turn !== game.turnState.turn_number) return null;
    const idx = myHand.map(tileIdentity).lastIndexOf(lastDrawnTile.identity);
    return idx >= 0 ? idx : null;
  }, [currentUserId, game.turnState.turn_number, lastDrawnTile, myHand]);
  const winnerLabel =
    winnerId === currentUserId
      ? currentUserDisplayName ?? 'You'
      : winnerId && opponentIds.includes(winnerId)
        ? getPlayerLabel(winnerId, opponentIds.indexOf(winnerId))
        : winnerId
          ? getPlayerLabel(winnerId)
          : 'A player';

  /** Four-player table: show the win summary in the wall area instead of above the board. */
  const placeGameOverOnTable =
    Boolean(isEnded && init.tilesDealt && opponentSlotsResolved != null);

  const isExhaustiveDraw = isEnded && !winnerId && game.endReason === 'exhaustive-draw';

  const gameOverBody = (
    <>
      <h2 className="text-xl font-bold text-on-surface">
        {isExhaustiveDraw
          ? 'Draw — wall exhausted'
          : iWon
            ? 'You won!'
            : `${winnerLabel} won!`}
      </h2>
      {(lastScoringResult?.points != null || game.points != null) && (
        <p className="text-base font-semibold text-on-surface">
          Total: {(lastScoringResult?.points ?? game.points) ?? 0} points
        </p>
      )}
      {(lastScoringResult?.breakdown ?? game.breakdown) && (lastScoringResult?.breakdown ?? game.breakdown)!.length > 0 && (
        <ul className="list-none flex flex-col gap-1 px-2 text-center text-sm text-muted" aria-label="Scoring breakdown">
          {(lastScoringResult?.breakdown ?? game.breakdown)!.map((entry, i) => {
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
        <label className="flex cursor-pointer items-center justify-center gap-2 text-sm text-on-surface">
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
          className="btn-primary mx-auto inline-flex max-w-xs items-center justify-center"
          aria-label="Back to home"
          title="Back to home"
        >
          Back to home
        </Link>
      )}
    </>
  );

  const mobileTableFocusDock = mobileFocusMode === 'table';

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-4xl flex-1 min-h-0 flex-col gap-2 overflow-y-auto p-2 sm:gap-3 sm:p-3">
        {error && (
          <div
            className="panel game-board-notice-enter rounded-xl px-4 py-3 text-danger text-sm"
            role="alert"
          >
            {error}
          </div>
        )}

        {(waitingOnBot || botStepCapMessage) && !isEnded && (
          <div
            className="panel game-board-notice-enter flex flex-col gap-2 rounded-xl border border-(--color-primary)/30 bg-surface-panel px-4 py-3 text-sm"
            role="status"
            aria-live="polite"
            aria-busy={waitingOnBot}
          >
            {waitingOnBot && (
              <div className="flex items-center gap-2 text-on-surface">
                <Spinner className="w-5 h-5 shrink-0" />
                <span className="font-medium">Waiting on bot…</span>
              </div>
            )}
            {botStepCapMessage ? (
              <p className="text-muted text-xs m-0">{botStepCapMessage}</p>
            ) : null}
          </div>
        )}

        {isEnded && !placeGameOverOnTable && (
          <section
            aria-label="Game over"
            className="panel flex flex-col gap-4 rounded-xl border-2 border-(--color-primary) bg-surface-panel p-6 text-center"
          >
            {gameOverBody}
          </section>
        )}

        {opponentSlotsResolved ? (
          <>
            <section
              aria-label="Players and discards"
              className={`relative flex w-full min-h-[min(260px,42svh)] flex-col gap-2 overflow-visible max-sm:gap-2 sm:min-h-[min(320px,50svh)] md:min-h-[380px] ${
                !isTutorial ? 'max-sm:hidden' : ''
              }`}
            >
              {(() => {
                const topPid = opponentSlotsResolved.top;
                const topWind = windByPlayer[topPid];
                return (
                  <OpponentSeatCard
                    key={topPid}
                    pid={topPid}
                    game={game}
                    label={getPlayerLabel(topPid, opponentIds.indexOf(topPid))}
                    wind={topWind}
                    isDealer={topPid === game.startingPlayer}
                    position="top-flow"
                    tutorialAnchor={topWind ? tutorialAnchorForOpponentWind(topWind) : 'opponent-top'}
                    isCurrent={topPid === game.currentPlayer}
                    isEnded={isEnded}
                    renderMeldTiles={renderMeldTiles}
                    getMeldCountParts={getMeldCountParts}
                  />
                );
              })()}
              <div className="relative flex w-full flex-1 flex-col max-sm:min-h-[min(200px,34svh)] max-sm:gap-2 sm:min-h-[min(240px,38svh)] md:min-h-[280px]">
                <div className="max-sm:order-1 sm:contents">
                  {(() => {
                    const pid = opponentSlotsResolved.left;
                    const wind = windByPlayer[pid];
                    return (
                      <OpponentSeatCard
                        key={pid}
                        pid={pid}
                        game={game}
                        label={getPlayerLabel(pid, opponentIds.indexOf(pid))}
                        wind={wind}
                        isDealer={pid === game.startingPlayer}
                        position="left"
                        tutorialAnchor={wind ? tutorialAnchorForOpponentWind(wind) : 'opponent-left'}
                        isCurrent={pid === game.currentPlayer}
                        isEnded={isEnded}
                        renderMeldTiles={renderMeldTiles}
                        getMeldCountParts={getMeldCountParts}
                      />
                    );
                  })()}
                </div>
                {placeGameOverOnTable && (
                  <div
                    className="absolute left-1/2 top-1/2 z-20 flex w-[min(100%,22rem)] max-w-sm justify-center px-2 max-sm:order-2 max-sm:static max-sm:mx-auto max-sm:translate-none -translate-x-1/2 -translate-y-1/2"
                    role="presentation"
                  >
                    <section
                      aria-label="Game over"
                      className="panel pointer-events-auto flex w-full flex-col gap-3 rounded-xl border-2 border-(--color-primary) bg-surface-panel p-4 text-center shadow-lg sm:p-5"
                    >
                      {gameOverBody}
                    </section>
                  </div>
                )}
                {init.tilesDealt && !isEnded && playerIdsFull.length === 4 && (
                  <div className="absolute left-1/2 top-1/2 z-0 max-sm:order-2 max-sm:static max-sm:mx-auto max-sm:translate-none -translate-x-1/2 -translate-y-1/2">
                    <WallTable {...wallTableInput} />
                  </div>
                )}
                {!init.tilesDealt && !isEnded && (
                  <div className="absolute left-1/2 top-1/2 z-0 max-w-56 max-sm:order-2 max-sm:static max-sm:mx-auto max-sm:translate-none -translate-x-1/2 -translate-y-1/2 px-2 text-center text-muted text-xs">
                    Opponents sit by wind (you are East when dealing). Roll & deal to build the walls.
                  </div>
                )}
                <div className="max-sm:order-3 sm:contents">
                  {(() => {
                    const pid = opponentSlotsResolved.right;
                    const wind = windByPlayer[pid];
                    return (
                      <OpponentSeatCard
                        key={pid}
                        pid={pid}
                        game={game}
                        label={getPlayerLabel(pid, opponentIds.indexOf(pid))}
                        wind={wind}
                        isDealer={pid === game.startingPlayer}
                        position="right"
                        tutorialAnchor={wind ? tutorialAnchorForOpponentWind(wind) : 'opponent-right'}
                        isCurrent={pid === game.currentPlayer}
                        isEnded={isEnded}
                        renderMeldTiles={renderMeldTiles}
                        getMeldCountParts={getMeldCountParts}
                      />
                    );
                  })()}
                </div>
              </div>
            </section>

            {!isTutorial ? (
              <section
                aria-label="Players and discards"
                className="flex flex-col overflow-hidden rounded-xl border border-border/50 bg-surface-panel/90 sm:hidden"
              >
                <div className="flex flex-wrap gap-1 border-b border-border/40 bg-(--color-surface-panel-muted)/20 p-2">
                  {(['normal', 'table'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMobileFocusMode(m)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                        mobileFocusMode === m
                          ? 'bg-(--color-primary) text-white'
                          : 'text-muted hover:bg-surface-panel-muted/50 hover:text-on-surface'
                      }`}
                    >
                      {m === 'normal' ? 'All' : 'Table'}
                    </button>
                  ))}
                </div>

                {placeGameOverOnTable && (
                  <div className="border-b border-border/40 p-3">
                    <section
                      aria-label="Game over"
                      className="panel flex flex-col gap-3 rounded-xl border-2 border-(--color-primary) bg-surface-panel p-4 text-center"
                    >
                      {gameOverBody}
                    </section>
                  </div>
                )}

                <div className="divide-y divide-border/40">
                  {[opponentSlotsResolved.top, opponentSlotsResolved.left, opponentSlotsResolved.right].map((pid) => {
                    const wind = windByPlayer[pid];
                    const melds = game.playerMelds?.[pid] ?? [];
                    const mc = getMeldCountParts(melds);
                    const discards = game.playerDiscards?.[pid] ?? [];
                    const hand = game.playerHands?.[pid] ?? [];
                    const previewDiscards = discards.slice(-MAX_PREVIEW_TILES);
                    const expanded = mobileExpandedOpponentPid === pid;
                    return (
                      <div key={pid}>
                        <OpponentCompactRow
                          opponentId={pid}
                          label={getPlayerLabel(pid, opponentIds.indexOf(pid))}
                          wind={wind}
                          isDealer={pid === game.startingPlayer}
                          isCurrent={pid === game.currentPlayer}
                          meldBase={mc.base}
                          meldKongBonus={mc.kongBonus}
                          previewDiscardTiles={previewDiscards}
                          handCount={hand.length}
                          expanded={expanded}
                          onAccordionToggle={handleOpponentAccordionToggle}
                          tutorialAnchor={wind ? tutorialAnchorForOpponentWind(wind) : undefined}
                        />
                        <AnimateExpand open={expanded}>
                          <div className="space-y-3 border-t border-border/30 bg-(--color-surface-panel-muted)/25 px-3 py-3 transition-colors duration-200 motion-reduce:duration-150">
                            {melds.length > 0 ? (
                              <div className="flex flex-col gap-2">
                                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                                  Melds
                                </span>
                                <div className="flex flex-wrap gap-2">
                                  {melds.map((meld) => (
                                    <div
                                      key={meld.meldId}
                                      className="flex flex-col items-center gap-0.5"
                                      title={meld.type}
                                    >
                                      <div className="flex flex-wrap gap-0.5">
                                        {renderMeldTiles(meld, false)}
                                      </div>
                                      {meld.visibility === 'concealed' && (
                                        <span className="text-[10px] font-medium text-muted">
                                          Concealed
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                            {discards.length > 0 ? (
                              <div className="flex flex-col gap-2">
                                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                                  Discards
                                </span>
                                <div className="flex flex-wrap gap-0.5">
                                  {discards.map((t, i) => (
                                    <TileView
                                      key={`${t._type}-${String(t.value)}-${i}`}
                                      tile={t}
                                      className="h-8 w-6"
                                    />
                                  ))}
                                </div>
                              </div>
                            ) : null}
                            <div className="flex flex-col gap-2">
                              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                                Hand
                              </span>
                              {isEnded && hand.length > 0 ? (
                                <div className="flex flex-wrap gap-0.5">
                                  {hand.map((t: Tile, i: number) => (
                                    <TileView key={i} tile={t} className="h-8 w-6" />
                                  ))}
                                </div>
                              ) : hand.length > 0 ? (
                                <div className="flex flex-wrap items-center gap-1">
                                  {Array.from({ length: hand.length }).map((_, i) => (
                                    <TileBackView
                                      key={i}
                                      className="h-8 w-6 shrink-0"
                                      aria-hidden
                                    />
                                  ))}
                                  <span className="text-xs tabular-nums text-muted">{hand.length}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted">—</span>
                              )}
                            </div>
                          </div>
                        </AnimateExpand>
                      </div>
                    );
                  })}
                </div>

                {init.tilesDealt && !isEnded && playerIdsFull.length === 4 ? (
                  <MobileWallSection
                    {...wallTableInput}
                    expanded={mobileWallOpen}
                    onToggle={toggleMobileWall}
                  />
                ) : null}

                {!init.tilesDealt && !isEnded ? (
                  <p className="px-3 py-2 text-center text-xs text-muted">
                    Opponents sit by wind (you are East when dealing). Roll & deal to build the walls.
                  </p>
                ) : null}
              </section>
            ) : null}
          </>
        ) : (
          <section aria-label="Players and discards" className="grid grid-cols-1 sm:grid-cols-3 gap-3 overflow-visible">
            {opponentIds.slice(0, 3).map((pid, idx) => (
              <OpponentSeatCard
                key={pid}
                pid={pid}
                game={game}
                label={getPlayerLabel(pid, idx)}
                wind={windByPlayer[pid]}
                isDealer={pid === game.startingPlayer}
                position="grid"
                tutorialAnchor={`opponent-${idx}`}
                isCurrent={pid === game.currentPlayer}
                isEnded={isEnded}
                renderMeldTiles={renderMeldTiles}
                getMeldCountParts={getMeldCountParts}
              />
            ))}
          </section>
        )}

        {!init.tilesDealt && opponentSlotsResolved && (
          <p className="text-muted max-sm:hidden text-center text-sm py-2">
            Ready to deal. Tap the button below to start the round.
          </p>
        )}
        {!init.tilesDealt && !opponentSlotsResolved && (
          <p className="text-muted text-center text-sm py-2">Ready to deal. Use the button below to start the round.</p>
        )}

      </div>

      <div className="w-full shrink-0 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-4 sm:pt-2 sm:pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div
          className={`mx-auto flex w-full max-w-4xl flex-col gap-2 rounded-2xl border border-border/50 bg-surface-panel p-2 shadow-sm sm:gap-3 sm:p-4 ${
            !isEnded && game.currentPlayer === currentUserId
              ? 'ring-1 ring-(--color-ring-focus) ring-offset-1 ring-offset-(--color-surface) sm:ring-2 sm:ring-offset-2'
              : ''
          }`}
          data-tutorial-anchor="player-dock"
        >
        {init.tilesDealt && (
          <>
            <div
              className="hidden flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-border/30 pb-2 text-center text-xs text-muted sm:flex sm:gap-x-4 sm:text-sm"
              role="status"
            >
              <span>{isEnded ? 'Game over' : `Current: ${currentPlayerLabel}`}</span>
              <span className="tabular-nums">Tiles left: {game.tilesLeft}</span>
              {game.lastDiscardedTile && (
                <span className="inline-flex items-center gap-1.5">
                  Last discard: <TileView tile={game.lastDiscardedTile} className="inline-block h-6 w-4" />
                </span>
              )}
            </div>
            <div
              className="flex flex-nowrap items-center gap-1.5 overflow-x-auto border-b border-border/30 pb-2 sm:hidden"
              role="status"
            >
              <span className="shrink-0 rounded-full bg-surface-panel-muted/90 px-2 py-0.5 text-[10px] font-medium text-on-surface">
                {isEnded ? 'Over' : currentPlayerLabel}
              </span>
              <span className="shrink-0 rounded-full bg-surface-panel-muted/90 px-2 py-0.5 text-[10px] tabular-nums text-muted">
                {game.tilesLeft} left
              </span>
              {game.lastDiscardedTile ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-panel-muted/90 px-2 py-0.5 text-[10px] text-muted">
                  Last
                  <TileView tile={game.lastDiscardedTile} className="inline-block h-5 w-3.5" />
                </span>
              ) : null}
            </div>
          </>
        )}
        {init.tilesDealt && !isEnded && canDeclareMahjong && isMyTurn && (
          <p className="text-center text-sm font-medium text-on-surface" role="status">
            {meldCallReady || !canDefineMelds
              ? 'You can win!'
              : `You can win, but declare your melds first (${declaredMeldsCount}/4)`}
          </p>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-3 max-sm:flex-col sm:flex-row sm:items-stretch sm:gap-4">
          <div className="flex min-w-0 flex-1 flex-col">
        {init.tilesDealt && (myHand.length > 0 || myMelds.length > 0) && (
          <section
            aria-label={isEnded ? 'Your winning hand' : 'Your hand'}
            className="flex min-w-0 flex-col gap-2 rounded-b-xl max-sm:flex max-sm:flex-col sm:block sm:gap-0"
            data-tutorial-anchor="hand"
          >
            {init.tilesDealt && !isTutorial ? (
              <div className="mb-0 flex max-w-full flex-wrap gap-1 max-sm:order-1 sm:hidden">
                <button
                  type="button"
                  onClick={() => setMobileDockSection((s) => (s === 'melds' ? 'none' : 'melds'))}
                  className={
                    mobileDockSection === 'melds'
                      ? 'rounded-lg bg-(--color-primary) px-2 py-1 text-[11px] font-medium text-white'
                      : 'rounded-lg border border-border/60 bg-surface-panel-muted/50 px-2 py-1 text-[11px] font-medium text-on-surface'
                  }
                >
                  Melds
                  {(() => {
                    const c = getMeldCountParts(myMelds);
                    return c.base > 0 || c.kongBonus > 0
                      ? ` (${c.base}${c.kongBonus > 0 ? `+${c.kongBonus}` : ''})`
                      : '';
                  })()}
                </button>
                <button
                  type="button"
                  onClick={() => setMobileDockSection((s) => (s === 'discards' ? 'none' : 'discards'))}
                  className={
                    mobileDockSection === 'discards'
                      ? 'rounded-lg bg-(--color-primary) px-2 py-1 text-[11px] font-medium text-white'
                      : 'rounded-lg border border-border/60 bg-surface-panel-muted/50 px-2 py-1 text-[11px] font-medium text-on-surface'
                  }
                >
                  Discards{myDiscards.length > 0 ? ` (${myDiscards.length})` : ''}
                </button>
                {!isTutorial && myHand.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      const tokens = makeHandTokens(myHand);
                      const indices = myHand.map((_, idx) => idx);
                      indices.sort((a, b) => {
                        const ta = myHand[a];
                        const tb = myHand[b];
                        if (!ta || !tb) return 0;
                        const ka = tileSortKey(ta);
                        const kb = tileSortKey(tb);
                        if (ka !== kb) return ka.localeCompare(kb);
                        return a - b;
                      });
                      setHandOrder(indices.map((idx) => tokens[idx]!).filter(Boolean));
                    }}
                    disabled={acting}
                    className="rounded-lg border border-border/60 bg-surface-panel-muted/50 px-2 py-1 text-[11px] font-medium text-on-surface"
                    aria-label="Sort hand"
                    title="Sort hand"
                  >
                    Sort
                  </button>
                ) : null}
              </div>
            ) : null}
            <div className="mb-2 flex min-h-8 max-sm:contents items-start justify-between gap-2 sm:mb-2 sm:flex sm:flex-row">
              <div
                aria-label="Your melds"
                className={`flex min-w-0 flex-1 flex-col items-start gap-1 max-sm:order-3 max-sm:w-full ${
                  !isTutorial && mobileDockSection !== 'melds' ? 'max-sm:hidden' : ''
                } ${!isTutorial && mobileTableFocusDock ? 'max-sm:hidden' : ''} sm:flex`}
              >
                {(() => {
                  const myMeldCounts = getMeldCountParts(myMelds);
                  return (
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="text-xs font-medium text-muted">
                        Melds
                        {myMeldCounts.base > 0 || myMeldCounts.kongBonus > 0
                          ? ` (${myMeldCounts.base}${myMeldCounts.kongBonus > 0 ? ` +${myMeldCounts.kongBonus}` : ''})`
                          : ''}
                      </span>
                      {myMeldPreviewSplit.rest.length > 0 && (
                        <AllTilesButton
                          btnRef={myMeldsBtnRef}
                          open={myMeldsOverlayOpen}
                          onClick={() => setMyMeldsOverlayOpen((v) => !v)}
                          ariaLabel={myMeldsOverlayOpen ? 'Hide all melds' : 'Show all melds'}
                          title={myMeldsOverlayOpen ? 'Hide all melds' : 'Show all melds'}
                        />
                      )}
                    </div>
                  );
                })()}
                {myMelds.length > 0 ? (
                  <>
                    <div className="flex flex-wrap justify-start gap-0.5">
                      {myMeldPreviewSplit.preview.map((meld) => (
                        <div key={meld.meldId} className="flex flex-col items-center gap-0.5" title={meld.type}>
                          <div className="flex flex-wrap gap-0.5">{renderMeldTiles(meld, true)}</div>
                          {meld.visibility === 'concealed' && (
                            <span className="text-[10px] font-medium text-muted">Concealed</span>
                          )}
                        </div>
                      ))}
                    </div>
                    <TilePopover open={myMeldsOverlayOpen} onClose={() => setMyMeldsOverlayOpen(false)} anchorRef={myMeldsBtnRef} align="start">
                      <div className="flex flex-col gap-3">
                        {myMelds.map((meld) => (
                          <div
                            key={meld.meldId}
                            className="flex flex-col items-center gap-1 border-b border-border/40 pb-3 last:border-0 last:pb-0"
                            title={meld.type}
                          >
                            <div className="flex flex-wrap justify-center gap-0.5">
                              {renderMeldTiles(meld, true)}
                            </div>
                            {meld.visibility === 'concealed' && (
                              <span className="text-[10px] font-medium text-muted">Concealed</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </TilePopover>
                  </>
                ) : null}
              </div>
              <div className="flex max-w-full min-w-0 max-sm:order-2 flex-col items-center gap-0.5 px-1 sm:shrink-0">
                {isEnded ? (
                  <span className="text-sm font-medium text-on-surface text-center">
                    {iWon ? 'Your winning hand' : 'Your hand'}
                  </span>
                ) : chowPickMode ? (
                  <p
                    className="text-sm text-center text-on-surface font-medium inline-flex items-center gap-2 max-w-56 sm:max-w-none"
                    aria-live="polite"
                  >
                    {acting && <Spinner className="w-4 h-4" />}
                    Select two tiles that complete a chow with the last discard, then confirm.
                  </p>
                ) : isMyTurn && game.turnState.tileDrawn ? (
                <p className="text-sm text-center inline-flex items-center gap-2">
                  {acting && <Spinner className="w-4 h-4" />}
                  {isTutorial && tutorialDiscardTile != null ? (
                    <span className="text-on-surface font-medium">Tap the tile marked “Discard” below</span>
                  ) : (
                    <span className="text-muted">Choose a tile to discard</span>
                  )}
                  {!isTutorial && selectedDiscardIndex != null && (
                    <button
                      type="button"
                      onClick={() => {
                        const tile = myHand[selectedDiscardIndex];
                        if (tile) onDiscardTile(tile);
                        setSelectedDiscardIndex(null);
                      }}
                      disabled={acting || !myHand[selectedDiscardIndex]}
                      className="btn-secondary inline-flex items-center justify-center gap-1.5 px-2.5 py-1 text-xs"
                      aria-label="Confirm discard"
                      title="Confirm discard"
                    >
                      <Icon src={icons.check} className="size-4 [&_.icon-svg]:size-4" aria-hidden />
                      Confirm
                    </button>
                  )}
                </p>
                ) : (
                  <span className="text-sm font-medium text-muted text-center">Your hand</span>
                )}
              <div className="flex items-center gap-2">
                <span className="text-muted text-xs">
                  Tiles{myHand.length > 0 ? ` (${myHand.length})` : ''}
                </span>
                {!isTutorial && myHand.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      const tokens = makeHandTokens(myHand);
                      const indices = myHand.map((_, idx) => idx);
                      indices.sort((a, b) => {
                        const ta = myHand[a];
                        const tb = myHand[b];
                        if (!ta || !tb) return 0;
                        const ka = tileSortKey(ta);
                        const kb = tileSortKey(tb);
                        if (ka !== kb) return ka.localeCompare(kb);
                        return a - b;
                      });
                      setHandOrder(indices.map((idx) => tokens[idx]!).filter(Boolean));
                    }}
                    disabled={acting}
                    className="btn-secondary max-sm:hidden px-2 py-1 text-[11px] leading-none"
                    aria-label="Sort hand"
                    title="Sort hand"
                  >
                    Sort
                  </button>
                ) : null}
              </div>
              </div>
              <div
                aria-label="Your discards"
                className={`flex min-w-0 flex-1 flex-col items-end gap-1 max-sm:order-4 max-sm:w-full ${
                  !isTutorial && mobileDockSection !== 'discards' ? 'max-sm:hidden' : ''
                } ${!isTutorial && mobileTableFocusDock ? 'max-sm:hidden' : ''} sm:flex`}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted">
                    Discards{myDiscards.length > 0 ? ` (${myDiscards.length})` : ''}
                  </span>
                  {myDiscards.length > MAX_PREVIEW_TILES && (
                    <AllTilesButton
                      btnRef={myDiscardsBtnRef}
                      open={myDiscardsOverlayOpen}
                      onClick={() => setMyDiscardsOverlayOpen((v) => !v)}
                      ariaLabel={myDiscardsOverlayOpen ? 'Hide all discards' : 'Show all discards'}
                      title={myDiscardsOverlayOpen ? 'Hide all discards' : 'Show all discards'}
                    />
                  )}
                </div>
                {myDiscards.length > 0 ? (
                  <>
                    <div className="flex flex-wrap justify-end gap-0.5">
                      {myDiscardPreviewTiles.map((t, i) => (
                        <TileView
                          key={`${t._type}-${String(t.value)}-${i}`}
                          tile={t}
                          className="h-10 w-7"
                        />
                      ))}
                    </div>
                    <TilePopover open={myDiscardsOverlayOpen} onClose={() => setMyDiscardsOverlayOpen(false)} anchorRef={myDiscardsBtnRef} align="end">
                      <div className="flex flex-wrap gap-1">
                        {myDiscards.map((t, i) => (
                          <TileView key={i} tile={t} className="h-10 w-7" />
                        ))}
                      </div>
                    </TilePopover>
                  </>
                ) : null}
              </div>
            </div>
            <div className="flex min-h-14 max-sm:order-5 flex-wrap items-end justify-start gap-1 overflow-x-auto overflow-y-visible pb-0.5 sm:justify-center">
              <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                <SortableContext items={handOrder} strategy={horizontalListSortingStrategy}>
                  {orderedHandIndices.map((i, ord) => {
                    const t = myHand[i];
                    if (!t) return null;
                const canDiscardThisTurn =
                  !isEnded &&
                  isMyTurn &&
                  game.turnState.tileDrawn &&
                  canDiscard &&
                  concealedMode == null &&
                  !chowPickMode;
                const isChowPickTile = chowPickMode && useChowTilePickFlow && !isEnded;
                const isChowPickSelected = chowPickIndices.includes(i);
                const isTutorialSuggested =
                  isTutorial && canDiscard && tutorialDiscardTile != null &&
                  t._type === tutorialDiscardTile._type && t.value === tutorialDiscardTile.value;
                const canOneTapDiscard = canDiscardThisTurn && isTutorial && isTutorialSuggested;
                const canSelectDiscard = canDiscardThisTurn && !isTutorial;
                const isConcealedSelectable = concealedMode != null && concealedSelectableIndices.has(i);
                const isConcealedSelected = concealedSelectedIndices.includes(i);
                const isNewlyDrawn =
                  !isEnded && canDiscardThisTurn && myLastDrawnIndex != null && myLastDrawnIndex === i;
                const isDiscardSelected = canSelectDiscard && selectedDiscardIndex === i;
                const tileEl = isChowPickTile ? (
                  <TileView
                    key={i}
                    tile={t}
                    asButton
                    onClick={() => toggleChowPickIndex(i)}
                    disabled={acting}
                    selected={isChowPickSelected}
                    className="h-14 w-10"
                    aria-label={`Select ${tileToLabel(t)} for chow`}
                    title="Select tile for chow"
                  />
                ) : canOneTapDiscard ? (
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
                ) : canSelectDiscard ? (
                  <TileView
                    key={i}
                    tile={t}
                    asButton
                    onClick={() => {
                      setSelectedDiscardIndex((cur) => (cur === i ? null : i));
                    }}
                    disabled={acting}
                    selected={isDiscardSelected}
                    className="h-14 w-10"
                    aria-label={`Select ${tileToLabel(t)} to discard`}
                    title="Select tile to discard"
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
                const decoratedTileEl = isNewlyDrawn ? (
                  <div key={`new-${i}`} className="relative inline-block">
                    {tileEl}
                    <span
                      className="absolute -top-1 -right-1 inline-flex h-3 w-3 rounded-full bg-(--color-primary) ring-2 ring-(--color-surface)"
                      aria-label="Newly drawn tile"
                      title="Newly drawn tile"
                    />
                  </div>
                ) : (
                  tileEl
                );
                    let content: ReactNode = decoratedTileEl;
                    if (isChowPickTile) {
                      content = (
                        <div
                          className={`flex flex-col items-center gap-1 transition-transform duration-150 ${
                            isChowPickSelected ? '-translate-y-1' : ''
                          }`}
                        >
                          {decoratedTileEl}
                        </div>
                      );
                    } else if (isDiscardSelected) {
                      content = (
                        <div className="flex flex-col items-center gap-1 transition-transform duration-150 -translate-y-1">
                          {decoratedTileEl}
                        </div>
                      );
                    } else if (isTutorialSuggested) {
                      content = (
                        <div className="flex flex-col items-center gap-1">
                          {decoratedTileEl}
                          <span className="text-xs font-medium text-on-surface px-2 py-0.5 rounded-md bg-surface-panel-muted border border-border/60">
                            Discard
                          </span>
                        </div>
                      );
                    }

                    return (
                      <SortableHandTile
                        key={handOrder[ord] ?? `${tileIdentity(t)}:${i}`}
                        id={handOrder[ord] ?? `${tileIdentity(t)}#${i}`}
                        disabled={dragDisabled}
                      >
                        {content}
                      </SortableHandTile>
                    );
                  })}
                </SortableContext>
              </DndContext>
            </div>
          </section>
        )}
          </div>
        <div
          className="flex w-full shrink-0 flex-col items-stretch gap-2 border-t border-border/40 pt-3 sm:w-44 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0 [&_button]:w-full [&_button]:justify-center"
          data-tutorial-anchor="action-bar"
        >
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
            meldCallReady || !canDefineMelds ? (
              <button
                onClick={onMahjong}
                disabled={acting}
                className="btn-primary btn-claim-mahjong inline-flex items-center justify-center gap-2"
                aria-label={acting ? 'Declaring Mahjong' : 'Declare Mahjong'}
              >
                {acting && <Spinner className="w-4 h-4" />}
                Mahjong
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setWinMeldModalOpen(true)}
                disabled={acting}
                className="btn-primary btn-claim-mahjong inline-flex items-center justify-center gap-2"
                aria-label={acting ? 'Opening meld declaration' : 'Define melds before Mahjong'}
                title={`Declare ${remainingMeldsNeeded} more meld(s)`}
              >
                {acting && <Spinner className="w-4 h-4" />}
                Define melds to win
              </button>
            )
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
              {showClaimDivider && <span className="w-full h-px shrink-0 bg-border my-0.5" aria-hidden />}
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
                  aria-label={acting ? 'Claiming Gang' : 'Claim Gang'}
                >
                  {acting && <Spinner className="w-4 h-4" />}
                  {meldDisplayTerm(game.ruleSetId, 'fullSet')}
                </button>
              )}
              {canClaimChow &&
                (isTutorial ? (
                  <button
                    type="button"
                    onClick={() => onClaimChow()}
                    disabled={acting}
                    className="btn-primary btn-claim-chow inline-flex items-center justify-center gap-2"
                    aria-label={acting ? 'Claiming Chow' : 'Claim Chow'}
                  >
                    {acting && <Spinner className="w-4 h-4" />}
                    Chow
                  </button>
                ) : useChowTilePickFlow ? (
                  chowPickMode ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          if (resolvedChowVariantId) onClaimChow(resolvedChowVariantId);
                        }}
                        disabled={acting || resolvedChowVariantId == null}
                        className="btn-primary btn-claim-chow inline-flex items-center justify-center gap-2"
                        aria-label={acting ? 'Confirming chow claim' : 'Confirm chow with selected tiles'}
                        title={
                          resolvedChowVariantId == null && chowPickSelectedTiles.length === 2
                            ? 'Those two tiles do not form a legal chow with the discard'
                            : undefined
                        }
                      >
                        {acting && <Spinner className="w-4 h-4" />}
                        Confirm chow
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setChowPickMode(false);
                          setChowPickIndices([]);
                        }}
                        disabled={acting}
                        className="btn-secondary inline-flex items-center justify-center gap-2"
                        aria-label="Cancel chow tile selection"
                      >
                        Cancel chow
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setConcealedMode(null);
                        setConcealedSelectedIndices([]);
                        setChowPickMode(true);
                        setChowPickIndices([]);
                      }}
                      disabled={acting}
                      className="btn-primary btn-claim-chow inline-flex items-center justify-center gap-2"
                      aria-label={acting ? 'Starting chow selection' : 'Chow — select two hand tiles'}
                    >
                      {acting && <Spinner className="w-4 h-4" />}
                      Chow
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => onClaimChow()}
                    disabled={acting}
                    className="btn-primary btn-claim-chow inline-flex items-center justify-center gap-2"
                    aria-label={acting ? 'Claiming Chow' : 'Claim Chow'}
                  >
                    {acting && <Spinner className="w-4 h-4" />}
                    Chow
                  </button>
                ))}
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
              onClick={
                concealedMode === 'pong'
                  ? resetConcealedSelection
                  : () => {
                      setChowPickMode(false);
                      setChowPickIndices([]);
                      setConcealedMode('pong');
                      setConcealedSelectedIndices([]);
                    }
              }
              disabled={acting}
              className="btn-secondary inline-flex items-center justify-center gap-2"
              aria-label={concealedMode === 'pong' ? 'Cancel concealed pong selection' : 'Concealed Pong'}
            >
              {concealedMode === 'pong' ? 'Cancel' : 'Concealed Pong'}
            </button>
          )}
          {init.tilesDealt && !isEnded && canConcealedChow && (
            <button
              onClick={
                concealedMode === 'chow'
                  ? resetConcealedSelection
                  : () => {
                      setChowPickMode(false);
                      setChowPickIndices([]);
                      setConcealedMode('chow');
                      setConcealedSelectedIndices([]);
                    }
              }
              disabled={acting}
              className="btn-secondary inline-flex items-center justify-center gap-2"
              aria-label={concealedMode === 'chow' ? 'Cancel concealed chow selection' : 'Concealed Chow'}
            >
              {concealedMode === 'chow' ? 'Cancel' : 'Concealed Chow'}
            </button>
          )}
          {init.tilesDealt && !isEnded && canConcealedKong && (
            <button
              onClick={
                concealedMode === 'kong'
                  ? resetConcealedSelection
                  : () => {
                      setChowPickMode(false);
                      setChowPickIndices([]);
                      setConcealedMode('kong');
                      setConcealedSelectedIndices([]);
                    }
              }
              disabled={acting}
              className="btn-secondary inline-flex items-center justify-center gap-2"
              aria-label={
                concealedMode === 'kong'
                  ? `Cancel concealed ${meldDisplayTerm(game.ruleSetId, 'fullSet')} selection`
                  : 'Concealed Gang'
              }
            >
              {concealedMode === 'kong' ? 'Cancel' : `Concealed ${meldDisplayTerm(game.ruleSetId, 'fullSet')}`}
            </button>
          )}
        </div>
        </div>
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

              <section aria-label="Declare concealed melds">
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
                        No concealed meld declarations are available right now. If the server still allows Mahjong, you can call it anyway.
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
                                className="btn-secondary inline-flex items-center justify-center gap-2"
                                aria-label={acting ? `Declaring concealed pong for ${label}` : `Declare concealed pong for ${label}`}
                                title={`Concealed Pong ${label}`}
                              >
                                {acting && <Spinner className="w-4 h-4" />}
                                Concealed Pong {label}
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
                                className="btn-secondary inline-flex items-center justify-center gap-2"
                                aria-label={acting ? `Declaring concealed gang for ${label}` : `Declare concealed gang for ${label}`}
                                title={`Concealed ${meldDisplayTerm(game.ruleSetId, 'fullSet')} ${label}`}
                              >
                                {acting && <Spinner className="w-4 h-4" />}
                                Concealed {meldDisplayTerm(game.ruleSetId, 'fullSet')} {label}
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
                                className="btn-secondary inline-flex items-center justify-center gap-2"
                                aria-label={acting ? `Declaring concealed chow ${label}` : `Declare concealed chow ${label}`}
                                title={`Concealed Chow ${label}`}
                              >
                                {acting && <Spinner className="w-4 h-4" />}
                                Concealed Chow {label}
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
    </div>
  );
}

