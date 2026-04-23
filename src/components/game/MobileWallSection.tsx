import { memo } from 'react';
import { WallTableCompact } from './WallTableCompact';
import { WallTable } from './WallTable';
import { AnimateExpand } from './AnimateExpand';
import { Icon } from '../Icon';
import { icons } from '../../icons';
import type { WallTableProps } from './WallTable';

export type MobileWallSectionProps = WallTableProps & {
  expanded: boolean;
  onToggle: () => void;
};

export const MobileWallSection = memo(function MobileWallSection({
  tilesLeft,
  diceTotal,
  cutIndex,
  totalWallTiles = 136,
  expanded,
  onToggle,
}: MobileWallSectionProps) {
  return (
    <div className="border-t border-border/40 p-2">
      <WallTableCompact
        tilesLeft={tilesLeft}
        diceTotal={diceTotal}
        cutIndex={cutIndex}
        totalWallTiles={totalWallTiles}
      />
      <button
        type="button"
        onClick={onToggle}
        className="btn-secondary mt-2 flex w-full items-center justify-center gap-2 py-2.5 text-sm transition-[transform,box-shadow] duration-200 ease-out motion-reduce:transition-none active:scale-[0.99] motion-reduce:active:scale-100"
        aria-expanded={expanded}
      >
        <span>{expanded ? 'Hide full layout' : 'Full wall layout'}</span>
        <Icon
          src={icons.chevronDown}
          className={`size-4 shrink-0 transition-transform duration-300 ease-out motion-reduce:transition-none [&_.icon-svg]:size-4 ${
            expanded ? 'rotate-180' : ''
          }`}
          aria-hidden
        />
      </button>
      <AnimateExpand open={expanded} className="mt-1">
        <div className="max-h-[min(70vh,32rem)] overflow-y-auto overscroll-contain border-t border-border/30 pt-3">
          <div className="flex justify-center pb-2">
            <WallTable
              tilesLeft={tilesLeft}
              diceTotal={diceTotal}
              cutIndex={cutIndex}
              totalWallTiles={totalWallTiles}
            />
          </div>
        </div>
      </AnimateExpand>
    </div>
  );
});
