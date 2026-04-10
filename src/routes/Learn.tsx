import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { SiteHeader } from '../components/SiteHeader';
import { GameBoard } from '../components/game/GameBoard';
import { useTutorialGame } from '../tutorial/useTutorialGame';
import { getTutorialAnchor, tutorialSteps, type TutorialAnchor } from '../tutorial/tutorialSteps';
import { MOCK_USER_ID } from '../api/mock';

const TUTORIAL_BOX_GAP = 14;
const TUTORIAL_BOX_MARGIN = 10;

type TutorialSlideEdge = 'top' | 'right' | 'bottom' | 'left';

function verticalRangesOverlap(aTop: number, aBottom: number, bTop: number, bBottom: number): boolean {
  return aTop < bBottom && aBottom > bTop;
}

function computeTutorialInfoboxPosition(
  mainEl: HTMLElement,
  anchorEl: HTMLElement,
  boxEl: HTMLElement,
  _anchor: TutorialAnchor | null,
): { top: number; left: number } {
  const mainRect = mainEl.getBoundingClientRect();
  const anchorRect = anchorEl.getBoundingClientRect();
  const boxRect = boxEl.getBoundingClientRect();
  const boxH = boxRect.height;
  const boxW = boxRect.width;

  const anchorTop = anchorRect.top - mainRect.top;
  const anchorBottom = anchorRect.bottom - mainRect.top;
  const maxTop = mainRect.height - boxH - TUTORIAL_BOX_MARGIN;

  const overlapsAnchorY = (t: number) =>
    verticalRangesOverlap(t, t + boxH, anchorTop, anchorBottom);

  let top = anchorTop - boxH - TUTORIAL_BOX_GAP;
  if (top < TUTORIAL_BOX_MARGIN) {
    top = anchorBottom + TUTORIAL_BOX_GAP;
  }

  if (overlapsAnchorY(top)) {
    top = anchorTop - boxH - TUTORIAL_BOX_GAP;
  }
  if (overlapsAnchorY(top)) {
    top = anchorBottom + TUTORIAL_BOX_GAP;
  }

  top = Math.max(TUTORIAL_BOX_MARGIN, Math.min(top, maxTop));

  if (overlapsAnchorY(top)) {
    const above = anchorTop - boxH - TUTORIAL_BOX_GAP;
    top = Math.max(TUTORIAL_BOX_MARGIN, Math.min(above, maxTop));
  }

  let left = anchorRect.left - mainRect.left + anchorRect.width / 2;
  const halfW = boxW / 2;
  const minLeft = halfW + TUTORIAL_BOX_MARGIN;
  const maxLeft = mainRect.width - halfW - TUTORIAL_BOX_MARGIN;
  left = Math.max(minLeft, Math.min(maxLeft, left));

  return { top, left };
}

function nearestEdgeForInfobox(
  mainEl: HTMLElement,
  boxTopLeft: { top: number; left: number },
  boxEl: HTMLElement,
): TutorialSlideEdge {
  const mainRect = mainEl.getBoundingClientRect();
  const boxRect = boxEl.getBoundingClientRect();
  const boxH = boxRect.height;
  const boxW = boxRect.width;
  const top = boxTopLeft.top;
  const left = boxTopLeft.left;
  const mainH = mainRect.height;
  const mainW = mainRect.width;
  const cy = top + boxH / 2;
  const cx = left;
  const dTop = cy;
  const dBottom = mainH - cy;
  const dLeft = cx - boxW / 2;
  const dRight = mainW - cx - boxW / 2;
  const pairs: [TutorialSlideEdge, number][] = [
    ['top', dTop],
    ['right', dRight],
    ['bottom', dBottom],
    ['left', dLeft],
  ];
  pairs.sort((a, b) => a[1] - b[1]);
  return pairs[0]![0];
}

