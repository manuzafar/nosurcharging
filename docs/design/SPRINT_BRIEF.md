# SPRINT_BRIEF.md
## nosurcharging.com.au — Active Sprint Instructions for Claude Code
## Authority: This document governs Sprints 0–3. It overrides CLAUDE.md where they conflict.
## Last updated: April 2026

---

## BEFORE YOU WRITE A SINGLE LINE OF CODE — READ THIS FULLY

This document contains everything you need to execute four sprints of work on
nosurcharging.com.au. It includes exact file targets, calculation ground truth,
pushback protocols, commit milestones, and self-audit procedures.

Reading order:
1. This file in full
2. `packages/calculations/calculations.ts` — the engine
3. `packages/calculations/constants/au.ts` — the rate constants
4. `packages/calculations/rules/resolver.ts` — the resolution pipeline
5. `packages/calculations/__tests__/calculations.test.ts` — current test ground truth

If anything in this brief conflicts with the code you read, **stop and ask before
proceeding**. The brief reflects RBA Conclusions Paper (March 2026) ground truth.
The code may be wrong. Treat code as potentially incorrect, brief as authoritative
for rate logic.

---

## PUSHBACK PROTOCOL — READ BEFORE STARTING EACH SPRINT

You are expected to push back. This is a financial tool. Silent implementation of
incorrect logic is worse than raising a concern and being wrong.

**Push back and ask before implementing if:**
- Any calculation formula in this brief produces a result that seems economically
  implausible (e.g. a small café getting a negative saving, or a saving larger than
  the merchant's total card volume)
- A rate constant contradicts what you can verify from the RBA paper
- The brief asks you to do something that conflicts with an existing invariant
  in the codebase (e.g. touching the scheme fee invariant `todayScheme === oct2026Scheme`)
- You find a dependency that isn't mentioned (e.g. a database migration required
  before a feature can work)
- Two requirements in this brief or in CLAUDE.md directly contradict each other
- An existing test would need to be deleted (not updated) to pass — this is a red flag

**How to push back:**
Write a clear comment at the top of your response:

```
⚠️ PUSHBACK BEFORE PROCEEDING:
I've identified a potential issue with [item]:
[Explain the concern precisely]
[State what you'd expect vs what the brief says]
My proposed resolution: [your suggestion]
Awaiting confirmation before implementing.
```

Do not proceed past a pushback until you receive a clear instruction to continue.

**Do not push back on:**
- Formatting preferences, colour values, or copy
- Questions you could answer by reading the existing codebase
- Minor naming decisions (use your judgement)

---

## RBA GROUND TRUTH — THE AUTHORITATIVE RATE TABLE

These values are confirmed from the RBA Conclusions Paper (March 2026).
Never change these constants without explicit instruction AND a citation from the paper.

```
CURRENT RATES (pre 1 October 2026):
  Debit cap:              10 cents per transaction (or 0.20% ad-valorem, network's choice)
  Debit benchmark:        8 cents (weighted average)
  Debit market average:   ~6 cents (competition has driven below benchmark)
  Consumer credit cap:    0.80%
  Consumer credit bench:  0.50%
  Consumer credit avg:    0.47% (confirmed market average from paper)
  Commercial credit cap:  0.80%
  Foreign cards:          Not regulated (pre April 2027)

NEW RATES (from 1 October 2026):
  Debit NEW cap:          min(8c, 0.16% × transaction value)  ← THE CRITICAL FORMULA
  Debit benchmark:        8c (unchanged)
  Consumer credit cap:    0.30%  (benchmark abolished)
  Commercial credit cap:  0.80%  (UNCHANGED — explicitly excluded from reform)
  Foreign cards:          UNCHANGED until April 2027

NEW RATES (from 1 April 2027):
  Foreign cards:          1.0% cap (both debit and credit foreign-issued)

SCHEME FEES (unregulated, unchanged by reform):
  Domestic acquirer:      10.5bps = 0.00105
  Cross-border acquirer:  158.2bps = 0.01582
  INVARIANT: todayScheme === oct2026Scheme ALWAYS. Never break this.

REFORM DATES:
  Surcharge ban effective:     1 October 2026  (2026-10-01)
  Domestic IC cuts effective:  1 October 2026  (2026-10-01)
  MSF publication deadline:    30 October 2026 (2026-10-30)
  First pass-through report:   30 January 2027 (2027-01-30)
  Foreign card cap effective:  1 April 2027    (2027-04-01)

SURCHARGE FACTS (from RBA paper):
  Total surcharges charged annually: ~$1.8B
  Consumer portion: ~$1.6B
  Business portion: ~$0.2B
  Merchants surcharging designated networks: 16%
  Designated networks: Visa, Mastercard, eftpos
  Exempt from ban: Amex, BNPL, PayPal (review mid-2026)

EFTPOS CLARIFICATION (important — this was wrong in an earlier draft):
  eftpos IS included in the reform. The new min(8c, 0.16%) cap applies to ALL
  domestic debit including eftpos (SNDCs). eftpos interchange is NOT near zero
  (~5-8c, cents-based, near the 8c benchmark). Do NOT exclude eftpos from the
  debit saving calculation.
```

---

## SPRINT 0 — ENGINE FIXES

**Scope:** `packages/calculations/` only. Zero changes to `apps/web`.
**Duration estimate:** ~0.5 day
**Gate to unlock Sprint 1:** All tests pass. New Scenario 6 passes. Credit figures updated.

### What you're fixing and why

The engine has one material correctness issue before launch:

**CALC-01: The "lower of" debit formula is missing.**

Currently `calculations.ts` computes projected debit rate as:
```typescript
Math.min(expertRates.debitCents, projectedRates.debitCentsPerTxn * 100) / 100
```
This caps at 8c but ignores the 0.16% ad-valorem component.

