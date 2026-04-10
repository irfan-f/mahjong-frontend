import { memo } from 'react';
import type { WindTileValue, Tile } from '../../types';
import { TileView } from '../TileView';
import { Icon } from '../Icon';
import { icons } from '../../icons';

function windInitial(w: WindTileValue | undefined): string {
  if (!w) return '';
  return w.charAt(0).toUpperCase();
}

export interface OpponentCompactRowProps {
  opponentId: string;
  label: string;
  wind?: WindTileValue;
  isDealer: boolean;
  isCurrent: boolean;
  meldBase: number;
  meldKongBonus: number;
  /** Recent discards shown face-up in the collapsed row. */
  previewDiscardTiles: Tile[];
  handCount: number;
  expanded: boolean;
  /** Stable callback from parent (e.g. useCallback) — pass opponentId. */
  onAccordionToggle: (opponentId: string) => void;
  tutorialAnchor?: string;
}

function OpponentCompactRowInner({
  opponentId,
  label,
  wind,
  isDealer,
  isCurrent,
  meldBase,
  meldKongBonus,
  previewDiscardTiles,
  handCount,
  expanded,
  onAccordionToggle,
  tutorialAnchor,
}: OpponentCompactRowProps) {
  const countParts: string[] = [];
  if (meldBase > 0 || meldKongBonus > 0) {
    countParts.push(
      meldKongBonus > 0 ? `M${meldBase}+${meldKongBonus}` : `M${meldBase}`,
    );
  }
  if (handCount > 0) countParts.push(`H${handCount}`);
  const counts = countParts.length > 0 ? countParts.join(' · ') : '';

  const windStr = wind ? windInitial(wind) : '';
  const meta = [windStr, isDealer ? 'Dealer' : '', counts].filter(Boolean).join(' · ');

  const discardSummary =
    previewDiscardTiles.length > 0
      ? `${previewDiscardTiles.length} recent discard${previewDiscardTiles.length === 1 ? '' : 's'}`
      : '';

  return (
    <div data-tutorial-anchor={tutorialAnchor}>
      <button
        type="button"
        onClick={() => onAccordionToggle(opponentId)}
        aria-expanded={expanded}
        className={`flex w-full flex-col gap-1.5 px-3 py-2.5 text-left transition-colors duration-200 ease-out motion-reduce:duration-150 hover:bg-surface-panel-muted/30 ${
          isCurrent ? 'bg-(--color-primary)/10' : ''
        }`}
        aria-label={`${label}${meta ? `, ${meta}` : ''}${discardSummary ? `, ${discardSummary}` : ''}`}
      >
        <div className="flex w-full min-w-0 items-center justify-between gap-2">
          <span className="min-w-0 truncate text-sm font-medium text-on-surface">{label}</span>
          <span className="flex shrink-0 items-center gap-1">
            {meta ? (
              <span className="text-xs tabular-nums text-muted">{meta}</span>
            ) : (
              <span className="text-xs text-muted">Details</span>
            )}
            <Icon
              src={icons.chevronDown}
              className={`size-4 shrink-0 text-muted transition-transform duration-300 ease-out motion-reduce:duration-150 [&_.icon-svg]:size-4 ${
                expanded ? 'rotate-180' : ''
              }`}
              aria-hidden
            />
          </span>
        </div>
        {previewDiscardTiles.length > 0 ? (
          <div
            className="flex max-w-full flex-nowrap gap-0.5 overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch]"
            aria-label="Recent discards"
          >
            {previewDiscardTiles.map((t, i) => (
              <TileView
                key={`${t._type}-${String(t.value)}-${i}`}
                tile={t}
                className="h-7 w-5 shrink-0"
              />
            ))}
          </div>
        ) : null}
      </button>
    </div>
  );
}

function discardPreviewKey(tiles: Tile[]): string {
  return tiles.map((t) => `${t._type}:${String(t.value)}`).join('|');
}

export const OpponentCompactRow = memo(OpponentCompactRowInner, (prev, next) => {
  return (
    prev.opponentId === next.opponentId &&
    prev.label === next.label &&
    prev.wind === next.wind &&
    prev.isDealer === next.isDealer &&
    prev.isCurrent === next.isCurrent &&
    prev.meldBase === next.meldBase &&
    prev.meldKongBonus === next.meldKongBonus &&
    prev.handCount === next.handCount &&
    prev.expanded === next.expanded &&
    prev.tutorialAnchor === next.tutorialAnchor &&
    prev.onAccordionToggle === next.onAccordionToggle &&
    discardPreviewKey(prev.previewDiscardTiles) === discardPreviewKey(next.previewDiscardTiles)
  );
});
