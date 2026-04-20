# Change Plan — nosurcharging.com.au UX Revamp
## docs/design/change-plan.md

Populated from an actual codebase audit on 2026-04-07.
Follows the template at `docs/design/revamp-change-plan-template.md`.

---

## STATUS: [ ] INCOMPLETE  [x] COMPLETE — AWAITING SIGN-OFF

---

## PRE-AUDIT RESOLUTIONS — deviations from the revamp package

These three deviations between the revamp package and the real codebase were
identified before writing this plan. The actual codebase wins.

| # | Revamp package says | Reality | Resolution |
|---|---|---|---|
| D1 | `lib/calculations.ts`, `lib/categories.ts`, `lib/constants.ts` | `packages/calculations/{calculations,actions,constants}.ts` inside a Turborepo workspace | Use the real paths throughout. The revamp package author didn't know the repo is a monorepo. |
| D2 | Current amber hex is `#B8840A`, token named `amber-*` | Actual amber palette: `amber.50 #FAEEDA / amber.200 #EF9F27 / amber.400 #BA7517 / amber.800 #633806`. Chart scheme uses `#BA7517`. | Migrate all 95 occurrences across 32 files from `amber` + `#BA7517` family → `accent` (#1A6B5A). Details in Section B.4. |
| D3 | Package sits at `nosurcharging-revamp-package/` at repo root | Package was intended for `docs/design/` | Moved all 5 files to `docs/design/revamp-*.md`. Done. |

---

## SECTION A — CODEBASE AUDIT

### A.1 — Component inventory

Every `.tsx` file under `apps/web/app/` and `apps/web/components/`, with purpose
and whether it reads from the calculation output. 36 files total.

#### Pages (`apps/web/app/`)

| File | Purpose | Reads calc output? |
|---|---|---|
| `app/layout.tsx` | Root HTML, loads fonts, Plausible script, Vercel analytics | No |
| `app/page.tsx` | Homepage SSR — Nav + HeroSection + PreviewSection + FeaturesSection + Footer | No |
| `app/assessment/page.tsx` | Assessment flow (client) — disclaimer → steps 1-4 → reveal → redirect | No |
| `app/results/page.tsx` | Results page — fetches assessment, passes `outputs`/`volume`/`pspName` to children | Yes (top-level — re-runs calc on slider input) |
| `app/privacy/page.tsx` | Privacy policy SSR | No |

#### Homepage components (`components/homepage/`)

| File | Purpose | Reads calc output? |
|---|---|---|
| `HeroSection.tsx` | Dark hero, headline + sub + CTA + trust row | No — all static copy |
| `PreviewSection.tsx` | 4-tab rotating preview of category outcomes | No — hardcoded illustrative data |
| `FeaturesSection.tsx` | "How it works" 3-step explanation | No |
| `Footer.tsx` | Footer links, attribution | No |

#### Assessment components (`components/assessment/`)

| File | Purpose | Reads calc output? |
|---|---|---|
| `DisclaimerConsent.tsx` | Consent gate — creates session + records consent (server actions) | No |
| `Step1Volume.tsx` | Annual card volume input | No |
| `Step2PlanType.tsx` | Flat vs cost-plus choice + optional MSF rate | No |
| `Step3Surcharging.tsx` | Surcharging yes/no + rate + networks | No |
| `Step4Industry.tsx` | Industry picker | No |
| `CardMixInput.tsx` | Optional 7-field card mix panel | No |
| `ExpertPanel.tsx` | Expert wizard rates panel | No |
| `RevealScreen.tsx` | 1.1s dark reveal with pulsing dot + server action fire | No |

#### Results components (`components/results/`)

| File | Purpose | Reads calc output? |
|---|---|---|
| `VerdictSection.tsx` | Category pill + confidence chip + hero P&L number + body | **Yes** — `category`, `plSwing`, `confidence`, `psp`, volume |
| `MetricCards.tsx` | 3-card grid: today net / October net / IC saving | **Yes** — `netToday`, `octNet`, `icSaving` |
| `ReformTimeline.tsx` | Static 3-date timeline (1 Oct 26, 30 Oct 26, 1 Apr 27) | No |
| `PassThroughSlider.tsx` | Interactive 0–100% slider, re-runs `calculateMetrics` | **Yes** — `icSaving`, `psp`, `planType`; writes back `outputs` |
| `EscapeScenarioCard.tsx` | Current-plan vs cost-plus-escape comparison | **Yes** — `netToday`, `octNet`, computes `costPlusOctNet` in component |
| `ActionList.tsx` | Renders `outputs.actions[]` grouped by `priority` | **Yes** — `actions[]` via type cast |
| `AssumptionsPanel.tsx` | Collapsible: RBA citation + resolution trace + CostBreakdownChart | **Yes** — `resolutionTrace`, plus renders `<CostBreakdownChart>` |
| `EmailCapture.tsx` | Email signup form (contractual copy) | No |
| `ConsultingCTA.tsx` | Category-specific paid consulting offer | **Yes** — `category` |
| `PSPRateRegistry.tsx` | 3-field anonymous rate contribution form | No |
| `ResultsDisclaimer.tsx` | Bottom "verify with your PSP" strip | No |

#### Chart components (`components/charts/`)

| File | Purpose | Reads calc output? |
|---|---|---|
| `WaterfallChart.tsx` | Primary visual: today vs October stacked bars | **Yes** — all breakdown fields + invariant throw |
| `CostBreakdownChart.tsx` | 4-segment breakdown chart (used inside AssumptionsPanel today) | **Yes** — all breakdown fields + invariant throw |

#### UI primitives (`components/ui/`)

| File | Purpose | Reads calc output? |
|---|---|---|
| `AmberButton.tsx` | Primary CTA button — `bg-amber-400 text-amber-50` | No |
| `TextButton.tsx` | Inline text link button | No |
| `Card.tsx` | Section card wrapper, `rounded-xl`, selected border `amber-400` | No |
| `PillBadge.tsx` | Small pill — variants amber/green/red/grey, `rounded-pill` | No |
| `ProgressBar.tsx` | Assessment progress bar | No |
| `StepCounter.tsx` | "Step n of 4" counter | No |

### A.2 — Calculation output type

Pasted verbatim from `packages/calculations/types.ts:118-135`:

```typescript
export interface AssessmentOutputs {
  category: 1 | 2 | 3 | 4;
  icSaving: number;
  debitSaving: number;
  creditSaving: number;
  todayInterchange: number;   // EXISTS — revamp doc said "LIKELY MISSING"
  todayMargin: number;        // EXISTS — revamp doc said "LIKELY MISSING"
  grossCOA: number;           // EXISTS — revamp doc said "LIKELY MISSING"
  annualMSF: number;
  surchargeRevenue: number;   // EXISTS — revamp doc said "CHECK EXISTS"
  netToday: number;
  octNet: number;
  plSwing: number;
  todayScheme: number;        // EXISTS — revamp doc said "LIKELY MISSING"
  oct2026Scheme: number;      // Invariant: === todayScheme
  confidence: Confidence;
  period: ReformPeriod;
}
```

**This is the single biggest positive finding of the audit.** Every cost-breakdown
field that `CostCompositionChart` and `ProblemsBlock` need already exists in the
engine. Zero new calculation fields are required for these components.

Note: `AssessmentOutputs` does **not** include `resolutionTrace`, `psp`, `volume`
or `actions` — those are threaded separately:
- `resolutionTrace` is on `ResolvedAssessmentInputs.resolutionTrace`, passed to
  `AssumptionsPanel` as a prop from the resolved inputs (not from outputs).
- `psp` / `volume` come from `assessment.inputs` and are passed as separate props.
- `actions[]` is currently accessed in `app/results/page.tsx:163` via an unsafe cast:
  `(outputs as unknown as { actions?: ActionItem[] }).actions ?? []`.
  **This cast is a code smell** — the actions are stored on the DB record alongside
  outputs, not inside the outputs object. Leave the cast alone for now; fixing it
  is out of scope for this revamp.

`costPlusOctNet` — not on `AssessmentOutputs`. Derived inside
`EscapeScenarioCard.tsx` via a `useMemo` that runs a mock calc. Leave that
pattern as-is; the revamp only asks for copy updates to that card.

`icSavingFull` — also not on outputs. Not needed — `icSaving` already represents
the total saving at 100% pass-through.

### A.3 — Action type

Pasted verbatim from `packages/calculations/types.ts:139-145`:

```typescript
export type ActionPriority = 'urgent' | 'plan' | 'monitor';

export interface ActionItem {
  priority: ActionPriority;
  timeAnchor: string;
  text: string;
}
```

**Missing fields the revamp requires:**
- `script` — word-for-word call script, currently baked into `text` for Cat 1/2
  (e.g. `Call ${psp} and say: "..."`). Needs to be extracted into its own field.
- `why` — plain-English stake explanation. Does not exist anywhere.

**Migration pattern (Section B shows calculations):**
```typescript
export interface ActionItem {
  priority: ActionPriority;
  timeAnchor: string;
  text: string;      // the instruction
  script?: string;   // optional word-for-word script (only where applicable)
  why?: string;      // optional stakes explanation
}
```

Optional on the type (so existing tests don't break) but ALL Cat 1-4 actions
in `actions.ts` will be updated to provide `why`, and all phone-based actions
will provide `script`.

### A.4 — Current colour tokens

Pasted verbatim from `apps/web/tailwind.config.ts:12-25`:

```typescript
colors: {
  amber: {
    50: '#FAEEDA',
    200: '#EF9F27',
    400: '#BA7517',  // the primary accent — NOT #B8840A as revamp doc claims
    800: '#633806',
  },
  chart: {
    interchange: '#E24B4A',
    scheme: '#BA7517',
    margin: '#888780',
    surcharge: '#3B6D11',
  },
},
```

Plus semantic variables in `apps/web/app/globals.css`:
- `--color-background-warning`, `--color-text-warning`, `--color-border-warning`
  all currently map to amber values and flip in dark mode.
- `--chart-scheme: #BA7517` is a direct-hex CSS var consumed by chart components.
- **Page background is currently `#FFFFFF`** (`--color-background-base`), NOT
  `#FAF7F2` as the revamp system wants.

---

## SECTION B — MISSING FIELDS ANALYSIS

### B.1 — Field existence matrix

| Field | Component that needs it | Exists in output? | Action needed |
|---|---|---|---|
| `todayInterchange` | CostCompositionChart | **Yes** | None |
| `todayScheme` | CostCompositionChart | **Yes** | None |
| `todayMargin` | CostCompositionChart | **Yes** | None |
| `grossCOA` | CostCompositionChart | **Yes** | None |
| `annualMSF` | CostCompositionChart (flat rate) | **Yes** | None |
| `surchargeRevenue` | ProblemsBlock | **Yes** | None |
| `costPlusOctNet` | EscapeScenarioCard | No — derived in component via `useMemo` | Leave derivation in place |
| `icSavingFull` | EscapeScenarioCard | No — same as `icSaving` at 100% | Use `icSaving` directly |
| `action.script` | ActionList | **No** | Add optional field to `ActionItem`, populate in `buildActions` |
| `action.why` | ActionList | **No** | Add optional field to `ActionItem`, populate in `buildActions` |
| `outputs.inputs.psp` | Multiple | Not on `AssessmentOutputs` | Use separate `pspName` prop (existing pattern) |

### B.2 — Fields to ADD before component work begins

Only two. Both are on `ActionItem`, not `AssessmentOutputs`.

```
1. ActionItem.script?: string
2. ActionItem.why?: string
```

### B.3 — Calculation logic for new fields

No new calculation logic. Both new fields are literal strings authored by hand
in `buildActions()`. Copy source: `docs/design/revamp-ux-spec.md` Section 3.4.

Exact populator changes (all in `packages/calculations/actions.ts`):

```typescript
// Cat 1 — example of existing action becoming enriched:
{
  priority: 'plan',
  timeAnchor: 'Before August 2026',
  text: `Call ${psp} about interchange cap pass-through`,   // CHANGED — was the full sentence
  script: `"Interchange is falling on 1 October as part of the RBA reform. ` +
          `Can you confirm my cost-plus rate will reflect the new interchange ` +
          `caps automatically?"`,
  why: `On cost-plus, the saving is supposed to flow through automatically — ` +
       `but you want ${psp} to confirm it in writing before October so there ` +
       `are no surprises.`,
}
```

Apply the same pattern to every action in every category. The `text` becomes a
short instruction, `script` holds the quoted dialogue (where relevant), and
`why` holds the plain-English stake. Full copy is in the ux-spec.

### B.4 — Amber → accent token migration (Phase 1 scope)

This is a colour token rename plus hex value change, not a structural rewrite.

**Mapping:**
```
OLD Tailwind class        →  NEW Tailwind class     Rationale
─────────────────────────────────────────────────────────────────────────
amber.50  (#FAEEDA)       →  accent-light (#EBF6F3)  Light tint of new accent
amber.200 (#EF9F27)       →  accent-border (#72C4B0) Mid-tone border
amber.400 (#BA7517)       →  accent (#1A6B5A)         Primary accent
amber.800 (#633806)       →  accent-dark (#0D4A3C)   Dark text / hover

chart.scheme (#BA7517)    →  chart.scheme (#1A6B5A)  Recolour the scheme segment
```

**Scope of the migration (verified by grep):**
- 95 occurrences across 32 files (27 in `apps/web/`, plus 3 test files + 2 configs).
- All `text-amber-*`, `bg-amber-*`, `border-amber-*`, `ring-amber-*`,
  `accent-amber-*` classes rewrite mechanically.
- Direct hex references in hardcoded `style={{...}}` blocks:
  - `#BA7517` (primary) — 14+ hardcoded uses in HeroSection, PassThroughSlider,
    ConsultingCTA, EmailCapture, app/page.tsx, etc.
  - `#FAEEDA` — used as CTA text color on dark backgrounds.
  - `#EF9F27` — used as kicker/eyebrow text in HeroSection.
- Tailwind config + globals.css CSS vars + 3 test files (`Step4Industry.test.tsx`,
  `CardMixInput.test.tsx`, `ActionList.test.tsx`) that assert amber class names.

**Naming decision:** rename `AmberButton.tsx` → `AccentButton.tsx` (and update
imports) as part of Phase 1. Clean rename beats a misleading legacy name.

---

## SECTION C — COMPLETE FILE CHANGE LIST

### Phase 1 — Token migration (one commit, one PR)

```
apps/web/tailwind.config.ts              UPDATE — replace amber palette with accent + chart.scheme recolour
apps/web/app/globals.css                 UPDATE — amber CSS vars → accent, --color-background-base → #FAF7F2
apps/web/components/ui/AmberButton.tsx   RENAME → AccentButton.tsx, classes amber→accent
apps/web/components/ui/Card.tsx          UPDATE — border-amber-400 → border-accent
apps/web/components/ui/PillBadge.tsx     UPDATE — amber variant → accent variant
apps/web/components/ui/ProgressBar.tsx   UPDATE — amber classes → accent
apps/web/components/ui/StepCounter.tsx   UPDATE — amber classes → accent
apps/web/app/page.tsx                    UPDATE — #BA7517 hex in nav logo + nav link
apps/web/app/assessment/page.tsx         UPDATE — imports AmberButton (rename)
apps/web/app/results/page.tsx            UPDATE — imports if any
apps/web/components/homepage/HeroSection.tsx        UPDATE — 4 amber refs (hex + classes)
apps/web/components/homepage/PreviewSection.tsx     UPDATE — 5 amber refs
apps/web/components/homepage/FeaturesSection.tsx    UPDATE — 2 amber refs
apps/web/components/assessment/DisclaimerConsent.tsx UPDATE — 2 amber refs
apps/web/components/assessment/Step1Volume.tsx      UPDATE — 5 amber refs
apps/web/components/assessment/Step2PlanType.tsx    UPDATE — 4 amber refs
apps/web/components/assessment/Step3Surcharging.tsx UPDATE — 3 amber refs
apps/web/components/assessment/Step4Industry.tsx    UPDATE — 4 amber refs
apps/web/components/assessment/CardMixInput.tsx     UPDATE — 3 amber refs
apps/web/components/assessment/ExpertPanel.tsx      UPDATE — 3 amber refs
apps/web/components/assessment/RevealScreen.tsx     UPDATE — 1 amber ref (pulse dot)
apps/web/components/results/VerdictSection.tsx      UPDATE — 2 amber refs
apps/web/components/results/ReformTimeline.tsx      UPDATE — 6 amber refs
apps/web/components/results/ActionList.tsx          UPDATE — 1 amber ref (date chip)
apps/web/components/results/PassThroughSlider.tsx   UPDATE — 2 amber refs
apps/web/components/results/EscapeScenarioCard.tsx  UPDATE — 1 amber ref
apps/web/components/results/ConsultingCTA.tsx       UPDATE — 1 amber ref
apps/web/components/results/EmailCapture.tsx        UPDATE — 1 amber ref
apps/web/components/charts/WaterfallChart.tsx       UPDATE — chart.scheme recolour
apps/web/components/charts/CostBreakdownChart.tsx   UPDATE — chart.scheme recolour
apps/web/__tests__/components/ActionList.test.tsx   UPDATE — assertion strings amber→accent
apps/web/__tests__/components/CardMixInput.test.tsx UPDATE — assertion strings
apps/web/__tests__/components/Step4Industry.test.tsx UPDATE — assertion strings
apps/web/e2e/card-mix.spec.ts                       UPDATE — assertion strings
apps/web/tailwind.config.ts                         UPDATE — add `paper`, `rule`, `ink` tokens per system.md
```

Plus: add the missing design tokens from `docs/design/revamp-system.md`:
- `paper #FAF7F2`, `paper-secondary #F3EDE4`, `ink #1A1409`, `ink-secondary #3D3320`,
  `ink-muted #6B5E4A`, `ink-faint #9A8C78`, `rule #DDD5C8`, plus the green/red
  P&L bg pairs.
- **Do not delete** the existing semantic `--color-*` CSS variables in
  `globals.css` yet — components still reference them. Repoint them instead.

### Phase 2 — Homepage (one PR, stack on Phase 1)

```
apps/web/app/page.tsx                         UPDATE — add ProofBar + TrustBar to composition, nav CTA copy, remove ConsultingCTA if present (not currently on homepage)
apps/web/components/homepage/ProofBar.tsx     CREATE — static 3-item proof bar, accent-light bg
apps/web/components/homepage/TrustBar.tsx     CREATE — static trust statements
apps/web/components/homepage/HeroSection.tsx  UPDATE — headline italic "Your", sub copy, CTA copy, banned-word removal ("your PSP")
apps/web/components/homepage/PreviewSection.tsx  REPLACE implementation — 4-tab rotating → 2×2 SituationsGrid, rename internally, "Situation N" not "Category N", flag as illustrative examples
apps/web/components/homepage/FeaturesSection.tsx UPDATE — step hint copy per ux-spec §1.6
```

Note: The current `PreviewSection.tsx` is the 4-tab rotating preview. The revamp
wants a static 2×2 grid with "Situation N" labelling. Replace the implementation
in place (keep the file name) — one component, not a new + delete pair.

### Phase 3 — Disclaimer (one PR, stack on Phase 1)

```
apps/web/components/assessment/DisclaimerConsent.tsx  UPDATE — four commitment items, white checkbox area, natural-width centred CTA
```

**Do NOT change:**
- The `<input type="checkbox">` element or its `checked` state
- The `createSession()` call at `app/assessment/page.tsx` or equivalent
- The `recordConsent()` server action call
- The form submission flow and redirect

This file is the single highest-sensitivity component in the whole revamp.
Copy + wrapper markup only.

### Phase 4 — Results (MUST BE INTERNALLY ORDERED — see Section D)

```
packages/calculations/types.ts                UPDATE — add `script?: string` and `why?: string` to ActionItem
packages/calculations/actions.ts              UPDATE — populate script + why for every Cat 1-4 action
packages/calculations/__tests__/actions.test.ts  CREATE or UPDATE — test the new fields on a sample
apps/web/__tests__/components/ActionList.test.tsx  UPDATE — render assertions for script + why
                                                    ─── Commit boundary here ───
apps/web/app/results/page.tsx                 UPDATE — new section order, primary zone vs depth zone, renders DepthToggle
apps/web/components/results/VerdictSection.tsx     UPDATE — daily anchor derived value, new headline, banned-word removal, "Situation N" not "Category N"
apps/web/components/results/ProblemsBlock.tsx       CREATE — new component, CERTAIN/DEPENDS variants driven by planType + surcharging
apps/web/components/results/DepthToggle.tsx         CREATE — new UI-only toggle wrapping the depth zone
apps/web/components/results/ActionList.tsx         UPDATE — render action.script (italic, border-left) and action.why (ink-faint)
apps/web/components/results/PassThroughSlider.tsx  UPDATE — intro copy rewrite (remove "Stripe keeps the full"), labels, accent token migration
apps/web/components/results/EscapeScenarioCard.tsx UPDATE — copy only
apps/web/components/results/CostCompositionChart.tsx CREATE — new component wrapping/replacing CostBreakdownChart behaviour in the depth zone
apps/web/components/results/AssumptionsPanel.tsx   UPDATE — toggle label, formula display rows, REMOVE the CostBreakdownChart render (moves out)
apps/web/components/results/ConsultingCTA.tsx      UPDATE — copy only
apps/web/components/results/SkeletonLoader.tsx     CREATE — new loading-state component
apps/web/components/charts/CostBreakdownChart.tsx  UPDATE — optional: retire or repurpose (see Open Q2)
apps/web/components/charts/WaterfallChart.tsx      ???     — see Open Q1
```

### Phase 5 — Mobile audit @ 375px

No new files. Adjust `max-[500px]:` rules in every touched component as needed.

### Phase 6 — Accessibility audit

No new files. Verify `:focus-visible` ring, `aria-expanded` on DepthToggle,
contrast ratios (accent on paper, ink-muted on white).

### Phase 7 — Final verification

No new files. Full test suite + Playwright E2E run + visual audit + lighthouse.

---

## SECTION D — SYNC RISK REGISTER

### D.1 — Sync risks

| Risk | Component | Depends On | Change Order |
|---|---|---|---|
| `action.script` undefined | ActionList.tsx | types.ts + actions.ts + buildActions tests | Add to engine first (Phase 4 sub-commit 1) |
| `action.why` undefined | ActionList.tsx | types.ts + actions.ts + buildActions tests | Add to engine first (Phase 4 sub-commit 1) |
| `paper` token missing in Tailwind | Every component referencing it | tailwind.config.ts | Phase 1 first, then any component can use it |
| `accent` token missing | Every amber→accent rename | tailwind.config.ts | Phase 1 must land before Phases 2-4 |
| `CostBreakdownChart` moves | AssumptionsPanel | CostCompositionChart creation | Create new component BEFORE removing old reference |
| Scheme fees chart colour change | WaterfallChart + CostBreakdownChart | chart.scheme token change | Both read from the same token — single atomic change |

### D.2 — Fields that cannot be touched (from component-map.md §7)

These names are hard-referenced by tests and downstream analytics. NEVER rename
or remove: `outputs.category`, `outputs.plSwing`, `outputs.icSaving`,
`outputs.inputs.planType`, `outputs.inputs.psp`, `outputs.inputs.volume`,
`outputs.inputs.surchargeRate`, `outputs.actions`, `outputs.todayScheme`,
`outputs.oct2026Scheme` (invariant), `outputs.grossCOA`.

### D.3 — Sequential changes that cannot be parallelised

```
1. tailwind.config.ts add new tokens (paper, accent, ink, rule)      ← Phase 1 sub-step 1
2. amber → accent class rename across 32 files                        ← Phase 1 sub-step 2
3. test assertion updates                                             ← Phase 1 sub-step 3
4. amber palette deletion from tailwind.config.ts                     ← Phase 1 sub-step 4 (gate: green tests)

1. ActionItem type adds script + why                                  ← Phase 4 sub-step 1
2. buildActions() populates script + why                              ← Phase 4 sub-step 1
3. actions.test.ts updated                                            ← Phase 4 sub-step 1
4. ActionList.tsx renders the new fields                              ← Phase 4 sub-step 2
```

---

## SECTION E — COPY-ONLY CHANGES (zero sync risk)

From the ux-spec, these are pure copy changes with no data dependency:

```
HeroSection.tsx         — headline italic "Your", sub copy, CTA copy, proof row
FeaturesSection.tsx     — step hint copy updates
DisclaimerConsent.tsx   — 4 commitment items, CTA label
PassThroughSlider.tsx   — intro copy, slider labels, note (banned-word removal)
EscapeScenarioCard.tsx  — explanatory copy refresh
ConsultingCTA.tsx       — headline + sub copy + category-specific rewrites
Nav (app/page.tsx)      — CTA label
ResultsDisclaimer.tsx   — remove banned phrase "verify with your PSP"
```

---

## SECTION F — TEST IMPACT ASSESSMENT

### F.1 — Current test baseline (must not regress)

Measured 2026-04-07 on `feature/ux-revamp` branch (HEAD of main):

```
packages/calculations test:unit:  67 tests passing
apps/web          test:unit:     149 tests passing
─────────────────────────────────────────────────
TOTAL                             216 tests passing
```

Plus Playwright E2E specs under `apps/web/e2e/`:
- `card-mix.spec.ts` (references amber classes — will need updating)
- Other E2E specs as inventoried in the pre-launch audit

**Rule: test count MUST NOT fall below 216 after the revamp.**
New components SHOULD add tests — target is ≥ 216 + (count of new components).

### F.2 — Test files that will break

| Test file | What it tests | Will revamp break it? | Why | Required update |
|---|---|---|---|---|
| `apps/web/__tests__/components/ActionList.test.tsx` | ActionList rendering + amber date chip | **Yes** | Asserts `text-amber-*` classes; new script/why rows | Update class assertions, add script/why render test |
| `apps/web/__tests__/components/CardMixInput.test.tsx` | Card mix input | **Yes** | Asserts amber classes | Update class assertions only |
| `apps/web/__tests__/components/Step4Industry.test.tsx` | Industry step | **Yes** | Asserts amber classes | Update class assertions only |
| `apps/web/e2e/card-mix.spec.ts` | E2E card mix flow | **Yes** | Asserts amber class | Update class assertion |
| `packages/calculations/__tests__/*.test.ts` | Calculation engine | **No** | No UI, no colour dependency | None |
| Other `apps/web/__tests__/` specs | Various | **No** (grep confirms no amber references) | | None |

### F.3 — New tests to add

| New component | Minimum test |
|---|---|
| `ProofBar.tsx` | Renders 3 proof items, correct text |
| `TrustBar.tsx` | Renders trust statements |
| `ProblemsBlock.tsx` | Cat 1/2: DEPENDS variant; Cat 3/4: CERTAIN variant; PSP name interpolation |
| `DepthToggle.tsx` | Toggle state + aria-expanded |
| `CostCompositionChart.tsx` | Renders + scheme fees invariant (same throw as existing CostBreakdownChart) |
| `SkeletonLoader.tsx` | Renders with role=status |
| `AccentButton.tsx` | Rename of AmberButton — rename existing test file if any, otherwise add smoke test |

`buildActions()` gets a new test file at
`packages/calculations/__tests__/actions.test.ts` (doesn't currently exist)
asserting that every Cat 1-4 action has a non-empty `why` and that relevant
actions have a non-empty `script`.

---

## SECTION G — COMMIT PLAN

Each commit is atomic, testable, and can be reviewed in isolation. Each Phase is
a sub-PR against `feature/ux-revamp`; after all phases are green, `feature/ux-revamp`
merges to `staging` → production.

```
Phase 1 — Token migration
  Commit 1a: design: add paper, accent, ink, rule tokens to tailwind.config
  Commit 1b: design: migrate amber → accent across app (95 refs, 32 files)
  Commit 1c: design: rename AmberButton → AccentButton
  Commit 1d: design: update tests + e2e for accent tokens
  Commit 1e: design: delete legacy amber palette from tailwind.config

Phase 2 — Homepage
  Commit 2a: feat: add ProofBar component (static, accent-light bg)
  Commit 2b: feat: add TrustBar component (static)
  Commit 2c: feat(hero): refresh copy + italic Your + CTA
  Commit 2d: feat(homepage): replace PreviewSection with SituationsGrid 2×2
  Commit 2e: feat(features): update step-hint copy
  Commit 2f: feat(homepage): new page composition (nav + sections order)

Phase 3 — Disclaimer
  Commit 3a: feat(disclaimer): four commitments + wrapper (no server-action changes)

Phase 4 — Results
  Commit 4a: calc: add optional script + why to ActionItem type
  Commit 4b: calc: populate script + why in buildActions for all categories
  Commit 4c: test: add actions.test.ts covering script + why presence
  Commit 4d: feat(results): restructure page — primary zone vs depth zone
  Commit 4e: feat(results): VerdictSection daily anchor + situation copy
  Commit 4f: feat(results): add ProblemsBlock (CERTAIN/DEPENDS variants)
  Commit 4g: feat(results): add DepthToggle
  Commit 4h: feat(results): ActionList renders script + why
  Commit 4i: feat(results): add CostCompositionChart in depth zone
  Commit 4j: refactor(results): AssumptionsPanel drops embedded chart + formula rows
  Commit 4k: feat(results): PassThroughSlider + EscapeScenarioCard copy refresh
  Commit 4l: feat(results): ConsultingCTA copy refresh
  Commit 4m: feat(results): add SkeletonLoader

Phase 5 — Mobile audit
  Commit 5a: fix(mobile): breakpoint adjustments at 375px

Phase 6 — Accessibility
  Commit 6a: a11y: focus states, aria-expanded, contrast fixes

Phase 7 — Final
  Commit 7a: docs: mark change-plan complete, close revamp task list
```

Total: ~30 commits across 7 phases. Each phase is its own sub-PR for review sanity.

---

## SECTION H — OPEN QUESTIONS — RESOLVED 2026-04-07

- **Q1 — WaterfallChart:** REMOVE. Not listed in revamp primary zone, competes with hero P&L.
- **Q2 — CostBreakdownChart:** RENAME IN PLACE to `CostCompositionChart.tsx`, update props/labels.
- **Q3 — ConsultingCTA on homepage:** Confirmed not present. No change.
- **Q4 — Banned-word snapshot test:** No. Fix them in-place; no enforcement test.
- **Q5 — Top site-wide disclaimer banner on results:** REMOVE. Keep bottom `ResultsDisclaimer` + RBA citation.

### Open Q1 — What happens to WaterfallChart?

`WaterfallChart.tsx` is currently the **primary visual** on the results page
(rendered at `app/results/page.tsx:146`). The revamp's new section order in
`revamp-ux-spec.md` §3 does NOT list WaterfallChart anywhere. It lists
CostCompositionChart in the depth zone, and nothing in its place as a primary
visual.

Three options:
- **(a) Remove it entirely.** Matches the ux-spec literally. Depth zone has the
  cost composition chart; primary zone has no chart at all. Aligns with
  "report-as-product" — a report has tables, not bar charts.
- **(b) Keep it in the primary zone as the primary visual.** Honours existing
  investment. Contradicts the ux-spec section order.
- **(c) Move it into the depth zone alongside CostCompositionChart.** Two charts
  in the depth zone. Compromise, but might clutter.

My recommendation: **(a) remove it**. The ux-spec is emphatic that the primary
zone is "hero number + problems + actions" and nothing else. WaterfallChart
adds visual noise that competes with the hero P&L number. The chart's insights
are preserved in CostCompositionChart's before/after bars.

### Open Q2 — CostBreakdownChart: replace or re-use?

`CostBreakdownChart.tsx` already exists and already does essentially what the
revamp's CostCompositionChart is asked to do (4-segment bars, scheme fees
invariant enforced). Two options:
- **(a) Rename `CostBreakdownChart.tsx` → `CostCompositionChart.tsx`**, update
  its props/labels to match the revamp spec (add "Estimated breakdown" pill,
  insight note), and use it in the depth zone.
- **(b) Build CostCompositionChart as a new component** that wraps or replaces
  CostBreakdownChart's logic, and retire CostBreakdownChart.

My recommendation: **(a) rename in place**. Less code churn, preserves
git history via `git mv`, same invariant enforcement.

### Open Q3 — Do we remove ConsultingCTA from the homepage?

The revamp package states "ConsultingCTA on results page only" (single
conversion goal on homepage). I need to verify whether ConsultingCTA currently
appears on the homepage. Grep of `app/page.tsx` shows it does NOT — the
homepage composition is only Hero / Preview / Features / Footer, and
ConsultingCTA is only imported in `app/results/page.tsx`. **No change needed
for this rule.** Flagging for confirmation.

### Open Q4 — Banned words and phrases sweep

The ux-spec bans several current phrases. Hitting these with a repo grep shows
they exist in these places:
- `"your PSP"` / `"your psp"` — HeroSection sub copy, ResultsDisclaimer footer
- `"Category N"` / `"Category 1-4"` — VerdictSection pills, PreviewSection
  labels, ConsultingCTA
- `"Verify with your PSP"` — ResultsDisclaimer (site-wide banner on results page)
- `"Stripe keeps the full"` — PassThroughSlider note

All are in scope for Phase 2 (homepage) and Phase 4 (results). Banned-word
enforcement: after all phases, I'll add a Vitest snapshot test that greps the
built HTML for these strings and fails the suite if any reappear.

### Open Q5 — `site-wide disclaimer banner`

Current `results/page.tsx` renders a fixed top banner with "This calculation is
an estimate. Verify with your PSP." — the revamp strips this. The required
regulatory disclaimer is already handled by `ResultsDisclaimer` at the bottom
of the page and the RBA citation in AssumptionsPanel. Confirming we can
remove the top banner entirely.

My recommendation: **yes, remove the top banner**, keep the bottom disclaimer
block, keep the RBA citation in AssumptionsPanel.

---

## SECTION I — SIGN-OFF CHECKLIST

Before proceeding to Phase 1:

- [x] All component files have been read and inventoried (Section A.1 — 36 files)
- [x] Calculation output type has been pasted in full (Section A.2)
- [x] Action type has been pasted in full (Section A.3)
- [x] Current Tailwind colours have been pasted (Section A.4)
- [x] Every missing field has been identified (Section B — only 2: action.script, action.why)
- [x] Calculation logic for every new field has been written (Section B.3 — literal strings, no logic)
- [x] Every file to be touched has been listed (Section C — ~45 files across 7 phases)
- [x] Every sync risk has been identified and ordered (Section D)
- [x] Minimum test count has been recorded (Section F.1 — 216)
- [x] Commit plan has been written (Section G — ~30 commits across 7 phases)
- [ ] **Manu has reviewed this plan and answered Open Q1-Q5**
- [ ] **Manu has said "proceed" or equivalent**

**When the last two boxes are checked: proceed to Phase 1, Commit 1a.**
