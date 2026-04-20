# RESULTS_OVERHAUL_BUILD_PLAN.md
## nosurcharging.com.au — Results Page Complete Overhaul
## Iterative implementation plan for Claude Code
## Produced: April 2026

---

## MANDATORY READING BEFORE ANY CODE IS WRITTEN

Read these files in this exact order. Do not skip any.

```
CLAUDE.md                                          ← project rules, wins over everything
docs/product/prd.md                                ← product intent
docs/design/revamp-ux-spec.md                      ← UX spec
apps/web/app/results/page.tsx                      ← current orchestrator (full read)
apps/web/tailwind.config.ts                        ← design token definitions
apps/web/app/globals.css                           ← CSS variables
packages/calculations/types.ts                     ← all types
packages/calculations/categories.ts               ← category logic
packages/calculations/actions.ts                  ← action building
apps/web/actions/contributeRate.ts                 ← existing registry action
apps/web/actions/getAssessment.ts                  ← data loading
docs/architecture/database-schema.sql              ← DB schema
```

---

## CODEBASE STATE — WHAT EXISTS RIGHT NOW

This section documents the actual current state from a live codebase audit.
Do not assume anything not listed here exists.

### Results page architecture

The current `app/results/page.tsx` is a **single-column, full-width, scrolling page**.
There is NO sidebar. There is NO two-column layout. There is NO shell directory.

Current component tree (exactly as imported in page.tsx):
```
ResultsPage (Suspense boundary)
  └── ResultsContent (client component, manages all state)
        ├── VerdictSection          ← verdict, hero P&L, body paragraph
        ├── MetricCards             ← 4-cell grid: IC saving, P&L, surcharge rev, cost today
        ├── ProblemsBlock           ← CERTAIN/DEPENDS problem cards
        ├── ActionList              ← urgency-tiered action items with scripts
        └── DepthToggle (collapsed by default)
              ├── PassThroughSlider ← flat-rate slider (Cat 2/4 only)
              ├── EscapeScenarioCard ← cost-plus pivot (Cat 2/4 only)
              ├── CostCompositionChart ← bar chart today vs October
              └── AssumptionsPanel  ← resolution trace display
        ├── ConsultingCTA           ← dark ink CTA block
        ├── EmailCapture            ← email signup for Oct 30 notification
        ├── PSPRateRegistry         ← existing minimal 3-field form
        └── ResultsDisclaimer       ← legal disclaimer

Layout: mx-auto max-w-results px-5 pb-12 (600px max-width, centred)
```

### State managed in ResultsContent

```typescript
assessment: StoredAssessment | null
outputs: AssessmentOutputs | null
actions: ActionItem[]            // seeded once, NOT recalculated on slider
passThrough: number (0-1)
loading: boolean
```

**Critical invariant**: `actions` is intentionally separate from `outputs`.
Slider changes recalculate `outputs` via `calculateMetrics()` but never
touch `actions`. This prevents the ActionList from collapsing on slider interaction.
**Do not break this invariant.**

### Type system

`AssessmentOutputs` has `category: 1 | 2 | 3 | 4` — integer, not string enum.
The taxonomy migration to `MerchantPosition` string enum is PENDING (see SITUATION_TAXONOMY_IMPACT.md).
**Do not migrate the type system in this overhaul** — that is a separate sprint.
All new components must accept `category: 1 | 2 | 3 | 4`.

### Database

`psp_rate_registry` table exists with: `assessment_id`, `psp_name`, `plan_type`,
`country_code`, `volume_band`, `effective_rate_pct`, `debit_cents`, `credit_pct`,
`trust_score`, `quarantined`.

`contributeRate` server action exists and works. It rate-limits to 1 per assessment_id.

**Missing columns needed for the enhanced registry section:**
- `industry` text — for industry-specific benchmarking
- `state_code` text — for geo benchmarking

These require a migration. See Sprint 5.

### Tests

38 test files total. Relevant to results:
- `apps/web/__tests__/components/ResultsPage.test.tsx` — 187 lines
- `apps/web/__tests__/components/VerdictSection.test.tsx` — 141 lines
- `apps/web/__tests__/components/ActionList.test.tsx` — 114 lines
- `apps/web/__tests__/actions/contributeRate.test.ts` — exists

**Every new component must have a companion test file written before the
component is considered done.** Tests must pass before moving to the next sprint.

### Design tokens (from tailwind.config.ts)

Key tokens that new components must use:
```
accent.DEFAULT    #1A6B5A    ← primary brand emerald
accent.light      #EBF6F3    ← emerald tint backgrounds
accent.border     #72C4B0    ← emerald borders
paper.DEFAULT     #FAF7F2    ← page background
paper.secondary   #F3EDE4    ← secondary surfaces
rule              #DDD5C8    ← dividers and borders
ink.DEFAULT       #1A1409    ← primary text
ink.muted         #6B5E4A    ← secondary text
ink.faint         #9A8C78    ← tertiary text
negative.DEFAULT  #7F1D1D    ← red text (danger)
negative.bg       #FDECEA    ← red background
font-mono                    ← all numbers

CSS variables:
--color-text-primary     #111111
--color-text-secondary   #374151   ← was #6b7280, updated to pass WCAG
--color-text-tertiary    #6B7280
--color-background-danger  #FCEBEB
--color-text-danger        #791F1F
--color-background-warning #FAEEDA
--color-text-warning       #633806
```

---

## THE OVERHAUL — WHAT NEEDS TO BE BUILT

The overhaul transforms the results page from a **single-column report** into a
**two-column dashboard with a sticky sidebar, tabbed navigation, and six new sections**.

### Target architecture

