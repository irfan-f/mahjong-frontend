import { useEffect, useMemo, useState } from 'react';

export function useClaimWindowCountdown(
  claimWindowEndsAt?: string | null
): { claimSecondsLeft: number; claimWindowTotalSeconds: number } {
  const endsAtMs = useMemo(() => {
    if (!claimWindowEndsAt) return null;
    const ms = Date.parse(claimWindowEndsAt);
    return Number.isFinite(ms) ? ms : null;
  }, [claimWindowEndsAt]);

  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!endsAtMs) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [endsAtMs]);

  if (!endsAtMs) return { claimSecondsLeft: 0, claimWindowTotalSeconds: 0 };

  const claimSecondsLeft = Math.max(0, Math.ceil((endsAtMs - now) / 1000));
  // Backend doesn't currently send total; keep UI stable with a reasonable default.
  const claimWindowTotalSeconds = 6;
  return { claimSecondsLeft, claimWindowTotalSeconds };
}

