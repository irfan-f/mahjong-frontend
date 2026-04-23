import type { ReactNode } from 'react';
import type { Game as GameType, WindTileValue } from '../../types';
import { HudActionButton } from './HudActionButton';
import { TileBackView, TileView } from '../TileView';

export function windToDisplayName(wind: WindTileValue): string {
  return wind === 'east'
    ? 'East'
    : wind === 'south'
      ? 'South'
      : wind === 'west'
        ? 'West'
        : 'North';
}

export function isPreDealPhase(game: GameType): boolean {
  return !game.initialization?.tilesDealt;
}

export function previousPlayerId(game: GameType): string | null {
  const ids = game.playerIds ?? [];
  if (ids.length === 0) return null;
  const idx = game.currentPlayer ? ids.indexOf(game.currentPlayer) : -1;
  if (idx < 0) return null;
  return ids[(idx + ids.length - 1) % ids.length] ?? null;
}

export function GameTopCluster({
  game,
  currentUserId,
  windByPlayer,
  previousTurnPlayerId,
  isEnded,
  getPlayerLabel,
}: {
  game: GameType;
  currentUserId: string;
  windByPlayer: Record<string, WindTileValue>;
  previousTurnPlayerId: string | null;
  isEnded: boolean;
  getPlayerLabel: (pid: string) => string;
}) {
  return (
    <section className="panel rounded-xl border border-border bg-surface-panel p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold">
          Turn: {game.currentPlayer ? getPlayerLabel(game.currentPlayer) : '—'}
        </div>
        <div className="text-xs text-muted">
          {isEnded ? 'Game ended' : previousTurnPlayerId ? `Previous: ${getPlayerLabel(previousTurnPlayerId)}` : null}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted">
        {(game.playerIds ?? []).map((pid) => (
          <span key={pid} className="rounded-md border border-border/50 bg-surface px-2 py-1">
            {pid === currentUserId ? 'You' : getPlayerLabel(pid)} {windByPlayer[pid] ? `(${windToDisplayName(windByPlayer[pid])})` : ''}
          </span>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(game.playerIds ?? []).map((pid) => {
          const melds = game.playerMelds?.[pid] ?? [];
          if (melds.length === 0) return null;
          return (
            <div key={pid} className="rounded-lg border border-border/50 bg-surface p-2">
              <div className="text-xs font-bold text-muted mb-2">
                {pid === currentUserId ? 'Your melds' : `${getPlayerLabel(pid)} melds`}
              </div>
              <div className="flex flex-col gap-2">
                {melds.map((m) => (
                  <div key={m.meldId} className="flex flex-wrap items-center gap-1.5" title={m.type}>
                    {Array.isArray(m.tiles)
                      ? m.tiles.map((t, i) => <TileView key={`${m.meldId}-${i}`} tile={t} className="h-10 w-7" />)
                      : Array.from({ length: m.tileCount ?? 0 }).map((_, i) => (
                          <TileBackView key={`${m.meldId}-back-${i}`} className="h-10 w-7" />
                        ))}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function ScoreboardYouIdentityBar({
  displayName,
  windLabel,
  inlineStatus,
  acting,
  waitingOnBot,
  isMyTurn,
  isEnded,
}: {
  displayName: string;
  windLabel?: string;
  wind?: WindTileValue;
  showDealerBadge?: boolean;
  inlineStatus: string | null;
  acting: boolean;
  waitingOnBot: boolean;
  isMyTurn: boolean;
  isEnded: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="truncate text-sm font-black">{displayName}</div>
        <div className="text-xs text-muted">
          {windLabel ? `${windLabel} wind` : null}
          {windLabel && inlineStatus ? ' • ' : null}
          {inlineStatus}
        </div>
      </div>
      <div className="text-xs text-muted">
        {isEnded ? 'Ended' : acting ? 'Acting…' : waitingOnBot ? 'Waiting on bot…' : isMyTurn ? 'Your turn' : '—'}
      </div>
    </div>
  );
}

export function ScoreboardYouInflowStrips(props: {
  myDiscards?: unknown;
  myMelds?: unknown;
  children?: ReactNode;
}) {
  return <div className="flex flex-col gap-2">{props.children}</div>;
}

export function ScoreboardYouHudActionBar({
  acting,
  mobileDrawCta,
  mobileDiscardCta,
  onDraw,
  selectedDiscardTile,
  onDiscardSelected,
  showNudgeBots,
  onNudgeBots,
  canConcealedChow,
  concealedChowActive,
  concealedChowClaimReady,
  onToggleConcealedChow,
  onClaimChow,
  canConcealedPong,
  concealedPongActive,
  concealedPongClaimReady,
  onToggleConcealedPong,
  onClaimPong,
  canConcealedKong,
  concealedKongActive,
  kongButtonLabel,
  onToggleConcealedKong,
}: {
  acting: boolean;
  mobileDrawCta: boolean;
  mobileDiscardCta: boolean;
  onDraw: () => void;
  selectedDiscardTile: unknown | null;
  onDiscardSelected: () => void;
  showNudgeBots: boolean;
  onNudgeBots: (() => void | Promise<void>) | null;
  canConcealedChow: boolean;
  concealedChowActive: boolean;
  concealedChowClaimReady: boolean;
  onToggleConcealedChow: () => void;
  onClaimChow?: () => void;
  canConcealedPong: boolean;
  concealedPongActive: boolean;
  concealedPongClaimReady: boolean;
  onToggleConcealedPong: () => void;
  onClaimPong?: () => void;
  canConcealedKong: boolean;
  concealedKongActive: boolean;
  kongButtonLabel?: string;
  onToggleConcealedKong: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 pt-2">
      {mobileDrawCta ? (
        <HudActionButton onClick={onDraw} disabled={acting} aria-label="Draw tile">
          Draw
        </HudActionButton>
      ) : null}
      {mobileDiscardCta ? (
        <HudActionButton
          variant="danger"
          onClick={onDiscardSelected}
          disabled={acting || selectedDiscardTile == null}
          aria-label="Discard selected tile"
        >
          Discard
        </HudActionButton>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {canConcealedChow ? (
          <HudActionButton
            variant={concealedChowActive ? (concealedChowClaimReady ? 'primary' : 'secondary') : 'secondary'}
            onClick={onToggleConcealedChow}
            disabled={acting}
          >
            Chow
          </HudActionButton>
        ) : null}
        {concealedChowActive && concealedChowClaimReady && onClaimChow ? (
          <HudActionButton onClick={onClaimChow} disabled={acting}>
            Confirm Chow
          </HudActionButton>
        ) : null}
        {canConcealedPong ? (
          <HudActionButton
            variant={concealedPongActive ? (concealedPongClaimReady ? 'primary' : 'secondary') : 'secondary'}
            onClick={onToggleConcealedPong}
            disabled={acting}
          >
            Pong
          </HudActionButton>
        ) : null}
        {concealedPongActive && concealedPongClaimReady && onClaimPong ? (
          <HudActionButton onClick={onClaimPong} disabled={acting}>
            Claim pong
          </HudActionButton>
        ) : null}
        {canConcealedKong ? (
          <HudActionButton
            variant={concealedKongActive ? 'primary' : 'secondary'}
            onClick={onToggleConcealedKong}
            disabled={acting}
          >
            {kongButtonLabel ?? 'Kong'}
          </HudActionButton>
        ) : null}
        {showNudgeBots && onNudgeBots ? (
          <HudActionButton variant="secondary" onClick={() => void onNudgeBots()} disabled={acting}>
            Nudge bots
          </HudActionButton>
        ) : null}
      </div>
    </div>
  );
}

