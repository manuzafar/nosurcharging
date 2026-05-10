# RESULTS_EDITORIAL_TREATMENT_BRIEF.md
## nosurcharging.com.au — Results page editorial treatment + visual modernisation
## Authority: This document governs the visual overhaul of the results page following the ruthless cut.
## Companion to: `RESULTS_RUTHLESS_CUT_BRIEF.md` (already shipped). Read that first.
## Produced: May 2026

---

## TO CLAUDE CODE — MANDATORY READING PROTOCOL

Before writing a single line of code:

1. Read this entire document.
2. Read `RESULTS_RUTHLESS_CUT_BRIEF.md` — the predecessor brief that has already shipped. This brief builds on that foundation; do not undo any of its work.
3. Read the current state of:
   - `apps/web/app/results/page.tsx` — the orchestrator
   - `apps/web/components/results/VerdictSection.tsx` — currently wrapped in a white card
   - `apps/web/components/results/VerticalActionSteps.tsx` — currently has card-style step containers
   - `apps/web/components/results/RefinementPanel.tsx` — currently has card-per-field treatment
   - `apps/web/components/results/PassThroughSlider.tsx` — currently in a card
   - `apps/web/components/results/AssumptionsPanel.tsx` — currently in a card
   - `apps/web/components/results/MetricCards.tsx` — keep as cards (data records)
   - `apps/web/components/results/ProblemsBlock.tsx` — keep as cards (semantic data)
   - `apps/web/components/results/EscapeScenarioCard.tsx` — keep as a card (comparison data)
   - `apps/web/components/results/sections/ArtifactCard.tsx` — keep as a card (focused conversion)
4. Read `apps/web/tailwind.config.ts` and `apps/web/app/globals.css` — the design token system.
5. Read `docs/design/design-tokens.md` and `docs/design/ux-design.md` — the design system rationale.

---

## PUSHBACK PROTOCOL — MANDATORY

You are expected to challenge this brief where it conflicts with the code. Use this format BEFORE implementing anything:

```
⚠️ PUSHBACK [ITEM-ID]:
Brief says: [what this doc says]
Code says:  [what the code actually does]
Risk:       [what would break if brief is followed blindly]
Proposal:   [your recommended resolution]
Status: AWAITING CONFIRMATION
```

**Required pushback triggers:**
- Any change to `MetricCards` rendering modes (Cat 1/2 flat grid · Cat 3/4 proportional · Cat 5 zero-cost). The 3 modes must survive — only the *containing chrome* changes.
- Any modification to action data flow from `packages/calculations/actions.ts` into `VerticalActionSteps`. Visual treatment changes only; data shape is sacred.
- Any modification to the calculation engine (`packages/calculations/`).
- The scheme-fees invariant in any chart that survives.
- The `actions` / `outputs` separation in `ResultsContent` (the slider isolation pattern).
- Any 64px hero number that creates horizontal overflow at narrow widths — propose a smaller scale that still dominates the first viewport.
- Any section-header pattern that doesn't survive being extracted as a reusable `SectionHeader` component.
- If removing a card wrapper from a component breaks a client-side state pattern, flag it and propose how to preserve the state.

**Do not push back on:**
- Typography refinements within the spec (12px → 13px, etc.) where context warrants.
- Component naming for new helpers.
- Whitespace and minor visual decisions inside the editorial treatment.

---

## WHY WE'RE DOING THIS

The ruthless cut shipped successfully — the results page is now structurally clean (single column, no sidebar, ~6 sections). User feedback validates the structural change but flags the visual treatment as feeling dated.

Specifically: the page mixes two design vocabularies. Some sections sit in rounded card containers (verdict card, metric cards, why-this-is-happening cards). Others float flat against the paper background (action list, reform timeline, refine, model your outcome). This visual inconsistency reads as half-designed rather than deliberate.

The fix is to lean into a single coherent aesthetic — *editorial* — drawn from the design vocabulary of modern financial tools (Stripe, Linear, Mercury, Vercel, Cash App, Granola). In editorial layout, typography and whitespace do the structural work; cards are reserved for genuine data records or focused conversion surfaces.

