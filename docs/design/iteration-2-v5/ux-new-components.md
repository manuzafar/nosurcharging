# UX Specifications — New Components
## Iteration 2 (Revised v3 — post-docs-audit)

**Design system constraints (confirmed from docs/design/design-tokens.md):**
- Accent colour: amber `#BA7517` — the ONLY brand accent. No emerald.
- PillBadge variants available: `'amber'`, `'green'`, `'red'`, `'grey'` only.
  There is NO `'accent'` variant. Any reference to `variant='accent'` must be
  changed to `variant='amber'`.
- Selected card border: `1px solid #BA7517`
- PSP pill selected: `background: #FAEEDA; color: #633806; border: 1px solid #BA7517`
- Slider accent: `accent-color: #BA7517`

**CB-08 override (pass-through slider initial value):**
PROMPT.md overrides `docs/design/component-specs.md` CB-08 on the slider initial
value. CB-08 says 0%; PROMPT.md specifies 45% (RBA market average). Update
component-specs.md CB-08 when implementing this change.

All components follow the existing design system:
- Canvas: var(--color-background-primary)
- Sharp corners on document cards (no border-radius)
- Borders-only depth (no box-shadow)
- 4px/8px spacing grid

---

## Component 1 — ZeroCostResultsVariant

**File:** apps/web/components/results/ZeroCostResultsVariant.tsx
**Renders when:** `outputs.modelType === 'zero_cost'` (check this BEFORE category-based rendering)
**Replaces:** Standard results template entirely

### Structure (top to bottom)

```
1. Critical banner
2. Before/after comparison block
3. Range display
4. Directional confidence note
5. Action list (ALL URGENT — no plan or monitor tier)
6. ConsultingCTA (same as standard results)
7. EmailCapture (same as standard results)
```

### 1. Critical banner

```
Background: #FDF2F2 (red-50 equivalent)
Border-left: 3px solid var(--color-text-danger)
Border (other sides): 1px solid rgba(191,53,53,0.25)
Border-radius: 0
Padding: 16px 20px

Eyebrow: "CRITICAL IMPACT — ZERO-COST PLAN"
  9px, 700 weight, 2.5px letter-spacing, var(--color-text-danger)

Headline: "Your entire payment cost model changes on 1 October 2026."
  17px, font-serif, var(--color-text-danger), line-height 1.35

Body:
  "Your zero-cost plan is built on the surcharge mechanism. When surcharges on Visa,
   Mastercard, and eftpos are banned, that mechanism ends. From 1 October, you absorb
   the full processing cost — from $0 to [postReformNetCost formatted] overnight.
   There is no transition, no partial offset, no existing rate to cushion this."
  13px, var(--color-text-secondary), line-height 1.65
```

### 2. Before/after comparison block

```
Layout: 2 columns (flex), border between, border: 0.5px solid var(--color-border-secondary)
Padding: 20px

LEFT column — "TODAY":
  Label:  "TODAY"
          8px, 700, 2.5px tracking, var(--color-text-tertiary)
  Value:  "$0"
          font-mono, 40px, 500, var(--color-text-success)
  Sub:    "net payment cost"
          12px, var(--color-text-secondary)

RIGHT column — "FROM 1 OCTOBER 2026":
  Label:  "FROM 1 OCTOBER 2026"
          8px, 700, 2.5px tracking, var(--color-text-tertiary)
  Value:  "$[postReformNetCost formatted]"
          font-mono, 40px, 500, var(--color-text-danger)
  Sub:    "per year in processing costs"
          12px, var(--color-text-secondary)
```

### 3. Range display

```
Section label: "ESTIMATED RANGE"
  8px, 700, 2.5px tracking, var(--color-text-tertiary)

Range line:
  "$[plSwingLow] — $[plSwingHigh]"
  font-mono, 24px, var(--color-text-danger)
  " — " in 14px regular, var(--color-text-tertiary)

Central estimate line:
  "Most likely: $[plSwing] (at 1.4% RBA flat-rate benchmark)"
  13px, var(--color-text-secondary)

Range note: from ZeroCostOutputs.rangeNote
  12px, var(--color-text-tertiary), line-height 1.55
```

