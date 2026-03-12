import { useState, useRef, useCallback } from 'react';
import { useClickOutside } from '../hooks/useClickOutside';
import type { Theme } from '../hooks/useTheme';
import { Icon } from './Icon';
import { icons } from '../icons';

const LABELS: Record<Theme, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

function ThemeIcon({ theme }: { theme: Theme }) {
  const src = theme === 'light' ? icons.sun : theme === 'dark' ? icons.moon : icons.defaultMode;
  return (
    <Icon
      src={src}
      className="size-5 [&_.icon-svg]:size-5"
      aria-hidden
    />
  );
}

export function ThemeToggle({
  theme,
  setTheme,
  className,
  variant = 'icon',
}: {
  theme: Theme;
  setTheme: (t: Theme) => void;
  className?: string;
  variant?: 'icon' | 'menu';
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const handleClose = useCallback(() => setOpen(false), []);

  useClickOutside(ref, handleClose, open);

  const listboxId = 'theme-listbox';

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    },
    []
  );

  const isMenu = variant === 'menu';

  return (
    <div ref={ref} className={`relative ${className ?? ''}`}>
      <button
        type="button"
        id={isMenu ? undefined : 'theme-toggle'}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleKeyDown}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listboxId : undefined}
        aria-label={`Theme: ${LABELS[theme]}`}
        title={`Theme: ${LABELS[theme]}`}
        className={
          isMenu
            ? 'flex w-full cursor-pointer items-center gap-3 rounded px-4 py-2.5 text-left text-sm text-text-primary hover:bg-surface-panel-muted focus:outline-none focus-visible:ring-1 focus-visible:ring-ring-focus'
            : 'btn-nav-header min-h-[44px] min-w-[44px] text-text-primary'
        }
      >
        <ThemeIcon theme={theme} />
        {isMenu && <span>Theme: {LABELS[theme]}</span>}
      </button>
      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Theme options"
          className={`absolute right-0 top-full mt-1 min-w-32 rounded-lg border border-border bg-surface-panel py-1 shadow-lg ${isMenu ? 'z-[51]' : 'z-50'}`}
          onKeyDown={handleKeyDown}
        >
          {(['light', 'dark', 'system'] as const).map((t) => (
            <button
              key={t}
              role="option"
              aria-selected={theme === t}
              type="button"
              onClick={() => {
                setTheme(t);
                setOpen(false);
              }}
              className="w-full cursor-pointer rounded px-4 py-2 text-left text-sm text-text-primary hover:bg-surface-panel-muted focus:outline-none focus-visible:ring-1 focus-visible:ring-ring-focus"
            >
              {LABELS[t]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
