import type { ReactNode } from 'react';
import type { Game as GameType, PlayerMeld, Tile, WindTileValue } from '../../types';
import { TileView } from '../TileView';
import { Spinner } from '../Spinner';

export type OpponentSeatPosition = 'grid' | 'top' | 'top-flow' | 'left' | 'right';

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
  tutorialAnchor: string;
  isCurrent: boolean;
  isEnded: boolean;
  isBot?: boolean;
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
  isBot = false,
  renderMeldTiles,
  getMeldCountParts,
}: OpponentSeatCardProps) {
  const hand = game.playerHands?.[pid] ?? [];
  const discards = game.playerDiscards?.[pid] ?? [];
  const melds = game.playerMelds?.[pid] ?? [];
  const meldCounts = getMeldCountParts(melds);
  const showTurnIndicator = isCurrent && !isEnded;

  const isSideSeat = position === 'left' || position === 'right';

  const meldsRowJustify = isSideSeat
    ? position === 'right'
      ? 'justify-end'
      : 'justify-start'
    : 'justify-center';

  const discardsRowJustify = meldsRowJustify;

  const positionClass =
    position === 'top'
      ? 'absolute top-1 left-1/2 z-10 w-[min(100%,28rem)] -translate-x-1/2 lg:w-[min(100%,44rem)] xl:w-[min(100%,56rem)]'
      : position === 'left'
        ? 'absolute left-0.5 top-1/2 z-10 w-[min(10rem,40vw)] -translate-y-1/2 sm:w-[clamp(9.5rem,14vw,14rem)] lg:w-[clamp(11rem,14vw,20rem)] xl:w-[clamp(13rem,13vw,24rem)]'
        : position === 'right'
          ? 'absolute right-0.5 top-1/2 z-10 w-[min(10rem,40vw)] -translate-y-1/2 sm:w-[clamp(9.5rem,14vw,14rem)] lg:w-[clamp(11rem,14vw,20rem)] xl:w-[clamp(13rem,13vw,24rem)]'
          : '';

  const wrapperClass =
    position === 'grid'
      ? 'relative'
      : position === 'top-flow'
        ? 'relative z-10 w-full shrink-0 sm:mx-auto sm:w-[min(100%,30rem)] lg:w-[min(100%,44rem)] xl:w-[min(100%,56rem)]'
        : `${positionClass} max-sm:static max-sm:translate-none max-sm:left-auto max-sm:right-auto max-sm:top-auto max-sm:w-full`;

  return (
    <div
      data-tutorial-anchor={tutorialAnchor}
      className={`${wrapperClass} panel flex flex-col gap-2 overflow-visible rounded-xl p-2 sm:p-3 lg:p-4 ${
        position === 'grid' ? 'relative' : ''
      } ${isCurrent ? 'ring-2 ring-(--color-ring-focus) ring-offset-2 ring-offset-(--color-surface)' : ''}`}
    >
      <div
        className={
          isSideSeat
            ? position === 'right'
              ? 'flex min-h-8 flex-col items-end gap-3 lg:gap-4'
              : 'flex min-h-8 flex-col items-stretch gap-3 lg:gap-4'
            : 'flex min-h-8 items-start justify-between gap-1.5 lg:gap-3'
        }
      >
        <div
          className={`relative flex min-w-0 flex-col gap-1 ${
            isSideSeat ? 'w-full' : 'flex-1 items-start'
          } ${isSideSeat && position === 'right' ? 'items-end' : ''}`}
        >
          <div className={`flex w-full items-center gap-2 ${isSideSeat ? '' : 'max-sm:max-w-48'}`}>
            <span className="text-xs md:text-sm lg:text-base font-medium text-muted">
              Melds
              {meldCounts.base > 0 || meldCounts.kongBonus > 0
                ? ` (${meldCounts.base}${meldCounts.kongBonus > 0 ? ` +${meldCounts.kongBonus}` : ''})`
                : ''}
            </span>
          </div>
          {melds.length > 0 && (
            <div className={`flex flex-wrap gap-2 ${meldsRowJustify}`}>
              {melds.map((meld) => (
                <div key={meld.meldId} className="flex flex-wrap gap-0.5" title={meld.type}>
                  {renderMeldTiles(meld, false)}
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          className={`flex shrink-0 flex-col gap-0.5 ${
            isSideSeat
              ? position === 'right'
                ? 'w-full items-end border-t border-border/50 pt-2 text-right'
                : 'w-full items-start border-t border-border/50 pt-2 text-left'
              : 'max-w-24 items-center text-center'
          }`}
        >
          <span aria-live="polite" aria-atomic="true" className="contents">
            {showTurnIndicator && (
              <span
                className={`inline-flex items-center gap-1 self-center rounded-full px-2 py-0.5 text-xs md:text-sm font-semibold ${
                  isBot
                    ? 'bg-(--color-primary)/15 text-(--color-primary)'
                    : 'bg-amber-400/20 text-amber-600 dark:text-amber-400'
                }`}
              >
                {isBot ? <Spinner className="w-2.5 h-2.5 shrink-0" aria-hidden /> : (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500 animate-pulse" aria-hidden />
                )}
                {isBot ? 'Thinking…' : 'Their turn'}
              </span>
            )}
          </span>
          <span
            className={`w-full truncate text-sm md:text-base lg:text-lg font-semibold text-on-surface ${
              isSideSeat ? (position === 'right' ? 'text-right' : 'text-left') : 'text-center'
            }`}
          >
            {label}
          </span>
          {wind ? (
            <span
              className={`text-xs sm:text-sm md:text-sm leading-tight text-muted ${
                isSideSeat ? (position === 'right' ? 'text-right' : 'text-left') : 'text-center'
              }`}
            >
              {formatWind(wind)}
              {isDealer ? ' · Dealer' : ''}
            </span>
          ) : isDealer ? (
            <span
              className={`text-xs sm:text-sm md:text-sm leading-tight text-muted ${
                isSideSeat ? (position === 'right' ? 'text-right' : 'text-left') : 'text-center'
              }`}
            >
              Dealer
            </span>
          ) : null}
          {hand.length > 0 ? (
            <span className="text-xs md:text-sm lg:text-base text-muted">Hand ({hand.length})</span>
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
          <div className="flex w-full items-center gap-2">
            <span className="text-xs md:text-sm lg:text-base font-medium text-muted">
              Discards{discards.length > 0 ? ` (${discards.length})` : ''}
            </span>
          </div>
          {discards.length > 0 && (
            <div className={`flex flex-wrap gap-0.5 ${discardsRowJustify}`}>
              {discards.map((t, i) => (
                <TileView key={`${t._type}-${String(t.value)}-${i}`} tile={t} className="h-7 w-5 lg:h-8 lg:w-[1.375rem] xl:h-10 xl:w-[1.6875rem]" />
              ))}
            </div>
          )}
        </div>
      </div>
      {isEnded && hand.length > 0 && (
        <div className="flex w-full flex-col gap-1 border-t border-border pt-1" aria-label={`${label} hand`}>
          <span className="text-xs md:text-sm lg:text-base font-medium text-muted">Hand</span>
          <div className="flex flex-wrap justify-center gap-0.5">
            {hand.map((t: Tile, i: number) => (
              <TileView key={i} tile={t} className="h-7 w-5 lg:h-8 lg:w-[1.375rem] xl:h-10 xl:w-[1.6875rem]" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
