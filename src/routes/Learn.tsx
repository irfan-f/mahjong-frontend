import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { AccountMenu } from '../components/AccountMenu';
import { GameBoard } from '../components/game/GameBoard';
import { Icon } from '../components/Icon';
import { icons } from '../icons';
import { useTutorialGame } from '../tutorial/useTutorialGame';
import { getTutorialAnchor } from '../tutorial/tutorialSteps';
import { MOCK_USER_ID } from '../api/mock';

const TUTORIAL_BOX_GAP = 8;

export function Learn() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/', { replace: true });
    }
  }, [authLoading, user, navigate]);

  const {
    game,
    step,
    stepIndex,
    totalSteps,
    acting,
    suggestedDiscardTile,
    goToNextStep,
    rollAndDeal,
    draw,
    discard,
    declareMahjong,
    claimPong,
    claimKong,
    claimChow,
    passClaim,
  } = useTutorialGame();

  const hasNoAction = !Object.values(step.allowedActions).some(Boolean);
  const showContinue = hasNoAction && stepIndex < totalSteps - 1;

  const mainRef = useRef<HTMLElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [boxPosition, setBoxPosition] = useState<{ top: number; left: number } | null>(null);
  const anchor = getTutorialAnchor(step);

  useLayoutEffect(() => {
    let next: { top: number; left: number } | null = null;
    if (anchor && game && mainRef.current && boxRef.current) {
      const main = mainRef.current;
      const el = main.querySelector(`[data-tutorial-anchor="${anchor}"]`);
      if (el) {
        const mainRect = main.getBoundingClientRect();
        const anchorRect = el.getBoundingClientRect();
        const boxRect = boxRef.current.getBoundingClientRect();
        const top = anchorRect.top - mainRect.top - boxRect.height - TUTORIAL_BOX_GAP;
        let left = anchorRect.left - mainRect.left + anchorRect.width / 2;
        const minLeft = boxRect.width / 2;
        const maxLeft = mainRect.width - boxRect.width / 2;
        left = Math.max(minLeft, Math.min(maxLeft, left));
        next = { top, left };
      }
    }
    const id = requestAnimationFrame(() => setBoxPosition(next));
    return () => cancelAnimationFrame(id);
  }, [anchor, game, step.id]);

  useEffect(() => {
    if (!anchor || !mainRef.current) return;
    const main = mainRef.current;
    const ro = new ResizeObserver(() => {
      if (!boxRef.current) return;
      const el = main.querySelector(`[data-tutorial-anchor="${anchor}"]`);
      if (!el) return;
      const mainRect = main.getBoundingClientRect();
      const anchorRect = el.getBoundingClientRect();
      const boxRect = boxRef.current.getBoundingClientRect();
      const top = anchorRect.top - mainRect.top - boxRect.height - TUTORIAL_BOX_GAP;
      let left = anchorRect.left - mainRect.left + anchorRect.width / 2;
      const minLeft = boxRect.width / 2;
      const maxLeft = mainRect.width - boxRect.width / 2;
      left = Math.max(minLeft, Math.min(maxLeft, left));
      setBoxPosition({ top, left });
    });
    ro.observe(main);
    return () => ro.disconnect();
  }, [anchor]);

  if (authLoading || !user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 p-4 bg-(--color-surface)">
        <p className="text-muted text-sm text-center">
          {authLoading ? 'Checking sign-in…' : 'Redirecting…'}
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-(--color-surface)">
      <header className="app-header shrink-0 z-10 flex items-center justify-between gap-4 px-4 py-2">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-10 h-10 rounded-lg text-muted hover:text-text-primary hover:bg-surface-panel transition-colors shrink-0"
            aria-label="Back"
            title="Back"
          >
            <span className="inline-block scale-x-[-1]">
              <Icon src={icons.forwardArrow} className="size-5 [&_.icon-svg]:size-5" />
            </span>
          </button>
          <span className="font-semibold text-on-surface truncate">Learn to play</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/what-if')}
            className="btn-secondary text-sm py-2 px-3"
            aria-label="Open What-if scorer"
            title="Open What-if scorer"
          >
            What-if
          </button>
          <AccountMenu theme={theme} setTheme={setTheme} onSignOut={signOut} />
        </div>
      </header>

      <main ref={mainRef} id="main-content" tabIndex={-1} className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {game ? (
            <GameBoard
              game={game}
              currentUserId={MOCK_USER_ID}
              currentUserDisplayName="You"
              error={null}
              acting={acting}
              onRollAndDeal={rollAndDeal}
              onDraw={draw}
              onDiscardTile={() => discard()}
              onMahjong={declareMahjong}
              onClaimPong={claimPong}
              onClaimKong={claimKong}
              onClaimChow={claimChow}
              onPassClaim={passClaim}
              mode="tutorial"
              tutorialAllowedActions={step.allowedActions}
              tutorialDiscardTile={suggestedDiscardTile}
            />
          ) : step.id === 'intro' ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <p className="text-muted text-sm text-center max-w-sm">Tap Continue to start.</p>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4">
              <p className="text-muted text-sm text-center max-w-md">Loading…</p>
            </div>
          )}
        </div>

        <div
          ref={boxRef}
          className={`absolute z-20 w-full max-w-[280px] panel px-4 py-3 shadow-xl rounded-xl border-2 border-(--color-primary) bg-surface-panel ring-2 ring-(--color-primary)/30 ${boxPosition == null ? 'top-3 right-3' : ''}`}
          style={
            boxPosition
              ? { top: boxPosition.top, left: boxPosition.left, transform: 'translateX(-50%)' }
              : undefined
          }
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-medium text-(--color-primary) tabular-nums" aria-hidden>Step {stepIndex + 1} of {totalSteps}</span>
          </div>
          <p className="text-base font-semibold text-on-surface">{step.title}</p>
          <p className="text-sm text-on-surface/95 mt-0.5">{step.description}</p>
          {showContinue && (
            <button
              type="button"
              onClick={goToNextStep}
              className="btn-primary text-sm font-medium w-full min-h-[44px] mt-3 py-2.5"
              aria-label="Continue to next step"
            >
              Continue
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
