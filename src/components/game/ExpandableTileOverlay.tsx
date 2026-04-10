import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../Icon';
import { icons } from '../../icons';

export type OverlayPlacement = 'left' | 'right' | 'center';

/** Side seats get a side-aligned overlay; top / grid use centered panel. */
export function overlayPlacementForOpponentSeat(
  position: 'grid' | 'top' | 'top-flow' | 'left' | 'right',
): OverlayPlacement {
  if (position === 'left') return 'left';
  if (position === 'right') return 'right';
  return 'center';
}

function flexJustify(placement: OverlayPlacement): string {
  if (placement === 'left') return 'justify-start';
  if (placement === 'right') return 'justify-end';
  return 'justify-center';
}

/** Select-like control to open the tile overlay (shared with GameBoard + OpponentSeatCard). */
export function ExpandableSelectTrigger({
  onClick,
  children,
  textAlign = 'start',
}: {
  onClick: () => void;
  children: React.ReactNode;
  /** `end` for discard column / right seat. */
  textAlign?: 'start' | 'end';
}) {
  const align = textAlign === 'end' ? 'text-right' : 'text-left';
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-1 flex min-h-9 w-full max-w-full items-center justify-between gap-2 rounded-lg border border-border/70 bg-surface-panel-muted/25 px-2.5 py-2 text-xs text-on-surface shadow-sm transition-colors hover:border-border hover:bg-surface-panel-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-ring-focus) focus-visible:ring-offset-1 focus-visible:ring-offset-(--color-surface)"
      aria-haspopup="dialog"
    >
      <span className={`min-w-0 flex-1 truncate font-medium ${align}`}>{children}</span>
      <Icon
        src={icons.chevronDown}
        className="size-4 shrink-0 text-muted [&_.icon-svg]:size-4"
        aria-hidden
      />
    </button>
  );
}

/** A non-transparent "All" trigger button that keeps a stable ref for popover positioning. */
export const AllTilesButton = ({
  open,
  onClick,
  ariaLabel,
  title,
  btnRef,
}: {
  open: boolean;
  onClick: () => void;
  ariaLabel: string;
  title: string;
  btnRef?: RefObject<HTMLButtonElement>;
}) => (
  <button
    ref={btnRef}
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-1 rounded-md border border-border/50 bg-surface-panel px-2 py-1 text-xs font-medium text-on-surface shadow-sm hover:bg-surface-panel-muted/60"
    aria-label={ariaLabel}
    title={title}
  >
    <span>All</span>
    <Icon
      src={icons.chevronDown}
      className={`size-4 [&_.icon-svg]:size-4 transition-transform ${open ? 'rotate-180' : ''}`}
      aria-hidden
    />
  </button>
);

const POPOVER_W = 352;
const EDGE_GAP = 8;

export interface TilePopoverProps {
  open: boolean;
  onClose: () => void;
  /** Ref to the trigger button; used to position the popover. */
  anchorRef: RefObject<HTMLElement | null>;
  children: React.ReactNode;
  /** Align popover start/end edge to anchor's start/end edge. Default 'start'. */
  align?: 'start' | 'end';
}

/** Portal popover that auto-opens upward when the trigger is in the lower half of the viewport.
 *  Multiple can be open simultaneously — no backdrop, each has its own close button. */
export function TilePopover({ open, onClose, anchorRef, children, align = 'start' }: TilePopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<React.CSSProperties>({});

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    const viewH = window.innerHeight;
    const viewW = window.innerWidth;
    const openUp = r.top > viewH * 0.55;
    const rawLeft = align === 'end' ? r.right - POPOVER_W : r.left;
    const left = Math.max(EDGE_GAP, Math.min(rawLeft, viewW - POPOVER_W - EDGE_GAP));
    setPos({
      position: 'fixed',
      left,
      ...(openUp ? { bottom: viewH - r.top + 4 } : { top: r.bottom + 4 }),
    });
  }, [open, anchorRef, align]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      const outsidePopover = !popoverRef.current?.contains(target);
      const outsideAnchor = !anchorRef.current?.contains(target);
      if (outsidePopover && outsideAnchor) onClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [open, onClose, anchorRef]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={popoverRef}
      style={pos}
      className="z-[200] flex w-[min(22rem,90vw)] max-h-[min(80vh,28rem)] flex-col overflow-hidden rounded-xl border border-border/70 bg-surface-panel shadow-xl"
    >
      <div className="flex shrink-0 items-center justify-end border-b border-border/50 px-2 py-1">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-2 py-0.5 text-sm leading-none text-muted hover:bg-surface-panel-muted/60 hover:text-on-surface"
          aria-label="Close"
          title="Close"
        >
          ×
        </button>
      </div>
      <div className="min-h-0 overflow-y-auto overscroll-contain p-3">
        {children}
      </div>
    </div>,
    document.body,
  );
}

export interface ExpandableTileOverlayProps {
  open: boolean;
  onClose: () => void;
  title: string;
  placement: OverlayPlacement;
  children: React.ReactNode;
}

export function ExpandableTileOverlay({
  open,
  onClose,
  title,
  placement,
  children,
}: ExpandableTileOverlayProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] flex items-center p-3 sm:p-6 ${flexJustify(placement)}`}
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-(--color-surface)/20 backdrop-blur-[3px]"
        aria-label="Dismiss overlay"
        onClick={onClose}
      />
      <div
        className={`relative z-[101] flex max-h-[min(85vh,36rem)] w-[min(100vw-1.5rem,26rem)] flex-col overflow-hidden rounded-xl border border-border/70 bg-surface-panel/75 shadow-lg backdrop-blur-xl sm:max-w-lg ${
          placement === 'left' ? 'sm:ml-1' : placement === 'right' ? 'sm:mr-1' : ''
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/60 bg-surface-panel-muted/20 px-3 py-2 backdrop-blur-sm">
          <h2 id={titleId} className="min-w-0 truncate text-sm font-semibold text-on-surface">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg px-2 py-1 text-sm font-medium text-muted hover:bg-surface-panel-muted/50 hover:text-on-surface"
            aria-label="Close"
          >
            Close
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain bg-surface-panel-muted/10 p-3 backdrop-blur-sm">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
