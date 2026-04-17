# nosurcharging.com.au — Iteration 2
## Pricing Model Expansion · Range Display · Modelling Fixes
## Master Claude Code Prompt — v5 (final)

**Repo:** https://github.com/manuzafar/nosurcharging
**Source read at:** commit 4b03d44, 11 April 2026
**Test baseline:** 216 passing tests (run `pnpm test` to confirm before starting)

---

## PRIORITY HIERARCHY — READ THIS FIRST

```
1. THIS PROMPT.MD — highest authority for iteration 2 changes
2. CLAUDE.md — project context and architecture rules
3. docs/ reference files — will be updated as part of this iteration
```

**Specific conflicts and resolutions:**

**`docs/product/calculation-verification.md`** says "if the engine produces
different values, the engine is wrong." For iteration 2, that document is wrong
on several specific values. This prompt supersedes it. Update the doc alongside
the code (instructions provided at each fix point).

**`docs/architecture/business-rules-engine.md` Section 7** includes eftpos in
the scheme-level saving calculation. That spec is incorrect — eftpos at ~$0.02/txn
is already below the 8c reform cap. Update that section alongside the code.

**`docs/design/component-specs.md` CB-08** says the pass-through slider initial
value is 0%. This prompt overrides it to 45% (RBA market average). Update CB-08.

**`docs/architecture/database-schema.sql`** has `category integer NOT NULL CHECK
(category IN (1,2,3,4))`. Apply migration 002 before any new plan types are
inserted.

---

## READ THESE FILES FIRST — ALL OF THEM, IN ORDER

Do not write a single line of code until you have read every file below.

```
CLAUDE.md
docs/product/calculation-verification.md   ← will be updated (see priority note)
docs/design/design-tokens.md              ← amber #BA7517 is the ONLY accent
docs/design/component-specs.md            ← CB-08 slider default conflict noted
docs/architecture/database-schema.sql     ← category constraint requires migration
docs/architecture/business-rules-engine.md ← Section 7 eftpos error noted above
packages/calculations/types.ts
packages/calculations/calculations.ts
packages/calculations/constants/au.ts
packages/calculations/rules/resolver.ts
packages/calculations/rules/schema.ts
packages/calculations/categories.ts
packages/calculations/actions.ts
packages/calculations/periods.ts
packages/calculations/__tests__/calculations.test.ts
apps/web/actions/submitAssessment.ts
apps/web/components/assessment/Step2PlanType.tsx
apps/web/components/assessment/Step3Surcharging.tsx
apps/web/components/results/VerdictSection.tsx
apps/web/components/results/PassThroughSlider.tsx
apps/web/app/assessment/page.tsx
apps/web/app/results/page.tsx
apps/web/e2e/                    ← list all spec files before writing Step 2 code
```

After reading, record:
```bash
pnpm test 2>&1 | tail -5         # exact test count — your baseline
pnpm build 2>&1 | grep -c error  # must be 0
```

---

## ARCHITECTURAL CONSTRAINTS — MEMORISE THESE

**Constraint 1 — Resolver/engine separation is sacred.**
`calculateMetrics()` receives `ResolvedAssessmentInputs` only. No fallbacks, no
raw form data, no optionals. All resolution happens in `resolver.ts`.

**Constraint 2 — PassThroughSlider re-runs the full pipeline on every drag.**
All fields in `AssessmentOutputs` recompute on every slider move. `plSwingLow`
and `plSwingHigh` must be IDENTICAL regardless of `passThrough` value — they must
NOT reference `inputs.passThrough`.

**Constraint 3 — Ground truth changes cascade through icSaving. Understand this
before editing any test.**

The eftpos exclusion fix (debitSaving) cascades to icSaving, and then to octNet
and plSwing. The surcharge network fix cascades to surchargeRevenue, netToday, and
plSwing. The `grossCOA` is UNCHANGED because the engine uses two separate debit
transaction variables (see Phase 1.3 Fix 1).

Fields PERMITTED to change:
- `debitSaving` — Scenarios 1-4
- `icSaving` — Scenarios 1-4 (cascade from debitSaving)
- `octNet` — Scenarios 1, 3, 4 (cascade from icSaving)
- `surchargeRevenue` — Scenarios 3, 4
- `netToday` — Scenarios 3, 4 (cascade from surchargeRevenue)
- `plSwing` — Scenarios 1, 2@45%PT, 2@100%PT, 3, 4

Fields NOT PERMITTED to change:
- `creditSaving` — any scenario
- `grossCOA` — any scenario (UNCHANGED — see Fix 1 architecture)
- `todayScheme`, `oct2026Scheme` — any scenario
- `netToday` — Scenarios 1 and 2 (no surcharging, unaffected)
- `plSwing` — Scenario 2@0%PT and Scenario 5

**Verified ground truth after both fixes:**

| Scenario | Field | Old value | New value |
|---|---|---|---|
| 1 ($2M CP) | debitSaving | $184.62 | **$160.00** |
| 1 ($2M CP) | icSaving | $1,724.62 | **$1,700.00** |
| 1 ($2M CP) | grossCOA | $9,401.54 | $9,401.54 (UNCHANGED) |
| 1 ($2M CP) | netToday | $9,401.54 | $9,401.54 (UNCHANGED) |
| 1 ($2M CP) | octNet | $7,676.92 | **$7,701.54** |
| 1 ($2M CP) | plSwing | +$1,724.62 | **+$1,700.00** |
| 2 (45%PT) | plSwing | +$776.08 | **+$765.00** |
| 2 (100%PT) | plSwing | +$1,724.62 | **+$1,700.00** |
| 3 ($10M CP+S) | debitSaving | $923.08 | **$800.00** |
| 3 ($10M CP+S) | icSaving | $8,623.08 | **$8,500.00** |
| 3 ($10M CP+S) | grossCOA | $47,007.69 | $47,007.69 (UNCHANGED) |
| 3 ($10M CP+S) | surchargeRevenue | $120,000 | **$108,000** |
| 3 ($10M CP+S) | netToday | -$72,992.31 | **-$60,992.31** |
| 3 ($10M CP+S) | octNet | $38,384.61 | **$38,507.69** |
| 3 ($10M CP+S) | plSwing | -$111,376.92 | **-$99,500.00** |
| 4 ($3M Flat+S) | debitSaving | $276.92 | **$240.00** |
| 4 ($3M Flat+S) | icSaving | $2,586.92 | **$2,550.00** |
| 4 ($3M Flat+S) | surchargeRevenue | $36,000 | **$32,400** |
| 4 ($3M Flat+S) | netToday | $6,000 | **$9,600** |
| 4 ($3M Flat+S) | octNet | $40,835.89 | **$40,852.50** |
| 4 ($3M Flat+S) | plSwing | -$34,835.89 | **-$31,252.50** |
| 5 ($5M expert) | all | unchanged | unchanged ✓ |