```
ResultsPage
  └── ResultsShell (new — two-column sticky layout)
        ├── ResultsTopBar (new — sticky 44px)
        ├── ResultsSidebar (new — 186px, Option B expressive)
        └── ResultsContent (refactored from current page.tsx)
              sections:
              ├── #overview         (existing + 3 new sub-tabs)
              ├── #actions          (existing + 2 new sub-tabs)
              ├── #customers        (NEW — communication toolkit)
              ├── #negotiate        (NEW — negotiation brief)
              ├── #checklist        (NEW — readiness checklist)
              ├── #values           (existing, minor refactor)
              ├── #refine           (existing, minor refactor)
              ├── #registry         (existing component, ELEVATED to its own section)
              └── #help             (existing ConsultingCTA + EmailCapture)
```

---

## SPRINTS — ITERATIVE DELIVERY

Each sprint has: a codebase audit step, implementation steps, test requirements,
and a self-audit gate. Nothing moves to the next sprint until the gate is passed.

---

### SPRINT 1 — Shell and Sidebar
**Scope**: Two-column layout shell + sticky top bar + Option B sidebar
**New files**: 4
**Modified files**: 1 (page.tsx)
**Risk**: Medium — changes the page layout fundamentally
**Reversible**: Yes — the shell wraps the existing content, does not modify it

---

#### Step 1.1 — Codebase audit (READ BEFORE WRITING)

Read these files completely:
```
apps/web/app/results/page.tsx           ← current layout class: "mx-auto max-w-results px-5 pb-12"
apps/web/tailwind.config.ts             ← confirm max-w-results = 600px, max-w-4xl = 896px
apps/web/app/globals.css                ← confirm no existing sidebar CSS
```

Answer these questions before writing any code:
- What is the current layout class on the `<main>` element? (should be `min-h-screen bg-paper`)
- Does any shell directory exist? (answer: no — `/components/results/shell/` does not exist)
- What is the current `<main>` children wrapper class? (should be `mx-auto max-w-results px-5 pb-12`)
- Is there any existing sticky positioning on the results page? (answer: no)

If any answer differs from expected, STOP and report before proceeding.

---

#### Step 1.2 — Create shell directory and ResultsTopBar

**New file**: `apps/web/components/results/shell/ResultsTopBar.tsx`

```typescript
// ResultsTopBar — sticky 44px top bar
// Props: category, pnl, pspName, assessmentId, accuracy
// Displays: brand | position pill | P&L mono 18px/500 | accuracy bar | "Result looks off?" link
//
// DESIGN RULES:
// - position pill uses SITUATION_PILLS from VerdictSection (do NOT duplicate the colour map)
// - P&L: font-mono 18px weight-500, red for negative, green for positive
// - "Result looks off?" is a link, not a button — href="#overview" (scrolls to feedback)
// - Background: paper-white (not paper — paper-white is closer to white)
// - Border-bottom: 1px rule
// - z-index: 50 (above content, below modals)
//
// DO NOT: add navigation items here — that belongs in ResultsSidebar
// DO NOT: duplicate the position pill colour logic — import from shared constants
```

Prop types:
```typescript
interface ResultsTopBarProps {
  category: 1 | 2 | 3 | 4;
  plSwing: number;       // from outputs.plSwing
  pspName: string;
  accuracy: number;      // 0-100 (confidence as %)
  assessmentId: string;
}
```

**Test file**: `apps/web/__tests__/components/shell/ResultsTopBar.test.tsx`
- Renders with positive plSwing — green colour class applied
- Renders with negative plSwing — red colour class applied
- "Result looks off?" link present with correct href
- Accuracy bar width proportional to accuracy prop

---

#### Step 1.3 — Create ResultsSidebar (Option B Expressive)

**New file**: `apps/web/components/results/shell/ResultsSidebar.tsx`

```typescript
// ResultsSidebar — 186px sticky sidebar, Option B expressive
//
// Option B features (from design session):
// 1. Position card at top: situation label + P&L + days-to-deadline
// 2. Colour-coded nav rows: emerald=active, red=urgent, amber=attention, default=neutral
// 3. Sub-labels under each nav item
// 4. PREPARE group: Talk to customers, Negotiation brief, Readiness checklist (all NEW badge)
// 5. Get help = full emerald CTA button (not a text link)
//
// SIDEBAR GROUP STRUCTURE (from IA session):
//   RESULT:     Overview, Actions
//   PREPARE:    Talk to customers, Negotiation brief, Readiness checklist
//   GO DEEPER:  Values & rates, Refine estimate
//   COMMUNITY:  PSP Rate Registry
//   ← Get help CTA (no group label — standalone button at bottom)
//
// ACTIVE STATE:
// - border-left: 2px solid accent.DEFAULT (#1A6B5A)
// - background: accent.light (#EBF6F3)
// - text: accent.DEFAULT colour
// - NO fill/tint on inactive items
//
// URGENCY CODING (Cat 3 and Cat 4 only):
// - Actions row: border-left accent.DEFAULT → red (negative.DEFAULT)
//               background: negative.bg (#FDECEA)
//               sub-label shows "N urgent — act before Oct"
// - Refine row:  border-left amber (color-text-warning)
//               background: color-background-warning
//               sub-label shows "Accuracy N% — improve this"
//
// POSITION CARD:
// - Cat 1/2 (no surcharge): emerald background (accent.light)
// - Cat 3/4 (surcharging): danger background (negative.bg)
// - Always shows: situation plain-English label + P&L + days countdown
//
// PLAIN-ENGLISH SITUATION LABELS (do NOT use "Situation N"):
//   Cat 1: "Your saving arrives automatically"
//   Cat 2: "Your PSP holds the key"
//   Cat 3: "Repricing required before October"
//   Cat 4: "Two problems, one deadline"
//
// NAVIGATION:
// - Each item is a button with onClick handler
// - onClick scrolls to the section anchor: document.getElementById(sectionId).scrollIntoView()
// - Active state determined by scroll position (IntersectionObserver)
// - Pass activeSection prop down from ResultsShell
```

Prop types:
```typescript
interface ResultsSidebarProps {
  category: 1 | 2 | 3 | 4;
  plSwing: number;
  urgentActionCount: number;
  accuracy: number;
  activeSection: string;
  onSectionClick: (sectionId: string) => void;
}
```

