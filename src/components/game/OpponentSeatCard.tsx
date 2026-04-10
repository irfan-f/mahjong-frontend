import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Game as GameType, PlayerMeld, Tile, WindTileValue } from '../../types';
import { TileView } from '../TileView';
import { MAX_PREVIEW_TILES, partitionMeldsForPreview } from '../../lib/meldPreview';
import { AllTilesButton, TilePopover } from './ExpandableTileOverlay';

/** `top-flow`: in normal flow above the table (avoids overlapping the wall). */
export type OpponentSeatPosition = 'grid' | 'top' | 'top-flow' | 'left' | 'right';

const MAX_PREVIEW_DISCARDS = MAX_PREVIEW_TILES;

function formatWind(w: WindTileValue): string {
  return w.charAt(0).toUpperCase() + w.slice(1);
}

export interface OpponentSeatCardProps {
  pid: string;
  game: GameType;
  label: string;
  wind?: WindTileValue;
  isDealer: boolean;
  position: OpponentSeatPosition;
  /** `data-tutorial-anchor` value */
  tutorialAnchor: string;
  isCurrent: boolean;
  isEnded: boolean;
  renderMeldTiles: (meld: PlayerMeld, isOwner: boolean) => ReactNode;
  getMeldCountParts: (melds: PlayerMeld[]) => { base: number; kongBonus: number };
}