### 4. Directional confidence note

```
Display: inline flex with badge

Badge: "DIRECTIONAL ESTIMATE"
  9px, 700, background: var(--color-background-secondary), var(--color-text-tertiary)
  border: 0.5px solid var(--color-border-secondary), padding: 3px 8px

Explanation: "Actual rate depends on which plan [pspName] migrates you to."
  12px, var(--color-text-tertiary)
```

### 5. Action list (ALL URGENT)

```
Section label: "WHAT TO DO — URGENTLY"
  8px, 700, 2.5px tracking, var(--color-text-danger)

Each action card:
  Same structure as standard ActionCard component
  All three actions have priority: 'urgent'
  URGENT chip: bg-red-50, red text, 9px 700
  No PLAN (amber) or MONITOR (grey) chips appear here.
```

### What NOT to render for zero-cost

```
✕ WaterfallChart
✕ PassThroughSlider
✕ EscapeScenarioCard
✕ CostCompositionChart
✓ ConsultingCTA — show (highest-priority merchant type for consulting)
✓ EmailCapture — show
```

---

## Component 2 — StrategicRateExitPage

**File:** apps/web/components/results/StrategicRateExitPage.tsx
**Renders when:** `result.strategicRateExit === true`
**Props:** `{ onBack: () => void }`

### Hard rules

- NO dollar figures anywhere on this page. Not in copy, not in estimates, not in examples.
- NO "costs will rise" or "you will pay more" — these are RISKS, not certainties.
- NO standard results components (no MetricCards, no ActionList, no WaterfallChart).

### Structure

```
1. Header block
2. Three mechanism cards
3. What to do now (ordered list)
4. CTA block
```

### 1. Header block

```
Eyebrow pill: "STRATEGIC RATE PLAN DETECTED"
  10px, 700, background: var(--color-background-secondary)
  border: 0.5px solid var(--color-border-secondary)

Headline: "Our standard model doesn't apply to your situation."
  font-serif, 22px, var(--color-text-primary)

Body:
  "Strategic rates are bilateral interchange agreements negotiated directly between
   large merchants and Visa or Mastercard. They sit outside the published interchange
   schedule and aren't modelled by our standard calculator. Applying the standard model
   to your situation would produce a confidently wrong answer — so we haven't."
  14px, var(--color-text-secondary), line-height 1.65
```

### 2. Three mechanism cards

```
Each card:
  Border: 0.5px solid var(--color-border-secondary)
  Border-left: 2px solid var(--color-border-secondary) — distinguish from regular cards
  Padding: 16px
  Border-radius: 0

Card 1 — Floor problem:
  Eyebrow: "POTENTIAL COST INCREASE"
    9px, 700, var(--color-text-danger)
  Title: "Your current rate may be below the new regulatory floor"
    15px, 500, var(--color-text-primary)
  Body:
    "Current strategic credit rates can be as low as 0.2%. The RBA's new credit benchmark
     is 0.3%. If Mastercard or Visa restructure their interchange schedules in response to
     the reform, the rate categories that enabled your sub-0.3% rate may disappear — and
     your effective rate rises to meet the new floor."
    13px, var(--color-text-secondary), line-height 1.65

Card 2 — Scheme fee compensation:
  Eyebrow: "UNREGULATED RISK"
    9px, 700, var(--color-text-warning, amber)
  Title: "Card schemes may offset lost interchange via scheme fees"
  Body:
    "Scheme fees — what you pay Visa and Mastercard for network participation — are not
     regulated by the RBA and are not capped. The RBA explicitly flagged the risk that
     schemes may increase these fees to offset interchange revenue lost from the reform.
     Scheme fees are typically a separate line item in bilateral agreements and are not
     subject to the same transparency obligations."

Card 3 — Renegotiation trigger:
  Eyebrow: "CONTRACTUAL RISK"
    9px, 700, var(--color-text-warning, amber)
  Title: "Your bilateral agreement may contain reform-triggered renegotiation clauses"
  Body:
    "Most bilateral interchange agreements include clauses allowing renegotiation when
     the regulatory framework changes materially. The October 2026 reforms qualify. A
     renegotiation triggered by this reform may not be on terms as favourable as your
     current deal — particularly if your current rate sits below the new published floor."
```