Per the RBA paper, the new debit rate is `min(8c, 0.16% × transaction value)`.
At $35 AVT (café default): new rate = min(8c, 5.6c) = 5.6c.
Engine currently says: 8c → saving = 1c. Correct: saving = 3.4c. Off by 3.4x for cafés.

**CALC-02a: Credit rate default is wrong.**

Currently: `expertRates.creditPct` defaults to 0.52 in `resolver.ts`.
RBA confirmed market average: 0.47%.
This overstates the credit saving by ~29% for average merchants.

### Step 1: Add debitAdValoremPct to constants

**File: `packages/calculations/types.ts`**

In the `InterchangeRates` interface, add the optional field:
```typescript
export interface InterchangeRates {
  debitCentsPerTxn: number;
  debitAdValoremPct?: number;   // ADD THIS — 0.16% for lower-of formula
  consumerCreditPct: number;
  commercialCreditPct: number;
  foreignPct: number;
}
```

**File: `packages/calculations/constants/au.ts`**

In `AU_INTERCHANGE.postOct2026`, add:
```typescript
postOct2026: {
  debitCentsPerTxn: 0.08,
  debitAdValoremPct: 0.0016,   // ADD — 0.16% per RBA Conclusions Paper
  consumerCreditPct: 0.003,
  commercialCreditPct: 0.008,
  foreignPct: 0.028,
} satisfies InterchangeRates,
```

Leave `preSep2026` and `postApr2027` unchanged. The formula only applies to the
new cap, not the current rates.

### Step 2: Implement lower-of in calculations.ts

**File: `packages/calculations/calculations.ts`**

Replace lines 37-39 (the projected debit rate calculation):

```typescript
// New debit rate = min(current rate, min(8c cap, 0.16% × AVT))
// The outer min(currentRate, ...) ensures we never compute a negative saving
const projectedDebitCentsPerTxn = projectedRates
  ? Math.min(
      currentDebitCentsPerTxn,
      Math.min(
        projectedRates.debitCentsPerTxn,
        (projectedRates.debitAdValoremPct ?? projectedRates.debitCentsPerTxn)
          * avgTransactionValue,
      ),
    ) / 1  // already in dollar units — divide by 1 is a no-op, just for clarity
  : currentDebitCentsPerTxn;
```

Wait — check the units before implementing. `expertRates.debitCents` is in cents (e.g. 9),
but `projectedRates.debitCentsPerTxn` is in dollars (e.g. 0.08). Line 31 converts:
```typescript
const currentDebitCentsPerTxn = expertRates.debitCents / 100; // convert cents → dollars
```

So `avgTransactionValue` (in dollars) × `debitAdValoremPct` (0.0016) = dollars.
The `debitCentsPerTxn` (0.08) is also in dollars. The min comparison is dollar-to-dollar.

Correct implementation:
```typescript
const projectedDebitCentsPerTxn = projectedRates
  ? Math.min(
      currentDebitCentsPerTxn,
      Math.min(
        projectedRates.debitCentsPerTxn,                                        // 0.08 dollars
        (projectedRates.debitAdValoremPct ?? projectedRates.debitCentsPerTxn)   // 0.0016 × AVT
          * avgTransactionValue,
      ),
    )
  : currentDebitCentsPerTxn;
```

Then use `projectedDebitCentsPerTxn` (not `projectedDebitCentsPerTxn`) in the
saving calculation on line 47. Check the variable name matches what's already there.

### Step 3: Fix credit rate default

**File: `packages/calculations/rules/resolver.ts`**

Find the `creditPct` resolution (around line 213-216) and change:
```typescript
{ source: 'regulatory_constant', value: 0.52 },
```
to:
```typescript
{ source: 'regulatory_constant', value: 0.47 },  // RBA confirmed market average
```

### Step 4: Wire industry AVT defaults

**File: `packages/calculations/rules/resolver.ts`**

In the `avgTransactionValue` resolution (around line 193-199), verify the resolution
chain includes the industry-specific default BEFORE the flat 65 fallback. The
`AU_AVG_TXN_BY_INDUSTRY` constant already exists in `constants/au.ts`. If the
industry env var lookup is not already using this constant, add:

```typescript
const avgTxnResolved = resolveValue('avgTransactionValue', [
  { source: 'merchant_input', value: ctx.merchantInput?.avgTransactionValue },
  { source: 'invoice_parsed', value: ctx.invoiceParsed?.avgTransactionValue },
  { source: 'env_var', value: parseEnvFloat(`CALC_AVG_TXN_${raw.industry.toUpperCase()}`) },
  { source: 'env_var', value: parseEnvFloat('CALC_AVG_TXN_DEFAULT') },
  { source: 'industry_default', value: AU_AVG_TXN_BY_INDUSTRY[raw.industry] ?? null },  // ADD
  { source: 'regulatory_constant', value: 65 },
]);
```

### Step 5: Update test ground truth

The test file at `__tests__/calculations.test.ts` has ground truth figures that
were computed with the OLD defaults (0.52% credit, flat 1c debit saving). These
must be recomputed and updated.

**How to recompute Scenario 1 ground truth** (the reference scenario):
```
Volume: $2,000,000 | Plan: costplus | debitShare: 0.60 | creditShare: 0.35
AVT: $65 | debitCents: 9c | creditPct: 0.47 (updated) | marginPct: 0.10%

debitTxns = 2,000,000 × 0.60 / 65 = 18,461.54
newDebitRate = min(0.08, 0.0016 × 65) = min(0.08, 0.104) = 0.08 (above kink)
debitSaving = 18,461.54 × (0.09 - 0.08) = 18,461.54 × 0.01 = $184.62 [unchanged]

creditSaving = 2,000,000 × 0.35 × (0.0047 - 0.003) = 2,000,000 × 0.35 × 0.0017 = $1,190.00
               [was $1,540.00 at 0.52% — now $1,190.00 at 0.47%]

icSaving = $184.62 + $1,190.00 = $1,374.62 [was $1,724.62]
plSwing (Cat 1) = $1,374.62 [was $1,724.62]
```

