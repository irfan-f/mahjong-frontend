import type { Game, WindTileValue } from '../../../types';
import { buildRecentActions } from './gameHudModel';

export function RecentActionsCard({
  game,
  windByPlayer,
}: {
  game: Game;
  windByPlayer: Record<string, WindTileValue>;
}) {
  // Keep the action builder "warm" (and verified) but do not render it yet.
  void buildRecentActions(game, windByPlayer);

  return (
    <section
      className="flex min-h-0 flex-col gap-[var(--game-hud-v-gap)] rounded-2xl border border-border bg-surface p-[var(--game-hud-v-pad)] max-[520px]:p-3"
      aria-label="Recent actions"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="text-sm font-black text-on-surface">Recent</div>
        <div className="text-xs" aria-label={`${game.tilesLeft} tiles in the wall`}>
          <span className="font-black tabular-nums text-on-surface">{game.tilesLeft}</span>{' '}
          <span className="text-muted">Tiles</span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl border border-dashed border-border/40 bg-surface-panel-muted/10 px-3 py-6 text-center">
        <span className="text-sm font-black text-muted">Work in Progress</span>
      </div>
    </section>
  );
}