**⚠️ PUSHBACK TRIGGER**: If implementing IntersectionObserver causes complex state
management, simplify to click-only active state for Sprint 1. Scroll-tracking active
state can be Sprint 2.

**Test file**: `apps/web/__tests__/components/shell/ResultsSidebar.test.tsx`
- Renders position card with correct Cat 4 label ("Two problems, one deadline")
- Renders position card with correct Cat 1 label ("Your saving arrives automatically")
- Actions row has red urgency styling when urgentActionCount > 0
- Active section button has emerald border-left
- All 8 nav items render (Overview, Actions, Talk to customers, Negotiation brief,
  Readiness checklist, Values & rates, Refine estimate, PSP Rate Registry)
- Get help CTA renders as button (not text link)

---

#### Step 1.4 — Create ResultsShell (layout wrapper)

**New file**: `apps/web/components/results/shell/ResultsShell.tsx`

```typescript
// ResultsShell — two-column sticky layout
//
// Layout:
//   <div className="min-h-screen bg-paper flex flex-col">
//     <ResultsTopBar sticky top-0 z-50 />
//     <div className="flex flex-1 min-h-0">
//       <ResultsSidebar sticky top-[44px] h-[calc(100vh-44px)] overflow-y-auto />
//       <main className="flex-1 min-w-0 max-w-4xl px-8 pb-20">
//         {children}
//       </main>
//     </div>
//   </div>
//
// KEY LAYOUT DECISIONS (from design audit):
// - max-w-4xl (896px) — not max-w-results (600px) which caused blank space bug
// - NO mx-auto on main — left-anchored to sidebar edge (Linear/Vercel pattern)
// - px-8 (32px) — breathing room between sidebar border and content
// - Sidebar: width 186px, border-right: 1px rule
// - Top bar: height 44px, position sticky, z-50
//
// MOBILE:
// - Sidebar hidden on mobile (hidden md:flex)
// - Mobile nav (MobileMiniNav) appears below top bar
// - Mobile bottom bar (MobileBottomBar) fixed at bottom
// - These components exist from previous sprints — DO NOT rebuild them
//
// SCROLL TRACKING:
// - Uses IntersectionObserver to track which section is in view
// - Passes activeSection to ResultsSidebar
// - Observer threshold: 0.3 (section is "active" when 30% visible)
```

---

#### Step 1.5 — Refactor page.tsx to use ResultsShell

**Modified file**: `apps/web/app/results/page.tsx`

Changes:
1. Import `ResultsShell` 
2. Replace the `<main className="min-h-screen bg-paper">` wrapper with `<ResultsShell>`
3. Pass required props (category, plSwing, urgentActionCount, accuracy) down
4. Add `id` attributes to each section div: `id="overview"`, `id="actions"`, etc.
5. Remove the `mx-auto max-w-results px-5 pb-12` wrapper div — layout now in ResultsShell

**Do NOT change**: any component imports, any component props, any data loading logic,
any state management. Only the layout changes.

---

#### Sprint 1 Self-Audit Gate

Run before declaring Sprint 1 complete:
```
□ npm run build passes with no TypeScript errors
□ All existing tests pass (npm run test)
□ New test files pass (ResultsTopBar, ResultsSidebar)
□ Staging URL renders with two-column layout at 1440px viewport
□ Mobile (390px): sidebar is hidden, content fills full width
□ Active section tracking works (click sidebar item → section scrolls into view)
□ Position card shows correct label for Cat 1, 2, 3, 4
□ Actions row shows red urgency styling for Cat 3 and Cat 4
□ hero P&L in top bar: 18px mono weight-500
□ max-w-results token UNCHANGED in tailwind.config.ts (still 600px)
□ Assessment wizard (/assessment) is completely unaffected
□ No console errors in browser DevTools
```

---

### SPRINT 2 — Overview Section Sub-Tabs
**Scope**: Add 3 sub-tabs inside the existing Overview section
**Sub-tabs**: Summary (existing content) | Where I stand today | What's changing | Reform timeline
**New files**: 4 sub-tab content components
**Modified files**: 1 (VerdictSection area of page.tsx)
**Risk**: Low — additive only, existing content unchanged in Summary tab
**Dependency**: Sprint 1 complete

---

#### Step 2.1 — Codebase audit

Read before writing:
```
apps/web/components/results/VerdictSection.tsx         ← full read
apps/web/components/results/MetricCards.tsx            ← full read
apps/web/components/results/ProblemsBlock.tsx          ← full read
apps/web/app/results/page.tsx                          ← understand current overview section
packages/calculations/types.ts                         ← AssessmentOutputs fields
```

Answer before coding:
- What fields does VerdictSection receive? (list all props)
- What does MetricCards receive? (list all props)
- Does ProblemsBlock receive surchargeRevenue directly or derive it? (direct from outputs)
- What is the actual rendered height of the Overview section currently? (check staging)

---

#### Step 2.2 — Create sub-tab shell component

**New file**: `apps/web/components/results/sections/OverviewSection.tsx`

Wraps the existing overview content in a sub-tab UI:
```typescript
// OverviewSection — overview with 4 sub-tabs
// Tabs: Summary | Where I stand today | What's changing | Reform timeline
//
// Tab state: managed locally with useState (not URL-based in Phase 1)
// Default tab: 'summary'
//
// SUB-TAB DESIGN:
// - Tab strip: flex row, border 0.5px rule, border-radius: rounded-lg
// - Active tab: bg-accent text-white
// - Inactive tab: bg-paper-secondary text-ink-muted
// - Tab min-width: fit-content with px-4 py-2
// - Font: text-caption (12px)
//
// EXISTING CONTENT (Summary tab):
// - Do NOT move or refactor VerdictSection, MetricCards, ProblemsBlock
// - They render exactly as they do now in the Summary tab
// - The sub-tab is additive — existing layout is preserved in Summary
```

---

#### Step 2.3 — Create WhereIStandToday sub-tab

**New file**: `apps/web/components/results/sections/WhereIStandToday.tsx`

