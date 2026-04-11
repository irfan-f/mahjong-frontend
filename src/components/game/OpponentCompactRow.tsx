import { memo } from 'react';
import type { WindTileValue, Tile } from '../../types';
import { TileView } from '../TileView';
import { tileToLabel } from '../../lib/tileAssets';
import { Spinner } from '../Spinner';
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
  isBot?: boolean;
  meldBase: number;
  meldKongBonus: number;
  previewDiscardTiles: Tile[];
  handCount: number;
  expanded: boolean;
  onAccordionToggle: (opponentId: string) => void;
  tutorialAnchor?: string;
  claimedDiscardKeys?: Set<string>;
}

function OpponentCompactRowInner({
  opponentId,
  label,
  wind,
  isDealer,
  isCurrent,
  isBot = false,
  meldBase,
  meldKongBonus,
  previewDiscardTiles,
  handCount,
  expanded,
  onAccordionToggle,
  tutorialAnchor,
  claimedDiscardKeys,
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
          <span className="min-w-0 flex items-center gap-1.5 truncate">
            <span aria-live="polite" aria-atomic="true" className="contents">
              {isCurrent && (
                <span
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                    isBot
                      ? 'bg-(--color-primary)/15 text-(--color-primary)'
                      : 'bg-amber-400/20 text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {isBot ? <Spinner className="w-2.5 h-2.5 shrink-0" aria-hidden /> : (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500 animate-pulse" aria-hidden />
                  )}
                  {isBot ? 'Thinking' : 'Turn'}
                </span>
              )}
            </span>
            <span className="truncate text-sm font-medium text-on-surface">{label}</span>
          </span>
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
            {previewDiscardTiles.map((t, i) => {
              const key = `${t._type}-${String(t.value)}-${i}`;
              const isClaimed = i === previewDiscardTiles.length - 1 && claimedDiscardKeys?.has(`${t._type}-${String(t.value)}`);
              if (!isClaimed) return <TileView key={key} tile={t} className="h-7 w-5 shrink-0" />;
              return (
                <div key={key} className="relative inline-flex shrink-0" title={`Claimed — ${tileToLabel(t)}`}>
                  <TileView tile={t} className="h-7 w-5" />
                  <span className="pointer-events-none absolute right-0.5 top-0.5 z-20 h-2 w-2 rounded-full bg-rose-500 shadow-sm ring-1 ring-white dark:ring-(--color-surface-panel)" aria-hidden />
                  <span className="sr-only">Claimed from discard: {tileToLabel(t)}</span>
                </div>
              );
            })}
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
    prev.isBot === next.isBot &&
    prev.meldBase === next.meldBase &&
    prev.meldKongBonus === next.meldKongBonus &&
    prev.handCount === next.handCount &&
    prev.expanded === next.expanded &&
    prev.tutorialAnchor === next.tutorialAnchor &&
    prev.onAccordionToggle === next.onAccordionToggle &&
    discardPreviewKey(prev.previewDiscardTiles) === discardPreviewKey(next.previewDiscardTiles)
  );
});
