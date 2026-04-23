import type { PlayerMeld, Tile } from '../../../types';
import { Icon } from '../../Icon';
import { icons } from '../../../icons';
import { TileView } from '../../TileView';
import { PlayerMeldFaceTiles } from '../PlayerMeldFaceTiles';
import { EmptyMeldsStripPlaceholder, TileStripPlaceholder } from './hudStripPlaceholders';

export type ScoreboardYouInflowStripsProps = {
  myDiscards: readonly Tile[];
  myMelds: readonly PlayerMeld[];
};

export function ScoreboardYouInflowStrips({ myDiscards, myMelds }: ScoreboardYouInflowStripsProps) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-2 pt-2 sm:pt-2.5">
      <div className="flex w-full min-w-0 items-stretch justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center justify-start gap-2.5 overflow-x-hidden" role="group" aria-label="Your discards">
          <span className="inline-flex shrink-0 items-center justify-center text-muted sm:hidden" aria-hidden>
            <Icon src={icons.delete} className="size-4 shrink-0 [&_.icon-svg]:size-4" />
          </span>
          <span
            className="hidden shrink-0 text-[0.75rem] font-black uppercase tracking-[0.06em] text-muted sm:inline"
            aria-hidden
          >
            Discards
          </span>
          <div className="flex min-w-0 w-full flex-1 items-center gap-1.5 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-0.5 [-webkit-overflow-scrolling:touch]">
            {myDiscards.length === 0 ? (
              <TileStripPlaceholder tileClass="tile-strip" />
            ) : (
              myDiscards
                .slice()
                .reverse()
                .map((t, i) => (
                  <TileView
                    key={`you-disc-${t._type}-${String(t.value)}-${i}`}
                    tile={t}
                    className="tile-strip shrink-0 shadow-none"
                  />
                ))
            )}
          </div>
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2.5 overflow-x-hidden" role="group" aria-label="Your melds">
          <span className="shrink-0 text-[0.75rem] font-black uppercase tracking-[0.06em] text-muted" aria-hidden>
            Melds
          </span>
          <div className="flex min-w-0 w-full flex-1 flex-nowrap items-center justify-start gap-2.5 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-0.5 [-webkit-overflow-scrolling:touch]">
            {myMelds.length === 0 ? (
              <EmptyMeldsStripPlaceholder tileClass="tile-strip" />
            ) : (
              myMelds
                .slice()
                .sort((a, b) => (b.declaredAtTurn ?? 0) - (a.declaredAtTurn ?? 0))
                .map((meld) => (
                  <div
                    key={meld.meldId}
                    className="flex shrink-0 items-center gap-0.5 rounded-full border border-border bg-surface-panel px-3 py-0.5 sm:gap-1 sm:px-3 sm:py-1"
                    title={meld.type}
                  >
                    <PlayerMeldFaceTiles meld={meld} isOwner tileClassName="tile-strip" />
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