Content (from design session):
```typescript
// WhereIStandToday — horizontal bar chart of cost components
//
// VISUAL:
// 1. Section header: "What you pay [PSP] each year"
// 2. Horizontal bar chart (NO external charting library — pure CSS bars)
//    Rows:
//    - Wholesale card cost: todayInterchange (from outputs)
//    - Scheme fees: todayScheme (from outputs)
//    - PSP margin: todayMargin (from outputs)
//    Each row: label (width 140px) | bar (flex-1) | value (width 80px mono)
//    Bar colours: ink-secondary, ink-muted, ink-faint
// 3. Total divider + annual total
// 4. (Cat 3/4 only) Surcharge recovery card: emerald tinted
//    Shows surchargeRevenue with "currently recover via surcharge" label
// 5. (Cat 3/4 only) Net position: "You're currently net positive/negative"
//
// CALCULATION NOTE:
// All values come from AssessmentOutputs — no new calculations.
// todayInterchange = outputs.todayInterchange (debit + credit IC)
// todayScheme = outputs.todayScheme
// todayMargin = outputs.todayMargin (pspMargin from calculation engine)
// grossCOA = outputs.grossCOA (total cost of acceptance)
// surchargeRevenue = outputs.surchargeRevenue
//
// ⚠️ PUSHBACK TRIGGER: If todayMargin or todayInterchange are not currently
// in AssessmentOutputs, check the type definition before assuming they exist.
// The type shows: todayInterchange, todayMargin ARE in AssessmentOutputs.
// grossCOA is also available. Use these — do not add new calculations.
```

Props:
```typescript
interface WhereIStandTodayProps {
  outputs: AssessmentOutputs;
  pspName: string;
  volume: number;
  planType: 'flat' | 'costplus';
  surcharging: boolean;
}
```

---

#### Step 2.4 — Create WhatsChanging sub-tab

**New file**: `apps/web/components/results/sections/WhatsChanging.tsx`

Content:
```typescript
// WhatsChanging — two-card layout showing CERTAIN and DEPENDS changes
//
// VISUAL:
// 1. Two-column card grid (flex on desktop, stack on mobile)
//    Card 1: CERTAIN (red, border-left 3px negative.DEFAULT)
//      - Title: "Surcharging on Visa, Mastercard and eftpos becomes illegal"
//      - Body: "From 1 October, adding a surcharge is banned — regardless of your plan."
//      - Impact number: (Cat 3/4 only) outputs.surchargeRevenue formatted as loss
//      - (Cat 1/2) Shows "Not applicable — you don't currently surcharge"
//    Card 2: DEPENDS (amber, border-left 3px color-text-warning)
//      - Title: "Wholesale card costs are being cut — but may not reach you"
//      - Body: category-specific (Cat 1: "you'll receive automatically", Cat 2/4: "depends on [PSP]")
//      - Impact: outputs.icSaving formatted
// 2. "What's NOT changing" strip: Amex, BNPL, PayPal surcharges unchanged
//
// CATEGORY-SPECIFIC COPY:
// This component needs category-aware copy. Write a getCopy(category) helper
// that returns the body text for each card per category. Do NOT inline ternaries.
```

---

#### Step 2.5 — Create ReformTimeline sub-tab

**New file**: `apps/web/components/results/sections/ReformTimeline.tsx`

Content:
```typescript
// ReformTimeline — vertical timeline with 5 dates
//
// DATES (hardcoded regulatory constants — do NOT fetch from DB):
//   Now:               "Assess your position"
//   1 October 2026:    "Surcharge ban + new interchange rates" ← KEY DATE, red dot
//   30 October 2026:   "PSPs must publish average MSF"
//   30 January 2027:   "RBA pass-through report published"
//   1 April 2027:      "Foreign card cap takes effect"
//
// VISUAL:
// - Vertical line: 1.5px rule colour, position absolute left-[7px]
// - Dot colours: emerald (now), red (Oct 1), amber (Oct 30, Jan 30), gray (Apr 27)
// - Oct 1 has a red callout banner: "Your most urgent deadline."
//   Text: category-specific (Cat 3/4: reprice + contact [PSP]; Cat 1: confirm pass-through)
//
// PADDING: The "now" dot is calculated from today's date relative to Oct 1.
// Show the merchant how many days remain: "163 days to 1 October 2026"
// Use: Math.ceil((new Date('2026-10-01') - new Date()) / 86400000)
// This is display-only — no calculation engine impact.
//
// ⚠️ Do NOT use any date library — pure Date arithmetic only. The app
// currently has no date library dependency and we are not adding one.
```

---

#### Sprint 2 Self-Audit Gate

```
□ Build passes, all existing tests pass
□ New tests pass: OverviewSection, WhereIStandToday, WhatsChanging, ReformTimeline
□ Summary tab: renders identical to current Overview — no visual regression
□ Sub-tab switching: clicking tabs correctly switches content, no flicker
□ WhereIStandToday: bar widths are proportional (not all the same width)
□ WhatsChanging: Cat 1 shows "not applicable" for CERTAIN card (no surcharge)
□ WhatsChanging: Cat 4 shows red CERTAIN card with surchargeRevenue amount
□ ReformTimeline: days countdown shows correct number (test with mocked Date)
□ Mobile: sub-tab strip is horizontally scrollable if tabs overflow
□ No new console errors
```

---

### SPRINT 3 — Actions Section Sub-Tabs
**Scope**: Add 2 sub-tabs to the existing Actions section
**Sub-tabs**: Action list (existing) | Your options | If you do nothing
**New files**: 2 sub-tab content components
**Modified files**: 1 (page.tsx — wrap actions in ActionsSection)
**Risk**: Low — existing ActionList is unchanged in the first tab
**Dependency**: Sprint 2 complete

---

#### Step 3.1 — Codebase audit

Read before writing:
```
apps/web/components/results/ActionList.tsx          ← full read — understand existing structure
apps/web/components/results/EscapeScenarioCard.tsx  ← this is relevant to "Your options"
apps/web/components/results/PassThroughSlider.tsx   ← this feeds into "Your options"
apps/web/app/results/page.tsx                       ← how actions state is managed
```