Update ALL scenario ground truth figures accordingly. Do NOT just change Scenario 1 —
every scenario with creditShare > 0 will have changed figures.

**Add Scenario 6 (new — validates lower-of formula for café AVT):**
```typescript
describe('Scenario 6 — Café: $2M cost-plus, AVT=$35 (tests lower-of clause)', () => {
  // At $35 AVT: newDebitRate = min(0.08, 0.0016 × 35) = min(0.08, 0.056) = 0.056
  // savingPerTxn = 0.09 - 0.056 = 0.034 (3.4c)
  // debitTxns = 2,000,000 × 0.60 / 35 = 34,285.71
  // debitSaving = 34,285.71 × 0.034 = $1,165.71
  // creditSaving = 2,000,000 × 0.35 × 0.0017 = $1,190.00
  // icSaving = $1,165.71 + $1,190.00 = $2,355.71
  const inputs = makeInputs({
    volume: 2_000_000,
    planType: 'costplus',
    surcharging: false,
    surchargeRate: 0,
    avgTransactionValue: 35,
    expertRates: { debitCents: 9, creditPct: 0.47, marginPct: 0.10 },
  });
  it('debitSaving > $1,100 (confirms lower-of, not flat 8c)', () => {
    expect(result.debitSaving).toBeGreaterThan(1100);
  });
  it('debitSaving ≈ $1,165.71', () => {
    expect(result.debitSaving).toBeCloseTo(1165.71, 0);
  });
});
```

**Add invariant test — lower-of must produce different results above/below $50 AVT:**
```typescript
it('lower-of: debit saving at AVT=$25 > debit saving at AVT=$65 (kink active)', () => {
  const below = calculateMetrics(makeInputs({ avgTransactionValue: 25 }), PRE_REFORM);
  const above = calculateMetrics(makeInputs({ avgTransactionValue: 65 }), PRE_REFORM);
  expect(below.debitSaving).toBeGreaterThan(above.debitSaving);
});

it('lower-of: debit saving at AVT=$50 equals debit saving at AVT=$65 (kink point)', () => {
  const atKink = calculateMetrics(makeInputs({ avgTransactionValue: 50 }), PRE_REFORM);
  const above  = calculateMetrics(makeInputs({ avgTransactionValue: 65 }), PRE_REFORM);
  // At $50: 0.0016 × 50 = 0.08 = 8c cap. Same as above.
  expect(atKink.debitSaving).toBeCloseTo(above.debitSaving * (65/50), 0);
});
```

### Sprint 0 commit milestone

**Run before committing:**
```bash
cd packages/calculations && ./node_modules/.bin/vitest run
```

Expected output: All tests pass (86+ tests). Zero failures. Scenario 6 exists and passes.

**Commit message:**
```
fix(calc): implement lower-of debit cap and correct rate defaults

- Add debitAdValoremPct: 0.0016 to postOct2026 interchange constants
- Implement min(8c, 0.16% × AVT) in calculateMetrics projected debit rate
- Fix credit rate default: 0.52% → 0.47% (RBA confirmed market average)
- Wire AU_AVG_TXN_BY_INDUSTRY into resolver avgTransactionValue resolution chain
- Add Scenario 6 (café, AVT=$35) to validate lower-of formula
- Add lower-of kink invariant tests
- Update all scenario ground truth figures for new credit default

Fixes CALC-01, CALC-02a per sprint brief.
RBA source: Conclusions Paper March 2026, p.48-50.
```

### Sprint 0 self-audit checklist

Run this checklist after committing. Do not proceed to Sprint 1 until all pass.

```
□ All tests pass (vitest run — zero failures)
□ Scenario 6 exists and passes
□ debitSaving at AVT=$25 is approximately 5x debitSaving at AVT=$65
   (quick check: run calculateMetrics with AVT=25 vs AVT=65, same volume)
□ creditSaving at creditPct=0.47 is lower than at creditPct=0.52
   (0.47-0.30=0.17% vs 0.52-0.30=0.22% — ratio should be ~0.77)
□ No TypeScript errors (tsc --noEmit in packages/calculations)
□ The scheme fee invariant is intact: todayScheme === oct2026Scheme in Scenario 1
□ debitSaving is never negative for any valid input (Math.max(0, ...) preserved)
□ No changes were made to apps/web — this sprint is engine-only
```

---

## SPRINT 1 — RESULTS PAGE FIXES AND COMPLETION

**Scope:** `apps/web/components/results/` — fix and extend existing components
**Duration estimate:** ~1 day
**Dependencies:** Sprint 0 complete and committed
**IMPORTANT CORRECTION:** The results page is already substantially built.
  Do NOT rebuild components that exist. Read each component before touching it.
  The briefing section below describes what to FIX and what to ADD — not what
  to build from scratch.

### What already exists and is working

Read these files before proceeding. They are complete and should not be rewritten:

