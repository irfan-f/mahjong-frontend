import type { Tile } from '../../../types';
import { tileToLabel } from '../../../lib/tileAssets';
import { Spinner } from '../../Spinner';
import type { WindTileValue } from '../../../types';
import { windToColorClass } from './gameHudModel';
import { HudActionButton } from '../HudActionButton';

function TurnIndicatorPlay() {
  return (
    <span className="relative inline-flex size-[clamp(1.5rem,3.2vw,2.1rem)] shrink-0 items-center justify-center">
      <span className="turn-indicator-frame" aria-hidden />
      <span className="relative z-10 text-[clamp(0.7rem,2vw,0.9rem)] font-black leading-none text-(--color-primary) [text-shadow:0_1px_0_rgba(0,0,0,0.08)] dark:[text-shadow:0_1px_0_rgba(0,0,0,0.25)]">
        ▶
      </span>
    </span>
  );
}

export type ScoreboardYouIdentityBarProps = {
  displayName: string;
  windLabel?: string;
  wind?: WindTileValue;
  showDealerBadge: boolean;
  inlineStatus?: string | null;
  acting: boolean;
  waitingOnBot: boolean;
  isMyTurn: boolean;
  isEnded: boolean;
};

export function ScoreboardYouIdentityBar({
  displayName,
  windLabel,
  wind,
  showDealerBadge,
  inlineStatus,
  acting,
  waitingOnBot,
  isMyTurn,
  isEnded,
}: ScoreboardYouIdentityBarProps) {
  const showSpinner = !isEnded && (acting || waitingOnBot);
  const showTurnIndicator = !isEnded && isMyTurn && !showSpinner;

  return (
    <div className="flex min-w-0 items-center justify-between gap-2 border-b border-border/25 pb-2">
      <div className="flex min-w-0 flex-wrap items-baseline gap-2">
        <span className="min-w-0 truncate text-xs font-black text-on-surface sm:text-sm">{displayName}</span>
        {windLabel ? (
          <span
            className={[
              'shrink-0 whitespace-nowrap rounded-full border border-border bg-surface-panel px-2 py-0.5 text-[0.72rem] font-black sm:py-1 sm:text-[0.78rem]',
              windToColorClass(wind),
            ].join(' ')}
          >
            {windLabel}
          </span>
        ) : null}
        {showDealerBadge ? <span className="badge-dealer">Dealer</span> : null}
      </div>
      {inlineStatus ? (
        <span
          className="min-w-0 max-w-[10.5rem] flex-1 truncate whitespace-nowrap px-1 text-center text-[0.7rem] font-medium text-muted sm:max-w-none sm:px-2 sm:text-xs"
          role="status"
        >
          {inlineStatus}
        </span>
      ) : null}
      {showTurnIndicator ? (
        <span className="inline-flex shrink-0 items-center gap-1" title="Your turn">
          <span className="sr-only">Your turn</span>
          <TurnIndicatorPlay />
        </span>
      ) : null}
    </div>
  );
}

export type ScoreboardYouHudActionBarProps = {
  acting: boolean;
  mobileDrawCta: boolean;
  mobileDiscardCta: boolean;
  onDraw: () => void;
  selectedDiscardTile: Tile | null;
  onDiscardSelected: () => void;
  showNudgeBots?: boolean;
  onNudgeBots?: (() => void | Promise<void>) | null;
  canConcealedChow: boolean;
  concealedChowActive: boolean;
  concealedChowClaimReady: boolean;
  onToggleConcealedChow: () => void;
  onClaimChow: () => void;
  /** Concealed pong (mirrors Chow: rail is hidden on small viewports, so these live in the scoreboard bar). */
  canConcealedPong: boolean;
  concealedPongActive: boolean;
  concealedPongClaimReady: boolean;
  onToggleConcealedPong: () => void;
  onClaimPong: () => void;
  canConcealedKong: boolean;
  concealedKongActive: boolean;
  kongButtonLabel: string;
  onToggleConcealedKong: () => void;
};