Critical question: **EscapeScenarioCard and PassThroughSlider are currently inside
DepthToggle (collapsed by default).** Sprint 3 promotes this functionality to the
Actions section sub-tabs. Confirm before proceeding:
- Does EscapeScenarioCard receive `outputs` and recalculated values? (yes)
- Does the slider need its own state management or does it use the global `handleOutputsChange`? (global)
- Will promoting these out of DepthToggle break any existing test? (check before coding)

---

#### Step 3.2 — Create YourOptions sub-tab

**New file**: `apps/web/components/results/sections/YourOptions.tsx`

Content:
```typescript
// YourOptions — repricing scenario cards + live slider
//
// STRUCTURE:
// 1. Three scenario cards (do nothing | reprice 1.0% | reprice 1.5%)
//    - Do nothing: red styling (negative.bg border negative.DEFAULT)
//    - Reprice 1.0%: amber styling
//    - Reprice 1.5%: emerald border (recommended) with "Recommended" badge
//    - Each card shows: scenario label | net position | annual/daily impact
//
// 2. Live modeller: a price-increase slider (0-3%, step 0.1%)
//    - Slider shows: new revenue, net position, per-day
//    - Calculation: newRev = volume * pct/100
//                   net = newRev - surchargeRevenue + (icSaving * passThrough)
//    - These calculations are LOCAL to this component (not sent to the engine)
//    - DO NOT call calculateMetrics() — this is a simple arithmetic display
//
// (Cat 1 / Cat 2 without surcharge): This component should NOT render
// for merchants who are not surcharging. Gate with: if (!surcharging) return null
//
// CATEGORY GATING:
// Cat 1: null (no surcharge, auto-saving)
// Cat 2: null (no surcharge)
// Cat 3: render (cost-plus, losing surcharge)
// Cat 4: render (flat rate, losing surcharge)
//
// ⚠️ CONFLICT RISK: EscapeScenarioCard in the DepthToggle serves a similar
// purpose. In this sprint, YourOptions is a NEW component — do not refactor
// EscapeScenarioCard. They can coexist until Sprint 6 cleanup. Inform Manu
// of this duplication and get explicit instruction before removing DepthToggle content.
```

Props:
```typescript
interface YourOptionsProps {
  category: 1 | 2 | 3 | 4;
  outputs: AssessmentOutputs;
  passThrough: number;
  volume: number;
  surcharging: boolean;
}
```

---

#### Step 3.3 — Create IfYouDoNothing sub-tab

**New file**: `apps/web/components/results/sections/IfYouDoNothing.tsx`

Content:
```typescript
// IfYouDoNothing — cost of inaction in escalating time increments
//
// VISUAL: 4 cells in a 2x2 grid
//   Daily cost:   Math.round(Math.abs(plSwing) / 365)
//   Weekly cost:  Math.round(Math.abs(plSwing) / 52)
//   Monthly cost: Math.round(Math.abs(plSwing) / 12)
//   Annual cost:  Math.abs(plSwing)
//
// Cell colours: escalating amber → red
//   Daily:   bg-[#FEF3E0]  text-amber-800
//   Weekly:  bg-[#FDDED0]  text-[#7F2D1D]
//   Monthly: bg-[#FDECEA]  text-[#791F1F]
//   Annual:  bg-[#FCEBEB]  border-1 border-[#F09595] text-[#791F1F]
//
// NOTE: Use hardcoded hex values as above — these specific intermediate
// shades are not in the design token scale and Tailwind purge will
// not include arbitrary values unless they're in the config. Use inline styles.
//
// Below the grid: the asymmetry callout
//   "Cost-plus merchants save automatically from 1 October. Flat-rate merchants
//    who don't ask [PSP] pay the exact same rate they always have."
//
// GATING: Only for Cat 3 and Cat 4 (surcharging merchants with a loss)
// For Cat 1 and Cat 2: show "You're not losing surcharge revenue — this section
// doesn't apply to your situation."
```

---

#### Sprint 3 Self-Audit Gate

```
□ Build passes, all tests pass
□ New tests: YourOptions, IfYouDoNothing
□ Action list (first tab): identical to current ActionList — no regression
□ YourOptions: renders for Cat 3 and Cat 4, null for Cat 1 and Cat 2
□ YourOptions slider: net position updates correctly at 0%, 1%, 1.5%, 3%
□ IfYouDoNothing: math correct — daily × 365 ≈ annual
□ IfYouDoNothing: null for Cat 1 and Cat 2
□ EscapeScenarioCard still exists in DepthToggle — not removed (confirm)
□ Slider in DepthToggle still works — not broken (confirm)
```

---

### SPRINT 4 — PREPARE Group: Three New Sections
**Scope**: Three entirely new sidebar sections
**Sections**: Talk to customers | Negotiation brief | Readiness checklist
**New files**: 3 section components + 3 test files
**Modified files**: page.tsx (add 3 new section IDs), ResultsSidebar.tsx (they already exist)
**Risk**: Low — additive only, no existing components touched
**Dependency**: Sprint 3 complete

---

#### Step 4.1 — Codebase audit

Read before writing:
```
apps/web/components/results/ActionList.tsx    ← pattern for PSP-inline copy
apps/web/actions/contributeRate.ts            ← understand PSP name passed as prop
packages/calculations/actions.ts             ← how PSP name is interpolated
```

Confirm: How is `pspName` sanitised before use in copy? (via sanitiseForHTML in page.tsx)
All three PREPARE components will receive `pspName` — confirm it is already sanitised
at the page level before interpolating into JSX.

---

#### Step 4.2 — Create TalkToCustomers section

**New file**: `apps/web/components/results/sections/TalkToCustomers.tsx`

