# RESULTS_PAGE_REDESIGN.md
## nosurcharging.com.au — Results Page UX Implementation Brief
## Target: Complete payment intelligence tool for merchants and businesses
## Authority: This document governs the results page overhaul.
## Produced: April 2026

---

## TO CLAUDE CODE — MANDATORY READING PROTOCOL

Before writing a single line of code:

1. Read this entire document
2. Read `apps/web/app/results/page.tsx` — the current orchestrator
3. Read `apps/web/tailwind.config.ts` — the design token system
4. Read `apps/web/app/globals.css` — the CSS custom properties
5. Read `packages/calculations/types.ts` — every interface
6. Read each existing component in `apps/web/components/results/`

**This document was written with knowledge of the codebase but may contain
errors or misalignments. You have full authority to push back.**

---

## PUSHBACK PROTOCOL — MANDATORY

You are expected to challenge this brief where it conflicts with the code.

Push back using this format BEFORE implementing anything:

```
⚠️ PUSHBACK [ITEM-ID]:
Brief says: [what this doc says]
Code says:  [what the code actually does]
Risk:       [what would break if brief is followed blindly]
Proposal:   [your recommended resolution]
Status: AWAITING CONFIRMATION
```

**Required pushback triggers:**
- Any prop name that doesn't match the actual interface in `types.ts`
- Any CSS class that doesn't exist in `tailwind.config.ts` or `globals.css`
- Any state change that would break the `actions` / `outputs` separation
  (the slider collapse bug fix — that separation is sacred)
- Any layout approach that conflicts with Next.js App Router constraints
- Any component reorganisation that would cause the scheme-fees invariant
  in `CostCompositionChart` to throw (`todayScheme !== oct2026Scheme`)
- Any `'use client'` boundary placement that creates a server/client mismatch
- Anything that would require a new database migration not described here

**Do not push back on:**
- Copy improvements, colour values within the design system
- Component naming decisions (use your judgment)
- File organisation within the spec

---

## WHAT PROBLEM THIS SOLVES

The results page (`/results?id=<uuid>`) is a single vertical column of 13
components. A merchant wanting their action plan must scroll past the verdict,
metric cards, problems block, depth zone, CTA, email capture, PSP registry,
and disclaimer. User testing: "unending scrolling."

**The fix has two layers:**
1. **Shell** — two-column sticky layout (desktop) + sticky mini-nav (mobile)
2. **Content** — improved display of numbers, actions, and values within sections

Both layers are specified below. They are built in order: shell first,
content improvements second. No content improvement should be released on
the old linear layout.

---

## DESIGN SYSTEM CONSTRAINTS — READ BEFORE TOUCHING ANY STYLES

The existing design system is non-negotiable. Do not introduce new tokens.

**Fonts (from `layout.tsx`):**
- Sans: DM Sans via `--font-sans` / `font-sans`
- Serif: DM Serif Display via `--font-serif` / `font-serif`
- Mono: JetBrains Mono via `--font-mono` / `font-mono`

**Colours (from `tailwind.config.ts`):**
- Accent: `#1A6B5A` (`accent.DEFAULT`), light: `#EBF6F3`, border: `#72C4B0`
- Paper canvas: `#FAF7F2` (`paper.DEFAULT`)
- Ink primary: `#1A1409` (`ink.DEFAULT`)
- Positive: `#166534` on `#E8F5EB`
- Negative: `#7F1D1D` on `#FDECEA`
- Use CSS vars: `--color-text-primary`, `--color-text-secondary`, `--color-text-tertiary`

**Corner radii (from tailwind.config.ts comments — the system is documented):**
- `rounded-full` — primary CTAs ONLY. Do not use elsewhere.
- `rounded-lg` (8px) — interactive elements (buttons, inputs, action cards)
- `rounded-xl` (12px) — wrapper cards (large containers)
- `rounded-pill` (20px) — classification chips (URGENT/PLAN/MONITOR, category pills)

**Max-widths:**
- `max-w-results` (600px) — content column within the right panel
- `max-w-assessment` (520px) — existing wizard, do not change

