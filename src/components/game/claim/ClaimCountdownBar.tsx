export function ClaimCountdownBar({
  secondsLeft,
  totalSeconds,
}: {
  secondsLeft: number;
  totalSeconds: number;
}) {
  const total = Math.max(1, totalSeconds);
  const pct = Math.min(100, Math.round((secondsLeft / total) * 100));
  const urgent = secondsLeft <= 5;
  return (
    <div className="flex w-full flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted">Claim window</span>
        <span
          className={`text-xs font-bold tabular-nums ${urgent ? 'text-rose-500' : 'text-on-surface'}`}
          aria-live="polite"
          aria-atomic="true"
          aria-label={`${secondsLeft} seconds remaining to claim`}
        >
          {secondsLeft}s
        </span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-border/50" aria-hidden>
        <div
          className={`h-full w-full origin-left rounded-full motion-safe:transition-transform motion-safe:duration-500 ${
            urgent ? 'bg-rose-500' : secondsLeft <= 10 ? 'bg-amber-400' : 'bg-(--color-primary)'
          }`}
          style={{ transform: `scaleX(${pct / 100})` }}
        />
      </div>
    </div>
  );
}
