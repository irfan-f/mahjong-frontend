import { memo } from 'react';
import { TileBackView } from '../TileView';
import type { WallQuadrantCounts } from '../../lib/tableLayout';
import { wallTilesPerQuadrant } from '../../lib/tableLayout';

const WIND_LABEL: Record<keyof WallQuadrantCounts, string> = {
  east: 'East wall',
  south: 'South wall',
  west: 'West wall',
  north: 'North wall',
};

const MAX_WALL_BACK_VISUAL = 24;

function WallArm({
  count,
  wind,
  direction,
}: {
  count: number;
  wind: keyof WallQuadrantCounts;
  direction: 'row' | 'col';
}) {
  /** ~one back per two tiles so counts like 20 read closer to a real wall segment (capped for DOM size). */
  const visual = count <= 0 ? 0 : Math.min(MAX_WALL_BACK_VISUAL, Math.max(1, Math.ceil(count / 2)));
  const label = WIND_LABEL[wind];
  const flex =
    direction === 'row'
      ? 'flex-row flex-wrap justify-center'
      : 'flex-col flex-wrap items-center max-h-[7rem] sm:max-h-[9rem]';

  return (
    <div
      className={`flex ${flex} gap-px min-h-7 max-w-36 sm:max-w-[18rem]`}
      title={`${label}: ${count} tiles in wall`}
      aria-label={`${label}, ${count} tiles`}
    >
      {count === 0 ? (
        <span className="text-[10px] text-muted px-1">—</span>
      ) : (
        Array.from({ length: visual }).map((_, i) => (
          <TileBackView key={i} className="h-3.5 w-2.5 sm:h-4 sm:w-3 shrink-0 opacity-90" aria-hidden />
        ))
      )}
      {count > 0 && (
        <span className="text-[10px] tabular-nums text-muted font-medium w-full text-center leading-tight">{count}</span>
      )}
    </div>
  );
}

export interface WallTableProps {
  tilesLeft: number;
  /** Full wall size (Hong Kong ruleset uses 136 in backend). */
  totalWallTiles?: number;
  /** Sum of two dice from roll & deal (drives break position). */
  diceTotal: number;
  /** Starting index in the ring where the live wall begins (from `computeWallCutIndex`). */
  cutIndex: number;
}

function WallTableInner({ tilesLeft, totalWallTiles = 136, diceTotal, cutIndex }: WallTableProps) {
  const counts = wallTilesPerQuadrant(tilesLeft, cutIndex, totalWallTiles);

  return (
    <div
      className="pointer-events-none select-none flex flex-col items-center gap-1 text-on-surface"
      aria-label={`Tile walls, ${tilesLeft} tiles remaining in the wall, dice total ${diceTotal}`}
    >
      <div className="text-[10px] uppercase tracking-wide text-muted/80 font-medium">Walls</div>
      <div className="flex flex-col items-center gap-1 p-2 rounded-2xl border border-border/50 bg-surface-panel/70 shadow-sm max-w-[min(100%,24rem)]">
        <span className="text-[10px] font-medium text-muted">West</span>
        <WallArm count={counts.west} wind="west" direction="row" />
        <div className="flex flex-row items-center justify-center gap-2 sm:gap-3 w-full">
          <div className="flex flex-col items-center gap-0.5 min-w-[3.5rem]">
            <span className="text-[10px] font-medium text-muted">North</span>
            <WallArm count={counts.north} wind="north" direction="col" />
          </div>
          <div className="flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-xl bg-(--color-surface-panel-muted)/60 border border-border/50 min-w-[4.5rem] shrink-0">
            <span className="text-base leading-none opacity-80" aria-hidden>
              🎲
            </span>
            <span className="text-xs font-semibold tabular-nums text-on-surface">{diceTotal}</span>
            <span className="text-[10px] text-muted tabular-nums">{tilesLeft} left</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 min-w-[3.5rem]">
            <span className="text-[10px] font-medium text-muted">South</span>
            <WallArm count={counts.south} wind="south" direction="col" />
          </div>
        </div>
        <span className="text-[10px] font-medium text-muted">East</span>
        <WallArm count={counts.east} wind="east" direction="row" />
      </div>
    </div>
  );
}

export const WallTable = memo(WallTableInner);