### 3. What to do now

```
Headline: "What to do now"
  font-serif, 16px, var(--color-text-primary)

Ordered list — plain numbered copy (not action cards, no priority chips):
  1. Contact your Mastercard and/or Visa account manager to understand how their
     interchange schedule restructure affects your bilateral agreement.

  2. Review your bilateral agreement for renegotiation trigger clauses and material
     change provisions. Note any reform-triggered review windows.

  3. Model three scenarios with your payments team: (a) costs unchanged,
     (b) credit rate rises to the published floor, (c) scheme fees increase by 5–10bps.

  4. Engage a payments specialist with large-merchant bilateral experience before
     October. This is not a situation for a self-service calculator — it requires
     expert review of your specific contract terms.

Font: 13px, var(--color-text-secondary), line-height 1.75
List item spacing: 12px between items
```

### 4. CTA block

```
Button: "Book a specialist payments review"
  Primary button style (amber #BA7517 — use existing primary button component)
  Links to Calendly (same URL as consulting CTA)

Note below button:
  "Reform Ready — engagement for large-merchant reform impact analysis"
  12px, var(--color-text-tertiary)

Back link:
  "← Back to assessment"
  Calls onBack() — resets strategicRateSelected in assessment state
  text-caption, underline, var(--color-text-tertiary)
  Position: below the CTA block
```

---

## Component 3 — LCRInsightPanel

**File:** apps/web/components/results/LCRInsightPanel.tsx
**Renders for:** Flat-rate and blended merchants ONLY
**Discriminant: planType (NOT category)** — see rationale below

**WHY planType not category:** Using `category === 2 || category === 4` works
accidentally (blended maps to these categories), but is fragile. A future category
addition would silently exclude or include this panel. Using planType makes the
intent explicit: "this panel is for merchants whose pricing structure makes LCR
relevant" — not "merchants in category 2 or 4."

**Position:** Below the action plan, above ConsultingCTA
**Preceded by:** Hard separator

### Props interface

```typescript
interface LCRInsightPanelProps {
  volume: number;
  pspName: string;
  planType: 'flat' | 'blended';
  avgTransactionValue: number;  // REQUIRED — eftpos is $0.02/txn flat, not a %
  // NOT: category: 2 | 4
  // The calling component passes planType from the persisted assessment inputs.
}
```

### The separator (render immediately above LCRInsightPanel)

```tsx
<div style={{
  borderTop: '1px solid var(--color-border-secondary)',
  margin: '32px 0 20px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
}}>
  <span style={{
    fontSize: '9px',
    fontWeight: 700,
    letterSpacing: '2px',
    color: 'var(--color-text-tertiary)',
    whiteSpace: 'nowrap',
  }}>
    ADDITIONAL INSIGHT — NOT INCLUDED IN FIGURES ABOVE
  </span>
  <div style={{ flex: 1, height: '1px', background: 'var(--color-border-secondary)' }} />
</div>
```

### Panel structure

