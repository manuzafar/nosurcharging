# Verification Checklist — Iteration 2 (v5)

Sequential — complete each phase fully before moving to the next.

---

## Before Phase 1 — Database migration

```sql
-- Apply 002_assessment_variants.sql in Supabase SQL editor — STAGING FIRST
SELECT id FROM assessments WHERE category NOT IN (0,1,2,3,4,5);  -- → 0 rows
```

- [ ] Migration applied to staging and verified
- [ ] Migration applied to production
- [ ] `category = 0` insert succeeds
- [ ] `category = 5` insert succeeds
- [ ] `category = null` insert FAILS (NOT NULL still enforced)
- [ ] `variant_type = null` insert FAILS (NOT NULL set after UPDATE)
- [ ] `category = 6` insert FAILS (CHECK constraint)

---

## After Phase 1 + Phase 2 — Engine

```bash
cd packages/calculations && pnpm test && pnpm build
```

### Permitted changes (exact values — verify each)

| Scenario | Field | Old value | New value | Arithmetic |
|---|---|---|---|---|
| 1 | debitSaving | $184.62 | **$160.00** | 16,000txns × $0.01 |
| 1 | icSaving | $1,724.62 | **$1,700.00** | $160+$1,540 |
| 1 | octNet | $7,676.92 | **$7,701.54** | $9,401.54-$1,700 |
| 1 | plSwing | +$1,724.62 | **+$1,700.00** | $9,401.54-$7,701.54 |
| 2 (45%PT) | plSwing | +$776.08 | **+$765.00** | $1,700×0.45 |
| 2 (100%PT) | plSwing | +$1,724.62 | **+$1,700.00** | icSaving |
| 3 | debitSaving | $923.08 | **$800.00** | 80,000txns × $0.01 |
| 3 | icSaving | $8,623.08 | **$8,500.00** | $800+$7,700 |
| 3 | surchargeRevenue | $120,000 | **$108,000** | $10M×1.2%×0.90 |
| 3 | netToday | -$72,992.31 | **-$60,992.31** | $47,007.69-$108,000 |
| 3 | octNet | $38,384.61 | **$38,507.69** | $47,007.69-$8,500 |
| 3 | plSwing | -$111,376.92 | **-$99,500.00** | -$60,992.31-$38,507.69 |
| 4 | debitSaving | $276.92 | **$240.00** | 24,000txns × $0.01 |
| 4 | icSaving | $2,586.92 | **$2,550.00** | $240+$2,310 |
| 4 | surchargeRevenue | $36,000 | **$32,400** | $3M×1.2%×0.90 |
| 4 | netToday | $6,000 | **$9,600** | $42,000-$32,400 |
| 4 | octNet | $40,835.89 | **$40,852.50** | $42,000-($2,550×0.45) |
| 4 | plSwing | -$34,835.89 | **-$31,252.50** | $9,600-$40,852.50 |

### NOT permitted to change (all must remain at original values)

- [ ] `creditSaving` — any scenario
- [ ] `grossCOA` — any scenario ($9,401.54, $47,007.69 — UNCHANGED under two-variable architecture)
- [ ] `todayScheme`, `oct2026Scheme` — any scenario
- [ ] `netToday` — Scenario 1 ($9,401.54) and Scenario 2 ($28,000)
- [ ] `plSwing` — Scenario 2@0%PT ($0.00) and Scenario 5 (+$1,750.00)

### Architecture diagnostic: if grossCOA changed unexpectedly

```bash
# Indicates single debitTxns variable was used for both saving and debitIC
# Fix: ensure visaMcDebitTxns is used for debitSaving and allDebitTxns for debitIC
grep -n "debitTxns" packages/calculations/calculations.ts
# Should show TWO declarations: visaMcDebitTxns AND allDebitTxns
```

### New scenario checks

