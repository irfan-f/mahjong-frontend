import type { Game, Tile, WindTileValue } from '../../../types';
import type React from 'react';
import { TileView } from '../../TileView';
import { buildRecentActions, windToColorClass, windToLetter } from './gameHudModel';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { meldDisplayTerm } from '../../../terminology/rulesetTerminology';

function RecentRow({
  tile,
  text,
  latest,
  tileClass,
}: {
  tile: Tile | null;
  text: React.ReactNode;
  latest?: boolean;
  tileClass: string;
}) {
  return (
    <li
      className={[
        'flex min-w-0 items-baseline justify-between gap-2 border-t border-border pt-2.5 first:border-t-0 first:pt-0',
        latest ? 'recent-row-latest' : '',
      ].join(' ')}
    >
      <span className="inline-flex min-w-0 items-center gap-2.5">
        {tile ? <TileView tile={tile} className={`${tileClass} shrink-0 shadow-none`} /> : <span className={`${tileClass} shrink-0 opacity-0`} aria-hidden />}
        <span
          className={[
            'min-w-0 truncate text-sm font-black',
            latest ? 'text-on-surface' : 'text-muted',
          ].join(' ')}
        >
          {text}
        </span>
      </span>
    </li>
  );
}

export function RecentActionsCard({
  game,
  windByPlayer,
}: {
  game: Game;
  windByPlayer: Record<string, WindTileValue>;
}) {
  const shortH = useMediaQuery('(max-height: 680px)');
  const tileClass = 'tile-strip';
  const actions = buildRecentActions(game, windByPlayer).slice(0, shortH ? 2 : 3);

  return (
    <section
      className="flex flex-col gap-[var(--game-hud-v-gap)] rounded-2xl border border-border bg-surface p-[var(--game-hud-v-pad)] max-[520px]:p-3"
      aria-label="Recent actions"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="text-sm font-black text-on-surface">Recent</div>
        <div className="text-xs" aria-label={`${game.tilesLeft} tiles in the wall`}>
          <span className="font-black tabular-nums text-on-surface">{game.tilesLeft}</span>{' '}
          <span className="text-muted">Tiles</span>
        </div>
      </div>

      <ul className="m-0 grid list-none gap-2.5 p-0" aria-label="Recent actions list">
        {actions.length === 0 ? (
          <li className="text-sm text-muted">No recent actions yet.</li>
        ) : (
          actions.map((a, idx) => {
            if (a.kind === 'claim') {
              const actor = windToLetter(a.actorWind);
              const from = windToLetter(a.fromWind);
              const actorClass = windToColorClass(a.actorWind);
              const fromClass = windToColorClass(a.fromWind);
              const meldLabel =
                a.meldType === 'pong'
                  ? 'Pong'
                  : a.meldType === 'chow'
                    ? 'Chow'
                    : meldDisplayTerm(game.ruleSetId, 'fullSet');
              return (
                <RecentRow
                  key={`claim-${a.actorId}-${idx}`}
                  tile={a.claimedTile ?? null}
                  text={
                    <>
                      <span className={actorClass}>{actor}</span> {meldLabel}{' '}
                      <span className={fromClass}>{from}</span>
                    </>
                  }
                  latest={idx === 0}
                  tileClass={tileClass}
                />
              );
            }
            if (a.kind === 'discard') {
              const actor = windToLetter(a.actorWind);
              const actorClass = windToColorClass(a.actorWind);
              return (
                <RecentRow
                  key={`discard-${a.actorId}-${idx}`}
                  tile={a.tile}
                  text={
                    <>
                      <span className={actorClass}>{actor}</span> discarded
                    </>
                  }
                  latest={idx === 0}
                  tileClass={tileClass}
                />
              );
            }
          })
        )}
      </ul>
    </section>
  );
}