```
Background: var(--color-background-secondary)
Border: 0.5px solid var(--color-border-secondary)
Border-radius: 6px (small — this is an aside, not a document card)
Padding: 16px

Header row (flex, space-between):
  Left:  "[pspName] keeps your Least Cost Routing saving"
         13px, 500, var(--color-text-primary)
  Right: "ESTIMATE · ASSUMED" badge
         9px, 700, 1px tracking
         background: var(--color-background-primary)
         color: var(--color-text-tertiary)
         border: 0.5px solid var(--color-border-secondary)
         padding: 3px 8px, border-radius: 3px

Figure (below header):
  "~$[estimatedLCRCapture formatted] / year"
  font-mono, 22px, 500, var(--color-text-primary)

Body copy:
  "When a customer taps a debit card, your terminal can route it via Visa Debit
   (~0.5% per transaction) or directly via eftpos (~$0.02 per transaction). [pspName]
   uses Least Cost Routing — automatically choosing eftpos. On your [planType label]
   rate, that routing saving goes to [pspName]. Your rate stays unchanged either way.
   On an itemised (cost-plus) plan, the eftpos routing saving would appear as a lower
   interchange line item — flowing to you automatically."
  12px, var(--color-text-secondary), line-height 1.65

  planType label: 'flat' → "flat" / 'blended' → "blended"

Assumption box:
  Background: var(--color-background-primary)
  Border: 0.5px solid var(--color-border-tertiary)
  Border-radius: 4px
  Padding: 10px 12px
  Margin-top: 12px

  Icon: ℹ︎ (12px, var(--color-text-tertiary))
  Copy: "How we calculated this: debit share assumed at 55% of volume (population average).
         eftpos interchange is a flat $0.02/transaction — expressed as a proportion of your
         average transaction value ($[ATV]) this gives [eftposEffectiveRate × 100]%.
         Visa Debit costs ~0.5%. LCR saving = difference × debit share × volume.
         Assumed your PSP keeps the routing saving — typical for flat-rate plans.
         This figure does not affect the P&L calculation above."
  Font: 11px, var(--color-text-tertiary), line-height 1.6
```

### Inline calculation

```typescript
export function LCRInsightPanel({ volume, pspName, planType, avgTransactionValue }: LCRInsightPanelProps) {
  const VISA_DEBIT_RATE     = 0.005;   // ~0.5% of transaction value (Visa Debit)
  const EFTPOS_CENTS_PER_TXN = 0.02;  // $0.02 flat fee per transaction (NOT a %)
  const DEBIT_SHARE          = 0.55;  // population average debit share

  // eftpos is a flat fee — express as proportion of THIS merchant's ATV
  // At ATV $65: $0.02/$65 = 0.031%. At ATV $15: $0.02/$15 = 0.133%
  const eftposEffectiveRate  = EFTPOS_CENTS_PER_TXN / avgTransactionValue;
  const lcrDiffRate          = Math.max(0, VISA_DEBIT_RATE - eftposEffectiveRate);

  const estimatedLCRCapture = Math.round(volume * DEBIT_SHARE * lcrDiffRate);

  const planLabel = planType === 'blended' ? 'blended' : 'flat';
  const formatted = '~$' + estimatedLCRCapture.toLocaleString('en-AU') + '/year';

  // ... render
}
```

---

## Component 4 — VerdictSection range display

### Range examples by category — CORRECTED to match ±20% formula

**Note on range width:** For Category 3 (costplus + surcharging), the range will appear
narrow relative to the total figure — this is mathematically correct. The surcharge
revenue loss dominates and is certain; only the IC saving (a smaller component) varies.
The narrow range is INFORMATIVE — it tells the merchant their position is well-defined.
Do not inflate the range for visual effect.

**Category 1 — cost-plus, not surcharging (positive range, green):**
```
Example: $2M, icSaving $1,700.00
plSwingLow  = $1,700 × 0.80 = +$1,360
plSwing     = +$1,700 (expected, at estimated card mix)
plSwingHigh = $1,700 × 1.20 = +$2,040

Display: "+$1,360 to +$2,040"
Expected: "+$1,700 — at estimated card mix"
```

**Category 2 — flat-rate, not surcharging (zero-to-positive range):**
```
Example: $2M flat, icSaving $1,700.00
plSwingLow  = 0 (0% pass-through)
plSwing     = +$765 (45% pass-through, RBA market average)
plSwingHigh = +$1,700 (100% pass-through)

Display: "$0 to +$1,700"
Expected: "+$765 — at 45% PSP pass-through (RBA market estimate)"
```

