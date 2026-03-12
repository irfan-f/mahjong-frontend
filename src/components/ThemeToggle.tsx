import { useState, useRef, useCallback } from 'react';
import { useClickOutside } from '../hooks/useClickOutside';
import type { Theme } from '../hooks/useTheme';

const LABELS: Record<Theme, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

function SunIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SystemIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

function ThemeIcon({ theme }: { theme: Theme }) {
  if (theme === 'light') return <SunIcon />;
  if (theme === 'dark') return <MoonIcon />;
  return <SystemIcon />;
}

export function ThemeToggle({
  theme,
  setTheme,
  className,
}: {
  theme: Theme;
  setTheme: (t: Theme) => void;
  className?: string;
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

  return (
    <div ref={ref} className={`relative ${className ?? ''}`}>
      <button
        type="button"
        id="theme-toggle"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleKeyDown}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listboxId : undefined}
        aria-label={`Theme: ${LABELS[theme]}`}
        title={`Theme: ${LABELS[theme]}`}
        className="btn-nav-header min-h-[44px] min-w-[44px] text-text-primary"
      >
        <ThemeIcon theme={theme} />
      </button>
      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Theme options"
          className="absolute right-0 top-full z-50 mt-1 min-w-32 rounded-lg border border-border bg-surface-panel py-1 shadow-lg"
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