**Constraint 4 — Types before components. Tests alongside engine changes.**
TypeScript type changes committed and build-tested before any component references
the new field. Write new test cases immediately after each engine change.

**Constraint 5 — `strategic_rate` never reaches the calculation engine.**
Intercepted in `submitAssessment.ts` before the resolve/calculate pipeline.

**Constraint 6 — `zero_cost` uses a separate function, not a branch.**
`calculateZeroCostMetrics()` — enforces `preReformNetCost: 0` literal type.

**Constraint 7 — Zero-cost rate uses three-state `msfRateMode`, not null.**
State: `'unselected' | 'market_estimate' | 'custom'` + `customMSFRate: number|null`.
`canProceed`: `msfRateMode === 'market_estimate'` OR `(msfRateMode === 'custom' &&
customMSFRate > 0)`. Never pre-selected on load.

**Constraint 8 — Amber tokens from design-tokens.md. No 'accent' variant.**
`#BA7517` is the only brand accent. PillBadge has variants `'amber'`, `'green'`,
`'red'`, `'grey'`. There is NO `'accent'` variant. Any reference to `'accent'` is
wrong — use `'amber'`.

**Constraint 9 — DB category column requires migration 002 before new plan types.**
Sentinels: `0 = zero_cost`, `5 = strategic_rate`. Never null.

---

## PHASE STRUCTURE

```
Phase 0 — DB migration         (apply 002_assessment_variants.sql)
Phase 1 — Package layer        (types → constants → engine+tests → categories → actions → resolver)
Phase 2 — Engine gate          (all 216+ tests pass including new scenarios)
Phase 3 — Server action        (submitAssessment.ts)
Phase 4 — Assessment UI        (Step2PlanType + E2E update)
Phase 5 — Results UI           (VerdictSection, new components, slider)
```

---

# PHASE 0 — DATABASE MIGRATION

Apply BEFORE any code changes. Staging first, verify, then production.

Create `packages/db/migrations/002_assessment_variants.sql`:

```sql
-- Migration 002: Support zero-cost and strategic-rate assessment variants
-- Apply via Supabase SQL editor: staging FIRST → verify → production
-- NEVER automate in CI

ALTER TABLE assessments
  DROP CONSTRAINT IF EXISTS assessments_category_check;

ALTER TABLE assessments
  ADD CONSTRAINT assessments_category_check
  CHECK (category IN (0, 1, 2, 3, 4, 5));
-- 0 = zero_cost, 5 = strategic_rate, 1-4 = existing categories

ALTER TABLE assessments
  ADD COLUMN IF NOT EXISTS variant_type text
  CHECK (variant_type IN ('standard', 'zero_cost', 'strategic_rate'));

UPDATE assessments SET variant_type = 'standard' WHERE variant_type IS NULL;

-- NOT NULL must be set AFTER the UPDATE — existing rows would otherwise fail
ALTER TABLE assessments ALTER COLUMN variant_type SET NOT NULL;
```

**Verify staging:**
```sql
SELECT id FROM assessments WHERE category NOT IN (0,1,2,3,4,5);  -- → 0 rows
INSERT INTO assessments (session_id, category, variant_type, inputs, outputs, ip_hash, country_code)
VALUES (gen_random_uuid(), 0, 'zero_cost', '{}', '{}', 'test', 'AU');
INSERT INTO assessments (session_id, category, variant_type, inputs, outputs, ip_hash, country_code)
VALUES (gen_random_uuid(), 5, 'strategic_rate', '{}', '{}', 'test', 'AU');
DELETE FROM assessments WHERE ip_hash = 'test';
```

---

# PHASE 1 — PACKAGE LAYER

## 1.1 — packages/calculations/types.ts

**1.1a — Extend planType**
```typescript
// In ResolvedAssessmentInputs:
planType: 'flat' | 'costplus' | 'blended' | 'zero_cost';
// strategic_rate never reaches the engine — intercepted in submitAssessment.ts

estimatedMSFRate?: number;  // zero-cost: resolved post-reform rate
debitRate?: number;         // blended: debit rate as proportion (e.g. 0.009)
creditRate?: number;        // blended: credit rate as proportion (e.g. 0.018)

// In RawAssessmentData:
planType: 'flat' | 'costplus' | 'blended' | 'zero_cost' | 'strategic_rate';
msfRateMode?: 'unselected' | 'market_estimate' | 'custom';
customMSFRate?: number;
// estimatedMSFRate is DERIVED in resolver from msfRateMode + customMSFRate
```

**1.1b — Add range fields to AssessmentOutputs**
```typescript
plSwingLow: number;   // Cat2/blended: 0%PT. Costplus: icSaving×0.80. Fixed at submission.
plSwingHigh: number;  // Cat2/blended: 100%PT. Costplus: icSaving×1.20. Fixed at submission.
rangeDriver: 'pass_through' | 'card_mix';
rangeNote: string;
```

**1.1c — ZeroCostOutputs and StrategicRateDetection**
```typescript
export interface ZeroCostOutputs {
  modelType: 'zero_cost';
  preReformNetCost: 0;           // LITERAL TYPE — compiler enforces invariant
  postReformNetCost: number;
  reformImpact: number;
  plSwingLow: number;
  plSwing: number;
  plSwingHigh: number;
  rangeDriver: 'post_reform_rate';
  rangeNote: string;
  estimatedMSFRate: number;
  confidence: 'directional';
  urgency: 'critical';
  period: ReformPeriod;
}

export interface StrategicRateDetection {
  detected: boolean;
  triggerReason: 'volume_threshold' | 'self_reported' | null;
}
```

```bash
pnpm build  # zero errors
git add packages/calculations/types.ts
git commit -m "types: range fields, ZeroCostOutputs, blended/zero_cost plan types"
```

---

## 1.2 — packages/calculations/constants/au.ts

