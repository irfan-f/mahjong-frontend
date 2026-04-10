import type { Theme } from '../hooks/useTheme';
import { ThemeToggle } from './ThemeToggle';

type GuestAppearanceCardProps = {
  theme: Theme;
  setTheme: (t: Theme) => void;
};

export function GuestAppearanceCard({ theme, setTheme }: GuestAppearanceCardProps) {
  return (
    <div className="panel rounded-xl border border-border p-3 shadow-md">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Appearance</h2>
      <div className="mt-2">
        <ThemeToggle theme={theme} setTheme={setTheme} variant="inline" />
      </div>
    </div>
  );
}
