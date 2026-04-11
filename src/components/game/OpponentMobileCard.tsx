import { memo } from 'react';
import type { Game as GameType, PlayerMeld, Tile, WindTileValue } from '../../types';
import { TileView, TileBackView } from '../TileView';
import { Spinner } from '../Spinner';

const WIND_LABEL: Record<string, string> = { east: 'E', south: 'S', west: 'W', north: 'N' };
const DISCARD_PREVIEW = 10;
const TILE = 'h-7 w-5';

export interface OpponentMobileCardProps {
  pid: string;
  game: GameType;
  label: string;
  wind?: WindTileValue;
  isDealer: boolean;
  isCurrent: boolean;
  isEnded: boolean;
  isBot?: boolean;
  getMeldCountParts: (melds: PlayerMeld[]) => { base: number; kongBonus: number };
}

function OpponentMobileCardInner({
  pid,
  game,
  label,
  wind,
  isDealer,
  isCurrent,
  isEnded,
  isBot = false,
  getMeldCountParts,
}: OpponentMobileCardProps) {
  const hand: Tile[] = game.playerHands?.[pid] ?? [];
  const melds: PlayerMeld[] = game.playerMelds?.[pid] ?? [];
  const discards: Tile[] = game.playerDiscards?.[pid] ?? [];
  const recentDiscards = discards.slice(-DISCARD_PREVIEW);
  const meldCounts = getMeldCountParts(melds);
  const active = isCurrent && !isEnded;
  const hasTiles = melds.length > 0 || recentDiscards.length > 0;

  return (
    <div
      className={`flex flex-col gap-2 rounded-xl p-2.5 transition-colors ${
        active
          ? 'bg-(--color-primary)/8 ring-1 ring-(--color-primary)/30'
          : 'border border-border/40 bg-surface-panel'
      }`}
      aria-label={`${label}${active ? ', their turn' : ''}${isDealer ? ', dealer' : ''}`}
    >
      {/* Header row */}
      <div className="flex min-w-0 items-center gap-1.5">
        {active ? (
          isBot ? (
            <Spinner className="h-2.5 w-2.5 shrink-0 text-(--color-primary)" aria-label="Thinking" />
          ) : (
            <span className="h-2 w-2 shrink-0 rounded-full bg-(--color-primary)" aria-label="Their turn" />
          )
        ) : (
          <span className="h-2 w-2 shrink-0" aria-hidden />
        )}

        {wind && (
          <span className="shrink-0 rounded px-1 py-0.5 text-[10px] font-bold leading-none text-muted bg-surface-panel-muted">
            {WIND_LABEL[wind] ?? wind.charAt(0).toUpperCase()}
          </span>
        )}

        <span
          className={`min-w-0 truncate text-sm font-semibold ${active ? 'text-(--color-primary)' : 'text-on-surface'}`}
        >
          {label}
        </span>

        {isDealer && (
          <span className="shrink-0 rounded px-1 py-0.5 text-[10px] font-medium leading-none text-amber-600 bg-amber-500/10 dark:text-amber-400">
            Dealer
          </span>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-2 text-xs text-muted">
          <span className="tabular-nums" aria-label={`${hand.length} tiles in hand`}>
            H:{hand.length}
          </span>
          {(meldCounts.base > 0 || meldCounts.kongBonus > 0) && (
            <span className="font-semibold text-(--color-primary) tabular-nums" aria-label={`${meldCounts.base} melds`}>
              M:{meldCounts.base}{meldCounts.kongBonus > 0 ? `+${meldCounts.kongBonus}` : ''}
            </span>
          )}
        </div>
      </div>

      {/* Tiles row: melds | discards */}
      {hasTiles && (
        <div
          className="flex items-end gap-1 overflow-x-auto overscroll-x-contain pb-0.5 [-webkit-overflow-scrolling:touch]"
          aria-label="Melds and recent discards"
        >
          {melds.map((meld) => {
            const visible = meld.tiles && meld.visibility !== 'concealed';
            const count = meld.tileCount ?? meld.tiles?.length ?? 0;
            return (
              <div key={meld.meldId} className="flex shrink-0 gap-px" title={meld.type}>
                {visible
                  ? meld.tiles!.map((t, ti) => <TileView key={ti} tile={t} className={TILE} />)
                  : Array.from({ length: count }).map((_, ti) => (
                      <TileBackView key={ti} className={TILE} aria-hidden />
                    ))}
              </div>
            );
          })}

          {melds.length > 0 && recentDiscards.length > 0 && (
            <div className="mx-1 w-px shrink-0 self-stretch bg-border/50" />
          )}

          {recentDiscards.map((t, i) => (
            <TileView key={`${t._type}-${String(t.value)}-${i}`} tile={t} className={`${TILE} shrink-0`} />
          ))}
        </div>
      )}

      {/* End of game: show hand face-up */}
      {isEnded && hand.length > 0 && (
        <div className="flex flex-wrap gap-0.5 border-t border-border/30 pt-1.5" aria-label={`${label}'s hand`}>
          {hand.map((t, i) => (
            <TileView key={i} tile={t} className={TILE} />
          ))}
        </div>
      )}
    </div>
  );
}

export const OpponentMobileCard = memo(OpponentMobileCardInner);
