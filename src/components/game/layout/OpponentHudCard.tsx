import type { ReactNode } from 'react';
import type { Game, PlayerMeld, Tile, WindTileValue } from '../../../types';
import { TileView } from '../../TileView';
import { PlayerMeldFaceTiles } from '../PlayerMeldFaceTiles';
import { Spinner } from '../../Spinner';
import { isPreDealPhase, windToColorClass, windToDisplayName } from './gameHudModel';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { Icon } from '../../Icon';
import { icons } from '../../../icons';
import { EmptyMeldsStripPlaceholder, TileStripPlaceholder } from './hudStripPlaceholders';

const DISCARD_PREVIEW = 14;

function TurnIndicatorPlay() {
  return (
    <span className="relative inline-flex size-[clamp(1.5rem,3.2vw,2.1rem)] shrink-0 items-center justify-center">
      <span className="turn-indicator-frame" aria-hidden />
      <span className="relative z-10 text-[clamp(0.7rem,2vw,0.9rem)] font-black leading-none text-(--color-primary) [text-shadow:0_1px_0_rgba(0,0,0,0.08)] dark:[text-shadow:0_1px_0_rgba(0,0,0,0.25)]">
        ▶
      </span>
    </span>
  );
}

function CornerFrame({
  subtle,
  children,
  label,
}: {
  subtle?: boolean;
  children: ReactNode;
  label: string;
}) {
  return (
    <span className="inline-flex flex-col items-center gap-0">
      <span className="sr-only">{label}</span>
      <span
        className={[
          'inline-flex items-center justify-center rounded-md border border-border bg-surface-panel p-[clamp(2px,0.7vh,6px)]',
          subtle ? 'text-muted' : 'text-(--color-primary)',
        ].join(' ')}
        aria-hidden
      >
        {children}
      </span>
    </span>
  );
}

function MeldGroup({ meld, isOwner, tileClass }: { meld: PlayerMeld; isOwner: boolean; tileClass: string }) {
  return (
    <div
      className="flex shrink-0 items-center gap-0.5 rounded-full border border-border bg-surface-panel px-3 py-0.5 sm:gap-1 sm:px-3 sm:py-1"
      title={meld.type}
    >
      <PlayerMeldFaceTiles meld={meld} isOwner={isOwner} tileClassName={`${tileClass} shadow-none`} />
    </div>
  );
}

export function OpponentHudCard({
  pid,
  game,
  label,
  wind,
  isDealer,
  isCurrent,
  wasTurn,
  isEnded,
  isBot,
}: {
  pid: string;
  game: Game;
  label: string;
  wind?: WindTileValue;
  isDealer: boolean;
  isCurrent: boolean;
  wasTurn: boolean;
  isEnded: boolean;
  isBot: boolean;
}) {
  const shortH = useMediaQuery('(max-height: 700px)');
  const discards: Tile[] = game.playerDiscards?.[pid] ?? [];
  const melds: PlayerMeld[] = game.playerMelds?.[pid] ?? [];
  const showDealer = isDealer && isPreDealPhase(game);
  const active = isCurrent && !isEnded;

  const recentDiscards = discards.slice(-DISCARD_PREVIEW).slice().reverse();
  const mostRecentDiscard = discards.length ? discards[discards.length - 1] : null;

  const cardShell = [
    'flex min-w-0 flex-col rounded-2xl border border-border bg-surface p-[var(--game-hud-v-pad)] max-[520px]:p-3 gap-[var(--game-hud-v-gap)]',
    active ? 'hud-seat-active' : '',
    !active && wasTurn ? 'hud-seat-prev-turn' : '',
  ].join(' ');

  return (
    <section className={cardShell} aria-label={`${label}${active ? ', their turn' : ''}`}>
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-baseline gap-2">
          <span className="min-w-0 truncate text-sm font-black text-on-surface">{label}</span>
          {wind ? (
            <span
              className={[
                'shrink-0 whitespace-nowrap rounded-full border border-border bg-surface-panel px-2 py-1 text-[0.78rem] font-black',
                windToColorClass(wind),
              ].join(' ')}
            >
              {windToDisplayName(wind)}
            </span>
          ) : null}
          {showDealer ? (
            <span className="badge-dealer">Dealer</span>
          ) : null}
        </div>

        <div className="shrink-0">
          {active ? (
            isBot ? (
              <CornerFrame label="Thinking">
                <Spinner className="size-[clamp(1.25rem,3vw,1.65rem)] text-(--color-primary)" aria-hidden />
              </CornerFrame>
            ) : (
              <CornerFrame label="Their turn">
                <TurnIndicatorPlay />
              </CornerFrame>
            )
          ) : mostRecentDiscard ? (
            <CornerFrame label="Most recent discard" subtle>
              <TileView tile={mostRecentDiscard} className="tile-strip shadow-none" />
            </CornerFrame>
          ) : (
            <CornerFrame label="No discards yet" subtle>
              <span className="flex size-[clamp(1.5rem,3.2vw,2rem)] items-center justify-center text-xs font-black text-muted" aria-hidden>
                —
              </span>
            </CornerFrame>
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-3">
        <div
          className="flex min-w-0 flex-none items-center justify-end gap-2.5 overflow-x-hidden md:flex-1"
          role="group"
          aria-label="Melds"
        >
          {shortH ? (
            <span className="sr-only">Melds</span>
          ) : (
            <span className="shrink-0 text-[0.75rem] font-black uppercase tracking-[0.06em] text-muted" aria-hidden>
              Melds
            </span>
          )}
          <div className="flex min-w-0 w-full flex-1 flex-nowrap items-center justify-start gap-2.5 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-0.5 [-webkit-overflow-scrolling:touch]">
            {melds.length === 0 ? (
              <EmptyMeldsStripPlaceholder tileClass="tile-strip" />
            ) : (
              melds
                .slice()
                .sort((a: PlayerMeld, b: PlayerMeld) => (b.declaredAtTurn ?? 0) - (a.declaredAtTurn ?? 0))
                .map((m: PlayerMeld) => (
                  <MeldGroup key={m.meldId} meld={m} isOwner={false} tileClass="tile-strip" />
                ))
            )}
          </div>
        </div>

        <div
          className="flex min-w-0 flex-none items-center justify-start gap-2.5 overflow-x-hidden md:flex-1"
          role="group"
          aria-label="Discards"
        >
          <span className="inline-flex shrink-0 items-center justify-center text-muted sm:hidden" aria-hidden>
            <Icon src={icons.delete} className="size-3.5 shrink-0 [&_.icon-svg]:size-3.5" />
          </span>
          <span className="hidden shrink-0 text-[0.75rem] font-black uppercase tracking-[0.06em] text-muted sm:inline" aria-hidden>
            Discards
          </span>
          <div className="flex min-w-0 w-full flex-1 items-center gap-1.5 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-0.5 [-webkit-overflow-scrolling:touch]">
            {recentDiscards.length === 0 ? (
              <TileStripPlaceholder tileClass="tile-strip" />
            ) : (
              recentDiscards.map((t, i) => (
                <TileView key={`${t._type}-${String(t.value)}-${i}`} tile={t} className="tile-strip shrink-0 shadow-none" />
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
