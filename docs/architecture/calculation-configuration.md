# Calculation Configuration
## nosurcharging.com.au

**Version:** 1.0 | **April 2026**

---

## 1. Configuration Tiers

The calculation engine uses a three-tier configuration model.

```
┌────────────────────────────────────────────────────────────┐
│  TIER 1 — Regulatory constants                             │
│  TypeScript code in packages/calculations/constants/au.ts  │
│  Change: PR + test run + deployment                        │
│  Who: Developer (Manu)                                     │
│  Examples: Interchange rate caps, reform dates, scheme fees│
└────────────────────────────────────────────────────────────┘
                           │
┌────────────────────────────────────────────────────────────┐
│  TIER 2 — Operational parameters                           │
│  Environment variables in Railway                          │
│  Change: Railway dashboard (no deployment)                 │
│  Who: Manu directly                                        │
│  Examples: Card mix defaults, average transaction value    │
└────────────────────────────────────────────────────────────┘
                           │
┌────────────────────────────────────────────────────────────┐
│  TIER 3 — Time-based rate switching                        │
│  Automatic — engine checks current date against constants  │
│  Change: Never (logic is fixed)                            │
│  Who: The system itself                                    │
│  Examples: Which rates are "current" vs "projected"        │
└────────────────────────────────────────────────────────────┘
```

---

## 2. Tier 1 — Regulatory Constants

### Why in code, not a database

Interchange rates are set by regulation. A wrong value in the calculation engine produces wrong financial guidance for real merchants. Putting these values in a database with an admin UI introduces the risk of accidental edits, no type safety, and no test coverage at the point of change.

Code-based constants give you:
- **Git audit trail** — every rate change is a commit with a message explaining why
- **Test coverage** — the test suite runs against the new value before it ships
- **Type safety** — TypeScript prevents `"0.30"` (string) where `0.003` (number) is required
- **PR review** — a second set of eyes before any regulatory value changes

### Full constants file

```typescript
// packages/calculations/constants/au.ts
// Source: RBA Conclusions Paper, 31 March 2026
// https://www.rba.gov.au/payments-and-infrastructure/review-of-retail-payments-regulation/2026-03/

export const AU_REFORM_DATES = {
  surchargeBan:       new Date('2026-10-01T00:00:00+11:00'), // AEST
  domesticICCuts:     new Date('2026-10-01T00:00:00+11:00'),
  foreignCardCap:     new Date('2027-04-01T00:00:00+11:00'),
  msfPublication:     new Date('2026-10-30T00:00:00+11:00'),
  passThroughReport:  new Date('2027-01-30T00:00:00+11:00'),
  amexBnplReview:     new Date('2026-07-01T00:00:00+10:00'), // Estimated mid-2026
} as const;

export const AU_INTERCHANGE = {
  // Pre-reform rates (current at time of writing)
  // Source: RBA weighted averages, March 2026
  preSep2026: {
    debitCentsPerTxn:    0.09,   // 9 cents
    consumerCreditPct:   0.0052, // 0.52%
    commercialCreditPct: 0.008,  // 0.80%
    foreignPct:          0.028,  // 2.80%
  },

  // Post-reform rates effective 1 October 2026
  postOct2026: {
    debitCentsPerTxn:    0.08,   // 8 cents (lower of 8c or 0.16%)
    consumerCreditPct:   0.003,  // 0.30%
    commercialCreditPct: 0.008,  // 0.80% — unchanged
    foreignPct:          0.028,  // 2.80% — unchanged until Apr 2027
  },

  // Post April 2027 — foreign card IC cap only
  // NOTE: Scheme fees (~1.58%) are NOT capped. True floor = ~2.58%
  postApr2027: {
    debitCentsPerTxn:    0.08,
    consumerCreditPct:   0.003,
    commercialCreditPct: 0.008,
    foreignPct:          0.01,   // 1.0% IC cap — interchange only
  },
} as const;

export const AU_SCHEME_FEES = {
  // Unregulated. Not covered by the reform. May rise.
  domesticPct:    0.00105, // 10.5 basis points
  crossBorderPct: 0.0158,  // 158 basis points
  // If scheme fees rise post-reform, update these values and redeploy.
} as const;

// Designated networks — surcharge ban applies
// Source: RBA Policy 1, March 2026
export const AU_DESIGNATED_NETWORKS = [
  'visa',
  'mastercard',
  'eftpos',
] as const;

// Networks exempt from the ban (still surchargeable after Oct 2026)
// Subject to mid-2026 RBA review
export const AU_EXEMPT_NETWORKS = [
  'amex',
  'bnpl',
  'paypal',
] as const;

export type AUDesignatedNetwork = typeof AU_DESIGNATED_NETWORKS[number];
export type AUExemptNetwork = typeof AU_EXEMPT_NETWORKS[number];
```

