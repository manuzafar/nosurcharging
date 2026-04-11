# Component Map — Data Dependencies and Change Risk
## nosurcharging.com.au UX Revamp

This document maps every component to its data source, change risk,
and sync requirements. Read before touching any results page component.

---

## RISK CLASSIFICATION

| Risk | Meaning |
|---|---|
| 🟢 SAFE | Purely cosmetic/copy change. No data dependency. Cannot cause sync issues. |
| 🟡 MEDIUM | Reads from calculation output. Type interface must be verified. |
| 🔴 HIGH | Requires new fields in calculation output or type changes. Must add to lib/ first. |

---

## SECTION 1 — HOMEPAGE COMPONENTS

### `Nav` (wherever nav renders)
- **Risk:** 🟢 SAFE
- **Change:** Copy only (CTA label)
- **Data source:** None
- **Sync requirement:** None

### `ProofBar` (NEW)
- **Risk:** 🟢 SAFE
- **Change:** New component, static copy
- **Data source:** None — hardcoded trust statements
- **Sync requirement:** None

### `HeroSection`
- **Risk:** 🟢 SAFE
- **Change:** Copy only (headline, sub, CTA, proof row)
- **Data source:** None
- **Sync requirement:** None

### `TrustBar` (NEW)
- **Risk:** 🟢 SAFE
- **Change:** New component, static copy
- **Data source:** None
- **Sync requirement:** None

### `PreviewSection` / situations grid
- **Risk:** 🟢 SAFE
- **Change:** Replace tab+card pattern with 2×2 grid
- **Data source:** Hardcoded illustrative values ONLY
- **Sync requirement:** None
- **Important:** These values are illustrative examples, NOT live calculations.
  They must be labelled as such.

### `FeaturesSection` / How it works
- **Risk:** 🟢 SAFE
- **Change:** Copy only (step hints)
- **Data source:** None
- **Sync requirement:** None

---

## SECTION 2 — DISCLAIMER COMPONENTS

### `DisclaimerConsent`
- **Risk:** 🟢 SAFE
- **Change:** Copy and visual wrapper only
- **Data source:** None (form state only — checkbox checked/unchecked)
- **Sync requirement:** None
- **CRITICAL:** The following must NOT change:
  - The checkbox HTML element and its checked state
  - The consent recording call (server action)
  - The session creation call (server action)
  - The form submission logic

---

## SECTION 3 — RESULTS PAGE COMPONENTS

### `VerdictSection` (update existing)
- **Risk:** 🟡 MEDIUM
- **Change:** Layout, copy, daily anchor
- **Data source:**
  ```
  outputs.category        — category number (1-4)
  outputs.plSwing         — the P&L swing (negative = worse off)
  outputs.inputs.psp      — merchant's PSP name
  outputs.inputs.volume   — annual card volume
  outputs.inputs.planType — 'flat' | 'costplus'
  outputs.inputs.surchargeRate — merchant's surcharge rate
  ```
- **New derived value (NOT a new field):**
  ```typescript
  const dailyCost = Math.round(Math.abs(outputs.plSwing) / 365)
  // This is derived in the component, NOT added to calculations.ts
  ```
- **Sync requirement:** Verify all field names above exist in calculations output

### `MetricCards` (update colours only)
- **Risk:** 🟢 SAFE
- **Change:** Colour tokens only (amber → accent)
- **Data source:**
  ```
  outputs.todayNet    — current net payments cost
  outputs.octNet      — October net payments cost
  outputs.icSaving    — interchange saving
  ```
