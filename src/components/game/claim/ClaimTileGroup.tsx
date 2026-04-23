import type { Tile } from '../../../types';
import { TileView } from '../../TileView';
import { tileToLabel } from '../../../lib/tileAssets';

export interface ClaimTileGroupProps {
  tiles: Tile[];
  label: string;
  discardIndex?: number;
  selected: boolean;
  dimmed?: boolean;
  onPress: () => void;
  disabled: boolean;
}

export function ClaimTileGroup({
  tiles,
  label,
  discardIndex = -1,
  selected,
  dimmed,
  onPress,
  disabled,
}: ClaimTileGroupProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`${label}: ${tiles.map(tileToLabel).join(', ')}`}
      className={`inline-flex flex-col items-center gap-1 rounded-xl border px-2 py-1.5 transition-[border-color,background-color,box-shadow,opacity] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 ${
        selected
          ? 'border-(--color-primary) bg-(--color-primary)/10 shadow-md ring-1 ring-(--color-primary)/30'
          : 'border-border/60 bg-surface-panel hover:border-(--color-primary)/50 hover:bg-surface-panel-muted/40'
      } ${dimmed ? 'opacity-35' : ''} disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <div className="flex gap-0.5">
        {tiles.map((t, i) => (
          <div key={i} className="relative">
            <TileView tile={t} className="tile-hand" />
            {i === discardIndex && (
              <span
                className="pointer-events-none absolute -bottom-0.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-(--color-primary)"
                aria-hidden
              />
            )}
          </div>
        ))}
      </div>
      <span className="text-xs font-semibold leading-tight text-on-surface">{label}</span>
    </button>
  );
}