### Relationship to the Business Rules Engine

Tier 1 constants are the lowest-priority source in the resolution pipeline. When the
resolver (rules/resolver.ts) builds ResolvedAssessmentInputs, it checks merchant input,
invoice-parsed values, and env vars before falling back to these constants. The constants
are the guaranteed baseline — they ensure no calculation ever receives null or undefined.

See docs/architecture/business-rules-engine.md for the full resolution pipeline design.

### When to update Tier 1 constants

| Event | What changes | When |
|---|---|---|
| October 2026 reform takes effect | No change needed — handled by Tier 3 switching | 1 Oct 2026 |
| RBA adjusts a rate cap | Update the relevant rate in `postOct2026` | If/when RBA announces |
| Scheme fees rise | Update `AU_SCHEME_FEES` | If/when announced |
| Amex/BNPL added to ban | Add to `AU_DESIGNATED_NETWORKS`, remove from `AU_EXEMPT_NETWORKS` | Mid-2026 review outcome |
| April 2027 foreign cap | No change needed — handled by Tier 3 | 1 Apr 2027 |
| New market (UK, EU) | Add `UK_INTERCHANGE`, `EU_INTERCHANGE` files | Phase 2 |

**Update process:**
1. Edit the relevant constant in the TypeScript file
2. Run `turbo run test:unit` — the test suite will catch any breaking changes
3. Verify reference scenarios in `docs/product/calculation-verification.md` still match
4. PR with a commit message referencing the regulatory source
5. Deploy to staging, verify outputs, deploy to production

---

## 3. Tier 2 — Operational Parameters

These can be changed via the Railway dashboard without a code deployment. They are injected at runtime via environment variables.

### Environment variables to add

```bash
# Card mix defaults — from RBA Statistical Tables C1 and C2
# Format: percentages as decimals (0.60 = 60%)
CALC_CARD_MIX_DEBIT=0.60
CALC_CARD_MIX_CREDIT=0.35
CALC_CARD_MIX_FOREIGN=0.05
CALC_CARD_MIX_COMMERCIAL=0.00

# Average transaction values by industry (AUD)
# Used when industry-specific mix is not available
CALC_AVG_TXN_CAFE=35
CALC_AVG_TXN_HOSPITALITY=80
CALC_AVG_TXN_RETAIL=65
CALC_AVG_TXN_ONLINE=95
CALC_AVG_TXN_TICKETING=120
CALC_AVG_TXN_DEFAULT=65
```

### How to read them in the constants router

```typescript
// packages/calculations/constants/index.ts

import { AU_INTERCHANGE, AU_SCHEME_FEES, AU_REFORM_DATES } from './au';

export interface CardMixDefaults {
  debitShare:          number;
  consumerCreditShare: number;
  foreignShare:        number;
  commercialShare:     number;
}

export function getCardMixDefaults(): CardMixDefaults {
  return {
    debitShare:          parseFloat(process.env.CALC_CARD_MIX_DEBIT    ?? '0.60'),
    consumerCreditShare: parseFloat(process.env.CALC_CARD_MIX_CREDIT   ?? '0.35'),
    foreignShare:        parseFloat(process.env.CALC_CARD_MIX_FOREIGN  ?? '0.05'),
    commercialShare:     parseFloat(process.env.CALC_CARD_MIX_COMMERCIAL ?? '0.00'),
  };
}

export function getAvgTxnValue(industry: string): number {
  const map: Record<string, string | undefined> = {
    cafe:         process.env.CALC_AVG_TXN_CAFE,
    hospitality:  process.env.CALC_AVG_TXN_HOSPITALITY,
    retail:       process.env.CALC_AVG_TXN_RETAIL,
    online:       process.env.CALC_AVG_TXN_ONLINE,
    ticketing:    process.env.CALC_AVG_TXN_TICKETING,
  };
  return parseFloat(map[industry] ?? process.env.CALC_AVG_TXN_DEFAULT ?? '65');
}
```

### Validation of Tier 2 parameters

Tier 2 parameters must be validated at startup. A misconfigured `CALC_CARD_MIX_DEBIT=abc` should fail loudly, not silently produce NaN.

