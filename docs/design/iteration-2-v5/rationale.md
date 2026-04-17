# Iteration 2 — Rationale (v5)

Read before starting. Reference when a judgment call is needed.

---

## Why ranges instead of point estimates

A point estimate like "−$31,253" implies precision the model doesn't have. The
debit saving depends on ATV (estimated). The credit saving depends on card mix
(RBA average). The pass-through depends on future PSP decisions. A range is honest
and more actionable — merchants can plan with a band, not a false anchor.

---

## Why TWO separate debitTxns variables (Option A)

The eftpos exclusion fix changes the debit saving calculation but must NOT change
`grossCOA`. `grossCOA` drives the waterfall chart — specifically, the "Today" bar
height. Changing it would silently distort the chart even for merchants who see no
eftpos saving.

The engine uses two variables:
- `visaMcDebitTxns` = (volume × visaMcDebitShare) / ATV → for `debitSaving` only
- `allDebitTxns` = (volume × debitShare) / ATV → for `debitIC` in `grossCOA`

This means `grossCOA` is UNCHANGED for all scenarios. The arithmetic consequence
is that `octNet` changes (because icSaving changes) but `netToday` for non-surcharging
scenarios does not.

**Why not Option B (single variable)?** Under Option B, `grossCOA` for Scenario 1
changes from $9,401.54 to $9,180.00. This produces Scenario 3 `octNet` = $37,400
instead of $38,507.69. The second independent reviewer (Claude Code) confirmed
$38,507.69 — the Option A value — which is only achievable with two separate
variables.

---

## Why the eftpos exclusion is correct

eftpos current interchange: ~$0.02 per transaction.
Reform cap: MIN(8c, 0.16% × ATV).
At ATV $65: MIN(8c, $0.104) = 8c. eftpos at $0.02 is already well below.
The reform produces zero debit saving for eftpos transactions.

Including eftpos overstated the saving by 13.3% (eftpos share 0.08 / debit share
0.60). The fix removes this overstatement.

Update docs: `docs/product/calculation-verification.md` and Section 7 of
`docs/architecture/business-rules-engine.md`.

---

## Why the surcharge formula uses actual card mix (not 0.95)

With the actual breakdown (all designated surcharged):
`visa_debit(0.35) + visa_credit(0.18) + mc_debit(0.17) + mc_credit(0.12) + eftpos(0.08) = 0.90`

A hardcoded 0.95 was never correct. The data is in `cardMix.breakdown` — using it
makes the Amex-only carve-out (CLAUDE.md Section 3) work at the calculation level:

- Empty `surchargeNetworks` + `surcharging=true` → defaults to all designated (0.90)
- `['amex']` → designated share = 0 → surchargeRevenue = $0
- `['visa', 'mastercard']` → designated share = 0.82

---

## Why debitShare (0.60) is used in the blended formula

A blended merchant's PSP statement shows one "debit rate" (e.g. 0.9%) covering
all debit — Visa, MC, AND eftpos. There is no separate eftpos rate on a blended
plan. Weighting by `visaMcDebitShare` (0.52) would incorrectly exclude eftpos from
the weighted calculation, understating the blended MSF by 13.3%.

The unknownShare term (`1 - debitShare - consumerCreditShare = 0.05`) covers Amex,
foreign, and commercial, using `msfRate` as the best available proxy.

**Removing round2() from the rate:** `round2(0.01235)` = 0.01 (19% error when
applied to the intermediate rate). `round2()` is a dollar-rounding function — it
rounds to the nearest cent. Applied to a rate like 0.01235, it destroys precision.
Remove it from the rate computation; apply only to `round2(volume × effectiveMSFRate)`.

---

## Why the three-state msfRateMode (not overloaded null)

`null` can mean both "nothing selected yet" and "confirmed rate button clicked but
no value entered". A merchant who clicks "I have a confirmed rate" sees the button
turn active while Next remains disabled — without three-state, these two conditions
are indistinguishable in component logic.

Three states, four situations:

| msfRateMode | customMSFRate | canProceed | UI |
|---|---|---|---|
| 'unselected' | null | No | Both buttons grey |
| 'market_estimate' | null | Yes | Button A red |
| 'custom' | null | No | Button B red, input empty |
| 'custom' | 0.013 | Yes | Button B red, input filled |