```typescript
// ADD: lower-of percentage rates for debit
export const AU_DEBIT_PCT_RATES = {
  preSep2026:  0.002,   // 0.20% — pre-reform percentage component
  postOct2026: 0.0016,  // 0.16% — new cap from 1 October 2026
} as const;
// Source: RBA Conclusions Paper, March 2026, Policy 4

// ADD: industry card mix defaults
export const AU_INDUSTRY_CARD_MIX: Record<string, typeof AU_SCHEME_CARD_MIX_DEFAULTS> = {
  cafe:        { visa_debit:0.38, visa_credit:0.14, mastercard_debit:0.22, mastercard_credit:0.09, eftpos:0.10, amex:0.03, foreign:0.03, commercial:0.01 },
  hospitality: { visa_debit:0.34, visa_credit:0.16, mastercard_debit:0.20, mastercard_credit:0.11, eftpos:0.09, amex:0.05, foreign:0.05, commercial:0 },
  retail:      { visa_debit:0.35, visa_credit:0.18, mastercard_debit:0.17, mastercard_credit:0.12, eftpos:0.08, amex:0.05, foreign:0.05, commercial:0 },
  online:      { visa_debit:0.22, visa_credit:0.25, mastercard_debit:0.13, mastercard_credit:0.17, eftpos:0.02, amex:0.11, foreign:0.10, commercial:0 },
  travel:      { visa_debit:0.18, visa_credit:0.20, mastercard_debit:0.12, mastercard_credit:0.14, eftpos:0.04, amex:0.12, foreign:0.20, commercial:0 },
  ticketing:   { visa_debit:0.28, visa_credit:0.22, mastercard_debit:0.16, mastercard_credit:0.15, eftpos:0.06, amex:0.08, foreign:0.05, commercial:0 },
  other:       { visa_debit:0.35, visa_credit:0.18, mastercard_debit:0.17, mastercard_credit:0.12, eftpos:0.08, amex:0.05, foreign:0.05, commercial:0 },
} as const;

// ADD: zero-cost MSF range
export const ZERO_COST_MSF_RANGE = {
  low:     0.012,  // 1.2% — merchant negotiates below market
  default: 0.014,  // 1.4% — RBA SME flat-rate benchmark
  high:    0.016,  // 1.6% — above-market scenario
} as const;
```

```bash
pnpm build
git add packages/calculations/constants/au.ts
git commit -m "constants: debit pct rates, industry card mix, zero-cost MSF range"
```

---

## 1.3 — packages/calculations/calculations.ts

Read the full file before editing. Make all three fixes first, then add new capabilities.

### Fix 1 — Debit saving: TWO separate debitTxns variables + "lower of" formula

**Architecture decision:** `debitIC` in `grossCOA` uses full `debitShare` (0.60,
includes eftpos). `debitSaving` uses `visaMcDebitShare` (0.52, Visa+MC only).
This preserves `grossCOA` unchanged while correctly excluding eftpos from the
saving calculation.

**WHY two variables, not one:** A blended merchant's debit rate covers ALL debit.
Changing the single `debitTxns` variable would change `debitIC`, changing
`grossCOA`, and breaking the waterfall chart. The eftpos exclusion is a SAVING
calculation fix — it should not alter the cost composition display.

```typescript
// ADD import:
import { AU_DEBIT_PCT_RATES } from './constants/au';

// FIND and REPLACE the debit txns + saving block:
// ─── BEFORE ───────────────────────────────────────────────
// const debitTxns = (volume * cardMix.debitShare) / avgTransactionValue;
// const debitSaving = Math.max(0, round2(debitTxns * (currentDebit - projectedDebit)));
// const debitIC = round2(debitTxns * currentDebitCentsPerTxn);
// ─── AFTER ────────────────────────────────────────────────

// visaMcDebitTxns: used ONLY for the saving calculation.
// eftpos (~$0.02/txn) is already below the 8c reform cap — no saving from reform.
const visaMcDebitShare = cardMix.breakdown.visa_debit + cardMix.breakdown.mastercard_debit;
const visaMcDebitTxns = (volume * visaMcDebitShare) / avgTransactionValue;

// "Lower of" rule: interchange = MIN(cents per txn, pct rate × ATV)
const currentDebitICPerTxn = Math.min(
  currentDebitCentsPerTxn,
  AU_DEBIT_PCT_RATES.preSep2026 * avgTransactionValue
);
const projectedDebitICPerTxn = projectedRates
  ? Math.min(projectedDebitCentsPerTxn, AU_DEBIT_PCT_RATES.postOct2026 * avgTransactionValue)
  : currentDebitICPerTxn;

const debitSaving = Math.max(0, round2(
  visaMcDebitTxns * (currentDebitICPerTxn - projectedDebitICPerTxn)
));

// allDebitTxns: used for debitIC in grossCOA (full share including eftpos).
// grossCOA must remain unchanged — debitIC still uses 0.60.
const allDebitTxns = (volume * cardMix.debitShare) / avgTransactionValue;
const debitIC = round2(allDebitTxns * currentDebitCentsPerTxn);
```

**Arithmetic proof at ATV=$65, $2M volume:**
- visaMcDebitTxns = (2,000,000 × 0.52) / 65 = 16,000
- currentDebitICPerTxn = MIN($0.09, 0.002×$65) = MIN($0.09, $0.13) = $0.09
- debitSaving = 16,000 × ($0.09 - $0.08) = $160.00 ✓
- allDebitTxns = (2,000,000 × 0.60) / 65 = 18,461.538
- debitIC = 18,461.538 × $0.09 = $1,661.54 (grossCOA UNCHANGED) ✓

**Update `docs/product/calculation-verification.md` Scenario 1 working:**
```
// FIND:
Debit transactions:
= (2,000,000 × 0.60) / 65
= 18,461.538...
Debit IC saving (9c → 8c = 1c per txn):
= 18,461.538 × 0.01
= $184.62

// REPLACE:
Visa+MC Debit transactions (eftpos excluded — already below 8c cap):
= (2,000,000 × 0.52) / 65     [0.52 = visa_debit(0.35) + mastercard_debit(0.17)]
= 16,000
Lower of rule: MIN(9c, 0.20%×$65) = MIN(9c, 13c) = 9c (cents cap wins at ATV $65)
Debit IC saving (9c → 8c = 1c per txn):
= 16,000 × $0.01
= $160.00
```

Also update `docs/architecture/business-rules-engine.md` Section 7:
```typescript
// In calculateDebitSavingByScheme(), change the schemes array to:
const schemes = [
  { key: 'visa_debit',       share: breakdown.visa_debit },
  { key: 'mastercard_debit', share: breakdown.mastercard_debit },
  // eftpos excluded: current rate (~$0.02/txn) is already below the new 8c cap.
  // The reform produces zero saving for eftpos transactions.
  // NOTE: allDebitTxns (for debitIC in grossCOA) still uses full debitShare.
];
```

### Fix 2 — Surcharge revenue: actual card mix designated share

```typescript
// FIND:
const surchargeRevenue = round2(volume * surchargeRate);

// REPLACE:
// Map each surcharged network to its card mix breakdown share.
// Empty surchargeNetworks with surcharging=true defaults to all designated
// networks — backward-compatible with Scenarios 3/4 (which use []).
const networksToApply: string[] =
  inputs.surcharging && inputs.surchargeNetworks.length === 0
    ? ['visa', 'mastercard', 'eftpos']  // default: all designated
    : inputs.surchargeNetworks;

let designatedSurchargeShare = 0;
if (inputs.surcharging) {
  const { breakdown } = cardMix;
  if (networksToApply.includes('visa')) {
    designatedSurchargeShare += breakdown.visa_debit + breakdown.visa_credit;
  }
  if (networksToApply.includes('mastercard')) {
    designatedSurchargeShare += breakdown.mastercard_debit + breakdown.mastercard_credit;
  }
  if (networksToApply.includes('eftpos')) {
    designatedSurchargeShare += breakdown.eftpos;
  }
  // amex, bnpl, paypal: not designated — excluded from ban
}

const surchargeRevenue = round2(volume * surchargeRate * designatedSurchargeShare);
```

