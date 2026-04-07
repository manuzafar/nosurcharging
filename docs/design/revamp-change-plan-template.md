# Change Plan — nosurcharging.com.au UX Revamp
## Complete this document before writing any code

This template is mandatory. Claude Code must complete every section
based on reading the actual codebase — not assumptions.

DO NOT PROCEED TO PHASE 1 UNTIL THIS DOCUMENT IS COMPLETE AND CONFIRMED.

---

## STATUS: [ ] INCOMPLETE  [ ] COMPLETE AND CONFIRMED

---

## SECTION A — CODEBASE AUDIT

### A.1 — Component inventory

List every file found under `app/` and `components/`. For each, state:
what it renders and whether it reads from calculation output.

```
[ Complete after running: find . -name "*.tsx" | grep -v node_modules ]

File: app/page.tsx
Purpose: [fill in]
Reads calculation output: Yes / No

File: app/assessment/page.tsx
Purpose: [fill in]
Reads calculation output: Yes / No

File: app/results/page.tsx (or equivalent)
Purpose: [fill in]
Reads calculation output: Yes / No

[ ... continue for every component file ]
```

### A.2 — Calculation output type

Paste the complete return type from `lib/calculations.ts` here:

```typescript
// PASTE THE ACTUAL TYPE HERE — DO NOT GUESS
interface CalculationOutput {
  // [fill in after reading the file]
}
```

### A.3 — Action type

Paste the current `Action` type (or interface) here:

```typescript
// PASTE THE ACTUAL TYPE HERE
interface Action {
  // [fill in after reading the file]
}
```

### A.4 — Current colour tokens

Paste the relevant section of `tailwind.config.ts` here:

```typescript
// PASTE THE ACTUAL COLOURS HERE
colors: {
  // [fill in]
}
```

---

## SECTION B — MISSING FIELDS ANALYSIS

For each new field required by the UX revamp, state whether it exists:

| Field | Component that needs it | Exists in output? | Action needed |
|---|---|---|---|
| `todayInterchange` | CostCompositionChart | [ ] Yes / [ ] No | |
| `todayScheme` | CostCompositionChart | [ ] Yes / [ ] No | |
| `todayMargin` | CostCompositionChart | [ ] Yes / [ ] No | |
| `grossCOA` | CostCompositionChart | [ ] Yes / [ ] No | |
| `surchargeRevenue` | ProblemsBlock | [ ] Yes / [ ] No | |
| `costPlusOctNet` | EscapeScenarioCard | [ ] Yes / [ ] No | |
| `action.script` | ActionList | [ ] Yes / [ ] No | |
| `action.why` | ActionList | [ ] Yes / [ ] No | |
| `outputs.inputs.psp` | Multiple components | [ ] Yes / [ ] No | |

**Fields that need to be ADDED before component work begins:**
```
[ List fields where "Exists" = No ]
```

**Calculation logic for each new field:**
```typescript
// For each new field, write the calculation here BEFORE adding to engine:

// todayInterchange (example — adjust based on actual engine structure):
todayInterchange = debitInterchangeCost + creditInterchangeCost

// todayScheme (example):
todayScheme = volume * SCHEME_FEE_RATE

// [ ... etc ]
```

---

## SECTION C — COMPLETE FILE CHANGE LIST

List every file that will be touched in this revamp, with change type:

### Phase 1 — Token migration
```
tailwind.config.ts      — UPDATE: rename amber→accent, new hex values
globals.css             — UPDATE: if any CSS vars use amber hex
[components using amber] — UPDATE: class names amber→accent
```

### Phase 2 — Homepage
```
app/page.tsx                         — UPDATE or leave (check structure)
components/homepage/HeroSection.tsx  — UPDATE: copy changes
components/homepage/ProofBar.tsx     — CREATE: new component
components/homepage/TrustBar.tsx     — CREATE: new component
components/homepage/PreviewSection.tsx — UPDATE: tab→grid
components/homepage/FeaturesSection.tsx — UPDATE: step hints
[Nav component path]                 — UPDATE: CTA copy
```

### Phase 3 — Disclaimer
```
[DisclaimerConsent component path]   — UPDATE: copy and wrapper only
```

