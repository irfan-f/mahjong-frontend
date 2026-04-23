import type { Game, WindTileValue } from '../../../types';
import { OpponentHudCard } from './OpponentHudCard';
import { RecentActionsCard } from './RecentActionsCard';

export function GameTopCluster({
  game,
  currentUserId,
  windByPlayer,
  getPlayerLabel,
  previousTurnPlayerId,
  isEnded,
}: {
  game: Game;
  currentUserId: string;
  windByPlayer: Record<string, WindTileValue>;
  getPlayerLabel: (pid: string) => string;
  previousTurnPlayerId: string | null;
  isEnded: boolean;
}) {
  const opponentIds = (game.playerIds ?? []).filter((id) => id !== currentUserId).slice(0, 3);
  const [p1, p2, p3] = opponentIds;

  if (opponentIds.length !== 3) return null;

  return (
    <section
      className="grid grid-cols-2 gap-[var(--game-hud-v-gap)]"
      aria-label="Opponents and recent actions"
    >
      <OpponentHudCard
        pid={p1}
        game={game}
        label={getPlayerLabel(p1)}
        wind={windByPlayer[p1]}
        isDealer={p1 === game.startingPlayer}
        isCurrent={p1 === game.currentPlayer}
        wasTurn={previousTurnPlayerId === p1}
        isEnded={isEnded}
        isBot={p1.startsWith('ai:')}
      />
      <OpponentHudCard
        pid={p2}
        game={game}
        label={getPlayerLabel(p2)}
        wind={windByPlayer[p2]}
        isDealer={p2 === game.startingPlayer}
        isCurrent={p2 === game.currentPlayer}
        wasTurn={previousTurnPlayerId === p2}
        isEnded={isEnded}
        isBot={p2.startsWith('ai:')}
      />
      <OpponentHudCard
        pid={p3}
        game={game}
        label={getPlayerLabel(p3)}
        wind={windByPlayer[p3]}
        isDealer={p3 === game.startingPlayer}
        isCurrent={p3 === game.currentPlayer}
        wasTurn={previousTurnPlayerId === p3}
        isEnded={isEnded}
        isBot={p3.startsWith('ai:')}
      />
      <RecentActionsCard game={game} windByPlayer={windByPlayer} />
    </section>
  );
}