**With default breakdown (empty [], surcharging=true → all designated):**
`visa_debit(0.35) + visa_credit(0.18) + mc_debit(0.17) + mc_credit(0.12) + eftpos(0.08) = 0.90`
S3: $10M × 1.2% × 0.90 = **$108,000** ✓
S4: $3M × 1.2% × 0.90 = **$32,400** ✓

**Update `docs/product/calculation-verification.md` Scenario 3 working:**
```
// FIND:
Surcharge revenue (designated networks only — Visa, MC, eftpos = ~95%):
= 10,000,000 × 0.012 × 0.95
= $108,000.00

// REPLACE:
Surcharge revenue (designated networks — actual card mix share):
= 10,000,000 × 0.012 × 0.90
  [0.90 = visa_debit(0.35)+visa_credit(0.18)+mc_debit(0.17)+mc_credit(0.12)+eftpos(0.08)]
= $108,000.00
```

Update Scenario 3 expected outputs in calculation-verification.md:
```typescript
// New values (grossCOA = $47,007.69 UNCHANGED):
// netToday = $47,007.69 - $108,000.00 = -$60,992.31
// icSaving = $8,500.00 (from new debitSaving $800)
// octNet = $47,007.69 - $8,500.00 = $38,507.69
// plSwing = -$60,992.31 - $38,507.69 = -$99,500.00
{ icSaving: 8500.00, netToday: -60992.31, octNet: 38507.69, plSwing: -99500.00 }
```

Update Scenario 4 expected outputs:
```typescript
// surchargeRevenue = $3M × 1.2% × 0.90 = $32,400
// netToday = $42,000 - $32,400 = $9,600
// icSaving = $2,550.00 (from new debitSaving $240)
// octNet = $42,000 - ($2,550 × 0.45) = $42,000 - $1,147.50 = $40,852.50
// plSwing = $9,600 - $40,852.50 = -$31,252.50
{ icSaving: 2550.00, netToday: 9600.00, octNet: 40852.50, plSwing: -31252.50 }
```

### Fix 3 — Blended: weighted rate using debitShare (not visaMcDebitShare), no round2 on rate

**Decision:** `debitShare` (0.60, all debit) is correct for blended. A blended
merchant's "debit rate" covers ALL debit transactions — Visa, MC, and eftpos are
all billed at the same blended rate. Using visaMcDebitShare (0.52) would understate
the blended debit contribution by excluding eftpos.

**The round2 problem:** `round2(0.01235) = 0.01` (rounds to nearest cent as a
number). Applied to a rate, this is a 19% error. Remove `round2()` from the rate
computation; apply it only to dollar amounts.

```typescript
// FIND and REPLACE the effectiveMSFRate block:
const effectiveMSFRate = (() => {
  if (
    planType !== 'blended'
    || inputs.debitRate === undefined
    || inputs.creditRate === undefined
  ) {
    return msfRate;
  }
  // debitShare (0.60): blended rate covers ALL debit (Visa, MC, eftpos)
  // unknownShare: Amex, foreign, commercial — use msfRate as proxy
  const unknownShare = Math.max(0, 1 - cardMix.debitShare - cardMix.consumerCreditShare);
  // NO round2() here — rates must not be rounded (0.01235 → 0.01 is a 19% error)
  return (
    inputs.debitRate  * cardMix.debitShare
    + inputs.creditRate * cardMix.consumerCreditShare
    + msfRate           * unknownShare
  );
})();
// round2() applied only to the dollar amount:
const annualMSF = round2(volume * effectiveMSFRate);
```

### Fix 4 — STOP: Write new test cases now, before categories.ts

Run:
```bash
pnpm test -- --reporter=verbose 2>&1 | head -50
```

For each failing test, check it against the verified ground truth table (Constraint 3).
Update the expected values. Then proceed to categories.ts.

### Add: Range computation

```typescript
// ADD after existing plSwing calculation, before return:
let plSwingLow: number;
let plSwingHigh: number;
let rangeDriver: AssessmentOutputs['rangeDriver'];
let rangeNote: string;

if (planType === 'flat' || planType === 'blended') {
  // Range is pass-through uncertainty (does NOT reference passThrough)
  if (surcharging) {
    const netTodayFlat = round2(annualMSF - surchargeRevenue);
    plSwingLow  = round2(netTodayFlat - annualMSF);            // 0% PT
    plSwingHigh = round2(netTodayFlat - (annualMSF - icSaving)); // 100% PT
  } else {
    plSwingLow  = 0;
    plSwingHigh = icSaving;
  }
  rangeDriver = 'pass_through';
  rangeNote   = 'Range shows 0% to 100% PSP pass-through. The RBA estimates ~45% average.';
} else {
  // Cost-plus: range is card mix accuracy (±20%)
  const lowIC  = round2(icSaving * 0.80);
  const highIC = round2(icSaving * 1.20);
  plSwingLow  = surcharging ? round2(lowIC  - surchargeRevenue) : lowIC;
  plSwingHigh = surcharging ? round2(highIC - surchargeRevenue) : highIC;
  rangeDriver = 'card_mix';
  rangeNote   = 'Range reflects ±20% card mix accuracy. Enter your actual card mix to narrow it.';
}
```

### Add: calculateZeroCostMetrics()

```typescript
export function calculateZeroCostMetrics(
  inputs: ResolvedAssessmentInputs,
  now: Date = new Date(),
): ZeroCostOutputs {
  const { volume } = inputs;
  const effectiveRate = inputs.estimatedMSFRate ?? ZERO_COST_MSF_RANGE.default;
  return {
    modelType:        'zero_cost',
    preReformNetCost: 0,
    postReformNetCost: round2(volume * effectiveRate),
    reformImpact:     round2(volume * effectiveRate),
    plSwingLow:       round2(volume * ZERO_COST_MSF_RANGE.low),
    plSwing:          round2(volume * ZERO_COST_MSF_RANGE.default),
    plSwingHigh:      round2(volume * ZERO_COST_MSF_RANGE.high),
    rangeDriver:      'post_reform_rate',
    rangeNote:        'Range shows 1.2%–1.6% post-reform rate scenarios. Centre uses RBA 1.4% benchmark.',
    estimatedMSFRate: effectiveRate,
    confidence:       'directional',
    urgency:          'critical',
    period:           getCurrentPeriod(now),
  };
}
```

