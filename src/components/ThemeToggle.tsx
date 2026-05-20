import type { Theme } from '../hooks/useTheme';
import { Icon } from './Icon';
import { icons } from '../icons';

const LABELS: Record<Theme, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

const NEXT_THEME: Record<Theme, Theme> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
};

const SWITCH_TO_PHRASE: Record<Theme, string> = {
  light: 'Switch to dark mode',
  dark: 'Switch to system theme',
  system: 'Switch to light mode',
};

function NextThemeIcon({ theme }: { theme: Theme }) {
  const next = NEXT_THEME[theme];
  const src = next === 'light' ? icons.sun : next === 'dark' ? icons.moon : icons.defaultMode;
  return <Icon src={src} className="size-5 shrink-0 [&_.icon-svg]:size-5" aria-hidden />;
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
  variant?: 'icon' | 'menu' | 'inline';
}) {
  const isMenu = variant === 'menu';

  if (variant === 'inline') {
    return (
      <div
        role="radiogroup"
        aria-label="Theme"
        className={`flex gap-0.5 rounded-lg border border-border bg-(--color-surface) p-0.5 ${className ?? ''}`}
      >
        {(['light', 'dark', 'system'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={theme === t}
            aria-label={
              theme === t ? `Using ${LABELS[t]} mode` : `Switch to ${LABELS[t].toLowerCase()} mode`
            }
            title={
              theme === t ? `Using ${LABELS[t]} mode` : `Switch to ${LABELS[t].toLowerCase()} mode`
            }
            onClick={() => setTheme(t)}
            className={`flex-1 rounded-md px-1.5 py-2 text-xs font-semibold transition-colors sm:text-sm ${
              theme === t
                ? 'bg-(--color-secondary) text-(--color-primary)'
                : 'text-muted hover:text-on-surface'
            }`}
          >
            {LABELS[t]}
          </button>
        ))}
      </div>
    );
  }

  const phrase = SWITCH_TO_PHRASE[theme];

  return (
    <button
      type="button"
      id={isMenu ? undefined : 'theme-toggle'}
      onClick={() => setTheme(NEXT_THEME[theme])}
      aria-label={phrase}
      title={phrase}
      className={
        isMenu
          ? `flex w-full cursor-pointer items-center gap-3 rounded px-4 py-2.5 text-left text-sm text-text-primary hover:bg-surface-panel-muted focus:outline-none focus-visible:ring-1 focus-visible:ring-ring-focus ${className ?? ''}`
          : `btn-nav-header inline-flex min-h-[44px] min-w-[44px] items-center gap-2 px-2 text-text-primary sm:min-w-0 sm:px-3 ${className ?? ''}`
      }
    >
      <NextThemeIcon theme={theme} />
      {isMenu ? (
        <span>{phrase}</span>
      ) : (
        <span className="hidden max-w-[10.5rem] truncate text-left text-xs font-semibold sm:inline">
          {phrase}
        </span>
      )}
    </button>
  );
}
