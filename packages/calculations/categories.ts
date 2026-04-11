// packages/calculations/categories.ts
// Category assignment logic. Two binary questions determine the category.
//
//                        NOT surcharging    Surcharging
//   Cost-plus plan       Category 1         Category 3
//   Flat rate plan       Category 2         Category 4

import type { StrategicRateDetection } from './types';

export function getCategory(
  planType: 'flat' | 'costplus' | 'blended' | 'zero_cost',
  surcharging: boolean,
): 1 | 2 | 3 | 4 {
  // zero_cost is routed before getCategory() — this normalisation is defensive only
  const normalised = (planType === 'blended' || planType === 'zero_cost') ? 'flat' : planType;
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

export const CATEGORY_VERDICTS: Record<1 | 2 | 3 | 4, string> = {
  1: 'Your costs fall automatically on 1 October.',
  2: 'The saving exists — but it won\'t arrive automatically.',
  3: 'Your surcharge revenue disappears on 1 October.',
  4: 'You face both challenges simultaneously.',
};
