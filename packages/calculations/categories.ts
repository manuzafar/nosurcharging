// packages/calculations/categories.ts
// Category assignment logic.
//
//                        NOT surcharging    Surcharging
//   Cost-plus plan       Category 1         Category 3
//   Flat rate plan       Category 2         Category 4
//   Zero-cost EFTPOS                Category 5 (short-circuits Q1/Q2)
//
// Zero-cost is structurally distinct: PSP-mediated surcharge collapses
// on 1 October, merchant moves to flat rate. The `surcharging` parameter
// is ignored when planType === 'zero_cost' (any Amex separate surcharge is
// preserved in surchargeNetworks/surchargeRate but doesn't move category).

import type { StrategicRateDetection } from './types';

export function getCategory(
  planType: 'flat' | 'costplus' | 'blended' | 'zero_cost',
  surcharging: boolean,
): 1 | 2 | 3 | 4 | 5 {
  if (planType === 'zero_cost') return 5;
  const normalised = planType === 'blended' ? 'flat' : planType;
  if (normalised === 'costplus' && !surcharging) return 1;
  if (normalised === 'flat'     && !surcharging) return 2;
  if (normalised === 'costplus' && surcharging)  return 3;
  if (normalised === 'flat'     && surcharging)  return 4;
  throw new Error(`Invalid category inputs: planType=${planType}, surcharging=${surcharging}`);
}

// Strategic-rate detection is explicit-tile-only — fires iff the merchant
// picks the strategic rate tile in Step 2. The previous volume-and-PSP
// heuristic ($50M+ at CommBank/NAB/Westpac/ANZ) was removed because it
// surprised large-bank merchants who wanted a normal Cat 1-4 result.
export function detectStrategicRate(planType: string): StrategicRateDetection {
  const detected = planType === 'strategic_rate';
  return {
    detected,
    triggerReason: detected ? 'self_reported' : null,
  };
}

export const CATEGORY_VERDICTS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'Your costs fall automatically on 1 October.',
  2: 'The saving exists — but it won\'t arrive automatically.',
  3: 'Your surcharge revenue disappears on 1 October.',
  4: 'You face both challenges simultaneously.',
  5: 'Your zero-cost plan ends on 1 October.',
};
