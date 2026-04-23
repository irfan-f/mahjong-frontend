/** Reserves strip height/width when empty so the strip does not jump when tiles appear. */
export function TileStripPlaceholder({ tileClass }: { tileClass: string }) {
  return (
    <span
      className={`${tileClass} shrink-0 rounded-sm border border-dashed border-border/50 bg-surface-panel-muted/25 shadow-none`}
      aria-hidden
    />
  );
}

/** Empty melds row: dashed pill with three tile-sized placeholders (opponent HUD pattern). */
export function EmptyMeldsStripPlaceholder({ tileClass }: { tileClass: string }) {
  return (
    <div
      className="flex shrink-0 items-center gap-1 rounded-full border border-dashed border-border/50 bg-surface-panel-muted/20 px-3 py-1"
      aria-hidden
    >
      <TileStripPlaceholder tileClass={tileClass} />
      <TileStripPlaceholder tileClass={tileClass} />
      <TileStripPlaceholder tileClass={tileClass} />
    </div>
  );
}