```typescript
// lib/validateConfig.ts
export function validateCalculationConfig(): void {
  const debit    = parseFloat(process.env.CALC_CARD_MIX_DEBIT    ?? '0.60');
  const credit   = parseFloat(process.env.CALC_CARD_MIX_CREDIT   ?? '0.35');
  const foreign  = parseFloat(process.env.CALC_CARD_MIX_FOREIGN  ?? '0.05');
  const commercial = parseFloat(process.env.CALC_CARD_MIX_COMMERCIAL ?? '0.00');

  const total = debit + credit + foreign + commercial;

  if (isNaN(debit) || isNaN(credit) || isNaN(foreign) || isNaN(commercial)) {
    throw new Error('CALC_CARD_MIX values must be valid decimals');
  }

  if (Math.abs(total - 1.0) > 0.001) {
    throw new Error(
      `Card mix shares must sum to 1.0. Current sum: ${total.toFixed(4)}`
    );
  }
}
```

Call `validateCalculationConfig()` in `app/layout.tsx` server-side during startup. If the config is invalid, the application fails to start — which is loud and obvious — rather than silently producing wrong outputs.

---

## 4. Tier 3 — Time-Based Rate Switching

**This is the most important architectural design in the calculation engine.**

The engine must automatically apply the correct rates based on the current date. The comparison changes over time:

```
Phase A (now → 30 Sep 2026):
  "Today" = preSep2026 rates
  "Oct 2026" = postOct2026 rates (projected)
  Context: "Here's what will change"

Phase B (1 Oct 2026 → 29 Jan 2027):
  "Today" = postOct2026 rates (now current)
  Comparison = whether PSP actually passed through the saving
  Context: "Did your rate actually fall? Compare to benchmarks."

Phase C (30 Jan 2027+):
  Pass-through report available
  "Today" = postOct2026 rates
  + Foreign card cap approaching (Apr 2027)
  Context: "Here's what your PSP reported, and what's coming next"

Phase D (1 Apr 2027+):
  "Today" = postApr2027 rates (foreign cap now active)
  Context: Ongoing benchmarking
```

### Implementation

```typescript
// packages/calculations/periods.ts

import { AU_REFORM_DATES, AU_INTERCHANGE } from './constants/au';
import type { InterchangeRates } from './types';

export type ReformPeriod = 'pre_reform' | 'post_oct_2026' | 'post_apr_2027';

export function getCurrentPeriod(now: Date = new Date()): ReformPeriod {
  if (now >= AU_REFORM_DATES.foreignCardCap)  return 'post_apr_2027';
  if (now >= AU_REFORM_DATES.domesticICCuts)   return 'post_oct_2026';
  return 'pre_reform';
}

export interface RatePair {
  current:   InterchangeRates;
  projected: InterchangeRates | null; // null when no future change is upcoming
  periodLabel: {
    current:   string; // e.g. "Today" or "Current rates"
    projected: string; // e.g. "Oct 2026" or "Apr 2027"
  };
}

export function getRatesForPeriod(now: Date = new Date()): RatePair {
  const period = getCurrentPeriod(now);

  switch (period) {
    case 'pre_reform':
      return {
        current:   AU_INTERCHANGE.preSep2026,
        projected: AU_INTERCHANGE.postOct2026,
        periodLabel: {
          current:   'Today',
          projected: 'Oct 2026',
        },
      };

    case 'post_oct_2026':
      // Oct rates are now current. Show Apr 2027 foreign cap as upcoming.
      return {
        current:   AU_INTERCHANGE.postOct2026,
        projected: AU_INTERCHANGE.postApr2027,
        periodLabel: {
          current:   'Current rates',
          projected: 'Apr 2027',
        },
      };

    case 'post_apr_2027':
      // All reforms in effect. No further changes projected.
      return {
        current:   AU_INTERCHANGE.postApr2027,
        projected: null,
        periodLabel: {
          current:   'Current rates',
          projected: 'No further changes',
        },
      };
  }
}
```

### How this flows into calculateMetrics

```typescript
// packages/calculations/calculations.ts

import { getRatesForPeriod } from './periods';
import { getCardMixDefaults, getAvgTxnValue } from './constants';

export function calculateMetrics(
  inputs: AssessmentInputs,
  now: Date = new Date() // Injected for testability
): AssessmentOutputs {
  const { current, projected, periodLabel } = getRatesForPeriod(now);
  const cardMix = getCardMixDefaults();
  const avgTxn  = getAvgTxnValue(inputs.industry);

  // Use current rates for "today" calculation
  const todayRates = inputs.expertRates
    ? mergeExpertRates(current, inputs.expertRates)
    : current;

  // Use projected rates for "next period" calculation (if any)
  const projectedRates = projected
    ? (inputs.expertRates ? mergeExpertRates(projected, inputs.expertRates) : projected)
    : null;

  // ... rest of calculation ...

  return {
    // ...
    periodLabel,
    hasProjectedPeriod: projected !== null,
  };
}
```