### Phase 4 — Results
```
lib/calculations.ts                  — UPDATE: add missing fields (if any)
[Action type file]                   — UPDATE: add script, why (if missing)
[buildActions function file]         — UPDATE: return script, why
app/results/page.tsx                 — UPDATE: section order
components/results/VerdictSection.tsx — UPDATE: daily anchor, copy
components/results/ProblemsBlock.tsx  — CREATE: new component
components/results/ActionList.tsx    — UPDATE: add script + why rendering
components/results/DepthToggle.tsx   — CREATE: new toggle component
components/results/PassThroughSlider.tsx — UPDATE: copy only
components/results/EscapeScenarioCard.tsx — UPDATE: copy only
components/results/CostCompositionChart.tsx — CREATE: new chart component
components/results/AssumptionsPanel.tsx — UPDATE: toggle label, formula display
components/results/ConsultingCTA.tsx — UPDATE: copy only
components/results/SkeletonLoader.tsx — CREATE: loading state
```

---

## SECTION D — SYNC RISK REGISTER

List every change that has a backend/frontend sync risk:

| Risk | Component | Depends On | Change Order |
|---|---|---|---|
| `todayInterchange` missing | CostCompositionChart | lib/calculations.ts | Add to engine FIRST |
| `action.why` missing | ActionList | buildActions() | Add to engine FIRST |
| [Fill in others] | | | |

**Changes that CANNOT be made simultaneously (must be sequential):**
```
1. [ ] lib/calculations.ts — add missing fields
2. [ ] Type definitions — update interfaces
3. [ ] Components — reference new fields
```

---

## SECTION E — COPY-ONLY CHANGES (zero sync risk)

List all changes that are purely copy or styling (no data dependency):

```
HeroSection.tsx         — headline italic, sub copy, CTA copy, proof row
FeaturesSection.tsx     — step hints
DisclaimerConsent.tsx   — four commitments copy
PassThroughSlider.tsx   — slider labels and intro copy
EscapeScenarioCard.tsx  — explanatory copy
ConsultingCTA.tsx       — headline and sub copy
Colour token renames    — no logic impact
```

---

## SECTION F — TEST IMPACT ASSESSMENT

List every test file that may need updating:

```
[ Run: find . -name "*.test.*" | grep -v node_modules ]

Test file: [path]
What it tests: [description]
Will revamp break it? [ ] Yes / [ ] No
If yes, why: [explanation]
Required test update: [what to change]
```

**Minimum test count before revamp:** [fill in after running: pnpm test]
**Test count must not fall below this number after revamp.**

---

## SECTION G — COMMIT PLAN

List every planned commit in order, with its scope:

```
Commit 1: design: migrate amber → accent token (tailwind.config.ts + class renames)
Commit 2: calc: add cost breakdown fields (lib/calculations.ts if needed)
Commit 3: calc: add script and why to action type and buildActions
Commit 4: feat: homepage revamp (ProofBar, TrustBar, HeroSection, PreviewSection)
Commit 5: feat: disclaimer — four commitments
Commit 6: feat: results — VerdictSection updates + ProblemsBlock + DepthToggle
Commit 7: feat: results — ActionList with script and why
Commit 8: feat: results — CostCompositionChart
Commit 9: feat: results — AssumptionsPanel + ConsultingCTA + SkeletonLoader
Commit 10: fix: mobile breakpoints
Commit 11: fix: accessibility states
Commit 12: UX revamp complete
```

---

## SECTION H — SIGN-OFF

Before proceeding to Phase 1:

- [ ] All component files have been read and inventoried (Section A.1)
- [ ] Calculation output type has been pasted in full (Section A.2)
- [ ] Action type has been pasted in full (Section A.3)
- [ ] Current Tailwind colours have been pasted (Section A.4)
- [ ] Every missing field has been identified (Section B)
- [ ] Calculation logic for every new field has been written (Section B)
- [ ] Every file to be touched has been listed (Section C)
- [ ] Every sync risk has been identified and ordered (Section D)
- [ ] Minimum test count has been recorded (Section F)
- [ ] Commit plan has been written (Section G)

**When all boxes are checked: proceed to Phase 1.**
**If any box is unchecked: complete it before proceeding.**