**⚠️ PUSHBACK TRIGGER:** The brief's HTML artifact used different hex values
(#F8F8F7, #111110 etc.) — these are NOT in the design system. Map everything
to the existing Tailwind tokens. Never hardcode hex values that aren't already
in tailwind.config.ts.

---

## PART 1 — SHELL: TWO-COLUMN STICKY LAYOUT

### Overview

Replace the current single `<main className="min-h-screen bg-paper">` with
a full-width shell that has:
- A sticky top bar (44px, full width)
- A two-column body (desktop) / single column (mobile)
- Left sidebar navigation (desktop ≥768px)
- Scrollable right content with section routing
- Mobile sticky mini-nav + persistent bottom CTA bar

### File to modify: `apps/web/app/results/page.tsx`

The current `ResultsContent` component returns a single-column layout.
Replace it with the structure below. All existing logic (state, effects,
data extraction) remains unchanged.

### State additions required

Add to `ResultsContent`:

```typescript
const [activeSection, setActiveSection] = useState<Section>('overview');

type Section = 'overview' | 'actions' | 'values' | 'refine' | 'help';
```

The `actions` and `outputs` state split is sacred — do not touch it.

### New layout structure (replace the `<main>` return)

```tsx
return (
  <div className="min-h-screen bg-paper">
    {/* STICKY TOP BAR */}
    <ResultsTopBar
      category={category}
      outputs={outputs}
      accuracy={computeAccuracy(resolutionTrace)}
    />

    {/* TWO-COLUMN BODY */}
    <div className="flex" style={{ height: 'calc(100vh - 44px)' }}>

      {/* LEFT SIDEBAR — desktop only */}
      <ResultsSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        actions={actions}
        outputs={outputs}
        category={category}
      />

      {/* RIGHT CONTENT — scrollable */}
      <main className="flex-1 overflow-y-auto min-w-0">
        <div className="mx-auto max-w-results px-5 pb-12">
          {activeSection === 'overview'  && <OverviewSection  ... />}
          {activeSection === 'actions'   && <ActionsSection   ... />}
          {activeSection === 'values'    && <ValuesSection    ... />}
          {activeSection === 'refine'    && <RefineSection    ... />}
          {activeSection === 'help'      && <HelpSection      ... />}
        </div>
      </main>
    </div>

    {/* MOBILE MINI-NAV — overlaid, not in the two-column flow */}
    <MobileMiniNav
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      outputs={outputs}
      category={category}
    />

    {/* MOBILE BOTTOM BAR — persistent */}
    <MobileBottomBar category={category} />
  </div>
);
```

**⚠️ PUSHBACK TRIGGER:** The current page uses `REVEAL_STYLE` staggered
animations. These were designed for a linear scroll reveal. With section-based
routing, they no longer make sense — each section appears instantly on click.
Remove `REVEAL_STYLE` from the new implementation. If you disagree with
removing them, explain why before proceeding.

---

### Component: `ResultsTopBar`

**File:** `apps/web/components/results/shell/ResultsTopBar.tsx`

**Purpose:** Always-visible identity bar. The merchant's P&L is always on screen.

**Props:**
```typescript
interface ResultsTopBarProps {
  category: 1 | 2 | 3 | 4;
  outputs: AssessmentOutputs;
  accuracy: number; // 0-100
}
```

**Layout (left to right, 44px height, full width):**
```
nosurcharging.com.au  |  [Situation N pill]  [P&L number]  [░░░ 20%]  →  Result looks off?  Share
```

**Specs:**
- `position: sticky; top: 0; z-index: 50`
- Background: `bg-paper-white` with `border-b border-rule`
- Brand: `text-accent text-xs font-medium tracking-tight` — links to `/`
- Vertical divider: `w-px h-4 bg-rule`
- Pill: same `SITUATION_PILLS` config from existing `VerdictSection.tsx`
  (import and reuse the existing map, do NOT duplicate it)
- P&L number: `font-mono text-financial-standard` — positive = `text-positive`,
  negative = `text-negative`
- Accuracy: `text-micro text-ink-faint` label + 56px bar + `text-accent font-mono text-xs`
- "Result looks off?" — small link that triggers a feedback drawer (see Sprint 2)
- "Share" — copies the current URL to clipboard

**Tests to write:**
```typescript
// ResultsTopBar.test.tsx
it('shows positive P&L in green (text-positive)')
it('shows negative P&L in red (text-negative)')
it('renders correct pill colour per category')
it('accuracy bar width matches accuracy prop')
```

---

### Component: `ResultsSidebar`

**File:** `apps/web/components/results/shell/ResultsSidebar.tsx`

**Purpose:** Left navigation. Invisible infrastructure — no background fill.

**Props:**
```typescript
interface ResultsSidebarProps {
  activeSection: Section;
  onSectionChange: (s: Section) => void;
  actions: ActionItem[];
  outputs: AssessmentOutputs;
  category: 1 | 2 | 3 | 4;
}
```

**Layout:**
```
width: 200px (hidden below md breakpoint)
position: sticky; top: 44px; height: calc(100vh - 44px); overflow-y: auto
border-right: 0.5px solid var(--color-border-secondary)
NO background colour — transparent against the paper canvas
```

**Section groups and items:**

Group label style: `text-micro text-ink-faint uppercase tracking-widest px-4 pt-2 pb-1`

```
RESULT
  ● Overview
  ● Actions        [N urgent] badge

UNDERSTAND  
  ● Values & rates
  ● Refine estimate  [accuracy%] badge

NEXT STEP
  ● Get help       [$2,500 or $3,500] badge
```

**Active state (confirmed from Tailwind CSS docs + Linear Docs live observation):**
```css
border-left: 2px solid #1A6B5A  /* accent.DEFAULT */
/* NO background fill */
/* font-weight: 500 on active text ONLY */
```

**Dot colours:**
- Overview: `accent.DEFAULT` (#1A6B5A)
- Actions: `#A32D2D` (danger) — because urgency lives here
- Values: `ink-faint` (#9A8C78)
- Refine: amber (`#854F0B`)
- Help: `accent.DEFAULT`

**Badge styles:**
- Urgent count: `bg-negative/10 text-negative text-micro rounded-pill px-2`
- Accuracy/price: `bg-accent-light text-accent-dark text-micro rounded-pill px-2`

**Mobile:** `hidden md:block` — sidebar disappears on mobile entirely.

**Tests to write:**
```typescript
it('renders only on md+ (hidden class on mobile)')
it('active section has border-left-accent, no background')
it('inactive sections have no border-left')
it('urgent badge count matches actions.filter(urgent).length')
```

---

### Component: `MobileMiniNav`

**File:** `apps/web/components/results/shell/MobileMiniNav.tsx`

**Purpose:** Replaces the sidebar on mobile. Sticky below the top bar.
Confirmed pattern from GitHub PR view and Vercel blog.

**Props:**
```typescript
interface MobileMiniNavProps {
  activeSection: Section;
  onSectionChange: (s: Section) => void;
  outputs: AssessmentOutputs;
  category: 1 | 2 | 3 | 4;
}
```

**Layout:**
```
md:hidden  (disappears on desktop — sidebar takes over)
position: sticky; top: 44px; z-index: 40
background: paper-white; border-bottom: rule
padding: 8px 14px
display: flex; align-items: center; gap: 8px
```

**Left anchor (always visible):**
```
[P&L number in mono, 17px, coloured positive/negative]  |  [scrollable tabs]
```

**Tabs (horizontal scrollable, no scrollbar visible):**
```
Overview  Actions  Values  Refine  Help
```

Tab style: `text-xs font-medium px-3 py-1 rounded-pill border border-rule text-ink-muted`
Active tab: `bg-accent text-white border-accent`

**Tests:**
```typescript
it('is hidden on md+ screens')
it('active tab has accent background')
it('P&L updates when outputs change')
```

---

### Component: `MobileBottomBar`

**File:** `apps/web/components/results/shell/MobileBottomBar.tsx`

**Purpose:** Persistent CTA reachable without any scrolling on mobile.

**Props:**
```typescript
interface MobileBottomBarProps {
  category: 1 | 2 | 3 | 4;
}
```

**Layout:**
```
md:hidden
position: fixed; bottom: 0; left: 0; right: 0; z-index: 50
background: paper-white; border-top: rule
padding: 10px 14px; display: flex; gap: 8px
padding-bottom: env(safe-area-inset-bottom, 10px)  /* iOS notch */
```

**Buttons:**
- Primary: `AccentButton` (existing component) — "Book a call · $X" — links to Calendly
- Secondary: plain button — "Save result" — copies URL to clipboard

**Category-specific CTA prices:**
- Cat 1 & 2: `$2,500`
- Cat 3 & 4: `$3,500`

**⚠️ PUSHBACK TRIGGER:** `position: fixed` in the visualiser runs inside an
iframe where it collapses to min-height. In the actual Next.js app on a real
viewport, `position: fixed` is correct for the bottom bar. Verify this works
in the deployed app and adjust if needed.

---

## PART 2 — SECTIONS: CONTENT WITHIN THE SHELL

Each section is a standalone component mounted when its nav item is active.
All sections receive the same base props from `ResultsContent`.

### Base props type (define in shell/types.ts)

```typescript
export interface SectionProps {
  outputs: AssessmentOutputs;
  actions: ActionItem[];
  category: 1 | 2 | 3 | 4;
  volume: number;
  pspName: string;
  planType: 'flat' | 'costplus';
  msfRate: number;
  surcharging: boolean;
  surchargeRate: number;
  resolutionTrace: ResolutionTrace;
  originalRaw: RawAssessmentData;
  resolutionContext: ResolutionContext;
  passThrough: number;
  onOutputsChange: (outputs: AssessmentOutputs, pt: number) => void;
}
```

**⚠️ PUSHBACK TRIGGER:** Check whether `resolutionTrace` is stored correctly
in `assessment.inputs`. From the code: `(storedInputs.resolutionTrace as ResolutionTrace) ?? {}`.
If the resolver stores the trace elsewhere in the DB schema, the `??{}` fallback
silently produces an empty trace. Verify before building the Refine section.

---

### Section: `OverviewSection`

**File:** `apps/web/components/results/sections/OverviewSection.tsx`

**Reuses (do not rebuild):**
- `VerdictSection` — import as-is, pass same props
- `MetricCards` — refactored (see below)
- `ProblemsBlock` — import as-is, pass same props

**New in overview (not in any existing component):**
- Section eyebrow: `text-micro text-ink-faint uppercase tracking-widest`
  followed by a `border-b border-rule pb-3 mb-4`
- Verdict body paragraph (plain English, category-specific) — this IS already
  in `VerdictSection.tsx` as `getCategoryBody()`. Verify it renders correctly.

**MetricCards refactor:**
The current `MetricCards` shows: Today | Oct 2026 | IC saving (3 cells, 20px mono).
The research showed these numbers are too small to lead with. Refactor to:

```
2x2 grid, each cell: bg-paper-secondary rounded-xl p-4 border border-rule/50
Label: text-micro text-ink-faint uppercase tracking-widest mb-2
Value: font-mono text-financial-standard (22px) — colour per semantic
Sub:   text-caption text-ink-faint mt-1
```

Four cells:
1. IC saving / +$X / "debit + credit" / `text-positive`
2. Net P&L impact / ±$X / "annual saving/shortfall" / positive or negative
3. Surcharge revenue / −$X or "$0" / "lost from 1 Oct" or "not applicable"
4. Your cost today / $X / "annual [plan type]" / `text-ink-secondary`

**⚠️ PUSHBACK TRIGGER:** The existing MetricCards uses `outputs.netToday` and
`outputs.octNet`. The new 4-cell layout uses `outputs.icSaving`, `outputs.plSwing`,
`outputs.surchargeRevenue`, and either `outputs.annualMSF` (flat) or `outputs.grossCOA`
(cost-plus). Verify these field names exist in `AssessmentOutputs` before changing
the component. Do not rename the component — just change its internals and props.

---

### Section: `ActionsSection`

**File:** `apps/web/components/results/sections/ActionsSection.tsx`

**Purpose:** The most important section. Merchant's to-do list.

**Research basis (Todoist pattern, confirmed live):**
- No card border wrapping each action item
- Left border = urgency signal (3px coloured stripe)
- Task text is the primary element (14px, not 13px)
- Script is clearly labelled and styled as a callout
- Whitespace separates items, not borders

**The existing `ActionList.tsx` uses card-style borders (`border: '1px solid var(--color-border-secondary)'`).**
This needs to change.

**New action item rendering (refactor the `ActionList` component):**

```tsx
// Each action item — no card, left border = urgency
<article
  style={{
    borderLeft: `3px solid ${TIER_BORDER[action.priority]}`,
    padding: '14px 16px',
    marginBottom: '2px',
    background: 'var(--color-background-primary)',
  }}
>
  {/* Top row: urgency chip + deadline */}
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '7px' }}>
    <span className={`text-micro font-medium uppercase tracking-wider rounded-pill px-2 py-0.5 ${TIER_CHIP_CLASS[action.priority]}`}>
      {TIER_LABEL[action.priority]}
    </span>
    <span className="text-micro font-mono" style={{ color: '#1A6B5A' }}>
      {action.timeAnchor}
    </span>
  </div>

  {/* Task text — 14px, not 13px */}
  <p style={{ fontSize: '14px', color: 'var(--color-text-primary)', lineHeight: '1.55' }}>
    {action.text}
  </p>

  {/* Script — if present */}
  {action.script && (
    <div style={{
      marginTop: '10px',
      padding: '10px 12px',
      background: 'var(--color-background-secondary)',
      borderLeft: '2px solid #72C4B0',
    }}>
      <span style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase',
        letterSpacing: '1px', color: '#1A6B5A', display: 'block', marginBottom: '4px' }}>
        Exact script
      </span>
      <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)',
        fontStyle: 'italic', lineHeight: '1.65' }}>
        "{action.script}"
      </p>
    </div>
  )}

  {/* Why — if present */}
  {action.why && (
    <p className="text-caption text-ink-faint" style={{ marginTop: '6px' }}>
      {action.why}
    </p>
  )}
</article>
```

**Left border colours:**
```typescript
const TIER_BORDER: Record<ActionPriority, string> = {
  urgent: '#A32D2D',
  plan:   '#854F0B',
  monitor: 'var(--color-border-secondary)',
};
```

**Summary bar above the list:**
```tsx
<div className="flex gap-2 mb-4 flex-wrap">
  <span className="...">{urgentCount} urgent</span>
  <span className="...">{planCount} to plan</span>
  <span className="...">{monitorCount} to monitor</span>
</div>
```

**What stays the same:**
- `sortByTier()` logic — keep it
- `ActionPriority` types — unchanged
- `ActionItem.timeAnchor`, `.text`, `.script`, `.why` — all used

**Tests to update:**
```typescript
// ActionList.test.tsx
it('urgent actions have border-left:#A32D2D, NOT card border')
it('script block has label "Exact script"')
it('task text is 14px (not 13px)')
it('summary bar shows correct counts')
```

---

### Section: `ValuesSection`

**File:** `apps/web/components/results/sections/ValuesSection.tsx`

**Purpose:** Rate changes and P&L breakdown. Currently this content is buried
inside `AssumptionsPanel` (collapsed). Promoting it to a top-level section
makes it accessible without expanding a toggle.

**Reuses:**
- `CostCompositionChart` — import as-is, place in this section
- `AssumptionsPanel` — keep for "show me exactly how this is calculated"
  toggle at the bottom of this section

**New content at the top of this section:**

**Rate changes table:**
```
[Label]                       [Before] → [After]   [Saving]
Debit per transaction         9c       → 5.6c       +$X
Consumer credit               0.47%    → 0.30%      +$X   (cost-plus only)
Surcharge on designated       1.20%    → 0%         −$X   (surcharging only)
Your Stripe flat rate         1.70%    → ?          TBD   (flat only)
```

Row style:
```tsx
<div style={{
  display: 'flex', alignItems: 'center', gap: '10px',
  padding: '12px 14px',
  background: 'var(--color-background-secondary)',
  borderRadius: '8px', marginBottom: '6px',
}}>
  <div style={{ flex: 1 }}>
    <div className="text-body-sm text-ink-secondary">{label}</div>
    <div className="text-micro text-ink-faint font-mono mt-0.5">{note}</div>
  </div>
  <span className="font-mono text-body-sm text-ink-faint line-through">{before}</span>
  <span className="text-ink-faint">→</span>
  <span className="font-mono text-body-sm font-medium" style={{ color: isNeg ? '#A32D2D' : '#1A6B5A' }}>{after}</span>
  <span className="font-mono text-caption font-medium ml-auto" style={{ color: isNeg ? '#A32D2D' : '#1A6B5A' }}>{saving}</span>
</div>
```

**P&L breakdown table:**
```
[Item]                              [Formula]           [Value]
What you pay today (flat)           $2M × 1.70%         $34,000
Surcharge recovered (if applicable) $2M × 1.20%         −$24,000
Debit saving (October)              min(8c,0.16%×$65)   +$X
Credit saving (October)             0.47%→0.30%         +$X
──────────────────────────────────────────────────────────────────
NET ANNUAL P&L IMPACT                                   ±$X
```

Row container: `border border-rule rounded-xl overflow-hidden`
Each row: `flex items-center px-4 py-3 border-b border-rule/50 last:border-b-0 last:bg-paper-secondary`

**CostCompositionChart** (already exists, has the scheme-fee invariant):
Place it below the breakdown table. Do not change it.

**AssumptionsPanel** (already exists):
Place it below the chart, behind the existing toggle. Do not change it.

**Source citation at the bottom:**
```tsx
<p className="text-caption text-ink-faint italic mt-4 pt-4 border-t border-rule">
  Scheme fees (~$2,100/yr on your volume) are unchanged by the reform and
  already included in your {pspName} bill. Source: RBA Conclusions Paper,
  March 2026.
</p>
```

---

### Section: `RefineSection`

**File:** `apps/web/components/results/sections/RefineSection.tsx`

**Purpose:** Allow merchants to improve their estimate accuracy.
This is the RefinementPanel from the sprint brief, promoted to a full section.

**Accuracy score at the top:**
```typescript
function computeAccuracy(trace: ResolutionTrace): number {
  let score = 20; // base
  if (['merchant_input','invoice_parsed'].includes(trace['avgTransactionValue']?.source)) score += 25;
  if (['merchant_input','invoice_parsed'].includes(trace['expertRates.creditPct']?.source)) score += 25;
  if (['merchant_input'].includes(trace['cardMix.commercial']?.source)) score += 15;
  // Monthly debit txn count is a Sprint 2 addition — placeholder for now
  return Math.min(score, 100);
}
```

Display:
```tsx
<div className="bg-paper-secondary rounded-xl p-4 mb-4 border border-rule/50">
  <div className="flex items-center gap-3 mb-1">
    <span className="text-micro text-ink-faint">Estimate accuracy</span>
    <div className="flex-1 h-1 bg-rule rounded-full overflow-hidden">
      <div style={{ width: `${accuracy}%`, background: '#1A6B5A', height: '100%' }} />
    </div>
    <span className="font-mono text-xs font-medium text-accent">{accuracy}%</span>
  </div>
  <p className="text-caption text-ink-faint">
    {accuracy < 60
      ? 'Update the fields below to improve your estimate.'
      : accuracy < 85
      ? 'Getting more accurate — enter your actual rates above.'
      : 'High accuracy — based on your specific inputs.'}
  </p>
</div>
```

**The three refinement fields:**
Each field card: `border border-rule rounded-xl p-4 mb-3`

**Field 1: Average transaction value**
- Pre-fill from: `resolutionTrace['avgTransactionValue']?.value ?? 65`
- Source badge text from: `resolutionTrace['avgTransactionValue']?.label ?? 'RBA average'`
- Badge turns emerald when user has edited the value
- Chip: below $50 → `'Critical — below $50 kink'` (emerald pill),
         ≥$50  → `'Moderate impact'` (amber pill)
- Hint: "Find in PSP dashboard → Reports → Average transaction value"

**Field 2: Credit interchange rate (cost-plus only — `planType === 'costplus'`)**
- Pre-fill: `resolutionTrace['expertRates.creditPct']?.value ?? 0.47`
- Source badge from trace label
- Chip: "High impact" (amber)
- Hint: "Monthly statement → interchange line items"

**Field 3: Commercial card share**
- Pre-fill: `resolutionTrace['cardMix.commercial']?.value ?? 0`
- Source badge from trace label
- Chip: B2B industry → "Critical for B2B" (red pill), other → "Moderate" (gray)
- Hint: "PSP statement → card type breakdown"

**Live P&L update:**
On any field change, run:
```typescript
const resolved = resolveAssessmentInputs(
  { ...originalRaw, passThrough },
  {
    ...resolutionContext,
    merchantInput: {
      avgTransactionValue: editedAvt,
      expertRates: { creditPct: editedCreditPct },
    },
  },
);
const newOutputs = calculateMetrics(resolved);
onOutputsChange(newOutputs, passThrough);
```

**⚠️ PUSHBACK TRIGGER:** The `resolveAssessmentInputs` and `calculateMetrics`
functions are imported from `@nosurcharging/calculations`. Before implementing
live updates, verify these imports work client-side (they should — both are
pure TypeScript with no server-only dependencies). If they are currently only
called server-side, a refactor is needed before this feature can work.

**PassThroughSlider (Cat 2 and Cat 4 only):**
The existing `PassThroughSlider` component moves into the Refine section.
It is no longer inside `DepthToggle`. This is the right home for it — a
refinement tool that improves your estimate by modelling pass-through.

**EscapeScenarioCard (Cat 2 and Cat 4 only):**
Also moves into the Refine section, below the slider. Import as-is.

---

### Section: `HelpSection`

**File:** `apps/web/components/results/sections/HelpSection.tsx`

**Purpose:** CTA + email capture. Currently split across two separate components
far down the page. Promoting them to a dedicated section makes the commercial
offer accessible without scrolling.

**Reuses:**
- `ConsultingCTA` — but refactored (see below)
- `EmailCapture` — import as-is

**ConsultingCTA refactor:**
The current CTA is a single product at a single price regardless of category.
The research showed category-specific copy outperforms generic copy.
Update to show category-appropriate headline, body, and price:

```typescript
const CTA_CONFIG: Record<1 | 2 | 3 | 4, {
  eyebrow: string;
  title: string;
  body: string;
  price: string;
}> = {
  1: {
    eyebrow: 'Payments Health Check',
    title: `Your plan is solid — let's confirm the saving arrives`,
    body: `A 30-minute call confirms your ${pspName} October statement will reflect the interchange cut, benchmarks your rate against the published MSF, and gives you the exact written confirmation script.`,
    price: '$2,500',
  },
  2: {
    eyebrow: 'Payments Health Check',
    title: `${pspName} needs to change your rate — let's get it in writing`,
    body: `A 30-minute call gives you the exact script to present to ${pspName}, the benchmark to back it up, and three cost-plus alternatives with published rates. Most merchants recover $1,000–$3,000/year.`,
    price: '$2,500',
  },
  3: {
    eyebrow: 'Reform Ready',
    title: 'Your repricing strategy needs to be set before October',
    body: `A Reform Ready engagement builds your full October response: repricing strategy to recover the ${fmt(surchargeRevenue)} surcharge revenue loss, ${pspName} negotiation brief, and a 12-month payment cost roadmap.`,
    price: '$3,500',
  },
  4: {
    eyebrow: 'Reform Ready',
    title: 'Two problems, one October deadline — let\'s fix both',
    body: `You need a repricing strategy AND a PSP plan change. A Reform Ready engagement addresses both simultaneously so you enter October with a clear, costed plan for each problem.`,
    price: '$3,500',
  },
};
```

CTA card layout:
```
[border border-rule rounded-xl overflow-hidden mb-4]
  [cta-top: padding 20px, border-bottom]
    eyebrow: text-micro font-medium uppercase tracking-widest text-accent mb-3
    title:   heading-sm font-medium mb-2
    body:    text-body-sm text-ink-secondary leading-relaxed
  [cta-bottom: padding 16px 20px, bg-paper-secondary, flex items-center gap-4]
    <AccentButton href={calendlyUrl}>Book a call · {price}</AccentButton>
    detail: text-caption text-ink-faint — "30-minute call · Fixed price · No retainer"
```

**PSPRateRegistry:**
Move `PSPRateRegistry` into the Help section, below EmailCapture.
It belongs here — it's a contribution mechanism, not a result.

**ResultsDisclaimer:**
Move to the bottom of the Help section.

---

## PART 3 — SKELETON + LOADING STATE

The existing `SkeletonLoader` must be updated to match the new two-column layout.
It should render a skeleton of the top bar + sidebar + content area, not the
current linear skeleton.

This is a low-priority change — do it after Parts 1 and 2 are working.

---

## COMMIT MILESTONES

Do not commit everything at once. Commit in this sequence:

### Milestone 1 — Shell only (no content changes)
```
feat(results): two-column sticky shell with top bar, sidebar, mobile nav

- ResultsTopBar: sticky P&L + accuracy always visible
- ResultsSidebar: ultra-light left nav, border-left active state only
- MobileMiniNav: sticky mini bar with horizontal section tabs
- MobileBottomBar: persistent bottom CTA on mobile
- Section routing: activeSection state, each section renders its existing content
- REVEAL_STYLE animations removed (replaced by section switching)
- All existing components still render, just within the new shell
- Tests: ResultsTopBar, ResultsSidebar, MobileMiniNav, MobileBottomBar

At this commit: the page should work end-to-end. No content has changed.
The only difference is layout. Every existing test must still pass.
```

**Self-audit before this commit:**
```
□ All 86 calculation tests still pass (cd packages/calculations && vitest run)
□ All web component tests still pass
□ No TypeScript errors (tsc --noEmit)
□ No console errors in browser for Cat 1, 2, 3, 4
□ Mobile: MobileBottomBar visible, MobileMiniNav visible, sidebar hidden
□ Desktop: sidebar visible, MobileMiniNav hidden, MobileBottomBar hidden
□ Clicking sidebar items switches sections
□ P&L in top bar matches P&L in content
□ Scheme-fee invariant in CostCompositionChart does not throw
□ actions state and outputs state remain separate (slider still works)
□ assessmentId URL param still loads from Supabase correctly
```

### Milestone 2 — Content improvements
```
feat(results): improved content display in all sections

- OverviewSection: 4-cell metric grid, verdict body paragraph prominent
- ActionsSection: left-border pattern replaces card border, 14px task text,
  labelled script callout, summary chip bar
- ValuesSection: rate changes table + P&L breakdown table + CostCompositionChart
- RefineSection: accuracy score + 3 pre-populated fields + live P&L update
  + PassThroughSlider + EscapeScenarioCard
- HelpSection: category-specific CTA copy + EmailCapture + PSPRateRegistry
  + ResultsDisclaimer
- ConsultingCTA: category-specific headline, body, price
- MetricCards: 4-cell grid with larger 22px numbers
- ActionList: left-border pattern, 14px text, script label
```

**Self-audit before this commit:**
```
□ All tests still pass
□ No TypeScript errors
□ Cat 1: overview shows positive P&L, no slider
□ Cat 2: refine section shows slider + escape scenario
□ Cat 3: actions show repricing as urgent
□ Cat 4: both surcharge loss AND flat-rate problems shown
□ Refine section: editing AVT field updates P&L in top bar in real time
□ Refine section: source badge turns emerald when field is edited
□ ValuesSection: rate table only shows credit row for cost-plus merchants
□ ValuesSection: surcharge row only shows for merchants who were surcharging
□ HelpSection CTA shows $2,500 for Cat 1/2, $3,500 for Cat 3/4
□ PSPRateRegistry is in HelpSection, not dangling below disclaimer
□ Mobile: "Book a call · $X" in bottom bar matches category price
```

### Milestone 3 — Zero-cost merchant variant (separate)
```
feat(results): zero-cost merchant variant

Trigger: planType === 'zerocost' in stored assessment
These merchants: Zeller fee-free, Tyro no-cost, Smartpay
They go from $0 to full processing costs. Completely different result.

- ZeroCostResults component: critical alert header, before/after table,
  three rate scenarios (1.2%, 1.4%, 1.6%), all actions urgent
- Render from results/page.tsx before the shell if planType === 'zerocost'
```

---

## PART 4 — THE END STATE: COMPLETE PAYMENT INTELLIGENCE TOOL

The brief says "the end state is that this becomes a complete payment
intelligence tool for merchants and businesses." This section specifies what
that means beyond the immediate UX work.

### Currently implemented (do not rebuild)
- 4-step assessment wizard (Steps 1–4)
- Category assignment (Cat 1–4)
- Calculation engine with 86 tests
- ResolutionTrace infrastructure
- PSP Rate Registry (contribution mechanism)
- Email capture

### Sprint 2 additions (next after this brief)
These are specified in the project backlog and Sprint Brief:

**UX-08 — Monthly debit transaction count field**
Add as a 4th field in RefineSection, as "OR" alternative to AVT.
Requires: add `monthlyDebitTxns` to `RawAssessmentData` and resolver.

**CALC-06 — Minimum monthly fee field**
Add to RefineSection for flat-rate merchants.
Requires: add `minMonthlyFee` to `ResolvedAssessmentInputs`.

**RESULTS-03 — Feedback mechanism**
"Does your result look off? Tell us →" link in the top bar.
Opens a drawer: email + free text + pre-filled category/volume.
Server action via Resend to Manu's inbox.

**RESULTS-07 — PSP-based MSF pre-population**
When merchant selects PSP in Step 2, pre-fill MSF field.
Published rates object in a new constants file.

### Sprint 3 additions (post-launch based on real traffic)
Specified in backlog items CALC-08, CALC-09, RESULTS-04.
Do not build until real traffic data exists.

---

## FILE STRUCTURE TARGET STATE

```
apps/web/
  app/results/page.tsx              (modified — shell + section routing)
  components/results/
    shell/
      ResultsTopBar.tsx             (NEW)
      ResultsSidebar.tsx            (NEW)
      MobileMiniNav.tsx             (NEW)
      MobileBottomBar.tsx           (NEW)
      types.ts                      (NEW — SectionProps, Section type)
    sections/
      OverviewSection.tsx           (NEW — wraps existing VerdictSection etc.)
      ActionsSection.tsx            (NEW — wraps refactored ActionList)
      ValuesSection.tsx             (NEW — wraps CostCompositionChart + new rate table)
      RefineSection.tsx             (NEW — wraps PassThroughSlider + EscapeScenarioCard + new fields)
      HelpSection.tsx               (NEW — wraps ConsultingCTA + EmailCapture + PSPRateRegistry)
    ActionList.tsx                  (MODIFIED — left-border pattern)
    MetricCards.tsx                 (MODIFIED — 4-cell grid)
    ConsultingCTA.tsx               (MODIFIED — category-specific copy)
    VerdictSection.tsx              (UNCHANGED)
    ProblemsBlock.tsx               (UNCHANGED)
    PassThroughSlider.tsx           (UNCHANGED — moves into RefineSection)
    EscapeScenarioCard.tsx          (UNCHANGED — moves into RefineSection)
    CostCompositionChart.tsx        (UNCHANGED — moves into ValuesSection)
    AssumptionsPanel.tsx            (UNCHANGED — moves into ValuesSection)
    EmailCapture.tsx                (UNCHANGED — moves into HelpSection)
    PSPRateRegistry.tsx             (UNCHANGED — moves into HelpSection)
    ResultsDisclaimer.tsx           (UNCHANGED — moves into HelpSection)
    SkeletonLoader.tsx              (MODIFIED — matches new two-column layout)
    DepthToggle.tsx                 (DEPRECATED — replaced by section routing)
```

---

## WHAT NOT TO BUILD IN THIS SPRINT

Do not build any of these without explicit instruction:
- PDF export (RESULTS-05)
- PSP Rate Registry data-driven CTA (RESULTS-04) — no data yet
- Accountant white-label
- Any new Supabase tables or schema changes beyond what's described
- Dark mode support (the app is deliberately light-only, see globals.css)
- Any change to the assessment wizard (Steps 1–4)
- Any change to the homepage
- Invoice upload or parsing (Phase 2)

---

## REFERENCE FILES

```
Design artifact:  /mnt/user-data/outputs/nosurcharging_results_final_design.html
Backlog:          /mnt/user-data/outputs/nosurcharging-backlog.md
Build plan:       /mnt/user-data/outputs/build-plan.md
Sprint brief:     /mnt/user-data/outputs/SPRINT_BRIEF.md
RBA rates:        packages/calculations/constants/au.ts
Calculation:      packages/calculations/calculations.ts
Resolver:         packages/calculations/rules/resolver.ts
```

Open `nosurcharging_results_final_design.html` in a browser to see the
visual target. The HTML artifact uses standalone CSS — map every style
to the existing Tailwind token system before implementing.

---

*Brief produced April 2026. Authoritative for results page UX overhaul.*
*Challenge anything that conflicts with the codebase you read.*
*The end state: a complete payment intelligence tool that merchants trust.*