- [ ] Scenario 6: `surcharging=false, networks=[]` → surchargeRevenue = $0
- [ ] Scenario 6: `surcharging=true, networks=[]` → all designated default → $10,800 ($1M×1.2%×0.90)
- [ ] Scenario 6: `networks=['visa','mastercard']` → 0.82 share → $9,840 ($1M×1.2%×0.82)
- [ ] Scenario 6: `networks=['visa','mastercard','eftpos']` → 0.90 share → $10,800
- [ ] Scenario 6: `networks=['amex']` → surchargeRevenue = $0 (amex not designated)
- [ ] Scenario 7a: preReformNetCost = 0 exactly, plSwing = $8,400, plSwingLow = $7,200
- [ ] Scenario 7b: custom rate 1.3% → postReformNetCost = $15,600
- [ ] Scenario 7c: preReformNetCost = 0 at all 5 volumes
- [ ] Scenario 8a: blended with rates → annualMSF = $12,350 (NOT $10,000 from round2 error)
- [ ] Scenario 8b: blended without rates → annualMSF = $13,000 (msfRate fallback)
- [ ] Scenario 8c: blended + surcharging networks=['visa','mastercard'] → surchargeRevenue = $19,680
- [ ] Scenario 9a: ATV $15 → debitSaving ≈ $208
- [ ] Scenario 9b: ATV $65 → debitSaving = $160.00
- [ ] Scenario 10: detectStrategicRate — all 5 cases pass
- [ ] Scenario 10: getCategory('zero_cost', false) = 2, getCategory('zero_cost', true) = 4 (no throw)
- [ ] Range invariant: plSwingLow/plSwingHigh identical at 0%, 45%, 100% passThrough
- [ ] Cat1 range: plSwingLow=$1,360, plSwingHigh=$2,040

### Documentation update check

- [ ] `docs/product/calculation-verification.md` updated:
  - S1: debit working shows visaMcDebitShare(0.52), result=$160.00; icSaving=$1,700
  - S3: surchargeRevenue=$108,000 (×0.90), netToday=-$60,992.31, octNet=$38,507.69, plSwing=-$99,500
  - S4: surchargeRevenue=$32,400, netToday=$9,600, octNet=$40,852.50, plSwing=-$31,252.50
- [ ] `docs/architecture/business-rules-engine.md` Section 7: eftpos removed from schemes array with explanatory comment

---

## After Phase 3 — Server action

```bash
pnpm build  # zero errors
```

- [ ] AssessmentFormData uses `msfRateMode` + `customMSFRate` (not `estimatedMSFRate`)
- [ ] `ZeroCostOutputs | AssessmentOutputs` union type accepted by TypeScript
- [ ] Supabase: zero-cost assessment → `category=0, variant_type='zero_cost'`
- [ ] Supabase: strategic-rate assessment → `category=5, variant_type='strategic_rate'`
- [ ] Neither has null in `variant_type` (NOT NULL enforced by migration)
- [ ] Both have a valid `assessmentId` UUID (URL is shareable)
- [ ] SR-12: confirmed `customMSFRate`, `blendedDebitRate`, `blendedCreditRate` are NOT in any log

---

## After Phase 4 — Assessment UI

```bash
pnpm build && pnpm playwright test
```

### Four plan type cards

- [ ] Flat rate card visible and selectable (aria-label: "Flat rate plan")
- [ ] Cost-plus card visible and selectable (aria-label: "Cost-plus plan")
- [ ] Blended card visible (aria-label: "Blended rate plan")
- [ ] Zero-cost card visible (aria-label: "Zero-cost EFTPOS plan")
- [ ] Selected card: `border: 1px solid #BA7517` — NOT 'accent' variant

### Zero-cost state machine

- [ ] msfRateMode starts as 'unselected' — both buttons grey, Next DISABLED
- [ ] "Use 1.4% market estimate" → msfRateMode='market_estimate', button red, preview appears, Next ENABLED
- [ ] "I have a confirmed rate" → msfRateMode='custom', button red, input appears, Next DISABLED
- [ ] Entering 1.3 in input → customMSFRate=0.013, Next ENABLED
- [ ] Clearing input → customMSFRate=null, Next DISABLED (custom but no rate)

### canProceed matrix