```bash
pnpm build && pnpm test
# Expected failures: S1 debitSaving, icSaving, octNet, plSwing
#                   S2 plSwing (45%, 100%)
#                   S3 icSaving, netToday, octNet, plSwing
#                   S4 icSaving, netToday, octNet, plSwing
# Update test file to match verified ground truth table in Constraint 3
# Also update docs/product/calculation-verification.md (see Fix 1 and Fix 2 instructions)
# Also update docs/architecture/business-rules-engine.md Section 7
git add packages/calculations/ docs/product/calculation-verification.md docs/architecture/business-rules-engine.md
git commit -m "calc: eftpos exclusion (2 txn vars), surcharge network share, blended rate, ranges, zero-cost; update docs"
```

---

## 1.4 — packages/calculations/categories.ts

```typescript
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
  throw new Error(`Unexpected: planType=${planType}, surcharging=${surcharging}`);
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
```

---

## 1.5 — packages/calculations/actions.ts

```typescript
export function buildActions(
  category: 1 | 2 | 3 | 4 | 'zero_cost',
  psp: string,
  industry: string,
  planType?: 'flat' | 'costplus' | 'blended' | 'zero_cost',
): ActionItem[] {
  if (category === 'zero_cost') return buildZeroCostActions(psp);
  const isBlended = planType === 'blended';
  switch (category) {
    case 1: return buildCat1Actions(psp);
    case 2: return buildCat2Actions(psp, isBlended);
    case 3: return buildCat3Actions(psp);
    case 4: return buildCat4Actions(psp, isBlended);
  }
}

// buildCat2Actions and buildCat4Actions: add isBlended parameter.
// When isBlended=true, append 2 extra PLAN-priority actions:
// 1. "Ask [PSP] for your full card mix breakdown — debit vs credit percentage..."
// 2. "Ask [PSP] for a quote on itemised (cost-plus) pricing..."

function buildZeroCostActions(psp: string): ActionItem[] {
  return [
    { priority: 'urgent', timeAnchor: 'This week',
      text: `Call ${psp} and say: "My zero-cost plan is built on the surcharge mechanism. When the surcharge ban takes effect on 1 October 2026, that mechanism ends. What plan will I be transferred to, and at what rate? I need a written quote before October."` },
    { priority: 'urgent', timeAnchor: 'This week',
      text: `Multiply your monthly card turnover by your expected post-reform rate (use 1.4% if you don't have a confirmed rate). This is your new monthly payment cost from 1 October. Build it into your cash flow now.` },
    { priority: 'urgent', timeAnchor: 'Before August 2026',
      text: `Get quotes from at least two other payment providers. Ask each: "I am currently on zero-cost EFTPOS. What is your best rate for a merchant switching off that model?" Use ${psp}'s quote as your benchmark.` },
  ];
}
```

---

## 1.6 — packages/calculations/rules/resolver.ts

**1.6a — Industry card mix defaults**

```typescript
import { AU_INDUSTRY_CARD_MIX } from '../constants/au';

// In resolveCardMix(), before the components block:
const industry = ctx.industry?.toLowerCase() ?? 'other';
const industryDefaults = AU_INDUSTRY_CARD_MIX[industry] ?? AU_INDUSTRY_CARD_MIX.other;

// Add industry_default source (before regulatory_constant) for each scheme field:
{ source: 'industry_default',    value: industryDefaults.visa_debit },
{ source: 'regulatory_constant', value: AU_SCHEME_CARD_MIX_DEFAULTS.visa_debit },
// repeat for all 7 scheme components
```

**1.6b — Zero-cost and blended resolution**

```typescript
// ADD in resolveAssessmentInputs(), before return:

// Zero-cost: derive estimatedMSFRate from three-state msfRateMode
let estimatedMSFRate: number | undefined;
if (raw.planType === 'zero_cost') {
  const derivedMSF =
    raw.msfRateMode === 'market_estimate' ? 0.014
    : raw.msfRateMode === 'custom' && raw.customMSFRate ? raw.customMSFRate
    : undefined;
  const r = resolveValue('estimatedMSFRate', [
    { source: 'merchant_input',      value: derivedMSF },
    { source: 'regulatory_constant', value: 0.014 },
  ]);
  trace['estimatedMSFRate'] = { source: r.source, value: r.value, label: sourceLabel(r.source) };
  estimatedMSFRate = r.value;
}

// Blended: pass through rates from merchantInput.blendedRates
let debitRate: number | undefined;
let creditRate: number | undefined;
if (raw.planType === 'blended') {
  debitRate  = ctx.merchantInput?.blendedRates?.debitRate;
  creditRate = ctx.merchantInput?.blendedRates?.creditRate;
}

return { ...existing, estimatedMSFRate, debitRate, creditRate };
```

```bash
pnpm build && pnpm test  # all green
git add packages/calculations/
git commit -m "resolver: industry card mix, zero-cost MSF, blended rates"
```

---

# PHASE 2 — ENGINE GATE

```bash
pnpm test
pnpm build  # zero TypeScript errors
```

Confirm these values match the verified ground truth table in Constraint 3.
If any value does NOT match, check the debitTxns implementation first — the most
common error is accidentally using a single variable for both saving and debitIC.

**Do not proceed to Phase 3 until both commands exit cleanly.**

---

# PHASE 3 — SERVER ACTION

## 3.1 — apps/web/actions/submitAssessment.ts

### Change 1 — Final prop types (define once, no intermediate state)

```typescript
// AssessmentFormData — final form, no intermediate estimatedMSFRate
planType: 'flat' | 'costplus' | 'blended' | 'zero_cost' | 'strategic_rate';
msfRateMode?: 'unselected' | 'market_estimate' | 'custom';
customMSFRate?: number;
blendedDebitRate?: number;
blendedCreditRate?: number;

// AssessmentResult — final union type
outputs?: AssessmentOutputs | ZeroCostOutputs;
strategicRateExit?: boolean;
assessmentId?: string;
```

### Change 2 — Imports

```typescript
import { calculateZeroCostMetrics } from '@nosurcharging/calculations/calculations';
import { detectStrategicRate } from '@nosurcharging/calculations/categories';
import type { ZeroCostOutputs } from '@nosurcharging/calculations/types';
```

### Change 3 — Strategic rate exit (persist record before returning)

```typescript
const strategicCheck = detectStrategicRate(formData.planType, formData.volume, formData.psp);
if (strategicCheck.detected) {
  const { data: inserted } = await supabaseAdmin
    .from('assessments')
    .insert({
      session_id: sessionId, country_code: 'AU',
      category: 5, variant_type: 'strategic_rate',
      inputs: { ...raw, merchantInput: formData.merchantInput },
      outputs: { strategic_rate: true, triggerReason: strategicCheck.triggerReason },
      ip_hash: ipHash,
    })
    .select('id').single();
  return { success: true, assessmentId: inserted?.id, strategicRateExit: true };
}
```

### Change 4 — Route zero_cost to calculateZeroCostMetrics

```typescript
const ctx: ResolutionContext = {
  country: 'AU', industry: formData.industry,
  merchantInput: {
    ...formData.merchantInput,
    blendedRates: formData.planType === 'blended'
      ? { debitRate: formData.blendedDebitRate, creditRate: formData.blendedCreditRate }
      : undefined,
  },
};
const resolved = resolveAssessmentInputs(
  { ...raw, msfRateMode: formData.msfRateMode, customMSFRate: formData.customMSFRate },
  ctx
);