```typescript
// TalkToCustomers — 5 ready-to-use communication templates
//
// TEMPLATES (all editable via contentEditable or textarea):
// 1. Customer email (subject line + body)
// 2. In-store counter sign (print-ready, short)
// 3. Social media post (150-200 words)
// 4. Staff briefing card (bullet points)
//
// TEMPLATE TABS: simple useState switching, not URL-based
//
// COPY BUTTON:
// Each template has a "Copy to clipboard" button.
// Use: navigator.clipboard.writeText(text)
// On success: button text changes to "Copied!" for 2 seconds
// Fallback: if clipboard API unavailable, select-all the textarea
//
// PRIVACY NOTE: Templates are rendered client-side only.
// No template content is sent to any server.
//
// PERSONALISATION:
// PSP name is interpolated into relevant templates (e.g. "negotiate with [PSP]")
// Business name and customer name have [PLACEHOLDER] tokens for merchants to fill in
//
// CATEGORY-SPECIFIC COPY:
// Cat 3/4 (surcharging): templates emphasise surcharge removal
// Cat 1/2 (not surcharging): templates are about the general reform (no surcharge to remove)
// Use a getCategoryTemplates(category, pspName) helper — do NOT inline ternaries in JSX
```

Props:
```typescript
interface TalkToCustomersProps {
  category: 1 | 2 | 3 | 4;
  pspName: string;
}
```

---

#### Step 4.3 — Create NegotiationBrief section

**New file**: `apps/web/components/results/sections/NegotiationBrief.tsx`

```typescript
// NegotiationBrief — PSP-specific call script and contact details
//
// PSP CONTACT DATA (hardcoded — Phase 1, no DB):
// Store as a TypeScript const object PSP_CONTACTS keyed by PSP name.
// Each entry: { channel, instructions, phone?, email?, hours }
//
// Known PSPs (from actions.ts, PSP_OPTIONS in Step2PlanType):
// Stripe, Square, Tyro, CommBank, ANZ, Westpac, eWAY, Adyen, Other
//
// For 'Other': show generic instructions without phone number
//
// STRUCTURE:
// 1. PSP contact card (emerald background)
//    - PSP name (16px font-medium)
//    - Channel and hours
// 2. Numbered steps (1-5)
//    - Step 3 always contains the verbatim script in a blockquote
// 3. Verbatim script: italic, accent border-left
//    EXACT SCRIPT interpolates: volume, pspName, plan type
// 4. If PSP says no: alternative PSP comparison table
//    This is STATIC data (not live) — use known published rates
//    Rows: Stripe IC+, Tyro IC+, CommBank IC+, Square flat
//
// ⚠️ PSP CONTACT DATA ACCURACY: The phone numbers and portal paths
// must be verified against current PSP websites. Note in the component:
// "// TODO: Verify PSP contact details before launch — last verified [date]"
// Do not present unverified phone numbers as fact.
```

Props:
```typescript
interface NegotiationBriefProps {
  pspName: string;
  planType: 'flat' | 'costplus';
  volume: number;
  category: 1 | 2 | 3 | 4;
  outputs: AssessmentOutputs;
}
```

---

#### Step 4.4 — Create ReadinessChecklist section

**New file**: `apps/web/components/results/sections/ReadinessChecklist.tsx`

```typescript
// ReadinessChecklist — interactive checklist with progress tracking
//
// CHECKLIST ITEMS (category-specific):
// Cat 3/4 (surcharging):
//   1. Contact [PSP] about rate review (deadline: 1 Aug 2026) — URGENT
//   2. Decide repricing strategy (deadline: 1 Sep 2026) — URGENT
//   3. Send customer communication (deadline: 15 Sep 2026)
//   4. Update POS pricing (deadline: 1 Oct 2026)
//   5. Check October statement (deadline: 30 Oct 2026)
//
// Cat 1/2 (not surcharging):
//   1. Confirm [PSP] will pass through saving in writing (deadline: 1 Aug 2026)
//   2. Check October statement for saving (deadline: 30 Oct 2026)
//   3. Review published MSF benchmark (deadline: 30 Oct 2026)
//   4. Review RBA pass-through report (deadline: 30 Jan 2027)
//
// STATE:
// - Checkbox state: useState<boolean[]>  — initialised to all false
// - Progress: count of done / total
// - Progress bar: visual only — no server persistence in Phase 1
//
// ⚠️ IMPORTANT: Do NOT persist checklist state to localStorage or sessionStorage.
// The checklist is session-only. This is a UX decision — merchants who return
// should start fresh (they may have made progress in reality). Phase 2 will
// add persistence via user accounts.
//
// Progress bar styling: bg-paper-secondary, fill bg-accent, height 7px rounded
```

Props:
```typescript
interface ReadinessChecklistProps {
  category: 1 | 2 | 3 | 4;
  pspName: string;
}
```

---

#### Sprint 4 Self-Audit Gate

```
□ Build passes, all tests pass
□ New tests: TalkToCustomers, NegotiationBrief, ReadinessChecklist
□ TalkToCustomers: all 4 tabs switch correctly
□ TalkToCustomers: copy button works and resets after 2 seconds
□ TalkToCustomers: Cat 1/2 copy differs from Cat 3/4 copy
□ NegotiationBrief: "Other" PSP shows generic instructions (no phone number)
□ NegotiationBrief: Stripe shows support ticket path (not phone)
□ ReadinessChecklist: checking items updates progress bar
□ ReadinessChecklist: Cat 1/2 shows different items to Cat 3/4
□ No checklist state in localStorage (check DevTools → Application)
```

---

### SPRINT 5 — PSP Registry Elevation
**Scope**: Elevate PSPRateRegistry from a small widget to a full section
**New features**: Live counter, value exchange, benchmark preview, How it works
**DB changes**: 1 migration (add industry + state_code columns)
**New files**: 1 new section component (replaces/wraps existing PSPRateRegistry.tsx)
**Modified files**: contributeRate.ts (add industry/state fields), page.tsx
**Risk**: Medium — DB migration required
**Dependency**: Sprint 4 complete

---

#### Step 5.1 — Codebase audit

