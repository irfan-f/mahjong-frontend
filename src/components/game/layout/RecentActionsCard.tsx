import type { Game, WindTileValue } from '../../../types';
import { TileView } from '../../TileView';
import { buildRecentActions, buildRecentActionsFromActionHistory, meldTypeToLabel, windToColorClass, windToLetter } from './gameHudModel';

export function RecentActionsCard({
  game,
  windByPlayer,
}: {
  game: Game;
  windByPlayer: Record<string, WindTileValue>;
}) {
  const actions =
    (game.actionHistory?.length ?? 0) > 0
      ? buildRecentActionsFromActionHistory(game.actionHistory, windByPlayer)
      : buildRecentActions(game, windByPlayer);

  const visible = actions.slice(0, 12);

  return (
    <section
      className="flex h-full min-h-0 flex-col gap-[var(--game-hud-v-gap)] rounded-2xl border border-border bg-surface p-[var(--game-hud-v-pad)] max-[520px]:p-3"
      aria-label="Recent actions"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="text-sm font-black text-on-surface">Recent</div>
        <div className="text-xs" aria-label={`${game.tilesLeft} tiles in the wall`}>
          <span className="font-black tabular-nums text-on-surface">{game.tilesLeft}</span>{' '}
          <span className="text-muted">Tiles</span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {visible.length === 0 ? (
          <div className="flex min-h-full items-center justify-center rounded-xl border border-dashed border-border/40 bg-surface-panel-muted/10 px-3 py-6 text-center">
            <span className="text-sm font-black text-muted">No actions yet</span>
          </div>
        ) : (
          <ol className="flex flex-col gap-2">
            {visible.map((a, i) => {
              const actorLetter = windToLetter(a.actorWind);
              const actorColor = windToColorClass(a.actorWind);

              if (a.kind === 'discard') {
                return (
                  <li key={`discard-${a.actorId}-${i}`} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface-panel px-3 py-2">
                    <div className="min-w-0 text-xs font-black text-on-surface">
                      <span className={actorColor}>{actorLetter}</span>{' '}
                      <span className="text-muted">discards</span>
                    </div>
                    <div className="shrink-0">
                      <TileView tile={a.tile} className="h-8 w-6 shadow-none" />
                    </div>
                  </li>
                );
              }

              if (a.kind === 'draw') {
                return (
                  <li key={`draw-${a.actorId}-${i}`} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface-panel px-3 py-2">
                    <div className="min-w-0 text-xs font-black text-on-surface">
                      <span className={actorColor}>{actorLetter}</span>{' '}
                      <span className="text-muted">draws</span>
                    </div>
                    <div className="shrink-0 text-xs font-black text-muted" aria-hidden>
                      —
                    </div>
                  </li>
                );
              }

              const fromLetter = windToLetter(a.fromWind);
              const fromColor = windToColorClass(a.fromWind);
              return (
                <li key={`claim-${a.actorId}-${a.fromId}-${i}`} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface-panel px-3 py-2">
                  <div className="min-w-0 text-xs font-black text-on-surface">
                    <span className={actorColor}>{actorLetter}</span>{' '}
                    <span className="text-muted">claims</span>{' '}
                    <span className="text-on-surface">{meldTypeToLabel(a.meldType)}</span>{' '}
                    <span className="text-muted">from</span>{' '}
                    <span className={fromColor}>{fromLetter}</span>
                  </div>
                  {a.claimedTile ? (
                    <div className="shrink-0">
                      <TileView tile={a.claimedTile} className="h-8 w-6 shadow-none" />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}

