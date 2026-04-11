# nosurcharging.com.au — UX Revamp Initiative
## Master Claude Code Prompt

---

## WHAT THIS IS

A comprehensive UX revamp of nosurcharging.com.au to make it market-ready,
user-friendly, and visually consistent for the October 2026 RBA surcharge
reform launch window.

This prompt covers the complete initiative from planning through to
verification. Read it in full before writing a single line of code.

---

## MANDATORY READING — DO BEFORE ANYTHING ELSE

Read ALL of the following files in sequence. Confirm you have read each one.
Do not proceed until every file has been read.

### Existing project context
- `CLAUDE.md`                              — Project context, rules, tech stack
- `docs/domain/rba-reform.md`             — Reform facts and timelines
- `docs/domain/merchant-categories.md`    — Four-category framework
- `docs/domain/payments-glossary.md`      — Term definitions
- `docs/product/product-vision.md`        — What we are building and why
- `docs/product/phase-1-spec.md`          — Phase 1 assessment requirements
- `docs/content/tone-of-voice.md`         — Editorial voice
- `lib/calculations.ts`                   — Calculation engine (read the types)
- `lib/categories.ts`                     — Category assignment logic
- `lib/constants.ts`                      — RBA rates (source of truth)

### Design reference files (in docs/design/)
- `docs/design/system.md`                 — Design system tokens and patterns
- `docs/design/ux-spec.md`               — Page-by-page UX specification
- `docs/design/component-map.md`          — Component → data dependency map
- `docs/design/change-plan-template.md`   — Planning template (complete this first)

---

## PHASE 0 — MANDATORY PLANNING (DO NOT SKIP)

Before writing any code, complete the following planning phase in full.

### Step 0.1 — Read the codebase

Scan the entire project structure:
```
find . -name "*.tsx" -o -name "*.ts" -o -name "*.css" | grep -v node_modules | grep -v .next | sort
```

Read every component file under `app/` and `components/`. Understand what
each one renders and what data it consumes.

### Step 0.2 — Read the calculation engine

Read `lib/calculations.ts` in full. Identify:
- The input type (what fields the function accepts)
- The output/return type (what fields the function returns)
- Every field name exactly as it exists

### Step 0.3 — Produce the Change Plan

Using `docs/design/change-plan-template.md` as your template, produce
`docs/design/change-plan.md` — a complete impact analysis document.

This document must list:
1. Every file that will be touched
2. For each file: what changes (copy / layout / data / type)
3. For each data-touching change: what field is being added or modified
4. Whether that field already exists in `lib/calculations.ts` output
5. The exact order in which files must be changed to maintain sync
6. Any TypeScript interface changes required and their dependents

**DO NOT PROCEED TO PHASE 1 UNTIL `docs/design/change-plan.md` IS COMPLETE.**

Show the change plan and wait for confirmation before proceeding.

### Step 0.4 — Confirm scope boundaries

State explicitly which items are OUT OF SCOPE and will not be touched:
- All server actions and API routes
- The calculation engine logic in `lib/calculations.ts`
- The category assignment logic in `lib/categories.ts`
- RBA rate constants in `lib/constants.ts`
- Database schema and Supabase configuration
- Authentication and session logic
- All form field inputs, validation, and submission logic
- The assessment step flow navigation logic
- Test files (tests must not decrease in count)

---

## PHASE 1 — DESIGN TOKEN MIGRATION

