import type { Tile } from '../types';
import { tileBackAssetPath, tileToAssetPath, tileToLabel } from '../lib/tileAssets';

export interface TileBackViewProps {
  className?: string;
  'aria-label'?: string;
  title?: string;
  'aria-hidden'?: boolean;
}

/** Renders the shared mahjong tile back SVG (concealed / face-down). */
export function TileBackView({
  className = 'h-12 w-9',
  'aria-label': ariaLabel = 'Face-down tile',
  title: titleProp,
  'aria-hidden': ariaHidden,
}: TileBackViewProps) {
  const src = tileBackAssetPath();
  const effectiveTitle = titleProp ?? (ariaHidden ? undefined : ariaLabel);

  const tileFace =
    'rounded-md bg-white border border-gray-300/90 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)]';

  const content = (
    <span className="relative h-full w-full flex items-center justify-center p-0.5">
      <img
        src={src}
        alt=""
        className="h-full w-full object-contain"
        loading="lazy"
        onError={(e) => {
          const target = e.currentTarget;
          target.style.display = 'none';
          const fallback = target.nextElementSibling;
          if (fallback instanceof HTMLElement) fallback.style.display = 'flex';
        }}
      />
      <span
        className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-muted p-1"
        style={{ display: 'none' }}
        aria-hidden
      >
        ?
      </span>
    </span>
  );

  return (
    <span
      className={`inline-flex items-center justify-center overflow-hidden ${tileFace} ${className}`}
      title={effectiveTitle}
      {...(ariaHidden ? { 'aria-hidden': true } : { 'aria-label': ariaLabel, role: 'img' })}
    >
      {content}
    </span>
  );
}

export interface TileViewProps {
  tile: Tile;
  /** Optional size (e.g. 'h-12 w-9' or 'h-16 w-12'). Defaults to reasonable hand size. */
  className?: string;
  /** When true, show as button (for discard selection). */
  asButton?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  /** Visual emphasis (e.g. selected for discard). */
  selected?: boolean;
  'aria-label'?: string;
  title?: string;
}

export function TileView({
  tile,
  className = 'h-12 w-9',
  asButton,
  onClick,
  disabled,
  selected,
  'aria-label': ariaLabel,
  title: titleProp,
}: TileViewProps) {
  const label = tileToLabel(tile);
  const src = tileToAssetPath(tile);
  const effectiveTitle = titleProp ?? label;
  const effectiveAriaLabel = ariaLabel ?? label;

  const content = (
    <span className="relative h-full w-full flex items-center justify-center p-0.5">
      <img
        src={src}
        alt=""
        className="h-full w-full object-contain"
        loading="lazy"
        onError={(e) => {
          const target = e.currentTarget;
          target.style.display = 'none';
          const fallback = target.nextElementSibling;
          if (fallback instanceof HTMLElement) fallback.style.display = 'inline';
        }}
      />
      <span
        className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700 p-1"
        style={{ display: 'none' }}
        aria-hidden
      >
        {label}
      </span>
    </span>
  );

  const tileFace =
    'rounded-md bg-white border border-gray-300/90 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)]';

  const tileButtonHover =
    'hover:border-gray-500 hover:shadow-[0_2px_6px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] active:scale-[0.98]';

  const selectedLift =
    'relative z-10 -translate-y-1.5 border-[3px] border-(--color-ring-focus) shadow-[0_10px_22px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.95)] sm:-translate-y-2';

  if (asButton) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={effectiveAriaLabel}
        title={effectiveTitle}
        aria-pressed={selected ? true : undefined}
        className={`cursor-pointer inline-flex items-center justify-center overflow-hidden min-w-0 min-h-0 transition-[transform,box-shadow,border-color] duration-150 ${tileFace} ${tileButtonHover} focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-ring-focus) focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${className} ${
          selected ? selectedLift : ''
        }`}
      >
        {content}
      </button>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center overflow-hidden ${tileFace} ${className}`}
      title={effectiveTitle}
      aria-label={effectiveAriaLabel}
    >
      {content}
    </span>
  );
}