const outputs: AssessmentOutputs | ZeroCostOutputs =
  formData.planType === 'zero_cost'
    ? calculateZeroCostMetrics(resolved)
    : calculateMetrics(resolved);
```

### Change 5 — Category and variant_type sentinels

```typescript
const categoryValue = formData.planType === 'zero_cost'
  ? 0  // sentinel — see migration 002
  : (outputs as AssessmentOutputs).category;
const variantType = formData.planType === 'zero_cost' ? 'zero_cost' : 'standard';
```

### Change 6 — buildActions

```typescript
const categoryArg = formData.planType === 'zero_cost'
  ? ('zero_cost' as const)
  : (outputs as AssessmentOutputs).category;
const actions = buildActions(categoryArg, safePsp, formData.industry, formData.planType);
```

### Change 7 — SR-12 compliance

Never log: `customMSFRate`, `blendedDebitRate`, `blendedCreditRate`.
Verify Sentry scrubbing config excludes these field names before this commit.

```bash
pnpm build
git add apps/web/actions/submitAssessment.ts packages/db/migrations/002_assessment_variants.sql
git commit -m "action: strategic exit, zero-cost routing, blended rates, category sentinels"
```

---

# PHASE 4 — ASSESSMENT UI

## 4.0 — Check E2E tests BEFORE writing Step 2 code

```bash
grep -rn "plan\|flat\|costplus\|Step 2\|statement" apps/web/e2e/
pnpm playwright test --grep "assessment" 2>&1 | grep -E "failed|error"
```

## 4.1 — apps/web/components/assessment/Step2PlanType.tsx

### Change 1 — Final props interface (define with final handlers — no intermediate state)

```typescript
interface Step2PlanTypeProps {
  planType: 'flat' | 'costplus' | 'blended' | 'zero_cost' | null;
  msfRateMode: 'unselected' | 'market_estimate' | 'custom';  // final — not estimatedMSFRate
  customMSFRate: number | null;
  blendedDebitRate: number | null;
  blendedCreditRate: number | null;
  psp: string | null;
  merchantInput: MerchantInputOverrides;
  volume?: number;  // for zero-cost preview
  onPlanTypeChange: (pt: 'flat' | 'costplus' | 'blended' | 'zero_cost') => void;
  onMsfRateModeChange: (mode: 'unselected' | 'market_estimate' | 'custom') => void;
  onCustomMSFRateChange: (rate: number | null) => void;
  onBlendedRatesChange: (debit: number | null, credit: number | null) => void;
  onStrategicRateSelected: () => void;
  onPspChange: (psp: string) => void;
  onMerchantInputChange: (input: MerchantInputOverrides) => void;
  onNext: () => void;
  onBack: () => void;
}
```

### Change 2 — Assessment page state

```typescript
// NEW fields (initial values):
msfRateMode: 'unselected' as 'unselected' | 'market_estimate' | 'custom',
customMSFRate: null as number | null,
blendedDebitRate: null as number | null,
blendedCreditRate: null as number | null,
strategicRateSelected: false,
passThrough: 0.45,  // OVERRIDE of CB-08 (0%) → 45% (RBA market average)
                    // Update docs/design/component-specs.md CB-08 to match
```

### Change 3 — Four plan type cards (add blended and zero-cost after existing two)

Selected card border: `1px solid #BA7517`. Badge: `variant='amber'` when selected.
There is NO `'accent'` variant.

```tsx
{/* Blended rate card — add after Cost-Plus card */}
<Card selected={planType === 'blended'} onClick={() => onPlanTypeChange('blended')}
  role="radio" ariaChecked={planType === 'blended'} ariaLabel="Blended rate plan">
  <div className="flex items-start justify-between">
    <div>
      <p className="text-body font-medium">Different rates for different cards</p>
      <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
        Westpac, Airwallex, some banks
      </p>
    </div>
    <PillBadge variant={planType === 'blended' ? 'amber' : 'grey'}>Blended</PillBadge>
  </div>
  <div className="mt-3 rounded-lg bg-gray-50 p-3 font-mono text-caption">
    <div className="flex justify-between text-gray-500"><span>Debit</span><span>0.90%</span></div>
    <div className="mt-0.5 flex justify-between text-gray-500"><span>Credit</span><span>1.60%</span></div>
  </div>
</Card>

{/* Zero-cost card */}
<Card selected={planType === 'zero_cost'} onClick={() => onPlanTypeChange('zero_cost')}
  role="radio" ariaChecked={planType === 'zero_cost'} ariaLabel="Zero-cost EFTPOS plan">
  <div className="flex items-start justify-between">
    <div>
      <p className="text-body font-medium">Zero-cost — I pay nothing</p>
      <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
        Smartpay / Shift4, Tyro zero-cost
      </p>
    </div>
    <PillBadge variant={planType === 'zero_cost' ? 'amber' : 'grey'}>Zero-cost</PillBadge>
  </div>
  <div className="mt-3 rounded-lg bg-gray-50 p-3 font-mono text-caption">
    <div className="flex justify-between">
      <span>Your payment cost</span>
      <span style={{ color: 'var(--color-text-success)' }}>$0.00</span>
    </div>
    <div className="mt-1 text-xs" style={{ color: '#BA7517' }}>⚠ Most affected by October reform</div>
  </div>
</Card>
```

### Change 4 — Zero-cost warning panel (three-state msfRateMode)