- [ ] flat + PSP → ENABLED
- [ ] blended + PSP (no rates entered) → ENABLED
- [ ] costplus + PSP → ENABLED
- [ ] zero_cost + PSP + market_estimate → ENABLED
- [ ] zero_cost + PSP + custom + valid rate → ENABLED
- [ ] zero_cost + PSP + unselected → **DISABLED**
- [ ] zero_cost + PSP + custom + no rate → **DISABLED**
- [ ] zero_cost + no PSP + market_estimate → **DISABLED**

### Strategic rate

- [ ] Clicking link → exit page renders inline (URL unchanged)
- [ ] Back button → Step 2 restored (plan type selection intact)

### Slider default

- [ ] After any flat-rate assessment, slider opens at 45%

### Analytics events

- [ ] `Plan type selected` fires with 'blended', 'zero_cost', 'strategic_rate'
- [ ] `Zero-cost rate selected` fires when msfRateMode confirmed
- [ ] `Blended rates entered` fires when any rate entered
- [ ] `Strategic rate exit viewed` fires on exit page mount

---

## After Phase 5 — Results UI

```bash
pnpm build && pnpm test && pnpm playwright test
```

### Structural

```bash
grep -rn "'flat_rate'\|'cost_plus'" --include="*.tsx" apps/web/components/  # → 0
grep -rn "variant='accent'\|variant=\"accent\"" --include="*.tsx" apps/web/  # → 0
grep -rn "EFTPOS_RATE.*0\.0002\|0\.0002" --include="*.tsx" apps/web/        # → 0
```

### Manual — Cat 2 (flat, not surcharging)

- [ ] Range shows "$0 to +$1,700" 
- [ ] Expected: "+$765 — at 45% PSP pass-through (RBA market estimate)"
- [ ] Slider at 45% on first load
- [ ] Dragging to 0% → plSwing shows $0
- [ ] Dragging to 100% → plSwing shows +$1,700
- [ ] **plSwingLow stays $0 throughout slider movement (does NOT change)**
- [ ] **plSwingHigh stays +$1,700 throughout slider movement (does NOT change)**
- [ ] LCR panel visible below action list

### Manual — Cat 1 (cost-plus, not surcharging)

- [ ] Range shows "+$1,360 to +$2,040"
- [ ] Expected: "+$1,700 — at estimated card mix"
- [ ] Range note mentions "±20%"
- [ ] No slider, no LCR panel

### Manual — Cat 3 (cost-plus, surcharging)

- [ ] Range shows two negative numbers
- [ ] plSwing = -$99,500 (for $10M scenario equivalent)
- [ ] No slider, no LCR panel

### Manual — Cat 4 (flat, surcharging)

- [ ] Range shows two negative numbers
- [ ] Slider at 45%
- [ ] LCR panel visible

### Manual — Zero-cost results

- [ ] Critical red banner (not amber)
- [ ] "$0" visible (preReformNetCost)
- [ ] URGENT chip on all 3 actions
- [ ] No slider, no waterfall chart
- [ ] plSwingLow/plSwing/plSwingHigh visible as range

### Manual — Strategic rate exit

- [ ] No dollar amounts in body text (search DOM: `$digit` pattern = 0 results)
- [ ] Three mechanism cards visible
- [ ] Calendly CTA visible
- [ ] Back link navigates correctly
- [ ] Assessment URL shareable (assessmentId in URL)

### Manual — Old assessment records (pre-iteration 2)

- [ ] Results page does not crash
- [ ] "Complete a new assessment to see the full range." shown

---

## Final gate — documentation audit

Before final commit:

- [ ] `docs/product/calculation-verification.md` — new ground truth values ✓
- [ ] `docs/architecture/business-rules-engine.md` — eftpos removed from scheme saving ✓
- [ ] `docs/design/component-specs.md` — CB-08 initial value updated to 45% ✓
- [ ] `packages/db/migrations/002_assessment_variants.sql` — committed ✓
- [ ] `rationale.md` in project notes — 44px override documented ✓

```bash
pnpm build && pnpm test && pnpm playwright test
git add -A
git commit -m "feat: Iteration 2 complete — pricing models, ranges, modelling fixes"
```