- `components/results/VerdictSection.tsx` — category pill, hero P&L, daily anchor, category body
- `components/results/MetricCards.tsx` — summary metric cards
- `components/results/ProblemsBlock.tsx` — Certain/Depends problem blocks (Cat 3/4 and Cat 2/4)
- `components/results/PassThroughSlider.tsx` — flat-rate pass-through slider (Cat 2/4 only)
- `components/results/EscapeScenarioCard.tsx` — cost-plus escape scenario (Cat 2/4 only)
- `components/results/CostCompositionChart.tsx` — stacked bar chart (today vs October)
- `components/results/AssumptionsPanel.tsx` — collapsible formula breakdown with ResolutionTrace
- `components/results/ActionList.tsx` — urgency-tiered actions
- `components/results/EmailCapture.tsx` — email capture form
- `components/results/ConsultingCTA.tsx` — category-specific CTA
- `components/results/PSPRateRegistry.tsx` — rate registry submission
- `components/results/ResultsDisclaimer.tsx` — legal disclaimer
- `components/results/SkeletonLoader.tsx` — loading state
- `components/results/DepthToggle.tsx` — collapsed depth zone wrapper
- `app/results/page.tsx` — orchestrates all the above

**Known bugs already fixed (do not re-fix):**
- The `actions` state is already deliberately separate from `outputs` state in
  `page.tsx` — this was the slider collapse bug. The comment explains it. Leave it.
- The `CostCompositionChart` uses `outputs.grossCOA` for the cost-plus baseline
  (not `netToday + icSaving`) — the WaterfallChart bug is already fixed.

### Fix 1: AssumptionsPanel hardcoded rate strings

**File: `components/results/AssumptionsPanel.tsx`**

Lines 106 and 114 have hardcoded rate strings that will be wrong after Sprint 0
changes the default credit rate from 0.52% to 0.47%:

```typescript
formula: '9c → 8c per debit transaction',      // line 106 — needs to be dynamic
formula: '0.52% → 0.30% on credit volume',     // line 114 — needs to be dynamic
```

These formulas need to show the actual rates used in the calculation, not hardcoded
values. The `outputs` object already has `debitSaving`, `creditSaving`, and the
resolver trace has the actual rates. Fix by deriving the formula strings dynamically:

```typescript
// For debit formula — derive from what the engine actually computed
// The debit saving = debitTxns × (currentRate - newRate)
// We don't have the per-transaction rate directly in outputs, but we can
// show the formula conceptually with the actual saved amount:
formula: `Debit transactions × saving per transaction`, // simpler and always accurate

// For credit formula — use the actual rate from resolutionTrace if available:
const creditRate = resolutionTrace['expertRates.creditPct']?.value ?? 0.47;
formula: `${formatPct(creditRate / 100)} → 0.30% on credit volume`,
```

⚠️ PUSHBACK TRIGGER: If `resolutionTrace['expertRates.creditPct']` is undefined
at this point, stop and investigate — the trace should always populate this field.
If the trace key is named differently, check `resolver.ts` and use the correct key.

### Fix 2: AssumptionsPanel formula strings for lower-of debit

After Sprint 0 implements the lower-of debit formula, the debit saving formula
row needs to reflect that the saving is not always 1c per transaction. For low-AVT
merchants (below $50), the formula is different.

Update the debit formula row to say:
```
formula: `min(8c, 0.16% × avg sale) per debit transaction`,
```

This is always accurate regardless of AVT — it describes the RBA formula correctly
for both above and below the $50 kink point.

### New build 1: Zero-cost merchant variant (RESULTS-02)

**Status:** Not yet built. Confirm with `grep -r "zerocost" apps/web/components` — if it
returns nothing, build it.

This is needed for Zeller fee-free, Tyro no-cost, and Smartpay merchants who
currently pay $0 for card acceptance via the surcharge mechanism. From October,
they lose the surcharge mechanism and must absorb full processing costs.

Trigger condition: `planType === 'zerocost'` in stored assessment.

**Add the variant to `app/results/page.tsx`:**

```typescript
// At the top of ResultsContent, after loading:
if (planType === 'zerocost') {
  return <ZeroCostResults volume={volume} pspName={pspName} />;
}
```

**Create `components/results/ZeroCostResults.tsx`:**

```
[Critical alert header — red border, prominent]
"You currently pay nothing for card acceptance — this changes in October."

[Before/After comparison table]
Today:    All card costs: $0 (recovered via surcharge)
October:  New costs at three scenarios:
            Conservative (1.2%): $[vol × 0.012]
            Expected (1.4%):     $[vol × 0.014]
            Optimistic (1.6%):   $[vol × 0.016]

Note: "Your actual rate depends on your PSP and plan negotiation."
Note: "Scheme fees (~$[vol × 0.00105]/year) apply on top of any plan rate."

[All actions: urgent — no plan/monitor tier]
[CTA: "Reform Ready · $3,500 — get your post-October pricing strategy"]
```

### New build 2: "Does your result look off?" feedback form (RESULTS-03)

**Status:** Not yet built.

Small, unobtrusive feedback mechanism below the P&L number in `VerdictSection`.
Do NOT use a modal — expand inline. Do NOT add a "beta" label anywhere.

**In `VerdictSection.tsx`, add below the context line (Row 6):**

```tsx
<FeedbackToggle
  category={category}
  volume={volume}
  assessmentId={assessmentId}  // pass from page.tsx
/>
```

**Create `components/results/FeedbackToggle.tsx`:**

```tsx
// Small quiet link that expands inline
// Copy: "Does your result look off? Tell us →"
// On expand: email (optional) + free text textarea
// On submit: POST to /api/feedback server action → Resend email to Manu
// No database write needed
```

**Create `app/actions/submitFeedback.ts` server action:**

```typescript
'use server';
import { Resend } from 'resend';  // already in package.json, used in webhooks/calendly

export async function submitFeedback(data: {
  email?: string;
  message: string;
  category: number;
  volume: number;
  assessmentId?: string;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: 'noreply@nosurcharging.com.au',
    to: process.env.FEEDBACK_EMAIL ?? 'manuzafar@gmail.com',
    subject: `[Feedback] Cat ${data.category} merchant — $${(data.volume/1000000).toFixed(1)}M volume`,
    text: `
      Message: ${data.message}
      Email: ${data.email ?? 'not provided'}
      Category: ${data.category}
      Volume: $${data.volume.toLocaleString()}
      Assessment: ${data.assessmentId ?? 'unknown'}
    `,
  });
}
```

