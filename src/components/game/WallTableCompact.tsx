import { memo, useMemo } from 'react';
import { wallTilesPerQuadrant, type WallQuadrantCounts } from '../../lib/tableLayout';
import { TileBackView } from '../TileView';
import type { WallTableProps } from './WallTable';

const WIND_ORDER: { key: keyof WallQuadrantCounts; letter: string }[] = [
  { key: 'east', letter: 'E' },
  { key: 'south', letter: 'S' },
  { key: 'west', letter: 'W' },
  { key: 'north', letter: 'N' },
];

/** Tiny decorative backs — not 1:1 with tile count, just visual rhythm. */
function WallSparkle({ tilesLeft }: { tilesLeft: number }) {
  const n = useMemo(() => {
    if (tilesLeft <= 0) return 0;
    return Math.min(14, Math.max(4, Math.round(tilesLeft / 10)));
  }, [tilesLeft]);

  if (n === 0) return null;
  return (
    <div
      className="mt-1.5 flex flex-wrap items-center justify-center gap-px transition-opacity duration-300 motion-reduce:duration-150"
      aria-hidden
    >
      {Array.from({ length: n }).map((_, i) => (
        <TileBackView
          key={i}
          className="h-2 w-1.5 shrink-0 rounded-[1px] opacity-75 transition-opacity duration-200"
        />
      ))}
    </div>
  );
}

/** Always-on cute summary: winds + counts, dice, wall total, micro “wall” strip. */
export const WallTableCompact = memo(function WallTableCompact({
  tilesLeft,
  totalWallTiles = 136,
  diceTotal,
  cutIndex,
}: WallTableProps) {
  const counts = useMemo(
    () => wallTilesPerQuadrant(tilesLeft, cutIndex, totalWallTiles),
    [tilesLeft, cutIndex, totalWallTiles],
  );

  return (
    <div
      className="pointer-events-none select-none rounded-xl border border-border/45 bg-gradient-to-br from-(--color-surface-panel)/95 to-(--color-surface-panel-muted)/35 px-2.5 py-2 shadow-sm transition-shadow duration-300 motion-reduce:duration-150"
      aria-label={`Wall summary: ${tilesLeft} tiles left, dice ${diceTotal}`}
    >
      <div className="flex items-stretch gap-2">
        <div className="grid min-w-0 flex-1 grid-cols-4 gap-1">
          {WIND_ORDER.map(({ key, letter }) => (
            <div
              key={key}
              title={`${letter}: ${counts[key]} tiles`}
              className="flex flex-col items-center justify-center rounded-lg border border-border/35 bg-(--color-surface-panel-muted)/40 px-0.5 py-1 transition-colors duration-200 motion-reduce:duration-150"
            >
              <span className="text-[10px] font-bold leading-none text-(--color-primary)">{letter}</span>
              <span className="mt-0.5 text-[10px] font-medium tabular-nums leading-none text-muted">
                {counts[key]}
              </span>
            </div>
          ))}
        </div>
        <div className="flex shrink-0 flex-col items-center justify-center rounded-xl border border-border/50 bg-(--color-surface-panel-muted)/50 px-2 py-1 shadow-inner transition-transform duration-300 motion-reduce:duration-150">
          <span className="text-base leading-none opacity-90" aria-hidden>
            🎲
          </span>
          <span className="text-xs font-semibold tabular-nums text-on-surface">{diceTotal}</span>
        </div>
      </div>
      <WallSparkle tilesLeft={tilesLeft} />
      <p className="mt-1 text-center text-[10px] font-semibold tabular-nums tracking-wide text-muted transition-colors duration-200">
        {tilesLeft} in wall
      </p>
    </div>
  );
});