### Testing the time-based switching

The `now` parameter injection makes time-based logic fully testable without mocking the system clock:

```typescript
// packages/calculations/__tests__/periods.test.ts
import { describe, it, expect } from 'vitest';
import { getCurrentPeriod, getRatesForPeriod } from '../periods';

describe('getCurrentPeriod', () => {
  it('returns pre_reform before 1 October 2026', () => {
    expect(getCurrentPeriod(new Date('2026-09-30'))).toBe('pre_reform');
  });

  it('returns post_oct_2026 on 1 October 2026', () => {
    expect(getCurrentPeriod(new Date('2026-10-01'))).toBe('post_oct_2026');
  });

  it('returns post_oct_2026 between October and April', () => {
    expect(getCurrentPeriod(new Date('2027-01-15'))).toBe('post_oct_2026');
  });

  it('returns post_apr_2027 on 1 April 2027', () => {
    expect(getCurrentPeriod(new Date('2027-04-01'))).toBe('post_apr_2027');
  });
});

describe('getRatesForPeriod', () => {
  it('shows Oct 2026 projection before reform', () => {
    const { periodLabel } = getRatesForPeriod(new Date('2026-04-01'));
    expect(periodLabel.projected).toBe('Oct 2026');
  });

  it('shows Apr 2027 projection after Oct reform', () => {
    const { periodLabel } = getRatesForPeriod(new Date('2026-11-01'));
    expect(periodLabel.projected).toBe('Apr 2027');
  });

  it('shows no projection after Apr 2027', () => {
    const { projected } = getRatesForPeriod(new Date('2027-06-01'));
    expect(projected).toBeNull();
  });

  it('uses lower debit rate after Oct 2026', () => {
    const pre  = getRatesForPeriod(new Date('2026-09-30'));
    const post = getRatesForPeriod(new Date('2026-10-01'));
    expect(post.current.debitCentsPerTxn).toBeLessThan(pre.current.debitCentsPerTxn);
  });
});
```

---

## 5. Expert Mode Rate Merging

When a payment wizard enters their exact rates, those rates replace the defaults for the "current" calculation — but the reform caps still apply to the "projected" calculation.

```typescript
// packages/calculations/calculations.ts

export function mergeExpertRates(
  baseRates: InterchangeRates,
  expertRates: ExpertRates
): InterchangeRates {
  return {
    // Expert debit rate, but capped at reform limit for projected period
    debitCentsPerTxn: expertRates.debitCents
      ?? baseRates.debitCentsPerTxn,

    // Expert credit rate — the reform cap applies to projected period separately
    consumerCreditPct: expertRates.creditPct
      ? expertRates.creditPct / 100
      : baseRates.consumerCreditPct,

    // Commercial rate: not affected by reform, use expert value if provided
    commercialCreditPct: baseRates.commercialCreditPct,

    // Foreign: not yet affected (until Apr 2027)
    foreignPct: baseRates.foreignPct,
  };
}

// When calculating PROJECTED rates for expert users:
// Cap the expert's rates at the reform limits
export function applyReformCaps(
  expertCurrentRates: InterchangeRates,
  reformRates: InterchangeRates
): InterchangeRates {
  return {
    // Their actual debit rate OR the reform cap, whichever is lower
    debitCentsPerTxn: Math.min(
      expertCurrentRates.debitCentsPerTxn,
      reformRates.debitCentsPerTxn
    ),

    // Their actual credit rate OR the reform cap, whichever is lower
    consumerCreditPct: Math.min(
      expertCurrentRates.consumerCreditPct,
      reformRates.consumerCreditPct
    ),

    commercialCreditPct: expertCurrentRates.commercialCreditPct,
    foreignPct: expertCurrentRates.foreignPct,
  };
}
```

**Example:** A merchant enters their actual debit rate as 7 cents. The reform cap is 8 cents. Since their rate (7c) is already below the cap (8c), the reform produces zero debit saving for them — correctly. The system must handle this case and not show a negative saving.

---

## 6. Formula Reference

The formulas are fixed. Only the input constants change.

### Interchange saving

