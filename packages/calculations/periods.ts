// packages/calculations/periods.ts
// Tier 3: Time-based rate switching.
// The `now` parameter is injected (default: new Date()) for testability.
//
// Periods:
//   'pre_reform'     → today < 1 Oct 2026
//   'post_oct_2026'  → 1 Oct 2026 ≤ today < 1 Apr 2027
//   'post_apr_2027'  → today ≥ 1 Apr 2027

import { AU_INTERCHANGE, AU_REFORM_DATES } from './constants/au';
import type { ReformPeriod, RatePair } from './types';

// Parse reform dates as UTC midnight for consistent comparison
const OCT_2026 = new Date(AU_REFORM_DATES.surchargeBan + 'T00:00:00Z');
const APR_2027 = new Date(AU_REFORM_DATES.foreignCardCap + 'T00:00:00Z');

export function getCurrentPeriod(now: Date = new Date()): ReformPeriod {
  const utcNow = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );

  if (utcNow >= APR_2027) return 'post_apr_2027';
  if (utcNow >= OCT_2026) return 'post_oct_2026';
  return 'pre_reform';
}

export function getRatesForPeriod(now: Date = new Date()): RatePair {
  const period = getCurrentPeriod(now);

  switch (period) {
    case 'pre_reform':
      return {
        current: AU_INTERCHANGE.preSep2026,
        projected: AU_INTERCHANGE.postOct2026,
        periodLabel: { current: 'Today', projected: 'Oct 2026' },
      };
    case 'post_oct_2026':
      return {
        current: AU_INTERCHANGE.postOct2026,
        projected: AU_INTERCHANGE.postApr2027,
        periodLabel: { current: 'Today', projected: 'Apr 2027' },
      };
    case 'post_apr_2027':
      return {
        current: AU_INTERCHANGE.postApr2027,
        projected: null,
        periodLabel: { current: 'Today', projected: null },
      };
  }
}