export function OpponentSeatCard({
  pid,
  game,
  label,
  wind,
  isDealer,
  position,
  tutorialAnchor,
  isCurrent,
  isEnded,
  renderMeldTiles,
  getMeldCountParts,
}: OpponentSeatCardProps) {
  const hand = game.playerHands?.[pid] ?? [];
  const discards = game.playerDiscards?.[pid] ?? [];
  const melds = game.playerMelds?.[pid] ?? [];
  const meldCounts = getMeldCountParts(melds);

  const [meldOverlayOpen, setMeldOverlayOpen] = useState(false);
  const [discardOverlayOpen, setDiscardOverlayOpen] = useState(false);
  const meldBtnRef = useRef<HTMLButtonElement>(null);
  const discardBtnRef = useRef<HTMLButtonElement>(null);

  const isSideSeat = position === 'left' || position === 'right';

  const { preview: previewMelds, rest: restMelds } = partitionMeldsForPreview(melds, MAX_PREVIEW_TILES);
  const hasMoreMelds = restMelds.length > 0;
  const previewDiscards = discards.slice(-MAX_PREVIEW_DISCARDS);
  const hasMoreDiscards = discards.length > MAX_PREVIEW_DISCARDS;

  const meldsRowJustify = isSideSeat
    ? position === 'right'
      ? 'justify-end'
      : 'justify-start'
    : 'justify-center';

  const discardsRowJustify = meldsRowJustify;

  const positionClass =
    position === 'top'
      ? 'absolute top-1 left-1/2 z-10 w-[min(100%,28rem)] -translate-x-1/2 lg:w-[min(100%,34rem)]'
      : position === 'left'
        ? 'absolute left-0.5 top-1/2 z-10 w-[min(10rem,40vw)] -translate-y-1/2 sm:w-[min(10.5rem,22vw)] lg:w-[min(13rem,18vw)]'
        : position === 'right'
          ? 'absolute right-0.5 top-1/2 z-10 w-[min(10rem,40vw)] -translate-y-1/2 sm:w-[min(10.5rem,22vw)] lg:w-[min(13rem,18vw)]'
          : '';

  const wrapperClass =
    position === 'grid'
      ? 'relative'
      : position === 'top-flow'
        ? 'relative z-10 w-full shrink-0 sm:mx-auto sm:w-[min(100%,28rem)] lg:w-[min(100%,34rem)]'
        : `${positionClass} max-sm:static max-sm:translate-none max-sm:left-auto max-sm:right-auto max-sm:top-auto max-sm:w-full`;

  return (
    <div
      data-tutorial-anchor={tutorialAnchor}
      className={`${wrapperClass} panel flex flex-col gap-2 overflow-visible rounded-xl p-2 sm:p-3 ${
        position === 'grid' ? 'relative' : ''
      } ${isCurrent ? 'ring-2 ring-(--color-ring-focus) ring-offset-2 ring-offset-(--color-surface)' : ''}`}
    >
      <div
        className={
          isSideSeat
            ? position === 'right'
              ? 'flex min-h-8 flex-col items-end gap-3'
              : 'flex min-h-8 flex-col items-stretch gap-3'
            : 'flex min-h-8 items-start justify-between gap-1.5'
        }
      >
        <div
          className={`relative flex min-w-0 flex-col gap-1 ${
            isSideSeat ? 'w-full' : 'flex-1 items-start'
          } ${isSideSeat && position === 'right' ? 'items-end' : ''}`}
        >
          <div className={`flex w-full items-center justify-between gap-2 ${isSideSeat ? '' : 'max-sm:max-w-48'}`}>
            <span className="text-xs font-medium text-muted">
              Melds
              {meldCounts.base > 0 || meldCounts.kongBonus > 0
                ? ` (${meldCounts.base}${meldCounts.kongBonus > 0 ? ` +${meldCounts.kongBonus}` : ''})`
                : ''}
            </span>
            {hasMoreMelds && (
              <AllTilesButton
                btnRef={meldBtnRef}
                open={meldOverlayOpen}
                onClick={() => setMeldOverlayOpen((v) => !v)}
                ariaLabel={meldOverlayOpen ? `Hide all melds for ${label}` : `Show all melds for ${label}`}
                title={meldOverlayOpen ? 'Hide all melds' : 'Show all melds'}
              />
            )}
          </div>
          {melds.length === 0 ? null : (
            <>
              <div className={`flex flex-wrap gap-1 ${meldsRowJustify}`}>
                {previewMelds.map((meld) => (
                  <div key={meld.meldId} className="flex flex-col items-center gap-0.5" title={meld.type}>
                    <div className="flex flex-wrap gap-0.5">{renderMeldTiles(meld, false)}</div>
                    {meld.visibility === 'concealed' && (
                      <span className="text-[10px] font-medium text-muted">Concealed</span>
                    )}
                  </div>
                ))}
              </div>
              <TilePopover open={meldOverlayOpen} onClose={() => setMeldOverlayOpen(false)} anchorRef={meldBtnRef} align="start">
                <div className="flex flex-col gap-3">
                  {melds.map((meld) => (
                    <div
                      key={meld.meldId}
                      className="flex flex-col items-center gap-1 border-b border-border/40 pb-3 last:border-0 last:pb-0"
                      title={meld.type}
                    >
                      <div className="flex flex-wrap justify-center gap-0.5">
                        {renderMeldTiles(meld, false)}
                      </div>
                      {meld.visibility === 'concealed' && (
                        <span className="text-[10px] font-medium text-muted">Concealed</span>
                      )}
                    </div>
                  ))}
                </div>
              </TilePopover>
            </>
          )}
        </div>
        <div
          className={`flex shrink-0 flex-col gap-0.5 ${
            isSideSeat
              ? position === 'right'
                ? 'w-full items-end border-t border-border/50 pt-2 text-right'
                : 'w-full items-start border-t border-border/50 pt-2 text-left'
              : 'max-w-22 items-center text-center'
          }`}
        >
          <span
            className={`w-full truncate text-sm font-medium ${
              isSideSeat ? (position === 'right' ? 'text-right' : 'text-left') : 'text-center'
            }`}
          >
            {label}
          </span>
          {wind ? (
            <span
              className={`text-[10px] leading-tight text-muted ${
                isSideSeat ? (position === 'right' ? 'text-right' : 'text-left') : 'text-center'
              }`}
            >
              {formatWind(wind)}
              {isDealer ? ' · Dealer' : ''}
            </span>
          ) : isDealer ? (
            <span
              className={`text-[10px] leading-tight text-muted ${
                isSideSeat ? (position === 'right' ? 'text-right' : 'text-left') : 'text-center'
              }`}
            >
              Dealer
            </span>
          ) : null}
          {hand.length > 0 ? (
            <span className="text-xs text-muted">Hand ({hand.length})</span>
          ) : null}
        </div>
        <div
          className={`relative flex min-w-0 flex-col gap-1 ${
            isSideSeat
              ? position === 'right'
                ? 'w-full items-end border-t border-border/50 pt-2'
                : 'w-full items-start border-t border-border/50 pt-2'
              : 'flex-1 items-end'
          }`}
        >
          <div className="flex w-full items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted">
              Discards{discards.length > 0 ? ` (${discards.length})` : ''}
            </span>
            {hasMoreDiscards && (
              <AllTilesButton
                btnRef={discardBtnRef}
                open={discardOverlayOpen}
                onClick={() => setDiscardOverlayOpen((v) => !v)}
                ariaLabel={discardOverlayOpen ? `Hide all discards for ${label}` : `Show all discards for ${label}`}
                title={discardOverlayOpen ? 'Hide all discards' : 'Show all discards'}
              />
            )}
          </div>
          {discards.length === 0 ? null : (
            <>
              <div className={`flex flex-wrap gap-0.5 ${discardsRowJustify}`}>
                {previewDiscards.map((t, i) => (
                  <TileView key={`${t._type}-${String(t.value)}-${i}`} tile={t} className="h-7 w-5 lg:h-8 lg:w-[1.375rem]" />
                ))}
              </div>
              <TilePopover open={discardOverlayOpen} onClose={() => setDiscardOverlayOpen(false)} anchorRef={discardBtnRef} align="end">
                <div className="flex flex-wrap gap-1">
                  {discards.map((t, i) => (
                    <TileView key={`${t._type}-${String(t.value)}-${i}`} tile={t} className="h-7 w-5 lg:h-8 lg:w-[1.375rem]" />
                  ))}
                </div>
              </TilePopover>
            </>
          )}
        </div>
      </div>
      {isEnded && hand.length > 0 && (
        <div className="flex w-full flex-col gap-1 border-t border-border pt-1" aria-label={`${label} hand`}>
          <span className="text-xs font-medium text-muted">Hand</span>
          <div className="flex flex-wrap justify-center gap-0.5">
            {hand.map((t: Tile, i: number) => (
              <TileView key={i} tile={t} className="h-7 w-5 lg:h-8 lg:w-[1.375rem]" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