The end-state aesthetic:
- Hero verdict: editorial (no card)
- Metric cards: cards (data records)
- Why-this-is-happening: cards (semantic data records)
- Action list: editorial (vertical timeline, no card)
- Reform timeline: editorial (no card)
- Refine your estimate: editorial settings panel (no card per field)
- Model your outcome: editorial (no card)
- Escape scenario: card (comparison data record)
- Assumptions toggle: editorial expand
- Save the full report: card (focused conversion)
- Disclaimer: editorial flow

Six card moments. Everything else flows.

This is not "less designed" — it's *more* deliberately designed. Editorial requires precise typography, intentional whitespace, and consistent rhythm across sections to feel finished rather than empty.

---

## THE SECTION HEADER PATTERN (THE PAGE'S RHYTHM)

The single most important pattern in this overhaul. Apply consistently to every editorial section.

### Specification

```
[0.5px hairline rule — full width of content column]
[36px top padding — desktop] / [28px top padding — mobile]
[Section header row: flex, justify-between, baseline-aligned]
  [Eyebrow — left]      [Meta — right (optional)]
[24px bottom margin from header to content — desktop] / [18px — mobile]
```

### Eyebrow style

```css
font-size: 11px;
font-weight: 500;
letter-spacing: 0.14em;  /* Slightly wider than current */
text-transform: uppercase;
color: var(--color-text-secondary);
margin: 0;
```

### Meta style (right-aligned)

```css
font-size: 11px;
font-family: var(--font-mono);
color: var(--color-text-tertiary);
letter-spacing: 0.04em;
margin: 0;
```

### Implementation

Create a reusable `SectionHeader` component:

```tsx
// apps/web/components/results/SectionHeader.tsx
interface SectionHeaderProps {
  eyebrow: string;
  meta?: string | React.ReactNode;
  metaColor?: string;  // e.g. var(--color-text-success) for accuracy chip
}
```

Render with hairline rule above + the eyebrow/meta row. Apply to every editorial section in `page.tsx`.

⚠️ PUSHBACK TRIGGER: If the existing component has its own internal eyebrow rendering, the eyebrow either moves OUT (into the SectionHeader) and the component's internal eyebrow is removed, or the SectionHeader is skipped for that component and the component renders its own header in this style. Propose which approach you prefer for each component. Do not have two eyebrows.

### Where to apply (every editorial section)

- The numbers section (above metric cards grid)
- Why this is happening (above why-cards grid)
- What to do, in order (above action list)
- Reform timeline (above the timeline)
- Refine your estimate (above the settings panel)
- Model your outcome (above the slider)
- Is there a better option? (above the escape scenario card)
- Save the full report (above the artifact card)

The eyebrow text is sentence case (not Title Case, not ALL CAPS — though the CSS transforms it via `text-transform: uppercase`).

---

## HERO OVERHAUL (`VerdictSection.tsx`)

The current hero sits in a white card with rounded border. Drop the card. The hero becomes editorial.

### Current structure (drop)

White card with `var(--color-background-primary)` background, 0.5px border, rounded-lg, padding ~24px. Contains pill, eyebrow, P&L number (44px), serif headline.

### New structure

```
[Pill — situation X · severity]   ← unchanged
[28px space]
[Eyebrow — small uppercase]
[6px space]
[P&L number — 64px monospace, on paper background, no container]
[22px space]
[Serif headline — 24px, line-height 1.3, max-width 520px]
[14px space]
[Body paragraph — 14px sans, line-height 1.7, max-width 540px, secondary colour]
```

### Specifications

```css
/* Pill - existing styling preserved */
/* Eyebrow */
font-size: 11px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase;
color: var(--color-text-secondary);

/* P&L number - the hero */
font-family: var(--font-mono);
font-size: 64px;            /* desktop */
font-size-mobile: 44px;     /* ≤500px */
font-weight: 500;
letter-spacing: -0.03em;
line-height: 1;
color: var(--color-text-danger) /* if negative */ or var(--color-text-success) /* if positive */;

/* Serif headline */
font-family: var(--font-serif);
font-size: 24px;            /* desktop */
font-size-mobile: 19px;     /* ≤500px */
font-weight: 500;
line-height: 1.3;
letter-spacing: -0.01em;
max-width: 520px;

/* Body paragraph */
font-size: 14px;
line-height: 1.7;
color: var(--color-text-secondary);
max-width: 540px;
```