**Category 3 — cost-plus, surcharging (negative range, both values red):**
```
Example: $10M, icSaving $8,500, surchargeRevenue $108,000 (0.90 designated share)
plSwingLow  = $8,500×0.80 - $108,000 = $6,800 - $108,000 = -$101,200
plSwing     = $8,500 - $108,000 = -$99,500 (expected, at estimated card mix)
plSwingHigh = $8,500×1.20 - $108,000 = $10,200 - $108,000 = -$97,800

Display: "-$101,200 to -$97,800"
Expected: "-$99,500 — at estimated card mix"

Note: The range spread ($3,400) appears narrow relative to the total figure ($99K).
This is correct — the surcharge loss dominates and is certain. The narrow range
communicates the merchant's position is well-defined, not poorly estimated.
```

**Category 4 — flat-rate, surcharging (negative range, both values red):**
```
Example: $3M flat, icSaving $2,550, surchargeRevenue $32,400 (0.90 designated share)
netTodayFlat = annualMSF - surchargeRevenue = $42,000 - $32,400 = $9,600
plSwingLow  = $9,600 - $42,000 = -$32,400  (0% PT: no saving, full loss)
plSwing     = $9,600 - ($42,000 - $2,550×0.45) = $9,600 - $40,852.50 = -$31,252.50 (45% PT)
plSwingHigh = $9,600 - ($42,000 - $2,550) = $9,600 - $39,450 = -$29,850 (100% PT)

Display: "-$32,400 to -$29,850"
Expected: "-$31,253 — at 45% PSP pass-through (RBA market estimate)"
```

### Typography specification

```
Range numbers:
  Font:    font-mono
  Size:    clamp(24px, 7vw, 32px) — responsive, stacks on mobile
  Weight:  500
  Colour:  All-positive range → var(--color-text-success)
           All-negative range → var(--color-text-danger)
           Mixed (straddles zero) → var(--color-text-primary)

" to " separator:
  Font:    font-sans (not mono)
  Size:    14px, weight 400
  Colour:  var(--color-text-tertiary)
  Margin:  8px horizontal

Expected outcome line:
  "Expected outcome:" label: 12px, var(--color-text-secondary)
  Value: font-mono, 13px, 500 — colour by sign (green/red)
  Explanation: 11px, var(--color-text-tertiary)

Range note:
  11px, var(--color-text-tertiary), line-height 1.55

Blended caveat (only if planType === 'blended' and no rates were provided):
  Show below range note:
  "Blended plan tip: entering your specific debit and credit rates from your
   statement will improve this estimate."
  11px, var(--color-text-tertiary), font-style italic
  This is NOT shown if blendedDebitRate and blendedCreditRate are both present.

Cost-plus upgrade prompt (only for Cat 1 and Cat 3, when card mix is estimated):
  Show when confidence !== 'high':
  "Providing your actual card mix from your PSP statement will narrow this range."
  11px, var(--color-text-tertiary)
  Include a link: "Update card mix →" that opens the ExpertPanel (if feasible via scroll)
```

### Mobile layout (< 380px)

```
Range numbers wrap to two lines:
  -$101,200
  to
  -$97,800

Use flex-wrap or single-column layout below this breakpoint.
The clamp() on font-size handles the responsive sizing.
```

---

## Component 5 — Step2PlanType new plan type cards

### Grid layout: four cards

```
Grid: auto-fit, minmax(200px, 1fr) — allows 2×2 on desktop, 1×4 on mobile
(was: minmax(220px, 1fr) for 2 cards — narrow to 200px to fit 4 comfortably)
Gap: 12px (was: gap-3)
```

### Card order (left to right, top to bottom)

```
1. Flat rate (existing — unchanged)
2. Blended (NEW)
3. Cost-plus (existing — unchanged)
4. Zero-cost (NEW)
```

### Blended card mock statement

```
"Different rates for different cards"
"Westpac, Airwallex, some banks"

Mock statement:
  Debit transactions    0.90%
  Credit transactions   1.60%
```