- **Sync requirement:** None (colours don't affect data)

### `ProblemsBlock` (NEW component)
- **Risk:** 🔴 HIGH — verify fields before building
- **Change:** New component
- **Data source:**
  ```
  outputs.inputs.planType    — to determine "DEPENDS ON YOUR PLAN"
  outputs.inputs.psp         — PSP name for inline references
  outputs.surchargeRevenue   — annual surcharge revenue (CHECK EXISTS)
  outputs.icSaving           — interchange saving (should exist)
  outputs.inputs.surchargeRate — merchant's surcharge rate
  ```
- **Sync requirement:**
  1. Check `lib/calculations.ts` for `surchargeRevenue` field
  2. If missing: add `surchargeRevenue: volume * (surchargeRate / 100)` to engine
  3. Add to TypeScript type
  4. THEN build component

### `ActionList` (update existing)
- **Risk:** 🔴 HIGH — requires new `why` field on action objects
- **Change:** Add `why` and `script` sections to each action card
- **Data source:**
  ```
  outputs.actions[]     — array of action objects
  action.tier           — 'urgent' | 'plan' | 'monitor'
  action.date           — display date string
  action.instruction    — what to do
  action.script         — NEW: word-for-word script (CHECK/ADD)
  action.why            — NEW: explanation of stakes (ADD)
  ```
- **Sync requirement — STRICT ORDER:**
  1. Add `script` and `why` to the `Action` interface in types
  2. Update `buildActions()` (in `lib/categories.ts` or wherever) to return them
  3. Commit: "calc: add script and why to action type and buildActions"
  4. THEN update `ActionList.tsx` to render them
  5. NEVER the reverse order

- **Action copy (see UX spec Section 3.4 for full copy):**
  All action copy in `buildActions()` must use `psp` parameter for PSP name.
  Never hardcode "Stripe" in the calculation library.

### `DepthToggle` (NEW component)
- **Risk:** 🟢 SAFE
- **Change:** New UI-only component, no data
- **Data source:** UI state only (open/closed)
- **Sync requirement:** None

### `PassThroughSlider` (update copy)
- **Risk:** 🟡 MEDIUM
- **Change:** Copy only (slider labels and intro text)
- **Data source:**
  ```
  outputs.icSaving    — total interchange saving (used for slider calculation)
  outputs.inputs.psp  — PSP name for copy
  outputs.inputs.planType — to determine if slider is relevant
  ```
- **Sync requirement:** Verify `icSaving` exists. Copy change doesn't affect data.

### `EscapeScenarioCard` (update copy)
- **Risk:** 🟡 MEDIUM
- **Change:** Copy only
- **Data source:**
  ```
  outputs.costPlusOctNet   — net cost if on cost-plus plan (CHECK EXISTS)
  outputs.icSavingFull     — saving at 100% pass-through (CHECK/ADD)
  outputs.inputs.psp       — PSP name
  outputs.inputs.volume    — for contextual copy
  ```
- **Sync requirement:** Verify `costPlusOctNet` and `icSavingFull` exist.
  If `icSavingFull` is missing, it's the same as `icSaving` at 100% —
  either use `icSaving` directly or add a clarity field.

### `CostCompositionChart` (NEW component)
- **Risk:** 🔴 HIGH — most likely to require new calculation fields
- **Change:** New component requiring breakdown of cost components
- **Data source:**
  ```
  outputs.todayInterchange   — interchange component today (LIKELY MISSING)
  outputs.todayScheme        — scheme fees component (LIKELY MISSING)
  outputs.todayMargin        — PSP margin component (LIKELY MISSING)
  outputs.grossCOA           — total gross cost (LIKELY MISSING)
  outputs.icSaving           — interchange saving in October (LIKELY EXISTS)
  outputs.inputs.planType    — to show "Estimated" badge for flat rate
  outputs.inputs.psp         — PSP name for insight note
  outputs.annualMSF          — total flat rate bill (for flat rate plans)
  ```
- **If these fields don't exist — add to `lib/calculations.ts`:**
  ```typescript
  // Approximate breakdown for flat rate (estimated):
  todayInterchange: estimateInterchange(volume, txnCount, planType)
  todayScheme:      volume * SCHEME_RATE_ESTIMATE
  todayMargin:      estimatePSPMargin(volume, msf, planType)
  grossCOA:         todayInterchange + todayScheme + todayMargin

  // For cost-plus (exact):
  todayInterchange: (debitInterchange + creditInterchange)
  todayScheme:      (debitScheme + creditScheme)
  todayMargin:      msf - todayInterchange - todayScheme
  grossCOA:         msf
  ```
- **Sync requirement — STRICT ORDER:**
  1. Read `lib/calculations.ts` output type
  2. Add ALL missing fields to engine
  3. Commit: "calc: add cost breakdown fields for CostCompositionChart"
  4. THEN build the component

- **Scheme fees invariant:**
  Both "Today" and "October" bars must show IDENTICAL scheme fees.
  `const schemeFees = Math.round(outputs.todayScheme * 100) / 100`
  Both bars use this same value.

### `AssumptionsPanel` (update)
- **Risk:** 🟡 MEDIUM
- **Change:** Add formula display, update toggle label
- **Data source:** All calculation fields (existing — just displaying them)
- **Sync requirement:** None if only changing display format

### `ConsultingCTA` (update copy)
- **Risk:** 🟡 MEDIUM
- **Change:** Copy only — but must use PSP name from outputs
- **Data source:**
  ```
  outputs.inputs.psp      — PSP name for personalised copy
  outputs.category        — for category-specific messaging
  ```
- **Sync requirement:** None if fields exist

### `SkeletonLoader` (NEW)
- **Risk:** 🟢 SAFE
- **Change:** New UI-only component
- **Data source:** None — appears while data loads
- **Sync requirement:** None

### `EmailCapture`, `PSPRateRegistry`, `ResultsDisclaimer`
- **Risk:** 🟢 SAFE
- **Change:** None — these components are untouched in this revamp

---

## SECTION 4 — LIBRARY FILES

### `lib/calculations.ts`
- **Touch only to ADD fields** — never modify existing calculation logic
- **If adding fields:** add them at the end of the return object
- **Every addition needs a unit test**
- **Commit separately from component changes**

### `lib/categories.ts` (or wherever `buildActions` lives)
- **Touch to add `script` and `why` to action objects**
- **Copy for `why` is in `docs/design/ux-spec.md` Section 3.4**
- **PSP name must be passed as parameter — never hardcoded**

### `lib/constants.ts`
- **DO NOT TOUCH** — RBA rates are the regulatory source of truth

---

## SECTION 5 — NEW FIELDS SUMMARY

Fields that may need to be added to `lib/calculations.ts`.
Check each one before building components that depend on them.

| Field | Used By | Calculation |
|---|---|---|
| `todayInterchange` | CostCompositionChart | Sum of debit + credit interchange costs |
| `todayScheme` | CostCompositionChart | Sum of scheme fees |
| `todayMargin` | CostCompositionChart | Total MSF minus interchange and scheme |
| `grossCOA` | CostCompositionChart | Total gross cost of acceptance |
| `surchargeRevenue` | ProblemsBlock | volume × surchargeRate (if surcharging) |
| `action.script` | ActionList | Word-for-word call script per action |
| `action.why` | ActionList | Plain English explanation of stakes |

**Before building any component that uses a field marked above:**
Confirm the field exists in `lib/calculations.ts` return value.
If it doesn't: add it, commit, then build the component.

---

## SECTION 6 — CHANGE ORDER DEPENDENCY GRAPH

```
Phase 1 (tokens)     — no dependencies, can run first
    ↓
Phase 2 (homepage)   — depends on Phase 1 only (colour tokens)
    ↓
Phase 3 (disclaimer) — no data dependencies, can run after Phase 1
    ↓
Phase 4 (results)    — MUST follow this internal order:
    │
    ├── 4.0  Read lib/calculations.ts, identify missing fields
    ├── 4.0a Add missing fields to lib/calculations.ts   ← COMMIT HERE
    ├── 4.1  Restructure results page layout
    ├── 4.2  VerdictSection (adds daily anchor — derived only)
    ├── 4.3  ProblemsBlock (NEW — needs surchargeRevenue)
    ├── 4.4  ActionList (needs script + why from buildActions) ← COMMIT HERE
    ├── 4.5  DepthToggle (UI only — safe)
    ├── 4.6  PassThroughSlider (copy only — safe)
    ├── 4.7  EscapeScenarioCard (copy only — safe)
    ├── 4.8  CostCompositionChart (NEW — needs breakdown fields)
    ├── 4.9  AssumptionsPanel (copy only — safe)
    └── 4.10 ConsultingCTA (copy only — safe)
    ↓
Phase 5 (mobile)     — visual audit, no data changes
    ↓
Phase 6 (a11y)       — interactive states, no data changes
    ↓
Phase 7 (verify)     — final checks
```

---

## SECTION 7 — FIELDS TO NEVER TOUCH

These fields are used by existing tests and must not be renamed or removed:

- `outputs.category`          — Core category assignment (1-4)
- `outputs.plSwing`           — The headline P&L number
- `outputs.icSaving`          — The interchange saving
- `outputs.inputs.planType`   — 'flat' | 'costplus'
- `outputs.inputs.psp`        — Merchant's PSP name
- `outputs.inputs.volume`     — Annual card volume
- `outputs.inputs.surchargeRate` — Merchant's surcharge rate (if any)
- `outputs.actions`           — The action array (can add fields, not remove)

---

## SECTION 8 — RED FLAGS TO WATCH FOR

If you see any of these during the revamp, stop and resolve before continuing:

🚨 A component references `outputs.X` and TypeScript shows "Property X does
   not exist on type..." → Field missing from calculation engine. Add it first.

🚨 A test fails with "Expected X but received undefined" → A new field was
   referenced before being added to the mock/fixture in the test.

🚨 `pnpm build` shows "Type 'undefined' is not assignable to type 'string'"
   → A new optional field was not marked optional in the type definition.

🚨 The results page renders blank number on localhost → `outputs.plSwing`
   is not being passed to the component correctly.

🚨 PSP name shows "undefined" or "your PSP" on results page → The inputs
   are not being passed through to the component. Check the data flow.