### Container

The hero has *no* card wrapper. It sits directly inside the page's content column with regular page padding. The visual hierarchy comes from the typography proportions — 64px monospace number is the design.

⚠️ PUSHBACK TRIGGER: If the existing card-style verdict has internal layout assumptions (e.g. the pill positions absolutely against the card edge, the body paragraph has specific spacing tied to card padding), propose how to refactor without breaking those.

---

## ACTION LIST OVERHAUL (`VerticalActionSteps.tsx`)

The data flow from `packages/calculations/actions.ts` is sacred — `priority`, `timeAnchor`, `text`, `script`, `why` continue to flow through unchanged. Only the visual treatment changes.

### Current visual

Each step has a numbered circle on the left and content on the right. The script callout, when present, sits inside a white card-style container with internal borders. Steps are separated by margin.

### New visual — vertical timeline pattern

```
[Coloured dot · 16x16, position: absolute, left: 0, top: 0]
[Vertical hairline · 1px, from below the dot down to the bottom of the step, position: absolute, left: 7px, top: 8px]
  ⤷ this line connects to the next step's dot, creating a continuous timeline
[Step content · padding-left: 36px]
  [Tier label + time anchor on one line — 4px below dot top]
  [Step title — 16px, weight 500, line-height 1.4]
  [Step body — 13px, secondary colour, line-height 1.65]
  [Script toggle — 11px uppercase, tertiary colour, "Show exact script ↓"]
  [(when expanded) Script — italic blockquote, light-bg with left-border accent]
[28px padding-bottom · creates breathing room between steps]
```

### Specifications

```css
/* Dot */
width: 16px; height: 16px; border-radius: 50%;
position: absolute; left: 0; top: 0;
/* Tier-coloured: */
background: var(--color-text-danger)   /* urgent */
background: var(--color-text-warning)  /* plan */
background: var(--color-background-primary); border: 1px solid var(--color-border-secondary)  /* monitor — outline only */

/* Connecting line */
position: absolute; left: 7px; top: 8px; bottom: 0;
width: 1px; background: var(--color-border-tertiary);
/* Last step: hide the line via :last-child::before { display: none } */

/* Step container */
position: relative;
padding: 0 0 28px 36px;

/* Tier label */
font-size: 10px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase;
color: tier-coloured (matching dot)

/* Time anchor */
font-family: var(--font-mono);
font-size: 11px; color: var(--color-text-tertiary);
letter-spacing: 0.04em; text-transform: uppercase;

/* Step title */
font-size: 16px; font-weight: 500; line-height: 1.4;
letter-spacing: -0.005em;
margin: 0 0 8px;

/* Step body */
font-size: 13px; color: var(--color-text-secondary);
line-height: 1.65; margin: 0;
```

### RAO framework (Cat 3/4 action 1) — inline mini-grid

The Recover · Absorb · Optimise framework currently renders as a card-within-a-card. New treatment: a 3-tile inline grid below the step body, before the toggle. Each tile is a small `var(--color-background-secondary)` block with a 1-line lever description and a 2-line context.

```
[grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin: 8px 0]
  [R · Recover via pricing]
  [A · Absorb from margin]
  [O · Optimise the cost]
```

On mobile (≤500px), the 3 tiles wrap to 2 columns with the third tile spanning both columns (`grid-column: span 2`).

### Final OCT deadline marker

The current `OCT DEADLINE 1 OCTOBER 2026 — Reform takes effect` marker stays as the last item in the timeline (visually distinct: filled black background dot or similar) but uses the same vertical-timeline structure.

⚠️ PUSHBACK TRIGGER: The current implementation may already be moving toward this pattern. Audit before refactoring — if the structure is already 70% there, the change is just CSS, not a rebuild.

---

## REFORM TIMELINE OVERHAUL (`ReformTimelineCompact.tsx`)

### Current visual (flat horizontal nodes)