```tsx
{planType === 'zero_cost' && (
  <div className="mt-4" style={{
    background: '#FDF2F2', borderLeft: '3px solid var(--color-text-danger)',
    border: '1px solid rgba(191,53,53,0.25)', padding: '16px',
  }}>
    <p className="text-label" style={{ color: 'var(--color-text-danger)', letterSpacing: '1.2px' }}>
      ACTION REQUIRED
    </p>
    <p className="mt-1 text-body-sm font-medium" style={{ color: 'var(--color-text-danger)' }}>
      Your zero-cost plan ends on 1 October 2026
    </p>
    <p className="mt-1 text-caption" style={{ color: 'var(--color-text-secondary)' }}>
      The surcharge mechanism ends. You will pay the full processing cost from October.
    </p>

    {/* Three-state — none pre-selected */}
    <div className="mt-3 flex flex-wrap gap-2">
      <button type="button" onClick={() => onMsfRateModeChange('market_estimate')}
        className={`rounded-pill border px-3 py-1.5 text-caption transition-all ${
          msfRateMode === 'market_estimate'
            ? 'border-red-400 bg-red-100 text-red-800'
            : 'border-gray-200 text-gray-500'}`}>
        Use 1.4% market estimate
      </button>
      <button type="button" onClick={() => onMsfRateModeChange('custom')}
        className={`rounded-pill border px-3 py-1.5 text-caption transition-all ${
          msfRateMode === 'custom'
            ? 'border-red-400 bg-red-100 text-red-800'
            : 'border-gray-200 text-gray-500'}`}>
        I have a confirmed rate
      </button>
    </div>

    {msfRateMode === 'custom' && (
      <div className="mt-2 flex items-center gap-2">
        <input type="number" placeholder="e.g. 1.3" step="0.01" min="0.1" max="5"
          className="w-24 rounded border border-gray-300 px-2 py-1 font-mono text-caption"
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            onCustomMSFRateChange(isNaN(v) || v <= 0 ? null : v / 100);
          }} />
        <span className="text-caption text-gray-400">%</span>
      </div>
    )}

    {(msfRateMode === 'market_estimate' || (msfRateMode === 'custom' && customMSFRate)) && (
      <p className="mt-2 text-caption" style={{ color: 'var(--color-text-secondary)' }}>
        At {((msfRateMode === 'market_estimate' ? 0.014 : customMSFRate!) * 100).toFixed(1)}%,
        you would pay approximately{' '}
        <strong>
          ${Math.round((volume ?? 0) * (msfRateMode === 'market_estimate' ? 0.014 : customMSFRate!))
              .toLocaleString('en-AU')}/year
        </strong>
        {' '}from 1 October.
      </p>
    )}
  </div>
)}
```

### Change 5 — Blended optional rate panel

```tsx
{planType === 'blended' && (
  <div className="mt-4 border border-gray-200 bg-gray-50 p-4">
    <p className="text-body-sm font-medium">Optional: enter your rates for a more accurate estimate</p>
    <p className="mt-1 text-caption text-gray-400">
      Find on your monthly statement. Leave blank to use RBA averages (±20% accuracy).
    </p>
    <div className="mt-3 flex gap-4">
      <div>
        <label className="text-caption text-gray-500">Debit rate (%)</label>
        <input type="number" placeholder="e.g. 0.9" step="0.01" min="0" max="5"
          className="mt-1 block w-24 rounded border border-gray-300 px-2 py-1 font-mono text-caption"
          onChange={(e) => { const v=parseFloat(e.target.value);
            onBlendedRatesChange(isNaN(v)?null:v/100, blendedCreditRate); }} />
      </div>
      <div>
        <label className="text-caption text-gray-500">Credit rate (%)</label>
        <input type="number" placeholder="e.g. 1.6" step="0.01" min="0" max="5"
          className="mt-1 block w-24 rounded border border-gray-300 px-2 py-1 font-mono text-caption"
          onChange={(e) => { const v=parseFloat(e.target.value);
            onBlendedRatesChange(blendedDebitRate, isNaN(v)?null:v/100); }} />
      </div>
    </div>
  </div>
)}
```

### Change 6 — Strategic rate text link and canProceed gate

```tsx
<div className="mt-3">
  <button type="button" onClick={onStrategicRateSelected}
    className="text-caption underline underline-offset-2"
    style={{ color: 'var(--color-text-tertiary)' }}>
    Processing $50M+ in card payments? You may have a strategic rate →
  </button>
</div>

// canProceed gate:
const zeroCostReady = planType !== 'zero_cost'
  || msfRateMode === 'market_estimate'
  || (msfRateMode === 'custom' && customMSFRate !== null && customMSFRate > 0);
const canProceed = planType !== null && psp !== null && zeroCostReady;
```

### Change 7 — Strategic exit inline (no URL change)

```tsx
if (strategicRateSelected) {
  return <StrategicRateExitPage onBack={() => setStrategicRateSelected(false)} />;
}
```

### Change 8 — SessionStorage persistence for new fields

```typescript
// Add to the persisted fields list (if sessionStorage is used):
const PERSISTED_FIELDS = [
  // ... existing fields ...
  'msfRateMode', 'customMSFRate', 'blendedDebitRate', 'blendedCreditRate',
  // strategicRateSelected intentionally NOT persisted (refresh → return to form)
];
```

### Change 9 — Analytics events

```typescript
// Update:
trackEvent('Plan type selected', { type: planType }); // now covers all 5 types

// New events:
trackEvent('Zero-cost rate selected', { mode: msfRateMode, country: 'AU' });
trackEvent('Blended rates entered',   { debit_provided: blendedDebitRate!==null,
                                         credit_provided: blendedCreditRate!==null, country: 'AU' });
// In StrategicRateExitPage on mount:
trackEvent('Strategic rate exit viewed', { trigger: triggerReason, country: 'AU' });
```

### Change 10 — Update E2E tests and CB-08 doc

```bash
pnpm playwright test --grep "assessment" 2>&1 | grep -E "failed|error"
# Update failing selectors to new aria-labels:
# aria-label="Flat rate plan"      (existing — unchanged)
# aria-label="Cost-plus plan"      (existing — unchanged)
# aria-label="Blended rate plan"   (NEW)
# aria-label="Zero-cost EFTPOS plan" (NEW)

# Update docs/design/component-specs.md:
# CB-08: "Initial value: 0%" → "Initial value: 45%"
# CB-01: Add blended and zero-cost card specs
```

```bash
pnpm build
git add apps/web/components/assessment/ apps/web/app/assessment/ apps/web/e2e/ docs/design/component-specs.md
git commit -m "assessment: zero-cost, blended, strategic rate, analytics, sessionStorage, CB-08 doc"
```

---

# PHASE 5 — RESULTS UI

## 5.1 — VerdictSection.tsx — range display

```typescript
const { plSwing, plSwingLow, plSwingHigh, rangeDriver, rangeNote } = outputs;
const fmt = (v: number) =>
  (v >= 0 ? '+' : '-') + '$' + Math.abs(v).toLocaleString('en-AU', { maximumFractionDigits: 0 });
```

**Handle old records without plSwingLow:**
```tsx
if (outputs.plSwingLow === undefined) {
  return (
    <div>
      {/* category pill + headline */}
      <p className="mt-3 font-mono text-financial-hero" style={{ color: swingColour }}>
        {fmt(plSwing)}
      </p>
      <p className="mt-1 text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
        Complete a new assessment to see the full range.
      </p>
    </div>
  );
}
```

**Range display — note the font-size override of CLAUDE.md rule #2:**
CLAUDE.md design rule #2 specifies the P&L hero at 44px. The range display
intentionally overrides this to `clamp(24px, 7vw, 32px)` because showing two
numbers (low + high) at 44px each would exceed mobile viewport width. The range
IS the hero — we are replacing one 44px number with a pair. Documented in
rationale.md. The single expected-outcome number below it uses `text-financial-standard`
(22px) which complies with the hierarchy.