```typescript
const debitTxns   = (volume * cardMix.debitShare) / avgTxnValue;
const debitSaving = debitTxns * (currentRates.debitCentsPerTxn - projectedRates.debitCentsPerTxn);

const creditSaving = volume * cardMix.consumerCreditShare *
  (currentRates.consumerCreditPct - projectedRates.consumerCreditPct);

const totalICSaving = debitSaving + creditSaving;
// Note: commercial and foreign IC rates are unchanged by Oct reform
```

### Cost-plus P&L swing

```typescript
const grossCOA = (volume * (
  currentRates.consumerCreditPct  * cardMix.consumerCreditShare +
  currentRates.commercialCreditPct * cardMix.commercialShare +
  currentRates.foreignPct          * cardMix.foreignShare
)) + (debitTxns * currentRates.debitCentsPerTxn) + schemeFeesTotal + marginTotal;

const surchargeRevenue = surcharging ? volume * surchargeRate : 0;
const netToday = grossCOA - surchargeRevenue;

// After reform: IC saving flows automatically
const octNet = grossCOA - totalICSaving - 0; // surcharge gone
const plSwing = netToday - octNet;
```

### Flat rate P&L swing

```typescript
const annualMSF = volume * msfRate; // merchant's blended rate × volume
const netToday = annualMSF - surchargeRevenue;

// After reform: IC saving flows only if PSP passes it through
const ptSaving = totalICSaving * passThrough; // passThrough: 0.0 to 1.0
const octNet = annualMSF - ptSaving - 0; // surcharge gone
const plSwing = netToday - octNet;
```

### Foreign card cost floor (important caveat)

```typescript
// After April 2027: IC cap of 1.0% applies to interchange ONLY
// Scheme fees (1.58%) are NOT capped — they are added on top
const foreignICRate   = 0.01;   // 1.0% cap
const foreignSchemeRate = 0.0158; // 1.58% — unregulated, unchanged
const foreignTrueFloor = foreignICRate + foreignSchemeRate; // 2.58%

// When displaying foreign card cost after Apr 2027:
// Always show the true floor, never just the IC cap
// "The 1.0% cap is on interchange only. True cost floor is ~2.58%."
```

---

## 7. Configuration Change Checklist

Use this when updating any calculation configuration.

### Tier 1 change (regulatory constant)

```
[ ] Identify the source (RBA publication URL or date)
[ ] Update the value in packages/calculations/constants/au.ts
[ ] Update the corresponding test in calculations.test.ts
[ ] Run turbo run test:unit — all tests must pass
[ ] Verify reference scenarios in calculation-verification.md
[ ] Commit with message: "Update [rate] per RBA [document] [date]"
[ ] PR to staging branch, deploy, verify outputs visually
[ ] PR to main, manual approval, deploy to production
```

### Tier 2 change (operational parameter)

```
[ ] Open Railway dashboard → web service → Variables
[ ] Update the relevant CALC_* variable
[ ] Click Deploy (Railway applies without a code deployment)
[ ] Verify the change on staging before production
[ ] Update the corresponding environment variable on production
[ ] Document the change and reason in a comment or Notion
```

### After any rate change

Verify these outputs manually on staging:

```
[ ] Category 1 merchant ($2M cost-plus, not surcharging):
    plSwing should be positive, reflecting IC saving

[ ] Category 2 merchant ($2M flat, not surcharging) at 0% PT:
    plSwing should be zero (PSP keeps saving)

[ ] Category 2 at 100% PT:
    plSwing should equal totalICSaving

[ ] Category 4 merchant ($3M flat, surcharging 1.2%):
    plSwing should be significantly negative

[ ] Expert user at debit rate below reform cap (e.g. 7c):
    debitSaving should be zero (already below cap)

[ ] After Oct 2026: getCurrentPeriod returns post_oct_2026
    periodLabel.current should be "Current rates" not "Today"
```

---

## 8. Phase 2 — Admin Configuration (Optional)

If the PSP Rate Registry generates enough volume, a simple admin table in Supabase could allow updating card mix benchmarks without code:

```sql
CREATE TABLE calculation_config (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL DEFAULT 'AU',
  config_key   text NOT NULL,  -- e.g. 'card_mix_debit'
  config_value text NOT NULL,  -- stored as text, parsed at runtime
  effective_from timestamptz NOT NULL,
  notes        text,
  created_at   timestamptz DEFAULT now(),
  UNIQUE(country_code, config_key, effective_from)
);
```

This is not needed for Phase 1. The environment variable approach in Tier 2 is sufficient until the product has enough volume that operational tuning is frequent.

---

*Calculation Configuration v1.0 · nosurcharging.com.au · April 2026*
