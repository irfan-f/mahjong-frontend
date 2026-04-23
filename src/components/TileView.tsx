import type { Tile } from '../types';
import { tileBackAssetPath, tileToAssetPath, tileToLabel } from '../lib/tileAssets';
import { useTileLabel } from '../contexts/TileLabelContext';

const WIND_SHORT: Record<string, string> = { east: 'E', south: 'S', west: 'W', north: 'N' };
const DRAGON_SHORT: Record<string, string> = { red: '中', green: '發', white: '白' };

function tileCompactLabel(tile: Tile): string {
  if (tile._type === 'character' || tile._type === 'dot' || tile._type === 'stick')
    return String(tile.value);
  if (tile._type === 'wind') return WIND_SHORT[tile.value] ?? String(tile.value);
  if (tile._type === 'dragon') return DRAGON_SHORT[tile.value] ?? String(tile.value);
  return '';
}

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

  const content = (
    <span className="relative h-full w-full flex items-center justify-center p-0">
      <img
        src={src}
        alt=""
        draggable={false}
        className="h-full w-full max-w-none object-contain object-center select-none"
        loading="lazy"
        onError={(e) => {
          const target = e.currentTarget;
          target.style.display = 'none';
          const fallback = target.nextElementSibling;
          if (fallback instanceof HTMLElement) fallback.style.display = 'flex';
        }}
      />
      <span
        className="absolute inset-0 flex items-center justify-center text-[0.625rem] font-medium text-muted p-1"
        style={{ display: 'none' }}
        aria-hidden
      >
        ?
      </span>
    </span>
  );

  return (
    <span
      className={`tile-face inline-flex items-center justify-center overflow-hidden select-none ${className}`}
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
  /** Border/focus accent when `selected` is true: discard, meld/claim, or default. */
  selectedTone?: 'default' | 'danger' | 'primary';
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
  selectedTone = 'default',
  'aria-label': ariaLabel,
  title: titleProp,
}: TileViewProps) {
  const showLabel = useTileLabel();
  const label = tileToLabel(tile);
  const src = tileToAssetPath(tile);
  const effectiveTitle = titleProp ? `${label} — ${titleProp}` : label;
  const effectiveAriaLabel = ariaLabel
    ? (ariaLabel.includes(label) ? ariaLabel : `${label}. ${ariaLabel}`)
    : label;
  const compactLabel = showLabel ? tileCompactLabel(tile) : '';

  const content = (
    <span className="relative h-full w-full flex items-center justify-center p-0">
      <img
        src={src}
        alt=""
        draggable={false}
        className="h-full w-full max-w-none object-contain object-center select-none"
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
      >
        {label}
      </span>
      {compactLabel && (
        <span
          className="pointer-events-none absolute bottom-0 inset-x-0 rounded-b-md bg-black/60 px-0.5 py-0.5 text-center font-black leading-none text-white"
          style={{ fontSize: '0.72rem' }}
          aria-hidden
        >
          {compactLabel}
        </span>
      )}
    </span>
  );

  const selectedLift =
    selectedTone === 'danger'
      ? 'tile-selected-lift tile-selected-lift--danger'
      : selectedTone === 'primary'
        ? 'tile-selected-lift tile-selected-lift--primary'
        : 'tile-selected-lift tile-selected-lift--focus';
  const focusRingClass =
    selectedTone === 'danger'
      ? 'focus-visible:ring-(--color-danger)'
      : selectedTone === 'primary'
        ? 'focus-visible:ring-(--color-primary)'
        : 'focus-visible:ring-(--color-ring-focus)';

  if (asButton) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={effectiveAriaLabel}
        title={effectiveTitle}
        aria-pressed={selected ? true : undefined}
        className={`tile-face tile-face-interactive cursor-pointer select-none inline-flex min-h-0 min-w-0 items-center justify-center overflow-hidden transition-[transform,box-shadow,border-color] duration-150 focus:outline-none focus-visible:ring-2 ${focusRingClass} focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className} ${
          selected ? selectedLift : ''
        }`}
      >
        {content}
      </button>
    );
  }

  return (
    <span
      role="img"
      className={`tile-face inline-flex items-center justify-center overflow-hidden select-none ${className}`}
      title={effectiveTitle}
      aria-label={effectiveAriaLabel}
    >
      {content}
    </span>
  );
}