**IMPORTANT: Do not add any "beta" label to the site anywhere.**

### Sprint 1 commit milestone

**Manual checks before committing:**
1. Open results page for Cat 1 merchant — AssumptionsPanel shows dynamic formula
   strings, NOT hardcoded "9c → 8c" or "0.52% → 0.30%"
2. Open for Cat 2 — CostCompositionChart uses `grossCOA` for baseline (already correct)
3. Open for zero-cost merchant — completely different layout renders
4. Click "Does your result look off?" — form expands inline, submits without error
5. No "beta" text visible anywhere in the HTML source

**Commit message:**
```
fix(results): dynamic formula strings + zero-cost variant + feedback form

- AssumptionsPanel: replace hardcoded "9c → 8c" / "0.52% → 0.30%" with
  dynamic strings derived from resolutionTrace and RBA lower-of formula description
- ZeroCostResults component for planType='zerocost' merchants (Zeller/Tyro/Smartpay)
- FeedbackToggle component + submitFeedback server action via Resend
- No "beta" labels added

Implements RESULTS-02, RESULTS-03, plus fix to AssumptionsPanel formula strings
for Sprint 0 rate changes. RESULTS-01 structure already complete.
```

### Sprint 1 self-audit checklist

```
□ AssumptionsPanel: no hardcoded "9c → 8c" or "0.52% → 0.30%" strings remaining
□ AssumptionsPanel: formula strings are dynamic and update if rates change
□ CostCompositionChart: grossCOA used for cost-plus baseline (verify line ~65)
□ PassThroughSlider: actions state separate from outputs state (leave as-is)
□ Zero-cost variant: planType='zerocost' triggers completely different layout
□ Zero-cost variant: three rate scenarios shown (1.2%, 1.4%, 1.6%)
□ Zero-cost variant: all actions urgent, no plan/monitor tier
□ Feedback form: expands inline (not modal), submits to Resend
□ No "beta" text anywhere on the site
□ All existing tests pass (vitest run + web component tests)
□ No TypeScript errors (tsc --noEmit)
□ No console errors in browser for Cat 1, 2, 3, 4 pages
```

---

## SPRINT 2 — REFINEMENT PANEL

**Scope:** `apps/web` results page + minor `packages/calculations` additions
**Duration estimate:** ~2 days
**Dependencies:** Sprint 1 complete and committed
**Key architectural decision:** UX-01, UX-02, UX-03, UX-05, UX-06, UX-07, and
  RESULTS-06 are ONE unified React component — `<RefinementPanel>`. Build them
  together. Do not build them as separate components and try to compose them later.

### The component specification: `<RefinementPanel>`

**Location:** `apps/web/components/results/RefinementPanel.tsx`

**Props:**
```typescript
interface RefinementPanelProps {
  initialResult: AssessmentOutputs;           // the stored canonical result
  resolutionTrace: ResolutionTrace;            // from stored assessment
  inputs: ResolvedAssessmentInputs;            // from stored assessment
  industry: string;                            // from stored assessment
  onRefinedResult: (result: AssessmentOutputs) => void;  // callback to update P&L display
}
```

**State:**
```typescript
// Local edits — do NOT write to Supabase automatically
const [editedValues, setEditedValues] = useState<Partial<RefinementOverrides>>({})
const [liveResult, setLiveResult] = useState<AssessmentOutputs>(initialResult)
const [isSaved, setIsSaved] = useState(false)
```

**Behaviour:**
- On any field edit: re-run `calculateMetrics` with the overridden values
- Call `onRefinedResult(newResult)` to update the headline P&L on the results page
- Compute delta = `liveResult.plSwing - initialResult.plSwing` for each field
- The stored Supabase result is never modified unless merchant clicks "Save"
- "Save my refinements" writes the overridden values back to Supabase via server action

### Accuracy score computation

Rendered ABOVE the refinement panel (or at the top of it):
```
Estimate accuracy  [██████░░░░]  45%
Enter your actual figures below to improve this estimate.
```

Scoring logic (pure function, computed from resolutionTrace):
```typescript
function computeAccuracy(trace: ResolutionTrace, editedValues: object): number {
  let score = 20; // base
  const highValueSources = ['merchant_input', 'invoice_parsed'];

  const avtSource = editedValues.avgTransactionValue
    ? 'merchant_input'
    : trace.avgTransactionValue?.source;
  if (highValueSources.includes(avtSource)) score += 25;

  const creditSource = editedValues.creditPct
    ? 'merchant_input'
    : trace['expertRates.creditPct']?.source;
  if (highValueSources.includes(creditSource)) score += 25;

  const commercialSource = editedValues.commercialShare
    ? 'merchant_input'
    : trace['cardMix.commercial']?.source;
  if (highValueSources.includes(commercialSource)) score += 15;

  if (editedValues.monthlyDebitTxns) score += 15;

  return Math.min(score, 100);
}
```

Label: "Estimate accuracy" — NOT "confidence score", NOT "data quality". Exactly
"Estimate accuracy". Less alarming, more actionable.

### Field specifications

Each field renders as a card with: label, source badge, pre-filled input, unit,
delta display, and a "Find it" hint.