Already exists from the ruthless cut brief. Five horizontal nodes connected by a thin line. Each node has dot + date + label + sub.

### New visual

Apply the SectionHeader pattern above the timeline. Drop any card wrapper if present.

**Desktop layout (≥501px)**: keep horizontal 5-node pattern. Improve spacing and typography:

```css
/* Date */
font-family: var(--font-mono); font-size: 11px;
color: var(--color-text-secondary); margin: 0;
/* Today: var(--color-text-success). 1 Oct: var(--color-text-danger). Others: secondary. */

/* Title */
font-size: 13px; font-weight: 500; margin: 3px 0;

/* Description */
font-size: 11px; color: var(--color-text-tertiary);
line-height: 1.5; margin: 0;
```

**Mobile layout (≤500px)**: switch to vertical list. Each row: dot + date stacked vs flex-row with date on left, content on right.

```
[12x12 dot · margin-top: 2px · flex-shrink: 0]
[content column · flex: 1]
  [Date — mono]
  [Title — weight 500]
  [Sub — tertiary]
[10px padding · 0.5px hairline border-bottom between rows]
```

The horizontal connecting line is dropped on mobile (vertical list doesn't need it).

⚠️ PUSHBACK TRIGGER: If the existing `ReformTimelineCompact` doesn't have a responsive breakpoint, this is the place to introduce one. Use the existing `min-width: 501px` breakpoint convention, not a new one.

---

## REFINE OVERHAUL (`RefinementPanel.tsx`)

### Current visual

Each refinement field is a separate card with its own border, internal padding, label/hint/chip/input layout.

### New visual — settings-panel rows

Apply the SectionHeader pattern above the panel (eyebrow "Refine your estimate", meta showing "Accuracy {N}%" coloured by current accuracy level — green at 65%+, amber at 40-64%, neutral below).

Each field becomes an inline editable row separated by hairlines:

```
[Row · flex, justify-between, align-items: center, padding: 16px 0]
  [Left column · flex: 1]
    [Field label — 14px, weight 500]
    [Hint — 12px, tertiary, margin-top: 2px]
  [Right column · flex, gap: 12px, align-items: center]
    [Source chip — 10px, mono, background by source]
    [Value — 18px monospace, weight 500, min-width 56px, text-align right]
[0.5px hairline border-bottom between rows]
```

Click any row to enter edit mode (the value becomes an inline input). On blur, recalculate and update the hero number live.

### Source chip styling

```css
font-size: 10px; padding: 3px 8px; border-radius: 4px;
font-family: var(--font-mono); letter-spacing: 0.04em;

/* Your input */
background: var(--color-background-success); color: var(--color-text-success);

/* RBA average / Industry default */
background: var(--color-background-secondary); color: var(--color-text-secondary);

/* Default / Not set */
background: var(--color-background-secondary); color: var(--color-text-tertiary);
```

### "More options" link

The 4th and 5th refinement fields (monthly debit transactions, minimum monthly fee) hide behind a "+ More options" link below the main 3 fields. Default state collapsed.

```css
/* More options link */
font-size: 11px; color: var(--color-text-info);
margin: 14px 0 0; cursor: pointer;
```

⚠️ PUSHBACK TRIGGER: If the live recalculation flow currently depends on a specific event handler attached to inputs in the card-per-field structure, propose how to preserve it inside the row pattern. The recalc behaviour is the value here — visual treatment is just chrome.

---

## MODEL YOUR OUTCOME (`PassThroughSlider.tsx`)

Cat 2 / Cat 4 only. Drop the card wrapper. Becomes editorial.

```
[SectionHeader: eyebrow "Model your outcome", meta "~45% pass-through · centre estimate"]
[Body paragraph — 13px, secondary, line-height 1.65, max-width 540px]
[18px space]
[Slider row — flex, gap 14px]
  [Min label — 11px tertiary mono]  [Range input · flex: 1]  [Max label — 11px tertiary mono]
[24px space]
[Result rows — three rows, each: flex justify-between, padding 14px 0, hairline below (except last)]
  [Row 1 · "Cost reduction in your Stripe rate" + amount in mono]
  [Row 2 · "Your net annual impact" + amount in mono]
  [Row 3 · "Net cost from October" + amount in mono]
```

No card. The section header signals where the section starts; the result rows with hairlines signal where it ends.

---

## ASSUMPTIONS PANEL (`AssumptionsPanel.tsx`)

Stay as-is in terms of *content*. Visual change: drop the card wrapper. The toggle becomes a simple text link, the expanded content uses hairline-separated rows like the refine panel.

```
[Toggle (default state) · "Show me exactly how this is calculated ↓" · 12px, tertiary, padding-top 18px, border-top 0.5px]
[(when expanded) Content · padding-top 14px, formula rows separated by hairlines]
```

No outer card. The expand behaviour is preserved.

---

## CARDS THAT STAY (do not touch)

- `MetricCards.tsx` — all 3 modes survive. The card chrome on the metric cards is correct (data records).
- `ProblemsBlock.tsx` — Cat 3/4/5 conditional rendering preserved. The semantic-coloured cards (red Surcharge ban, amber IC saving uncertain) survive.
- `EscapeScenarioCard.tsx` — green-tinted card with the savings figure. Stays as a card.
- `ArtifactCard.tsx` — the Email-me-the-PDF card. Stays as a card. Apply the SectionHeader pattern *above* it (eyebrow "Save the full report"); the existing card itself is unchanged.

These four card moments (or six if you count the four-cell metrics grid as four) are the only cards on the page. Verify after the overhaul that no other cards remain anywhere.

---

## TYPOGRAPHY HIERARCHY (THE COMPLETE PICTURE)

Use these exact specifications throughout:

| Role | Family | Size | Weight | Letter-spacing | Line-height |
|---|---|---|---|---|---|
| Hero number | mono | 64px / 44px mobile | 500 | -0.03em | 1.0 |
| Hero serif headline | serif | 24px / 19px mobile | 500 | -0.01em | 1.3 |
| Section eyebrow | sans | 11px | 500 | 0.14em | — |
| Meta (right-aligned) | mono | 11px | 400 | 0.04em | — |
| Card eyebrow (inside cards) | sans | 10px | 500 | 0.08em uppercase | — |
| Metric card value | mono | 22px | 500 | -0.01em | 1.0 |
| Step title | sans | 16px | 500 | -0.005em | 1.4 |
| Step body | sans | 13px | 400 | — | 1.65 |
| Tier label | sans | 10px | 500 | 0.14em uppercase | — |
| Time anchor | mono | 11px | 400 | 0.04em uppercase | — |
| Settings row label | sans | 14px | 500 | — | — |
| Settings row hint | sans | 12px | 400 | — | — |
| Settings row value | mono | 18px | 500 | — | — |
| Body paragraph | sans | 14px | 400 | — | 1.7 |
| Disclaimer | sans | 11px | 400 | — | 1.6 |

Two weights only: 400 and 500. Never 600 or 700.

---

## MOBILE CONSIDERATIONS

The editorial pattern translates more cleanly to mobile than dashboard, but two things need explicit attention:

1. **The 5-column reform timeline goes vertical at ≤500px.** See "Reform timeline overhaul" above.

2. **The 3-column action-list RAO framework goes 2-column with last item spanning both at ≤500px.** See "Action list overhaul" above.

3. **The 64px hero number scales to 44px at ≤500px.** Check that `−$XXX,XXX` doesn't overflow at 380px viewport with 16-24px page padding. If a 7-digit P&L overflows, scale to 40px or wrap with smaller dollar sign.

4. **Page padding at mobile**: 16-20px horizontal, not 24-32px. Maximise content width on small screens. Cards and content should be edge-to-edge with minimal page padding.

5. **The existing top bar simplification (from the ruthless cut)** survives. On mobile, the inline nav links collapse to a hamburger; the brand + situation pill + P&L number stay visible.

---

## BUILD SEQUENCE

Three milestones. Do not collapse them.

### Milestone 1 — Section header foundation

```
feat(results): SectionHeader component + typography token alignment

- Create apps/web/components/results/SectionHeader.tsx (eyebrow + meta + hairline rule)
- Audit existing typography styles against the spec table; align where needed
- Apply SectionHeader to all editorial sections in page.tsx (no other changes yet)
- Visual change should be subtle: section dividers become consistent
```

Self-audit:
- All existing tests pass
- Cat 1 / 2 / 3 / 4 / 5 results render
- Section headers appear consistently above the numbers, why, action list, reform timeline, refine, model, escape, artifact

### Milestone 2 — Hero + action list visual overhaul

```
feat(results): editorial hero treatment + vertical timeline action list

- VerdictSection: drop card wrapper, restructure hero composition
- VerticalActionSteps: vertical-line + dots pattern, drop card-style step containers
- Scripts visible by default with toggle; RAO inline mini-grid
- Verify mobile responsive (44px hero number, RAO 2-col fallback)
- Verify no test regressions
```

Self-audit:
- Hero P&L number is 64px on desktop, 44px on mobile
- Action list reads as one continuous timeline visually
- All actions for Cat 1-5 render correctly
- RAO framework only shows for Cat 3/4 action 1
- Scripts toggle still works (collapse/expand state preserved)

### Milestone 3 — Refine + model + assumptions visual overhaul

```
feat(results): settings-panel refine + editorial slider + editorial assumptions

- RefinementPanel: settings-list rows (no card per field), inline editing
- PassThroughSlider: drop card wrapper, three result rows with hairlines
- AssumptionsPanel: drop card wrapper, expand-on-demand only
- "More options" link revealing fields 4 and 5 in refine
- Live recalculation flow preserved
```

Self-audit:
- Editing refine field updates hero number live
- Cat 2 / Cat 4 see slider and escape scenario inside the right sections
- Assumptions toggle expand/collapse works
- All tests still pass
- Settings rows are tappable on mobile (44px tap targets)

---

## VISUAL REFERENCE

The end-state visual reference exists as two mockups (desktop and mobile) produced during the design conversation. Treat them as the visual target — they show:

- Hero treatment with 64px floating P&L number
- Section header pattern (hairline + eyebrow + meta) repeated consistently
- Vertical-timeline action list
- Settings-panel refine rows
- Compact horizontal-on-desktop / vertical-on-mobile reform timeline
- Six card moments (metrics, why-cards, escape, artifact) and editorial flow everywhere else

If the implementation diverges from the visual targets, propose the divergence in a pushback before shipping.

---

## WHAT THIS BRIEF IS NOT

This brief is purely about visual treatment. It does not cover:

- Any change to the assessment wizard or homepage.
- Any change to the EmailGate flow.
- Any change to the calculation engine.
- Any change to the PDF generation or email sending logic from the cut brief.
- Any new database columns or schema changes.
- Any change to the section structure beyond what's described — the same sections appear in the same order; only their visual chrome changes.
- Any change to the strategic-rate-exit variant or the FeedbackModal.

---

## ESTIMATED EFFORT

Approximately 8–12 hours of Claude Code time for the full overhaul:

- Milestone 1 (SectionHeader + typography audit): 2–3 hours
- Milestone 2 (hero + action list): 3–5 hours
- Milestone 3 (refine + slider + assumptions): 3–4 hours

Each milestone is shippable independently and incrementally improves the page's visual coherence.

---

## REFERENCE FILES

```
Cut brief (predecessor):     docs/design/RESULTS_RUTHLESS_CUT_BRIEF.md
Tone of voice:               docs/content/tone-of-voice.md
Design tokens:               docs/design/design-tokens.md
UX rationale:                docs/design/ux-design.md
Tailwind config:             apps/web/tailwind.config.ts
Global CSS:                  apps/web/app/globals.css
Action source of truth:      packages/calculations/actions.ts (do not modify)
Verdict copy source:         packages/calculations/categories.ts (do not modify)
Calculation engine:          packages/calculations/calculations.ts (do not modify)
```

---

*Brief produced May 2026. Authoritative for the results page editorial overhaul.*
*Builds on RESULTS_RUTHLESS_CUT_BRIEF.md — do not undo any of that work.*
*Challenge anything that conflicts with the codebase you read.*
*The end state: a results page that reads like a Stripe / Linear / Mercury / Vercel page in 2026, not a 2019 SaaS dashboard.*