Read before writing:
```
apps/web/components/results/PSPRateRegistry.tsx     ← full read (existing component)
apps/web/actions/contributeRate.ts                  ← full read (existing action)
apps/web/__tests__/actions/contributeRate.test.ts   ← full read (existing tests)
docs/architecture/database-schema.sql               ← confirm psp_rate_registry columns
```

Answer before coding:
- What columns does `psp_rate_registry` currently have? (from schema: psp_name, plan_type, country_code, volume_band, effective_rate_pct, debit_cents, credit_pct, trust_score, quarantined)
- Does `industry` column exist? (NO — requires migration)
- Does `state_code` column exist? (NO — requires migration)
- Is there a live count query currently? (NO — existing component just shows "Submitted. Thank you.")

---

#### Step 5.2 — DB migration

**New file**: `packages/db/migrations/005_psp_registry_fields.sql`

```sql
-- Migration 005: PSP registry additional fields
-- Adds industry and state_code for segment benchmarking

ALTER TABLE psp_rate_registry
  ADD COLUMN IF NOT EXISTS industry text,
  ADD COLUMN IF NOT EXISTS state_code text;

-- Add CHECK constraint for industry (optional — can be relaxed)
-- No constraint on state_code (free text for flexibility)
```

**⚠️ Run this migration against the staging database before any code changes.**
Confirm the migration succeeded by checking the staging schema.
The production migration runs separately after staging is confirmed.

---

#### Step 5.3 — Update contributeRate action

**Modified file**: `apps/web/actions/contributeRate.ts`

Add `industry` and `state_code` to `ContributeRateInput` interface.
Add to the INSERT statement. Both are optional (nullable in DB).

**Update existing tests** in `contributeRate.test.ts` to cover the new fields.
Do NOT remove any existing test cases.

---

#### Step 5.4 — Create PSPRegistrySection (full section)

**New file**: `apps/web/components/results/sections/PSPRegistrySection.tsx`

This replaces the existing `PSPRateRegistry.tsx` usage at the section level.
The existing `PSPRateRegistry.tsx` component is kept — it handles the form logic.
`PSPRegistrySection` is the section wrapper that adds:

```typescript
// PSPRegistrySection — full "Community" section wrapping the contribution form
//
// STRUCTURE:
// 1. Hero area (dark ink background — same as ConsultingCTA)
//    - Eyebrow: "PSP Rate Registry"
//    - Title: "Help build the only independent Australian merchant rate database"
//    - Body: value proposition
//    - Live counter: fetched from Supabase (count of non-quarantined entries)
//    - Progress bar towards 1,000 goal
//
// 2. Value exchange strip (3 columns on dark background)
//    - You contribute → You get back → On 30 October
//
// 3. Three-tab body
//    Tab 1: "Contribute your rate" — uses existing PSPRateRegistry form logic
//    Tab 2: "See the benchmark"   — aggregated data preview (see below)
//    Tab 3: "How it works"        — privacy model explanation
//
// LIVE COUNTER:
// Fetch count from Supabase using the anonymous client (not admin).
// CREATE a database VIEW or RPC for this — do NOT expose the raw table.
// Query: SELECT COUNT(*) FROM psp_rate_registry WHERE quarantined = false
// Cache this on the server (fetch at page load, not client-side re-fetch).
// If query fails: show "Building..." instead of a number — do NOT show 0.
//
// ⚠️ RLS ISSUE: The psp_rate_registry table has no SELECT policy for anonymous users.
// You need to either:
// a) Create an RPC function (preferred) that returns the count — called with anon key
// b) Create a public-read policy scoped to COUNT only
// CONFIRM with Manu before adding any new RLS policy.
//
// BENCHMARK PREVIEW (Tab 2):
// Phase 1: show ONLY entries where count >= 5 per (psp_name, plan_type, volume_band) cell.
// Do NOT show individual rates — aggregate only (median, range min, range max).
// Query strategy: use a Supabase RPC or Edge Function for the aggregation.
// DO NOT perform aggregation on the client.
// If no cells have 5+ entries: show "Not enough data yet — contribute to unlock"
//
// INSTANT BENCHMARK (success state after contribution):
// After submitting, show the merchant their rate vs the median for their segment.
// Only show if segment has >= 5 entries (otherwise: "You're one of the first — check back")
```

Props:
```typescript
interface PSPRegistrySectionProps {
  assessmentId: string;
  pspName: string;
  planType: 'flat' | 'costplus';
  volume: number;
  category: 1 | 2 | 3 | 4;
  industry: string;
}
```

---

#### Sprint 5 Self-Audit Gate

```
□ Migration 005 runs successfully against staging (check schema)
□ contributeRate.ts: industry and state_code accepted and inserted
□ All existing contributeRate tests still pass
□ New tests added for industry/state_code fields
□ PSPRegistrySection renders without errors when count query fails
□ Live counter: shows "Building..." if Supabase query fails
□ Benchmark tab: shows "Not enough data" message (staging has < 5 entries per segment)
□ Privacy model tab: "What we collect / What we never collect" renders
□ Existing PSPRateRegistry.tsx is not deleted (confirm it exists)
□ RLS policy change (if any) is reviewed and approved by Manu before shipping
□ Build passes, all tests pass
```

---

### SPRINT 6 — Refine and Values Integration + DepthToggle Cleanup
**Scope**: Integrate existing Refine/Values sections into the new sidebar navigation,
clean up DepthToggle now that its content is promoted to sub-tabs
**Modified files**: page.tsx, DepthToggle (may be removed)
**Risk**: Medium — DepthToggle removal is a meaningful change
**Dependency**: Sprint 5 complete

---

#### Step 6.1 — Codebase audit

Read before writing:
```
apps/web/components/results/DepthToggle.tsx
apps/web/components/results/PassThroughSlider.tsx
apps/web/components/results/EscapeScenarioCard.tsx
apps/web/components/results/CostCompositionChart.tsx
apps/web/components/results/AssumptionsPanel.tsx
```

Answer before coding:
- Is DepthToggle used anywhere other than results/page.tsx? (search entire codebase)
- Does the Refine section currently exist as a named `<section id="refine">` in page.tsx?
- What tests exist for DepthToggle? (check — if tests exist, they need updating before removal)