---

## Why estimatedMSFRate cannot be pre-selected

If form state initialises msfRateMode at 'market_estimate', `canProceed` is
satisfied the moment zero-cost is tapped — before the merchant sees or confirms
anything. The $0 → $thousands gap would be submitted on a default they never
acknowledged. The three-state model requires an active choice.

---

## Why plSwingLow/plSwingHigh are FIXED at submission

The PassThroughSlider re-runs `resolveAssessmentInputs()` + `calculateMetrics()`
on every drag event. If range fields referenced `passThrough`, they would collapse
to equal `plSwing` at every position. The range represents "the realistic spread
of outcomes" — permanently contextual. The slider is exploration within that spread.

---

## Why the 44px hero number is overridden for range display

CLAUDE.md design rule #2: "P&L swing hero number is 44px monospace. It is the
first thing the merchant sees. Everything else is secondary."

The range display uses `clamp(24px, 7vw, 32px)` instead. This intentionally
overrides the rule for this specific reason:

A range like "+$1,360 to +$2,040" at 44px per number would require ~320px on
mobile (375px viewport). The range IS the hero — we are replacing one 44px
point estimate with a pair of numbers that together carry more information.
Fitting both on one line at a still-prominent size (32px desktop, ~26px mobile)
is a better user experience than wrapping to two lines or using a smaller font
for just one number.

The single expected-outcome line below it uses `text-financial-standard` (22px),
maintaining the size hierarchy per design rule #2's intent.

---

## Why getCategory('zero_cost') should not throw

Zero-cost should never reach `getCategory()` — it's intercepted in
`submitAssessment.ts` before the resolve/calculate pipeline. However, the TypeScript
type signature accepts `'zero_cost'` as a valid planType. Without defensive handling,
anyone calling `getCategory('zero_cost', false)` directly (in tests, scripts, or
future features) will get an unhandled throw.

The fix (`planType === 'zero_cost' → 'flat'`) is defensive, not a meaningful
category assignment. Zero-cost is routed to `calculateZeroCostMetrics()`, not
through the 2×2 matrix.

---

## Why zero-cost uses a separate function

`preReformNetCost: 0` is a TypeScript literal type. Assigning any non-zero value
fails to compile. A branch inside `calculateMetrics()` could accidentally produce
a non-zero value without the compiler catching it. The separate function makes the
invariant structurally impossible to violate.

---

## Why strategic rate is an inline exit (not navigated)

Navigation to `/assessment/strategic-rate` breaks session state. The merchant has
entered 4 steps of data. Navigation requires URL params or sessionStorage to
restore it. "Back" via browser history is messy. Inline rendering (`strategicRateSelected=true`)
keeps all assessment state. "Back" resets one boolean, returns to Step 2 intact.

---

## Why strategic rate records are persisted

Without an `assessmentId`, there is no URL, no sharing, no bookmarking. A minimal
record with `category = 5` generates a UUID. Dollar figures are never stored or
displayed on the exit page.

---

## Why LCR uses avgTransactionValue (not hardcoded eftpos rate)

eftpos charges ~$0.02 per transaction — a flat fee. To compute a volume-based
saving, it must be expressed as a proportion of transaction value:
`eftposEffectiveRate = $0.02 / avgTransactionValue`.

At ATV $65 (retail): $0.02/$65 = 0.031%
At ATV $15 (café):   $0.02/$15 = 0.133%

A hardcoded "eftpos = 0.02%" is only accurate at ATV $100. For cafés (the highest
eftpos-share merchants, who are most likely to use this tool), the estimate would
be 4x wrong. `avgTransactionValue` must be a required prop.

---

## Why amber, not emerald

`docs/design/design-tokens.md` specifies `#BA7517` as the only brand accent.
PillBadge variants are `'amber'`, `'green'`, `'red'`, `'grey'`. No `'accent'`
variant exists. All uses of emerald or 'accent' in earlier draft specs were
errors. This iteration uses amber tokens exclusively.

---

## Why sessionStorage must include new fields

Without persistence, a browser refresh mid-assessment silently resets msfRateMode
to 'unselected', blocking Next. The merchant loses their rate selection and must
re-enter it.

`strategicRateSelected` is intentionally excluded — a refresh should return to the
form, not the exit page.