```tsx
<div className="mt-3">
  <p className="font-mono" style={{ fontSize: 'clamp(24px, 7vw, 32px)', color: rangeColour }}>
    {fmt(plSwingLow)}
    <span className="font-sans mx-2" style={{ fontSize: '14px', color: 'var(--color-text-tertiary)' }}>
      to
    </span>
    {fmt(plSwingHigh)}
  </p>
  <p className="mt-1 text-caption" style={{ color: 'var(--color-text-secondary)' }}>
    per year from 1 October 2026
  </p>
</div>

<div className="mt-2 flex flex-wrap items-center gap-x-2">
  <span className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>Expected:</span>
  <span className="font-mono text-body-sm font-medium"
    style={{ color: plSwing >= 0 ? 'var(--color-text-success)' : 'var(--color-text-danger)' }}>
    {fmt(plSwing)}
  </span>
  <span className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
    {rangeDriver === 'pass_through'
      ? '— at 45% PSP pass-through (RBA market estimate)'
      : '— at estimated card mix'}
  </span>
</div>

<p className="mt-2 text-caption" style={{ color: 'var(--color-text-tertiary)', lineHeight: '1.55' }}>
  {rangeNote}
</p>
```

## 5.2 — PassThroughSlider.tsx — initial value and note

`passThrough: 0.45` was set in Phase 4 Change 2. The slider renders at 45% on
first mount — no changes needed here.

Update the slider note:
```tsx
<p className="...">
  The RBA estimates ~45% of merchants will see some pass-through from their PSP.
  At 0%, {pspName} keeps the full {fmt(icSaving)} interchange saving.
  At 100%, it passes through entirely.
</p>
```

## 5.3 — Create ZeroCostResultsVariant.tsx (NEW)

Full spec: docs/design/ux-new-components.md Component 1.
Props: `{ outputs: ZeroCostOutputs; volume: number; pspName: string; actions: ActionItem[] }`
Uses amber `#BA7517` — no emerald accent, no 'accent' badge variant.

## 5.4 — Create StrategicRateExitPage.tsx (NEW)

Full spec: docs/design/ux-new-components.md Component 2.
Props: `{ onBack: () => void }`
No dollar figures anywhere on the page. On mount: `trackEvent('Strategic rate exit viewed', ...)`.

## 5.5 — Create LCRInsightPanel.tsx (NEW)

Full spec: docs/design/ux-new-components.md Component 3.

```typescript
interface LCRInsightPanelProps {
  volume: number;
  pspName: string;
  planType: 'flat' | 'blended';      // NOT category
  avgTransactionValue: number;        // REQUIRED — eftpos is a flat fee, not a %
}
// Calculation:
const EFTPOS_CENTS = 0.02;      // $0.02 flat fee per transaction
const VISA_DEBIT  = 0.005;      // ~0.5% rate
const DEBIT_SHARE = 0.55;
const eftposRate  = EFTPOS_CENTS / avgTransactionValue;  // varies with ATV
const lcrDiff     = Math.max(0, VISA_DEBIT - eftposRate);
const estimate    = Math.round(volume * DEBIT_SHARE * lcrDiff);
```

Pass `avgTransactionValue` from results page:
```tsx
<LCRInsightPanel volume={...} pspName={...} planType={planType}
  avgTransactionValue={result.inputs?.avgTransactionValue ?? 65} />
```

## 5.6 — Update results page routing

```tsx
if (result.strategicRateExit) {
  return <StrategicRateExitPage onBack={() => router.push('/assessment')} />;
}
if (result.outputs && 'modelType' in result.outputs) {
  return <ZeroCostResultsVariant outputs={result.outputs as ZeroCostOutputs}
    volume={...} pspName={...} actions={result.actions ?? []} />;
}
// LCR panel: appears for flat and blended plans
const planType = result.inputs?.planType;
{(planType === 'flat' || planType === 'blended') && (
  <LCRInsightPanel volume={...} pspName={...} planType={planType}
    avgTransactionValue={result.inputs?.avgTransactionValue ?? 65} />
)}
```

---

# PHASE 5 GATE — FINAL VERIFICATION

```bash
grep -rn "'flat_rate'\|'cost_plus'" --include="*.tsx" apps/web/components/  # → 0
grep -rn '"Stripe"\|"Square"\|"CommBank"' apps/web/components/  # → 0 (constant arrays OK)
pnpm build && pnpm test && pnpm playwright test
```

Final commit:
```bash
git add -A
git commit -m "feat: Iteration 2 complete — pricing models, ranges, modelling fixes"
```

---

# INVARIANTS — NEVER VIOLATE

1. `todayScheme === oct2026Scheme`
2. `debitSaving >= 0`
3. `preReformNetCost === 0` for zero_cost (literal type)
4. `plSwingLow <= plSwing <= plSwingHigh`
5. `plSwingLow` and `plSwingHigh` do NOT reference `inputs.passThrough`
6. All numeric outputs finite (no NaN, Infinity)
7. `calculateMetrics()` never receives raw form data
8. `strategic_rate` never reaches `calculateMetrics()` or `calculateZeroCostMetrics()`
9. Test count never decreases from 216
10. `category` column always receives 0, 1, 2, 3, 4, or 5 — never null
11. `grossCOA` is UNCHANGED by the eftpos exclusion fix (two separate debitTxns)

---

# IF YOU GET STUCK

**"Expected 184.62 received 160.00" on Scenario 1 debitSaving:**
Expected. Update to $160.00. Also update icSaving ($1,700), octNet ($7,701.54), plSwing (+$1,700). See Constraint 3 table.

**"Expected 1724.62 received 1700.00" on Scenario 1 icSaving:**
Expected. icSaving cascades from debitSaving. See Constraint 3.

**grossCOA changed unexpectedly:**
You are using a single `debitTxns` variable for both saving and debitIC. Fix: use `visaMcDebitTxns` for saving and `allDebitTxns` for debitIC.

**Scenario 3 octNet shows $37,400 instead of $38,507.69:**
Same single-variable issue — grossCOA changed when it shouldn't. Fix as above.

**Supabase insert error on category:**
Migration 002 not applied, OR variant_type column IS NULL (migration needs the `SET NOT NULL` line after the UPDATE).

**PillBadge TypeScript error on 'accent':**
'accent' doesn't exist. Use 'amber'.

**PassThroughSlider range collapses to point:**
plSwingLow or plSwingHigh references passThrough. Check — they must only use icSaving and surchargeRevenue.

**Strategic rate page has no assessmentId:**
The insert in Phase 3 Change 3 returns `inserted?.id`. Check the insert succeeded without error.