**⚠️ Do NOT remove DepthToggle until you have confirmed:**
1. EscapeScenarioCard and PassThroughSlider content is covered by Sprint 3's YourOptions
2. CostCompositionChart is accessible in the Values & rates section
3. AssumptionsPanel is accessible in the Refine section
4. No test expects DepthToggle to be present

If DepthToggle removal is complex, defer it and keep it collapsed — do NOT break
what's working to achieve cleanup.

---

### SPRINT 7 — Final Polish, Integration Testing, Launch Prep
**Scope**: Cross-section integration tests, mobile audit, performance check
**No new components**
**Risk**: Low

---

#### Sprint 7 checklist

```
INTEGRATION:
□ Cat 1 full journey: all 8 sections visible, correct content for Cat 1
□ Cat 2 full journey: all 8 sections visible, correct content for Cat 2
□ Cat 3 full journey: all 8 sections visible, correct content for Cat 3
□ Cat 4 full journey: all 8 sections visible, correct content for Cat 4
□ PassThrough slider still works (existing functionality not broken)
□ ConsultingCTA still visible and functional
□ EmailCapture still visible and functional
□ ResultsDisclaimer still present at bottom

MOBILE (390px viewport):
□ Sidebar hidden, content fills full width
□ All 8 sections scroll correctly
□ Sub-tab strips are horizontally scrollable on mobile
□ Copy buttons work on mobile
□ Checklist checkboxes are touch-friendly (min 44px tap target)

PERFORMANCE:
□ Lighthouse performance score >= 80 on staging
□ No layout shift (CLS) from sidebar
□ Staggered fadeUp animation still works
□ No extra API calls introduced (registry count cached at page load)

ACCESSIBILITY:
□ Lighthouse accessibility score >= 95
□ All interactive elements have accessible labels
□ Tab order follows logical reading order
□ Focus ring visible on sidebar nav items

ANALYTICS:
□ Plausible events fire for each new section view
□ Registry contribution event fires correctly
□ Sub-tab clicks tracked: 'Sub-tab viewed' { section, tab }
```

---

## PUSHBACK PROTOCOL

This is the most important section. Claude Code must actively push back at these triggers.

### When to STOP and report before coding

**1. Type mismatch** — If a component needs a prop that doesn't exist in the current
type definitions, STOP. Report the exact type definition and the specific field missing.
Do NOT add to the type without explicit instruction.

**2. Unexpected existing code** — If you find a component or function that already does
something you're about to build (even partially), STOP. Report what exists and ask for
direction. Do not build a duplicate.

**3. RLS changes** — If any new feature requires a new Supabase RLS policy or modification
to an existing one, STOP. List the specific change and why it's needed. Wait for approval.

**4. DepthToggle dependency** — If removing or refactoring DepthToggle would break an
existing test or create a regression, STOP. Report the specific test and conflict.

**5. Calculation outside the engine** — If a new component needs a financial calculation
that isn't available in `AssessmentOutputs`, STOP. Report the needed value and check
whether it can be derived from existing outputs before adding new fields to the engine.

**6. Build failure at any step** — Do not proceed to the next step with a failing build.

### Pushback format

```
⚠️ PUSHBACK [SPRINT X / STEP X.X]:
Brief says: [what the brief specifies]
Code shows: [what actually exists in the codebase]
Conflict: [why they don't reconcile]
Risk: [what breaks if we proceed without resolving]
Options:
  A) [option]
  B) [option]
Waiting for direction.
```

---

## GLOBAL RULES — APPLY TO EVERY SPRINT

1. **Read before write**: Read every file mentioned in the sprint audit before writing any code.

2. **Tokens not hex**: All colours must use Tailwind tokens or CSS variables from globals.css.
   Never hardcode hex values except for the specific escalating-cell colours in IfYouDoNothing
   (which are intentionally off-scale) — and document why.

3. **Font mono for all numbers**: Every financial number (P&L, rates, costs, percentages)
   must use `font-mono`. No exceptions.

4. **No new dependencies**: Do not add any npm package (charting, date, animation, or other)
   without explicit approval. All charts are pure CSS. All dates are native Date arithmetic.
   All animations are CSS keyframes from globals.css.

5. **Tests before done**: A component is not "done" until its test file exists and passes.
   Tests must cover: render without errors, prop variations for each category, edge cases
   (zero values, missing PSP, etc.).

6. **Actions invariant preserved**: `actions` state in ResultsContent must remain separate
   from `outputs`. Never recalculate actions on slider change. Never merge them.

7. **PSP name always inline**: Copy must always use the actual PSP name (e.g. "Stripe"),
   never "your PSP" or "your provider". This is enforced in actions.ts — enforce it in
   all new components too.

8. **Category gating explicit**: Every component that is category-specific must have a
   visible comment explaining the gating logic and must return null (not an empty div)
   for excluded categories.

9. **Commits per step**: One commit per numbered step. Commit message format:
   `feat(results/sprint-N): [step description]`

10. **Self-audit before next sprint**: Every sprint gate must be completed and reported
    before the next sprint begins. Report: passed / failed with specific item.

---

## WHAT THIS OVERHAUL IS NOT

Do not build these in this overhaul (Phase 2+ items):
- User accounts or login
- Saved assessment history
- Real-time Supabase subscriptions for live registry count updates
- Statement/invoice upload or parsing
- Benchmark data from external sources (all benchmark data is merchant-contributed)
- PDF or Excel export (PSP_EXPORT is a Phase 2 feature)
- White-label or accountant SaaS mode
- MerchantPosition taxonomy migration (separate sprint, separate brief)

---

*Produced: April 2026*
*Source: Live codebase audit of apps/web/ and packages/calculations/*
*Companion documents: RESULTS_PAGE_REDESIGN.md, MERCHANT_VALUE_BACKLOG.md,*
*SITUATION_TAXONOMY_IMPACT.md, TYPOGRAPHY_LEGIBILITY_FIX.md*