**Source badge states:**
- `regulatory_constant` or `env_var` → "RBA average" (gray)
- `industry_default` → "Industry default" (gray)
- `merchant_input` or `invoice_parsed` → "Your input" (emerald #1A6B5A)
- After edit → "Your input" (emerald), regardless of original source

**Delta display (per-field):**
```typescript
const delta = computeFieldDelta(fieldKey, newValue, initialResult, inputs);
// Returns: "+$823 vs default" (green) or "−$312 vs default" (red) or "" (no change)
```

---

**Field 1: Average transaction value**

Only relevant for the debit saving — does not affect credit saving.
Pre-fill: `resolutionTrace.avgTransactionValue.value`

Chip label (industry-adaptive, computed from pre-filled value):
- Pre-filled AVT < $50: "Critical — below $50 kink" (emerald chip)
- Pre-filled AVT ≥ $50: "Moderate impact" (amber chip)

Hint text (industry-adaptive):
- Café/QSR: "Below $50, the RBA's formula gives a much larger debit saving. Find
  your average transaction value in your PSP dashboard → Reports."
- All others: "Find in your PSP dashboard → Reports → Average transaction value."

Delta: shows impact on `debitSaving` specifically, not total P&L.

**Field 2: Credit interchange rate**

Only render for `planType === 'costplus'` merchants.
Pre-fill: `resolutionTrace['expertRates.creditPct'].value`
Unit: `%`
Min: 0.10, Max: 0.80 (RBA cap), Step: 0.01

Chip: "High impact" for all non-B2B industries. "Key figure" for B2B.

Hint: "Find on your monthly merchant statement → interchange line items →
  look for 'Visa credit' or 'MC consumer credit' rates."

Additional note below field (for small merchants):
"Small merchants may pay up to 0.80%. If your rate is higher than 0.47%,
  your saving is larger than shown."

Delta: shows impact on `creditSaving` specifically.

**Field 3: Commercial / corporate card share**

Pre-fill: `resolutionTrace['cardMix.commercial']?.value ?? 0`
Unit: `% of cards`
Min: 0, Max: 100, Step: 1

Chip (industry-adaptive):
- Industry === 'professional' or 'b2b': "Critical for B2B" (red chip)
- All others: collapsed by default, chip shows "Low impact" (gray)
  with expand arrow — only show if merchant expands "Advanced fields"

Hint: "Check your PSP statement → card type breakdown → look for 'corporate'
  or 'business' cards."

Important note below the field:
"Corporate card interchange is UNCHANGED by the reform (0.80% cap retained).
  A higher commercial share means a smaller credit saving."

Delta: shows impact on `creditSaving` (reduces it — delta will be red).

⚠️ PUSHBACK TRIGGER: If computing this delta would require a structural change
to how the engine handles card mix (e.g. if the resolver doesn't accept
a commercial share override), STOP and raise this before implementing.
The engine should accept commercial share as a `cardMix` override — verify
this works before building the UI field.

**Field 4: Monthly debit transaction count (alternative to AVT)**

Present as an OR alternative to Field 1, not a separate field:
```
Average transaction value:  [$35]   ← Field 1
                         — OR —
Monthly debit transactions: [____]  ← Field 4
```
Label: "Monthly debit transactions (optional)"
Note: "Enter this OR the average transaction value above — whichever is easier to find."
Hint: "PSP dashboard → Reports → Transaction count → filter by debit"
Source badge: "Derived from AVT" initially, "Your input" after entry

Resolution: if monthlyDebitTxns is provided, use `monthlyDebitTxns × 12` as
annual debit transaction count directly in the calculation, bypassing AVT entirely.

To implement this: the `calculateMetrics` function receives `avgTransactionValue`
and derives transaction count from it. To support direct transaction count override,
either:
(a) Add a `debitTxnCountOverride` parameter to `calculateMetrics`, OR
(b) Compute the effective AVT from the transaction count: `effectiveAVT = (volume × debitShare) / annualTxns`
  and pass that as the AVT to `calculateMetrics`.

Option (b) is simpler and doesn't require a signature change. Prefer option (b).

**PSP-based MSF pre-population (Step 2 wizard — separate from refinement panel)**

In the Step 2 wizard, PSP selection should set the MSF rate field with a
pre-populated value. This is a small change to the Step 2 component, NOT the
refinement panel.

```typescript
// In constants or a utility file:
export const PSP_PUBLISHED_RATES: Record<string, number> = {
  'Stripe':    0.017,   // 1.70% standard
  'Square':    0.016,   // 1.60%
  'Tyro':      0.014,   // 1.40% approx
  'CommBank':  0.0115,  // 1.15% approx
  'ANZ':       0.011,   // 1.10% approx
  'Westpac':   0.011,   // 1.10% approx
  'Zeller':    0.014,
  'eWAY':      0.014,
  'Adyen':     0.012,
  'Other':     0.014,   // RBA average
};
```

When PSP is selected in Step 2, pre-fill the MSF field with this value.
Source badge: "[PSP] standard rate — confirm or update."
Caveat text below field: "Published April 2026. Verify with your PSP for your
specific rate."

### Sprint 2 commit milestone

**Manual checklist before committing:**
1. Open results page for a Cat 1 merchant — refinement panel is visible below P&L
2. Change AVT from industry default to a custom value — source badge turns emerald,
   P&L updates in real time, delta shows "+$X vs default"
3. Change AVT to a value below $50 (e.g. $25) — chip changes to "Critical — below $50 kink"
4. Change AVT to a value above $50 (e.g. $80) — chip changes to "Moderate impact"
5. Change credit rate from 0.47 to 0.80 — large positive delta shown
6. Enter 0% commercial → 30% commercial — credit saving drops, negative delta shown
7. Open in Step 2 wizard, select Stripe — MSF field pre-populates with 1.70%
8. Accuracy score starts at 20%, increases as fields are filled

**Commit message:**
```
feat(results): refinement panel with pre-populated fields and live P&L delta

- RefinementPanel component with ResolutionTrace-driven field rendering
- Pre-populated fields: AVT, credit rate, commercial share, monthly debit txns
- Source badges: "RBA average" / "Industry default" / "Your input" (emerald on edit)
- Live P&L delta per field and headline P&L update on every edit (debounced 150ms)
- Accuracy score (20% base → 100% with all fields filled)
- Industry-adaptive chips: "Critical — below $50 kink" vs "Moderate impact"
- B2B industry: commercial share shown prominently; other industries: collapsed
- PSP-based MSF pre-population in Step 2 wizard
- Local state only — no Supabase writes until "Save my refinements" clicked

Implements UX-01,02,03,05,06,07 + RESULTS-06,07 per sprint brief.
```

### Sprint 2 self-audit checklist

```
□ Refinement panel renders below the P&L number on results page
□ All fields are pre-populated — no blank inputs
□ Source badges show correct provenance (matches ResolutionTrace)
□ Editing any field updates the headline P&L in real time
□ Editing reverts to default → delta disappears, source badge reverts
□ AVT field chip changes correctly above/below $50
□ Credit rate field NOT shown for flat-rate merchants (planType === 'flat')
□ Commercial share field collapsed by default for non-B2B industries
□ Monthly debit txn count shown as OR alternative to AVT
□ Accuracy score starts at 20%, reaches ~95% with all fields filled
□ Supabase result NOT modified when editing (only on "Save" click)
□ PSP selection in Step 2 pre-fills MSF rate field
□ All existing tests still pass (vitest run)
□ No TypeScript errors (tsc --noEmit)
□ No console errors in browser dev tools on any field edit
□ Performance: P&L update feels instant (< 50ms) — if slow, check if
  calculateMetrics is accidentally making a server call instead of running client-side
```

---

## SPRINT 3 — ACCURACY + ADDITIONAL FIELDS

**Scope:** Extensions to Sprint 2 components + minor engine changes
**Duration estimate:** ~1 day
**Dependencies:** Sprint 2 complete and committed
**Gate:** All new fields work. All assumptions panel copy is present. Tests pass.

### UX-04: Accuracy score already implemented in Sprint 2

This was specified as a Sprint 3 item but is actually simpler to build
as part of Sprint 2's `<RefinementPanel>` component. If it was built in
Sprint 2, mark this done. If not, implement it now per the spec in Sprint 2.

### CALC-06: Minimum monthly fee field

Only relevant for flat-rate merchants. Add to the refinement panel (for
`planType === 'flat'` merchants only).

**Engine change required first:**

**File: `packages/calculations/types.ts`**
Add `minMonthlyFee?: number` to `ResolvedAssessmentInputs`.

**File: `packages/calculations/calculations.ts`**
Change the `annualMSF` computation:
```typescript
const annualMSFBase = round2(volume * msfRate);
const annualMSF = inputs.minMonthlyFee
  ? Math.max(annualMSFBase, inputs.minMonthlyFee * 12)
  : annualMSFBase;
```

This ensures the floor is the minimum annual commitment, not just rate × volume.

**UI field:**
Label: "Minimum monthly fee (optional)"
Hint: "Some PSPs charge a monthly minimum regardless of volume. Find this on
  your statement or in your PSP contract."
Unit: "$"
Note: "Only relevant if your monthly card volume is low enough that the minimum
  applies."

### UX-08 + CALC-03: Monthly debit transaction count

If not already implemented in Sprint 2, implement now. See the Field 4
specification in Sprint 2 for full details. The key engine consideration:
use option (b) — compute effective AVT from transaction count to avoid
a signature change to `calculateMetrics`.

### CALC-04: Commercial card assumptions panel copy

In the trace-driven rendering of the refinement panel, add special copy when
commercial share is 0 (the default):

```
[Rendered when trace['cardMix.commercial'].source === 'regulatory_constant' AND value === 0]
"Commercial card share assumed 0%. If your customers use corporate or
 business cards, enter your actual share above — corporate interchange is
 unchanged by the reform."
```

### CALC-05: Surcharge revenue direction disclosure

For Cat 3 and Cat 4 merchants only, add a note in the assumptions section:
```
[Rendered when category === 3 || category === 4]
"Surcharge revenue estimated from total card volume at your surcharge rate.
 Your actual loss may be slightly smaller — some customers may avoid the
 surcharge by paying cash, so actual surcharge revenue is slightly less than
 the arithmetic. Your result is therefore a conservative estimate."
```

### Sprint 3 commit milestone

**Run before committing:**
```bash
cd packages/calculations && ./node_modules/.bin/vitest run
```

**Commit message:**
```
feat(calc+ux): accuracy score, minimum fee field, and assumptions copy

- Accuracy score: 20% base → 100% max, driven by ResolutionTrace sources
- Minimum monthly fee field for flat-rate merchants (engine: max(MSF, minFee×12))
- Monthly debit transaction count field if not in Sprint 2
- Commercial card share assumptions copy (CALC-04)
- Surcharge revenue direction disclosure for Cat 3/4 (CALC-05)
- Add minMonthlyFee to ResolvedAssessmentInputs type

Implements UX-04, UX-08, CALC-03, CALC-04, CALC-05, CALC-06 per sprint brief.
```

### Sprint 3 self-audit checklist

```
□ Accuracy score is present and scoring correctly (verify manually: fill 0 fields → 20%, all fields → ~95%)
□ Minimum monthly fee field visible for flat-rate merchants, absent for cost-plus
□ Entering a minimum monthly fee increases the cost baseline for Cat 2/4 merchants
□ Commercial card assumptions copy visible when commercial = 0% (default)
□ Surcharge revenue conservative note visible for Cat 3 and Cat 4 only
□ All existing tests pass (vitest run — zero failures)
□ No TypeScript errors (tsc --noEmit)
□ No regressions in results page layout or data
```

---

## FINAL SELF-AUDIT — BEFORE LAUNCH

Run this complete end-to-end audit after Sprint 3 is committed. This is the
launch gate. Do not declare ready-to-launch until all items are green.

### Calculation correctness check

Run these manually in a browser console on the deployed staging environment,
or via the vitest suite:

**Test 1 — Lower-of kink is working:**
Enter a café merchant with AVT=$30. The debit saving should be materially larger
than for a retailer with AVT=$70 at the same volume. If they're the same, the
lower-of formula is not being applied.

**Test 2 — Credit rate matters:**
Change expertRates.creditPct from 0.47 to 0.80 in the refinement panel.
The credit saving should increase by (0.80-0.30)/(0.47-0.30) = 2.94x.
If it doesn't change, the live recalculation is not wired.

**Test 3 — Commercial card reduces saving:**
Set commercial card share to 40%. The credit saving should be approximately
0% (since commercial share displaces consumer credit and commercial interchange
is unchanged). If credit saving is unchanged, the commercial share override is broken.

**Test 4 — Scheme fee invariant:**
For any merchant, `todayScheme` must equal `oct2026Scheme`. These values are
used in the waterfall chart. Check them in the returned result object.

**Test 5 — Zero-cost merchant variant:**
Navigate to the results page for a zero-cost merchant. Confirm it's the
completely different layout (alert header, three scenarios), NOT the Cat 1-4 layout.

### UI completeness check

```
□ Results page has all 8 sections in correct order (pill, mechanism, highlight, P&L, slider?, actions, email, CTA)
□ Refinement panel is present on results page
□ Accuracy score is visible and updates when fields are filled
□ All pre-populated fields have source badges
□ Source badges turn emerald on edit
□ Live P&L delta visible per field
□ Feedback form "Does your result look off?" is present below P&L
□ PSP selection in Step 2 pre-fills MSF rate
□ No "beta" text anywhere on the site
□ Calendly link in CTA points to a live Calendly URL (not a placeholder)
```

### Technical health check

```
□ vitest run — zero failures
□ tsc --noEmit — zero TypeScript errors
□ No console.error in browser for any merchant path
□ Results page loads in < 2 seconds on a slow connection (Lighthouse)
□ Mobile layout: results page is usable on a 375px screen
□ The /results?id=<uuid> URL works — results load from Supabase correctly
□ The refinement panel works without JavaScript errors in Safari
```

---

## WHAT NOT TO BUILD IN THESE SPRINTS

Do not build any of the following without explicit instruction:

- RESULTS-04 (Rate Registry CTA) — no data exists yet
- RESULTS-05 / MON-02 (PDF export) — no demand signal yet
- PSP Rate Registry (Iteration 3) — separate project
- DIST-04 (accountant white-label) — Phase 3 play
- MON-01 (benchmark reports) — needs 500+ submissions
- FUTURE-01 through FUTURE-04 — separate planning session
- Any new database tables or schema changes beyond what's specified here
- Any changes to the security headers or CORS configuration
- Any changes to the authentication flow

---

## REPO REFERENCES

Key files you'll need to read before each sprint:

```
packages/calculations/
  calculations.ts          ← engine — the heart of everything
  constants/au.ts          ← RBA rate constants
  rules/resolver.ts        ← input resolution pipeline
  rules/schema.ts          ← rule definitions
  types.ts                 ← all interfaces
  __tests__/
    calculations.test.ts   ← ground truth scenarios
    resolver.test.ts       ← resolution pipeline tests

apps/web/
  app/results/             ← results page (Sprint 1 target)
  components/results/      ← result components (Sprint 2 target)
  app/assessment/          ← wizard steps (Sprint 2 Step 2 change)

docs/product/
  consulting-products.md   ← CTA copy per category
  pre-launch-checklist.md  ← launch gate checklist
  calculation-verification.md ← original ground truth reference
```

---

## RATE CONSTANTS QUICK REFERENCE

For copy-paste into code, without needing to look up the brief:

```typescript
// RBA Conclusions Paper, March 2026

// CURRENT (pre 1 Oct 2026)
DEBIT_CAP_CENTS:        0.10   // 10c cap
DEBIT_BENCHMARK_CENTS:  0.08   // 8c benchmark
DEBIT_MARKET_AVG:       0.06   // ~6c actual weighted average
CREDIT_CAP:             0.008  // 0.80% cap
CREDIT_BENCHMARK:       0.005  // 0.50% benchmark
CREDIT_MARKET_AVG:      0.0047 // 0.47% confirmed market average
COMMERCIAL_CAP:         0.008  // 0.80% UNCHANGED

// NEW (from 1 Oct 2026)
NEW_DEBIT_CAP_CENTS:    0.08   // 8c flat cap
NEW_DEBIT_ADVALOREM:    0.0016 // 0.16% — lower-of formula
NEW_CREDIT_CAP:         0.003  // 0.30% (benchmark abolished)
COMMERCIAL_UNCHANGED:   0.008  // 0.80% UNCHANGED

// NEW (from 1 Apr 2027)
FOREIGN_CAP:            0.01   // 1.0% all foreign cards

// SCHEME FEES (unchanged, unregulated)
SCHEME_DOMESTIC:        0.00105  // 10.5bps
SCHEME_CROSS_BORDER:    0.01582  // 158.2bps
```

---

*Brief produced April 2026. Authoritative for Sprints 0–3.*
*Source: RBA Conclusions Paper March 2026 + RBA Consultation Paper July 2025.*
*If any rate in this brief contradicts the repo's CLAUDE.md, raise a pushback.*