### What changes
Migrate the accent colour from Amber (#B8840A) to Ledger/Emerald (#1A6B5A)
throughout the design system.

### Exactly what to do

**1.1 — Update tailwind.config.ts**

Rename the `amber` colour token to `accent` and set it to the new values:

```typescript
// tailwind.config.ts
accent: {
  DEFAULT:  '#1A6B5A',   // Was: #B8840A
  light:    '#EBF6F3',   // Was: #FEF3E0
  border:   '#72C4B0',   // Was: (new)
  dark:     '#0D4A3C',   // Was: (new)
},
```

Also update the canvas/background warm tone. The existing `paper` token is
good (#FAF7F2) — keep it. No change needed.

**1.2 — Update globals.css**

If any CSS custom properties reference amber hex values, update them.

**1.3 — Global class rename**

Run the following to find all Tailwind class references to update:
```
grep -r "amber" --include="*.tsx" --include="*.ts" --include="*.css" .
```

Replace all:
- `text-amber-*`    → `text-accent-*`
- `bg-amber-*`      → `bg-accent-*`
- `border-amber-*`  → `border-accent-*`
- `ring-amber-*`    → `ring-accent-*`

**1.4 — Verify**
```
grep -r "#B8840A\|#FEF3E0\|text-amber\|bg-amber\|border-amber" --include="*.tsx" --include="*.ts" --include="*.css" .
```
Must return zero results.

**1.5 — Build check**
```
pnpm build
```
Must succeed with zero TypeScript errors.

**1.6 — Commit**
```
git add -A && git commit -m "design: migrate amber → accent/ledger token system"
```

---

## PHASE 2 — HOMEPAGE REVAMP

### Reference
Read `docs/design/ux-spec.md` Section 1 (Homepage) before writing any code.

### Components to update

**2.1 — Navigation**

File: `app/page.tsx` or `components/layout/Nav.tsx` (wherever nav renders)

Changes:
- Single CTA: "Generate my free report →" replacing "Start assessment"
- No secondary nav links on homepage
- Logo: "no**surcharging**.com.au" with accent on "surcharging"

**2.2 — Proof bar (NEW component)**

File: Create `components/homepage/ProofBar.tsx`

Replace the scrolling marquee entirely. New component is a static horizontal
bar with three trust statements:
- "Independent — no Stripe or Square affiliation"
- "Based on RBA Conclusions Paper, March 2026"
- "Plain English — every term explained"

See `docs/design/ux-spec.md` Section 1.2 for full spec.

**Data dependency:** None. Purely static copy.

**2.3 — Hero section**

File: `components/homepage/HeroSection.tsx` (or equivalent)

Copy changes only:
- Headline: italic emphasis on "Your" not on "Free. In five minutes."
- Sub: "Find out exactly what October costs your business — in dollars,
  with Stripe named directly."
- CTA: "Generate my free report →"
- Proof row item 2: "No Stripe or Square affiliation" (removes "PSP" jargon)

Layout and component structure: unchanged.

**2.4 — Trust bar (NEW component)**

File: Create `components/homepage/TrustBar.tsx`

Insert between HeroSection and SituationsPreview. Contains:
- One merchant quote (see UX spec for copy)
- RBA document citation
- Free tool statement

See `docs/design/ux-spec.md` Section 1.4 for full spec.

**Data dependency:** None. Static copy.

**2.5 — Situations preview (replaces category tabs)**

File: `components/homepage/PreviewSection.tsx` (or equivalent)

Replace the four-tab category preview with a 2×2 card grid.
Each card shows:
- Situation label (1–4, no "Category" language)
- Plain English situation description
- Annual P&L impact number (hardcoded illustrative examples)
- One action hint

See `docs/design/ux-spec.md` Section 1.5 for exact copy.

**Data dependency:** Hardcoded illustrative values only. No live calculation.

**2.6 — How it works**

File: `components/homepage/FeaturesSection.tsx` (or equivalent)

Copy changes only — update each step hint to include "why we ask":
- Step 1: "We calculate your actual dollar impact — not a percentage, a number."
- Step 2: "This determines whether the cost saving reaches you automatically or needs a rate review."
- Step 3: "The ban is the biggest variable. If you surcharge, you need to act before October."
- Step 4: "For average transaction size, which affects the calculation."

**2.7 — Remove consulting strip from homepage**

Remove any consulting/booking CTA from the homepage entirely.
It belongs on the results page only (see Phase 4).

**2.8 — Bottom CTA**

Update CTA button copy to: "Generate my free report →"
Proof row: same three items as hero section.

**2.9 — Build and commit**
```
pnpm build && pnpm test
```
Tests must not decrease in count.
```
git add -A && git commit -m "feat: homepage revamp — proof bar, trust bar, situations grid"
```

---

## PHASE 3 — DISCLAIMER PAGE REVAMP

### Reference
Read `docs/design/ux-spec.md` Section 2 (Disclaimer) before writing any code.

### File: `app/assessment/page.tsx` or `components/assessment/DisclaimerConsent.tsx`

### CRITICAL: What NOT to change
- The checkbox element itself
- The consent recording logic
- Any server action calls
- The session creation logic
- The form submission flow

### What to change — copy and layout wrapper only

**3.1 — Replace legal wall with four commitments**

Current: single dense disclaimer paragraph
New structure:
```
Tag: "BEFORE WE START"
Headline: "A few things to know about this report"
Sub: "We want to be completely upfront about what this tool does — and doesn't do."

Four commitment items (in this order):
1. "This is an estimate, not a guarantee." + explanation
2. "We explain everything." + explanation     ← moved to #2
3. "We are independent." + explanation
4. "This is not financial advice." + explanation

Checkbox area: white background, grey border
               (NOT accent/emerald background)

Button: "Start my assessment →"
        Centred, natural content width
        NOT full-width on desktop
```

**3.2 — Verify existing functionality**

After changes:
- Checkbox must still check/uncheck
- Submit must still fire the server action
- Consent must still be recorded correctly
- Session must still be created

**3.3 — Build and commit**
```
pnpm build && pnpm test
```
```
git add -A && git commit -m "feat: disclaimer — four commitments, plain English framing"
```

---

## PHASE 4 — RESULTS PAGE REVAMP

### Reference
Read `docs/design/ux-spec.md` Section 3 (Results Page) before writing any code.

### CRITICAL: Backend/frontend sync requirements

This phase has the highest sync risk. Follow this order exactly.

**4.0 — Pre-build type audit**

Before touching any component, run:
```
cat lib/calculations.ts
```

Identify the exact return type. List every field currently returned.

Then cross-reference against `docs/design/component-map.md` Section 3
(New Fields Required). For each new field:
- Does it already exist? → Use it directly
- Does it not exist? → Add it to calculations.ts AND its type first

**Fields the new UI requires — check each one:**

| UI Element | Field Needed | Exists? | Action |
|---|---|---|---|
| Daily anchor ("$X/day") | `plSwing` | Likely yes | Derive: `Math.round(Math.abs(outputs.plSwing) / 365)` in component |
| CostCompositionChart | `todayInterchange` | Check | Add if missing |
| CostCompositionChart | `todayScheme` | Check | Add if missing |
| CostCompositionChart | `todayMargin` | Check | Add if missing |
| CostCompositionChart | `grossCOA` | Check | Add if missing |
| CostCompositionChart | `icSaving` | Likely yes | Verify |
| Action card "why" | action.why | No | Add to buildActions() |
| Escape scenario | `costPlusOctNet` | Likely yes | Verify |
| Escape scenario | `icSavingFull` | Check | Add if missing |

**4.0a — If any field is missing, add it to calculations.ts FIRST:**
```
git add lib/calculations.ts && git commit -m "calc: add [field] to calculation output"
```

Then update the TypeScript types. Then update the components.
Never the reverse order.

**4.1 — Restructure results page layout**

File: `app/results/page.tsx` (or equivalent)

New section order:
```
PRIMARY ZONE (always visible):
  1. VerdictSection (updated — see 4.2)
  2. MetricCards (unchanged layout, updated colours)
  3. ProblemsBlock (NEW — see 4.3)
  4. ActionList (moved UP — see 4.4)
  5. DepthToggle (NEW — see 4.5)

DEPTH ZONE (behind toggle):
  6. PassThroughSlider (updated copy — see 4.6)
  7. EscapeScenarioCard (updated copy — see 4.7)
  8. CostCompositionChart (NEW — see 4.8)
  9. AssumptionsPanel (collapsible — see 4.9)

ALWAYS VISIBLE:
  10. ConsultingCTA (updated copy — see 4.10)
  11. EmailCapture (unchanged)
  12. PSPRateRegistry (unchanged)
  13. ResultsDisclaimer (unchanged)
```

**4.2 — VerdictSection updates**

File: `components/results/VerdictSection.tsx` (or equivalent)

Changes:
- Category pill: "SITUATION [N]" not "Category [N]"
  Remove "of 4" suffix
- Hero number: increase to 60px font-size (from current)
- Add daily anchor below number:
  ```tsx
  const dailyCost = Math.round(Math.abs(outputs.plSwing) / 365)
  // "{dailyCost > 0 ? 'That's $X more per day' : ...}"
  ```
- Context line: show volume, PSP name, plan type, surcharge rate from inputs

**Data dependencies preserved:**
- `outputs.category` → unchanged
- `outputs.plSwing` → unchanged, derive dailyCost from it
- `outputs.inputs.psp` → unchanged
- `outputs.inputs.volume` → unchanged

**4.3 — ProblemsBlock (NEW component)**

File: Create `components/results/ProblemsBlock.tsx`

Two problem blocks:
```
Block 1 (red background):
  Label: "CERTAIN"
  Title: "Your surcharge revenue disappears"
  Body: uses outputs.inputs.surchargeRate and surchargeRevenue

Block 2 (amber background):
  Label: "DEPENDS ON YOUR PLAN"
  Title: "A processing cost reduction may or may not flow through"
  Body: uses outputs.icSaving and outputs.inputs.planType
        and outputs.inputs.psp
```

**Data dependencies:**
- `outputs.inputs.surchargeRate` → must verify field name in calculations.ts
- `outputs.icSaving` → verify exists
- `outputs.inputs.planType` → must be 'flat' | 'costplus'
- `outputs.inputs.psp` → merchant's PSP name

**4.4 — ActionList restructure**

File: `components/results/ActionList.tsx` (or equivalent)

Each action now renders three parts:
```tsx
<div className="action-card">
  <div className="header">
    <TierChip tier={action.tier} />
    <DateLabel date={action.date} />
  </div>
  <div className="what">{action.instruction}</div>
  <div className="script">{action.script}</div>  {/* ITALIC, QUOTED */}
  <div className="why">{action.why}</div>         {/* NEW FIELD */}
</div>
```

**SYNC REQUIREMENT:**
The `why` field on each action comes from `buildActions()` in
`lib/categories.ts` or wherever actions are built. Add it there FIRST.

```typescript
// Add 'why' to the Action type:
interface Action {
  tier: 'urgent' | 'plan' | 'monitor'
  date: string
  instruction: string
  script: string
  why: string        // ← NEW
}
```

Then update `buildActions()` to return the `why` for each action.
Then update `ActionList.tsx` to render it.
In that order.

See `docs/design/ux-spec.md` Section 3.4 for all action copy including 'why'.

**4.5 — DepthToggle (NEW component)**

File: Create `components/results/DepthToggle.tsx`

A toggle button that shows/hides the depth zone:
- Collapsed state: "↓ Understand your numbers"
- Expanded state: "↑ Hide the numbers"
- Depth zone content: PassThroughSlider + EscapeScenarioCard +
  CostCompositionChart + AssumptionsPanel

**4.6 — PassThroughSlider copy update**

File: `components/results/PassThroughSlider.tsx` (or equivalent)

Copy changes only — slider logic and outputs.icSaving unchanged:
- Left label: "Not reflected in your rate (0%)"  [was: "Stripe keeps all of it"]
- Right label: "Fully reflected (100%)"
- Intro: "The key variable is how much of the $X processing cost reduction
         is reflected in your [PSP] rate after October."
- Result row: "Cost reduction reflected in your [PSP] rate"

Replace all instances of "your PSP" / "your provider" with
`outputs.inputs.psp` (the merchant's actual PSP name).

**4.7 — EscapeScenarioCard copy update**

File: `components/results/EscapeScenarioCard.tsx` (or equivalent)

Copy changes:
- Remove "no negotiation needed" language
- Add: "[PSP] also offers an itemised plan where interchange and scheme
  fees are shown separately."
- Note: "Ask [PSP] for a quote on their interchange-plus pricing."

Replace all instances of "your PSP" with `outputs.inputs.psp`.

**4.8 — CostCompositionChart (NEW component)**

File: Create `components/results/CostCompositionChart.tsx`

**This is the highest sync risk in the entire revamp.**

Before building:
1. Confirm `outputs.todayInterchange`, `outputs.todayScheme`,
   `outputs.todayMargin`, `outputs.grossCOA`, `outputs.icSaving`
   all exist in the calculation return type
2. If any are missing, add them to `lib/calculations.ts` FIRST

Chart spec:
```
Library: Recharts (already installed)
Type: BarChart, layout="vertical" (horizontal stacked bars)
Two bars: "Today" and "October"
Four segments:
  Interchange: #BF3535 (changes in October)
  Scheme fees: #C8C4BC (unchanged)
  PSP margin:  #9a9a94 (unchanged)
  Other:       #E5E3DC (flat rate only — derive from total - known parts)

For flat rate plans (Category 2, 4):
  - Show "Estimated breakdown" badge
  - other = annualMSF - todayInterchange - todayScheme - todayMargin

For cost-plus plans (Category 1, 3):
  - No "Estimated" badge
  - other = 0

Insight note (dynamic text):
  "Interchange is [X]% of your [PSP] bill.
   The RBA reform only cuts interchange.
   Scheme fees and [PSP]'s margin are unchanged."

  X = Math.round(todayInterchange / grossCOA * 100)

Placement: Inside depth zone (behind DepthToggle)
```

**Scheme fees invariant:**
Both "Today" and "October" bars must show IDENTICAL scheme fees values.
Use: `const scheme = Math.round(outputs.todayScheme * 100) / 100`

**4.9 — AssumptionsPanel**

File: `components/results/AssumptionsPanel.tsx` (or equivalent)

Changes:
- Already collapsed by default (confirm this — if not, make it so)
- Toggle label: "↓ Show me exactly how this is calculated"
- Every row must show its formula: "label = formula = value"
  Example: "What you pay [PSP] today = $3,000,000 × 1.4% = $42,000"
- Add scheme fees inline note explaining they're unregulated
- Calculation should update when PassThroughSlider changes

**4.10 — ConsultingCTA**

File: `components/results/ConsultingCTA.tsx` (or equivalent)

Copy changes only:
- Headline: "Walk into October knowing exactly what to say to [PSP],
             what to charge customers, and whether your rate is fair."
  (replace `[PSP]` with `outputs.inputs.psp`)
- Sub: "Reform Ready · one engagement · fixed price · April–September 2026"
- Remove: consulting CTA from homepage (already done in Phase 2)

**4.11 — Skeleton loading state**

File: Create `components/results/SkeletonLoader.tsx`

A loading state that appears while the results are fetching. Reflects
the actual section structure:
- Category pill placeholder
- Hero number placeholder (large)
- Two problem block placeholders
- Three action card placeholders

Use CSS animation: opacity pulse 0.35 → 0.65, 1.5s ease-in-out infinite.

**4.12 — Build and test**
```
pnpm build
```
Zero TypeScript errors. If there are errors, they mean a field was
referenced in a component before being added to the calculation engine.
Fix by updating `lib/calculations.ts` first.

```
pnpm test
```
Test count must not decrease.

**4.13 — Commit**
```
git add -A && git commit -m "feat: results page — progressive disclosure, plain English, CostCompositionChart"
```

---

## PHASE 5 — MOBILE AUDIT

### Why this phase exists
The majority of target merchants will visit on iPhone.
Every component must work at 375px before desktop optimisation.

### 5.1 — Components to audit for mobile

Test each at 375px viewport width:
- [ ] Homepage hero — headline font-size readable, CTA accessible
- [ ] Proof bar — items stack or scroll gracefully
- [ ] Trust bar — quote stacks vertically
- [ ] Situations grid — 2 columns at 375px (no horizontal overflow)
- [ ] Results hero number — 48px on mobile (not 60px — reduce on sm:)
- [ ] ProblemsBlock — full width, readable
- [ ] ActionList — script text readable, action cards don't overflow
- [ ] CostCompositionChart — chart horizontal, readable on small screen
- [ ] ConsultingCTA — stacks vertically on mobile
- [ ] Disclaimer — button natural width on desktop, full-width on mobile

### 5.2 — Fix breakpoints

For each component that fails at 375px:
- Use Tailwind responsive prefixes (`sm:`, `md:`)
- Default (no prefix) = mobile-first
- Never use `xs:` — stick to sm/md/lg

### 5.3 — Commit
```
git add -A && git commit -m "fix: mobile breakpoints for all revamp components"
```

---

## PHASE 6 — ACCESSIBILITY + STATES

### 6.1 — Interactive states

Every interactive element must have:
- `hover:` state (border intensity increase, or opacity)
- `focus:` state (3px ring in accent colour, 2px offset)
- `active:` state (opacity: 0.92 or scale: 0.98)
- `disabled:` state (opacity: 0.4, cursor-not-allowed)

### 6.2 — Colour contrast

Run WCAG AA check on:
- Body text (#1A1409) on paper (#FAF7F2) — must pass
- Accent (#1A6B5A) on white — must pass for large text
- White on accent (#1A6B5A) — must pass for button text

### 6.3 — Aria labels

- CTA buttons must have descriptive aria-label if icon-only
- DepthToggle: aria-expanded on button
- Form inputs: all have associated labels (existing — verify not broken)

### 6.4 — Commit
```
git add -A && git commit -m "fix: accessibility states and WCAG contrast"
```

---

## PHASE 7 — FINAL VERIFICATION

Run the complete verification checklist:

### Token check
```bash
grep -r "#B8840A\|#FEF3E0\|text-amber\|bg-amber\|border-amber" \
  --include="*.tsx" --include="*.ts" --include="*.css" .
```
→ Must return zero results

### Jargon check
```bash
grep -rn "your PSP\|your provider\|P&L swing\|Category 1\|Category 2\|Category 3\|Category 4" \
  --include="*.tsx" .
```
→ Must return zero results (except in comments and domain docs)

### Type safety
```bash
pnpm build
```
→ Zero TypeScript errors

### Tests
```bash
pnpm test
```
→ Count must equal or exceed pre-revamp count

### Visual checklist (manual, localhost:3000)
- [ ] Homepage loads: proof bar visible, hero CTA visible (not invisible)
- [ ] Marquee is gone — replaced by static proof bar
- [ ] "Your" in hero headline is italic in accent colour
- [ ] Disclaimer: four commitment items visible, checkbox neutral background
- [ ] Start assessment: assessment flow works end-to-end
- [ ] Results page: big number visible, daily anchor visible
- [ ] Results page: two problem blocks (CERTAIN / DEPENDS)
- [ ] Results page: action plan visible WITHOUT opening depth toggle
- [ ] Depth toggle: opens to reveal slider, escape, chart, calculation
- [ ] CostCompositionChart: renders for all four categories
- [ ] "Understand your numbers" depth toggle works on mobile
- [ ] ConsultingCTA: outcome-led copy, PSP name from inputs

### Final commit
```
git add -A && git commit -m "UX revamp complete — nosurcharging.com.au market-ready"
```

---

## SYNC RULES — READ AND FOLLOW

These rules prevent backend/frontend drift. Treat them as hard requirements.

**Rule 1: Types first, components second.**
Never reference a field in a component before that field is defined
in the TypeScript type AND returned by the calculation function.
Order: `lib/calculations.ts` → type definition → component.

**Rule 2: One concern per commit.**
Type changes commit separately from component changes.
This makes any sync error immediately visible in the diff.

**Rule 3: Build after every phase.**
`pnpm build` after every phase, not just at the end.
A TypeScript error at build time is the signal that frontend and
backend are out of sync.

**Rule 4: Copy-only changes never need type changes.**
If a change is purely copy or styling (no new data fields rendered),
it cannot cause a sync issue. Confirm this before each change.

**Rule 5: PSP name always from inputs.**
Never hardcode "Stripe" in component copy.
Always use `outputs.inputs.psp` or equivalent.
The merchant may be on Square, Tyro, CommBank, or any other provider.

**Rule 6: Daily anchor is derived, not stored.**
`Math.round(Math.abs(outputs.plSwing) / 365)` in the component.
Do not add a `dailySwing` field to the calculation engine.

**Rule 7: Illustrative values on homepage are hardcoded.**
The situations grid on the homepage uses hardcoded example values.
These do NOT come from the calculation engine.
They must be clearly labelled as illustrative.

---

## IF YOU GET STUCK

If a TypeScript error appears that you cannot resolve:
1. Stop immediately
2. Read the error message precisely — it tells you which field is missing
3. Trace back to `lib/calculations.ts` and check the return type
4. Add the missing field to the calculation before continuing

If a component renders blank or undefined values:
1. Check `docs/design/component-map.md` — verify the field name
2. Add a console.log of `outputs` in the component to see actual fields
3. Update the field reference to match the actual output

If tests fail:
1. Read the test output carefully
2. If tests fail due to copy changes (text content changed), update test expectations
3. If tests fail due to logic changes, stop — logic must not change in this revamp

---

## WHAT SUCCESS LOOKS LIKE

A merchant in Newtown who Googles "RBA surcharge ban" arrives at the page:
- Sees a clean header with a clear button they can immediately see and click
- Reads a headline that says "YOUR payments report" — feels personal
- Sees three independent trust signals (no Stripe affiliation, RBA data, plain English)
- Completes four questions in under five minutes
- Arrives at a results page showing their number ($X more per day)
- Understands immediately what is certain (surcharge ban) vs uncertain (depends on plan)
- Can act immediately — the action plan is the first thing they see after the number
- Can hand the results page to their accountant

That experience is the definition of done.
