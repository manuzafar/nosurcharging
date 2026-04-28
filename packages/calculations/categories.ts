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

export function detectStrategicRate(
  planType: string, volume: number, psp: string,
): StrategicRateDetection {
  const selfReported = planType === 'strategic_rate';
  const pspIsCapable = ['commbank','nab','westpac','anz'].some(kw => psp.toLowerCase().includes(kw));
  const volumeAndPSP = volume >= 50_000_000 && pspIsCapable;
  return {
    detected:      selfReported || volumeAndPSP,
    triggerReason: selfReported ? 'self_reported' : volumeAndPSP ? 'volume_threshold' : null,
  };
}

export const CATEGORY_VERDICTS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'Your costs fall automatically on 1 October.',
  2: 'The saving exists — but it won\'t arrive automatically.',
  3: 'Your surcharge revenue disappears on 1 October.',
  4: 'You face both challenges simultaneously.',
  5: 'Your zero-cost plan ends on 1 October.',
};