export function ScoreboardYouHudActionBar({
  acting,
  mobileDrawCta,
  mobileDiscardCta,
  onDraw,
  selectedDiscardTile,
  onDiscardSelected,
  showNudgeBots = false,
  onNudgeBots = null,
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
}: ScoreboardYouHudActionBarProps) {
  return (
    <div
      className="flex min-w-0 shrink-0 flex-wrap items-center justify-center gap-2 border-t border-border/30 pt-2"
      role="region"
      aria-label="Your quick actions"
    >
      {showNudgeBots && onNudgeBots ? (
        <HudActionButton
          variant="secondary"
          onClick={() => void onNudgeBots()}
          disabled={acting}
          aria-label="Nudge bots"
          title="Nudge bots"
        >
          Nudge
        </HudActionButton>
      ) : null}
      {canConcealedChow ? (
        <>
          <HudActionButton
            variant="soft"
            onClick={onToggleConcealedChow}
            disabled={acting}
            className={
              concealedChowActive
                ? 'border-(--color-danger) bg-(--color-danger)/10 text-(--color-danger)'
                : 'border-(--color-claim-chow) bg-(--color-claim-chow)/10 text-(--color-claim-chow)'
            }
            aria-label={concealedChowActive ? 'Cancel chow selection' : 'Chow'}
            aria-pressed={concealedChowActive}
            title="Chow"
          >
            {concealedChowActive ? `Cancel` : 'Chow'}
          </HudActionButton>
          {concealedChowActive ? (
            <HudActionButton
              variant="primary"
              onClick={onClaimChow}
              disabled={acting || !concealedChowClaimReady}
              aria-label="Claim chow"
              title="Claim"
            >
              Claim
            </HudActionButton>
          ) : null}
        </>
      ) : null}
      {canConcealedPong ? (
        <>
          <HudActionButton
            variant="soft"
            onClick={onToggleConcealedPong}
            disabled={acting}
            className={
              concealedPongActive
                ? 'border-(--color-danger) bg-(--color-danger)/10 text-(--color-danger)'
                : 'border-(--color-claim-pong) bg-(--color-claim-pong)/10 text-(--color-claim-pong)'
            }
            aria-label={concealedPongActive ? 'Cancel pong selection' : 'Pong'}
            aria-pressed={concealedPongActive}
            title="Pong"
          >
            {concealedPongActive ? 'Cancel' : 'Pong'}
          </HudActionButton>
          {concealedPongActive ? (
            <HudActionButton
              variant="primary"
              onClick={onClaimPong}
              disabled={acting || !concealedPongClaimReady}
              aria-label="Claim pong"
              title="Claim"
            >
              Claim
            </HudActionButton>
          ) : null}
        </>
      ) : null}
      {canConcealedKong ? (
        <HudActionButton
          variant="soft"
          onClick={onToggleConcealedKong}
          disabled={acting}
          className={
            concealedKongActive
              ? 'border-(--color-danger) bg-(--color-danger)/10 text-(--color-danger)'
              : 'border-(--color-claim-kong) bg-(--color-claim-kong)/10 text-(--color-claim-kong)'
          }
          aria-label={concealedKongActive ? `Cancel ${kongButtonLabel} selection` : kongButtonLabel}
          aria-pressed={concealedKongActive}
          title={kongButtonLabel}
        >
          {concealedKongActive ? 'Cancel' : kongButtonLabel}
        </HudActionButton>
      ) : null}
      {mobileDrawCta ? (
        <HudActionButton
          variant="primary"
          onClick={onDraw}
          disabled={acting}
          aria-label={acting && mobileDrawCta ? 'Drawing' : 'Draw a tile'}
          title={mobileDrawCta ? 'Draw from wall' : undefined}
        >
          {acting && mobileDrawCta ? <Spinner className="size-3.5" /> : null}
          Draw
        </HudActionButton>
      ) : null}
      {mobileDiscardCta ? (
        <HudActionButton
          variant="softDanger"
          disabled={acting || selectedDiscardTile == null}
          onClick={onDiscardSelected}
          className="border-(--color-danger) bg-(--color-danger)/10 text-(--color-danger)"
          aria-label={
            selectedDiscardTile == null ? 'Select a tile to discard' : `Discard ${tileToLabel(selectedDiscardTile)}`
          }
          title="Discard selected tile"
        >
          {acting && mobileDiscardCta && selectedDiscardTile ? <Spinner className="size-3.5" /> : null}
          Discard
        </HudActionButton>
      ) : null}
    </div>
  );
}
