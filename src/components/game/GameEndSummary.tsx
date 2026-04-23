import type { ReactNode } from 'react';
import type { ScoringBreakdownEntry } from '../../types';

export function GameEndSummary({
  isExhaustiveDraw,
  iWon,
  winnerLabel,
  lastScoringResult,
  gamePoints,
  gameBreakdown,
  children,
}: {
  isExhaustiveDraw: boolean;
  iWon: boolean;
  winnerLabel: string;
  lastScoringResult?: unknown;
  gamePoints?: number | null;
  gameBreakdown?: ScoringBreakdownEntry[] | null;
  [key: string]: unknown;
  children?: ReactNode;
  // The real implementation can be richer; this keeps the table functional and type-safe.
}) {
  const headline = isExhaustiveDraw ? 'Exhaustive draw' : iWon ? 'You won' : `${winnerLabel} won`;

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xl font-black m-0">{headline}</h2>
      {typeof gamePoints === 'number' ? (
        <p className="m-0 text-sm text-muted">Points: {gamePoints}</p>
      ) : null}
      {Array.isArray(gameBreakdown) && gameBreakdown.length > 0 ? (
        <details className="text-left">
          <summary className="cursor-pointer text-sm font-semibold">Scoring breakdown</summary>
          <ul className="mt-2 space-y-1 text-sm">
            {gameBreakdown.map((b, i) => (
              <li key={i} className="flex justify-between gap-3">
                <span>{b.patternNameEn ?? b.pattern}</span>
                <span className="tabular-nums">{b.points}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      {lastScoringResult ? null : null}
      {children}
    </div>
  );
}