### Zero-cost card mock statement

```
"Zero-cost — I pay nothing"
"Smartpay / Shift4, Tyro zero-cost"

Mock statement:
  Your payment cost     $0.00  ← green colour
  ⚠ Most affected by October reform  ← amber, 9px below subtitle
```

### Zero-cost warning panel (appears immediately below cards when zero_cost selected)

```
Background: #FDF2F2
Border: 1px solid rgba(191,53,53,0.3), border-left: 3px solid var(--color-text-danger)
Border-radius: 0 (document aesthetic)
Padding: 16px

EYEBROW: "ACTION REQUIRED" — var(--color-text-danger), 9px 700
HEADLINE: "Your zero-cost plan ends on 1 October 2026"
BODY: "The surcharge mechanism ends. You will pay the full processing cost from October.
       What rate do you expect to pay?"

Rate selection (pill buttons — NONE pre-selected, msfRateMode starts 'unselected'):
  The Next button is DISABLED until msfRateMode is confirmed.

  Button A: "Use 1.4% market estimate"
    onClick → onMsfRateModeChange('market_estimate')
    Active (red) when msfRateMode === 'market_estimate'

  Button B: "I have a confirmed rate"
    onClick → onMsfRateModeChange('custom')
    Active (red) when msfRateMode === 'custom'
    Number input appears: placeholder "e.g. 1.3", step 0.01, min 0.1, max 5
    Valid entry → onCustomMSFRateChange(value / 100)
    Invalid/empty → onCustomMSFRateChange(null)

  Three-state clarifies intent at every moment:
    'unselected' → both buttons grey, Next disabled
    'market_estimate' → Button A red, Next enabled
    'custom' + valid rate → Button B red + input filled, Next enabled
    'custom' + no rate → Button B red + input empty, Next STILL disabled

When rate confirmed:
  Preview line: "At [X.X]%, you'd pay approximately $[amount]/year from 1 October."

canProceed gate:
  const zeroCostReady = planType !== 'zero_cost'
    || msfRateMode === 'market_estimate'
    || (msfRateMode === 'custom' && customMSFRate !== null && customMSFRate > 0);
  const canProceed = planType !== null && psp !== null && zeroCostReady;
```

### Blended optional rate panel (appears below cards when blended selected)

```
Background: var(--color-background-secondary)
Border: 0.5px solid var(--color-border-secondary)
Border-radius: 0
Padding: 16px

Headline: "Optional: enter your rates for a more accurate estimate"
Subtext: "Find these on your monthly statement. Leave blank to use RBA averages (±20% accuracy)."

Two number inputs side by side:
  Debit rate (%): placeholder "e.g. 0.9", step 0.01
  Credit rate (%): placeholder "e.g. 1.6", step 0.01

Both are optional — canProceed does NOT require these.
```

### Strategic rate text link

```
Position: below all four plan type cards
Margin-top: 12px

Text: "Processing $50M+ in card payments? You may have a strategic rate →"
Style: text-caption, underline, var(--color-text-tertiary)
onClick: onStrategicRateSelected()
  → sets strategicRateSelected = true in assessment state
  → assessment page renders StrategicRateExitPage inline
  → "Back" button in StrategicRateExitPage resets strategicRateSelected = false
```

---

## Assessment form state — summary of new fields

```typescript
// Initial state values (all new fields):
msfRateMode: 'unselected' as 'unselected' | 'market_estimate' | 'custom',
customMSFRate: null as number | null,
blendedDebitRate: null as number | null,
blendedCreditRate: null as number | null,
strategicRateSelected: false,
passThrough: 0.45,          // CHANGED from 0 to 0.45 — RBA market average
```

```typescript
// Updated submitAssessment call fields:
msfRateMode: state.msfRateMode,
customMSFRate: state.customMSFRate ?? undefined,
blendedDebitRate: state.blendedDebitRate ?? undefined,
blendedCreditRate: state.blendedCreditRate ?? undefined,
```