function isSlideOutAnimationName(name: string): boolean {
  return (
    name === 'tutorial-slide-out-to-top' ||
    name === 'tutorial-slide-out-to-bottom' ||
    name === 'tutorial-slide-out-to-left' ||
    name === 'tutorial-slide-out-to-right' ||
    name === 'tutorial-slide-fade-out'
  );
}

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

  const [displayIndex, setDisplayIndex] = useState(stepIndex);
  const [slidePhase, setSlidePhase] = useState<'in' | 'out'>('in');
  const [slideEdge, setSlideEdge] = useState<TutorialSlideEdge>('right');
  const [exitEdge, setExitEdge] = useState<TutorialSlideEdge>('right');

  const pendingContinueRef = useRef(false);
  const stepIndexRef = useRef(stepIndex);
  const slidePhaseRef = useRef(slidePhase);

  useLayoutEffect(() => {
    stepIndexRef.current = stepIndex;
    slidePhaseRef.current = slidePhase;
  }, [stepIndex, slidePhase]);

  const displayStep = tutorialSteps[displayIndex] ?? tutorialSteps[0]!;
  const positionAnchor = getTutorialAnchor(displayStep);

  const pageRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [boxPosition, setBoxPosition] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (slidePhase === 'out') return;
    let next: { top: number; left: number } | null = null;
    const page = pageRef.current;
    const main = mainRef.current;
    const box = boxRef.current;
    if (positionAnchor && main && box && page) {
      const el = page.querySelector(`[data-tutorial-anchor="${positionAnchor}"]`);
      if (el instanceof HTMLElement) {
        next = computeTutorialInfoboxPosition(main, el, box, positionAnchor);
      }
    }
    const id = requestAnimationFrame(() => {
      setBoxPosition(next);
      if (next != null && main && box) {
        setSlideEdge(nearestEdgeForInfobox(main, next, box));
      } else {
        setSlideEdge('right');
      }
    });
    return () => cancelAnimationFrame(id);
  }, [positionAnchor, game, displayStep.id, slidePhase, displayIndex]);

  useEffect(() => {
    if (!positionAnchor || !pageRef.current || !mainRef.current || !boxRef.current) return;
    if (slidePhase === 'out') return;
    const page = pageRef.current;
    const main = mainRef.current;
    const box = boxRef.current;
    const ro = new ResizeObserver(() => {
      if (slidePhaseRef.current === 'out') return;
      const el = page.querySelector(`[data-tutorial-anchor="${positionAnchor}"]`);
      if (!(el instanceof HTMLElement)) return;
      const pos = computeTutorialInfoboxPosition(main, el, box, positionAnchor);
      setBoxPosition(pos);
      setSlideEdge(nearestEdgeForInfobox(main, pos, box));
    });
    ro.observe(page);
    ro.observe(main);
    return () => ro.disconnect();
  }, [positionAnchor, slidePhase]);

  useEffect(() => {
    if (stepIndex === displayIndex) return;
    if (slidePhase === 'out') return;
    const edge = slideEdge;
    const id = requestAnimationFrame(() => {
      setExitEdge(edge);
      setSlidePhase('out');
    });
    return () => cancelAnimationFrame(id);
  }, [stepIndex, displayIndex, slidePhase, slideEdge]);

  const handleExitComplete = useCallback(() => {
    if (pendingContinueRef.current) {
      pendingContinueRef.current = false;
      goToNextStep();
      setDisplayIndex((d) => d + 1);
    } else {
      setDisplayIndex(stepIndexRef.current);
    }
    setSlidePhase('in');
  }, [goToNextStep]);

  const handleSlideAnimationEnd = useCallback(
    (e: { animationName: string; stopPropagation: () => void }) => {
      if (slidePhase !== 'out') return;
      if (!isSlideOutAnimationName(e.animationName)) return;
      e.stopPropagation();
      handleExitComplete();
    },
    [slidePhase, handleExitComplete],
  );

  const handleContinueClick = () => {
    pendingContinueRef.current = true;
    setExitEdge(slideEdge);
    setSlidePhase('out');
  };

  if (authLoading || !user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 p-4 bg-(--color-surface)">
        <p className="text-muted text-sm text-center">
          {authLoading ? 'Checking sign-in…' : 'Redirecting…'}
        </p>
      </div>
    );
  }

  const edgeClass = slidePhase === 'out' ? exitEdge : slideEdge;

  return (
    <div ref={pageRef} className="h-screen flex flex-col bg-(--color-surface)">
      <SiteHeader
        theme={theme}
        setTheme={setTheme}
        onSignOut={signOut}
        homeLinkTutorialAnchor
      />

      <main
        ref={mainRef}
        id="main-content"
        tabIndex={-1}
        className="flex-1 flex flex-col min-h-0 overflow-visible relative"
      >
        {displayStep.id === 'intro' && (
          <div
            aria-hidden
            data-tutorial-anchor="learn-intro"
            className="pointer-events-none absolute left-1/2 bottom-28 -translate-x-1/2 w-px h-px overflow-hidden"
          />
        )}

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
          ) : displayStep.id === 'intro' ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <p className="text-muted text-sm text-center max-w-sm">
                Tap <span className="font-medium text-on-surface">Continue</span> in the card below when you are ready to
                start the tutorial.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4">
              <p className="text-muted text-sm text-center max-w-md">Loading…</p>
            </div>
          )}
        </div>

        <div
          ref={boxRef}
          className={`absolute z-20 w-[min(100%-2rem,260px)] max-w-[260px] ${
            boxPosition == null ? 'top-3 right-3' : 'pointer-events-none'
          }`}
          style={
            boxPosition
              ? { top: boxPosition.top, left: boxPosition.left, transform: 'translateX(-50%)', right: 'auto' }
              : undefined
          }
        >
          <div
            key={displayIndex}
            className={`tutorial-slide-shell--${slidePhase}-${edgeClass} pointer-events-auto`}
            onAnimationEnd={handleSlideAnimationEnd}
          >
            <div
              className="px-3.5 py-3 rounded-xl border border-border/80 bg-surface-panel shadow-lg"
              role="status"
              aria-live="polite"
            >
              <div className="mb-1 border-l-2 border-(--color-primary)/70 pl-2 -ml-0.5">
                <span className="text-xs font-medium text-muted tabular-nums" aria-hidden>
                  Step {displayIndex + 1} of {totalSteps}
                </span>
              </div>
              <p className="text-base font-semibold text-on-surface leading-snug">{displayStep.title}</p>
              <p className="text-sm text-muted mt-1 leading-relaxed">{displayStep.description}</p>
              {showContinue && (
                <button
                  type="button"
                  onClick={handleContinueClick}
                  className="btn-primary text-sm font-medium w-full min-h-[44px] min-w-0 mt-3 py-2.5"
                  aria-label="Continue to next step"
                >
                  Continue
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
