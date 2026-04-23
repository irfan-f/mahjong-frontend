import type { PlayerMeld } from '../../types';
import { tileToLabel } from '../../lib/tileAssets';
import { TileBackView, TileView } from '../TileView';

export function PlayerMeldFaceTiles({
  meld,
  isOwner,
  tileClassName,
}: {
  meld: PlayerMeld;
  isOwner: boolean;
  tileClassName: string;
}) {
  if (meld.tiles && (isOwner || meld.visibility !== 'concealed')) {
    const claimIdx = meld.source === 'discard-claim' ? meld.claimedTileIndex : null;
    return meld.tiles.map((t, ti) => {
      const tileEl = <TileView key={ti} tile={t} className={tileClassName} />;
      if (ti !== claimIdx) return tileEl;
      return (
        <div key={ti} className="relative inline-flex" title={`Claimed — ${tileToLabel(t)}`}>
          {tileEl}
          <span
            className="pointer-events-none absolute right-0.5 top-0.5 z-20 h-2 w-2 rounded-full bg-rose-500 shadow-sm ring-1 ring-white dark:ring-(--color-surface-panel)"
            aria-hidden
          />
          <span className="sr-only">Claimed from discard: {tileToLabel(t)}</span>
        </div>
      );
    });
  }
  const count = meld.tileCount ?? meld.tiles?.length ?? 0;
  return Array.from({ length: count }).map((_, idx) => (
    <TileBackView key={idx} className={tileClassName} aria-hidden />
  ));
}
