import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import type { LegalAction, Tile } from '../../../types';
import type { SelectedClaimGroup } from './claimSelection';
import { TileView } from '../../TileView';
import { HudActionButton } from '../HudActionButton';
import { tileToLabel } from '../../../lib/tileAssets';

type Layout = 'sheet' | 'modal';

function groupLabel(group: SelectedClaimGroup): string {
  if (group === 'pong') return 'Pong';
  if (group === 'kong') return 'Kong';
  return 'Chow';
}

export function ClaimPrompt({
  layout,
  headline,
  claimSecondsLeft,
  claimWindowTotalSeconds,
  onDismiss,
  acting,
  useGroupSelectMode,
  selectedClaimGroup,
  setSelectedClaimGroup,
  canClaimPong,
  pongMeldPreview,
  canClaimKong,
  kongMeldPreview,
  kongSetLabel,
  canClaimChow,
  chowClaimActions,
  lastDiscardedTile,
  onClaimPong,
  onClaimKong,
  onClaimChow,
  canPassClaim,
  onPassClaim,
}: {
  layout: Layout;
  headline: string;
  claimSecondsLeft: number;
  claimWindowTotalSeconds: number;
  onDismiss: () => void;
  acting: boolean;
  useGroupSelectMode: boolean;
  selectedClaimGroup: SelectedClaimGroup | null;
  setSelectedClaimGroup: Dispatch<SetStateAction<SelectedClaimGroup | null>>;
  canClaimPong: boolean;
  pongMeldPreview: Tile[] | null;
  canClaimKong: boolean;
  kongMeldPreview: Tile[] | null;
  kongSetLabel: string;
  canClaimChow: boolean;
  chowClaimActions: Extract<LegalAction, { kind: 'claimChow' }>[];
  lastDiscardedTile: Tile | null;
  onClaimPong: () => void;
  onClaimKong: () => void;
  onClaimChow: (chowVariantId?: string) => void;
  canPassClaim: boolean;
  onPassClaim: () => void;
}) {
  const [selectedChowVariantId, setSelectedChowVariantId] = useState<string | null>(null);

  const chowOptions = useMemo(
    () =>
      chowClaimActions.map((a) => ({
        variantId: a.variantId,
        meld: a.meld,
        label: `Chow: ${a.meld.map(tileToLabel).join(', ')}`,
      })),
    [chowClaimActions],
  );

  const containerTone =
    layout === 'sheet'
      ? 'fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border border-border bg-surface p-4 shadow-lg'
      : 'panel rounded-xl border border-border bg-surface p-4 shadow-sm';

  const progress =
    claimWindowTotalSeconds > 0
      ? Math.max(0, Math.min(1, claimSecondsLeft / claimWindowTotalSeconds))
      : 0;

  const showGroupSelector =
    useGroupSelectMode && (canClaimPong || canClaimKong || chowClaimActions.length > 1);

  return (
    <section className={containerTone} aria-label="Claim prompt">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-black">{headline}</div>
          <div className="mt-1 text-xs text-muted">
            {claimSecondsLeft}s left
          </div>
        </div>
        <HudActionButton variant="secondary" onClick={onDismiss} disabled={acting} aria-label="Dismiss claim prompt">
          Dismiss
        </HudActionButton>
      </div>

      <div className="mt-2 h-1.5 w-full overflow-hidden rounded bg-surface-panel-muted/50" aria-hidden>
        <div className="h-full bg-(--color-primary)" style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>

      {showGroupSelector ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {canClaimPong ? (
            <HudActionButton
              variant={selectedClaimGroup === 'pong' ? 'primary' : 'secondary'}
              onClick={() => setSelectedClaimGroup('pong')}
              disabled={acting}
            >
              Pong
            </HudActionButton>
          ) : null}
          {canClaimKong ? (
            <HudActionButton
              variant={selectedClaimGroup === 'kong' ? 'primary' : 'secondary'}
              onClick={() => setSelectedClaimGroup('kong')}
              disabled={acting}
            >
              Kong
            </HudActionButton>
          ) : null}
          {chowClaimActions.map((a) => (
            <HudActionButton
              key={a.variantId}
              variant={
                typeof selectedClaimGroup === 'object' &&
                selectedClaimGroup != null &&
                selectedClaimGroup.kind === 'chow' &&
                selectedClaimGroup.chowVariantId === a.variantId
                  ? 'primary'
                  : 'secondary'
              }
              onClick={() => setSelectedClaimGroup({ kind: 'chow', chowVariantId: a.variantId })}
              disabled={acting}
            >
              Chow
            </HudActionButton>
          ))}
        </div>
      ) : null}

      <div className="mt-3 flex flex-col gap-2">
        {canClaimPong && (!showGroupSelector || selectedClaimGroup === 'pong' || selectedClaimGroup == null) ? (
          <HudActionButton onClick={onClaimPong} disabled={acting} aria-label="Claim pong">
            <span className="inline-flex items-center justify-center gap-2">
              <span>Claim Pong</span>
              {lastDiscardedTile ? <TileView tile={lastDiscardedTile} className="h-8 w-6 shadow-none" /> : null}
            </span>
          </HudActionButton>
        ) : null}
        {canClaimKong && (!showGroupSelector || selectedClaimGroup === 'kong' || selectedClaimGroup == null) ? (
          <HudActionButton onClick={onClaimKong} disabled={acting} aria-label={`Claim kong (${kongSetLabel})`}>
            <span className="inline-flex items-center justify-center gap-2">
              <span>Claim {kongSetLabel}</span>
              {lastDiscardedTile ? <TileView tile={lastDiscardedTile} className="h-8 w-6 shadow-none" /> : null}
            </span>
          </HudActionButton>
        ) : null}
        {canClaimChow &&
        (!showGroupSelector ||
          (selectedClaimGroup != null && typeof selectedClaimGroup === 'object' && selectedClaimGroup.kind === 'chow') ||
          selectedClaimGroup == null) ? (
          <div className="flex flex-col gap-2">
            {chowOptions.map((o) => (
              <HudActionButton
                key={o.variantId}
                variant={selectedChowVariantId === o.variantId ? 'primary' : 'secondary'}
                onClick={() => {
                  setSelectedChowVariantId(o.variantId);
                  setSelectedClaimGroup({ kind: 'chow', chowVariantId: o.variantId });
                }}
                disabled={acting}
                aria-label={o.label}
              >
                <span className="flex w-full items-center justify-between gap-3">
                  <span className="shrink-0 font-black">Chow</span>
                  <span className="flex shrink-0 items-center gap-1" aria-hidden>
                    {o.meld.map((t, i) => (
                      <TileView key={`${o.variantId}-${i}`} tile={t} className="h-8 w-6 shadow-none" />
                    ))}
                  </span>
                </span>
              </HudActionButton>
            ))}
            {selectedChowVariantId ? (
              <HudActionButton
                onClick={() => onClaimChow(selectedChowVariantId)}
                disabled={acting}
                aria-label="Confirm Chow"
              >
                Confirm Chow
              </HudActionButton>
            ) : null}
          </div>
        ) : null}
        {canPassClaim ? (
          <HudActionButton variant="secondary" onClick={onPassClaim} disabled={acting} aria-label="Pass claim">
            Pass
          </HudActionButton>
        ) : null}
      </div>

      {(pongMeldPreview || kongMeldPreview || lastDiscardedTile) ? (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
          {pongMeldPreview?.map((t, i) => (
            <TileView key={`pong-${i}`} tile={t} className="h-10 w-7" />
          ))}
          {kongMeldPreview?.map((t, i) => (
            <TileView key={`kong-${i}`} tile={t} className="h-10 w-7" />
          ))}
          {lastDiscardedTile ? <TileView tile={lastDiscardedTile} className="h-10 w-7" /> : null}
        </div>
      ) : null}

      {showGroupSelector && selectedClaimGroup ? (
        <p className="mt-2 text-center text-xs text-muted">Selected: {groupLabel(selectedClaimGroup)}</p>
      ) : null}
    </section>
  );
}

