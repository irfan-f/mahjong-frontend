export type InternalMeldKind = 'sequence' | 'set' | 'fullSet';

export type MeldDisplayTerm = 'chow' | 'pong' | 'gang';

export type RulesetId = 'default-v1' | 'ma-jiang';

/** Default ruleset for new games, scoring API, and what-if when no game context. */
export const DEFAULT_RULESET_ID: RulesetId = 'ma-jiang';

/** Labels for ruleset pickers (lobby, what-if, etc.). Keep in sync with backend `ruleSetId` enum. */
export const RULESET_SELECT_OPTIONS: { id: RulesetId; label: string }[] = [
  { id: 'ma-jiang', label: 'Ma-jiang' },
  { id: 'default-v1', label: '1 point win' },
];

export const RULESET_MELD_TERMS: Record<RulesetId, Record<InternalMeldKind, MeldDisplayTerm>> = {
  'default-v1': {
    sequence: 'chow',
    set: 'pong',
    fullSet: 'gang',
  },
  'ma-jiang': {
    sequence: 'chow',
    set: 'pong',
    fullSet: 'gang',
  },
};

export function meldDisplayTerm(ruleSetId: RulesetId | undefined, kind: InternalMeldKind): MeldDisplayTerm {
  const id: RulesetId = ruleSetId ?? DEFAULT_RULESET_ID;
  return RULESET_MELD_TERMS[id][kind];
}

