import { useCallback, useMemo, useState } from 'react';
import type { Game, Tile } from '../types';
import { getTutorialGameForStep, getTutorialSuggestedDiscard } from '../api/mock';
import type { TutorialStep, TutorialStepId } from './tutorialSteps';
import { tutorialSteps, getTutorialStepById } from './tutorialSteps';

export interface TutorialGameState {
  game: Game | null;
  step: TutorialStep;
  stepIndex: number;
  totalSteps: number;
  acting: boolean;
  /** When step allows discard, the single tile the user should discard. */
  suggestedDiscardTile: Tile | null;
}

export interface TutorialGameControls {
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  restart: () => void;
  setStepById: (id: TutorialStepId) => void;
  rollAndDeal: () => void;
  draw: () => void;
  discard: () => void;
  declareMahjong: () => void;
  claimPong: () => void;
  claimKong: () => void;
  claimChow: () => void;
  passClaim: () => void;
}

export interface UseTutorialGameResult extends TutorialGameState, TutorialGameControls {}

function getInitialState(): { game: Game | null; stepIndex: number } {
  const firstStep = tutorialSteps[0];
  const game = getTutorialGameForStep(firstStep.id);
  return {
    game,
    stepIndex: 0,
  };
}

export function useTutorialGame(): UseTutorialGameResult {
  const [{ game, stepIndex }, setState] = useState(getInitialState);
  const [acting, setActing] = useState(false);

  const totalSteps = tutorialSteps.length;
  const step = tutorialSteps[stepIndex] ?? tutorialSteps[0];

  const setStepIndex = useCallback((nextIndex: number) => {
    setState(() => {
      const clamped = Math.max(0, Math.min(tutorialSteps.length - 1, nextIndex));
      const nextStep = tutorialSteps[clamped];
      const nextGame = getTutorialGameForStep(nextStep.id);
      return {
        game: nextGame,
        stepIndex: clamped,
      };
    });
  }, []);

  const goToNextStep = useCallback(() => {
    setStepIndex(stepIndex + 1);
  }, [setStepIndex, stepIndex]);

  const goToPreviousStep = useCallback(() => {
    setStepIndex(stepIndex - 1);
  }, [setStepIndex, stepIndex]);

  const restart = useCallback(() => {
    setState(getInitialState());
  }, []);

  const setStepById = useCallback((id: TutorialStepId) => {
    const target = getTutorialStepById(id);
    const index = tutorialSteps.findIndex((s) => s.id === target.id);
    if (index >= 0) {
      setStepIndex(index);
    }
  }, [setStepIndex]);

  const advanceStep = useCallback(() => {
    setActing(true);
    setStepIndex(stepIndex + 1);
    requestAnimationFrame(() => setActing(false));
  }, [setStepIndex, stepIndex]);

  const rollAndDeal = useCallback(() => {
    if (!step.allowedActions.canRollAndDeal) return;
    advanceStep();
  }, [advanceStep, step.allowedActions.canRollAndDeal]);

  const draw = useCallback(() => {
    if (!step.allowedActions.canDraw) return;
    advanceStep();
  }, [advanceStep, step.allowedActions.canDraw]);

  const discard = useCallback(() => {
    if (!step.allowedActions.canDiscard) return;
    advanceStep();
  }, [advanceStep, step.allowedActions.canDiscard]);

  const declareMahjong = useCallback(() => {
    if (!step.allowedActions.canDeclareMahjong) return;
    advanceStep();
  }, [advanceStep, step.allowedActions.canDeclareMahjong]);

  const claimPong = useCallback(() => {
    if (!step.allowedActions.canClaimPong) return;
    advanceStep();
  }, [advanceStep, step.allowedActions.canClaimPong]);

  const claimKong = useCallback(() => {
    if (!step.allowedActions.canClaimKong) return;
    advanceStep();
  }, [advanceStep, step.allowedActions.canClaimKong]);

  const claimChow = useCallback(() => {
    if (!step.allowedActions.canClaimChow) return;
    advanceStep();
  }, [advanceStep, step.allowedActions.canClaimChow]);

  const passClaim = useCallback(() => {
    if (!step.allowedActions.canPassClaim) return;
    advanceStep();
  }, [advanceStep, step.allowedActions.canPassClaim]);

  const suggestedDiscardTile = useMemo(
    () => (step.allowedActions.canDiscard ? getTutorialSuggestedDiscard(step.id) : null),
    [step.allowedActions.canDiscard, step.id]
  );

  const value: UseTutorialGameResult = useMemo(
    () => ({
      game,
      step,
      stepIndex,
      totalSteps,
      acting,
      suggestedDiscardTile,
      goToNextStep,
      goToPreviousStep,
      restart,
      setStepById,
      rollAndDeal,
      draw,
      discard,
      declareMahjong,
      claimPong,
      claimKong,
      claimChow,
      passClaim,
    }),
    [
      game,
      step,
      stepIndex,
      totalSteps,
      acting,
      suggestedDiscardTile,
      goToNextStep,
      goToPreviousStep,
      restart,
      setStepById,
      rollAndDeal,
      draw,
      discard,
      declareMahjong,
      claimPong,
      claimKong,
      claimChow,
      passClaim,
    ]
  );

  return value;
}

