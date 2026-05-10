# RESULTS_RUTHLESS_CUT_BRIEF.md
## nosurcharging.com.au — Results page editorial cut + PDF artifact handoff
## Authority: This document governs the next results-page revamp.
## Produced: May 2026

---

## TO CLAUDE CODE — MANDATORY READING PROTOCOL

Before writing a single line of code:

1. Read this entire document.
2. Read `apps/web/app/results/page.tsx` — the current orchestrator.
3. Read `apps/web/components/results/shell/types.ts` — the section routing definitions.
4. Read `apps/web/components/results/sections/` — every file. You will be deleting most of them.
5. Read `apps/web/components/results/VerticalActionSteps.tsx`, `MetricCards.tsx`, `ProblemsBlock.tsx`, `RefinementPanel.tsx`. These are the components that survive.
6. Read `packages/calculations/actions.ts` — the action-list source of truth. Do not modify.
7. Read `packages/calculations/categories.ts` — verdict copy source of truth. Do not modify.

This document was written from a complete content inventory of the current page but may contain errors. Push back where the brief conflicts with the code, in the format defined below.

---

## PUSHBACK PROTOCOL — MANDATORY

You are expected to challenge this brief where it conflicts with the code or existing tests. Use this format BEFORE implementing anything:

```
⚠️ PUSHBACK [ITEM-ID]:
Brief says: [what this doc says]
Code says:  [what the code actually does]
Risk:       [what would break if brief is followed blindly]
Proposal:   [your recommended resolution]
Status: AWAITING CONFIRMATION
```

**Required pushback triggers:**
- Any deletion that the test suite depends on (run `pnpm test:unit` and check what fails after each deletion).
- Any change to `MetricCards` that breaks the 3-mode rendering (Cat 1/2 flat grid · Cat 3/4 proportional · Cat 5 zero-cost). The 3 modes must survive.
- Any change to `VerticalActionSteps` that alters how `ActionItem` (`priority`, `timeAnchor`, `text`, `script`, `why`) flows from `packages/calculations/actions.ts`. The data shape is sacred — only the visual treatment changes.
- Any change to `ProblemsBlock` that drops the Cat 3 / Cat 4 / Cat 5 conditional rendering.
- Any modification to the calculation engine (`packages/calculations/`). This brief does not require any calculation changes.
- The scheme-fees invariant in `CostCompositionChart` (`todayScheme === oct2026Scheme`). This component is being moved to PDF-only — verify it still passes its tests in the new context.
- The `actions` / `outputs` separation in `ResultsContent`. The slider isolation bug fix from previous sprints must remain intact.
- Any `'use client'` boundary placement that breaks server/client mismatch.
- The PDF generation path (Section 7) — if React-PDF turns out to be incompatible with any existing component, propose an alternative before re-architecting.

**Do not push back on:**
- Copy revisions inside the limits set by `docs/content/tone-of-voice.md`.
- Component naming for new files.
- Whitespace and minor visual decisions.

---

## WHY WE'RE DOING THIS

User testing of the current results page surfaced two consistent complaints:

1. "There's a lot of information."
2. "I don't know where to go."

Both are rational responses to the current shape: 9 sidebar sections, 4 sub-tabs inside Overview alone, ~17 distinct content components, and ~12 places where the same idea repeats. The sidebar that was meant to fix "unending scrolling" has created a different version of the same problem — the merchant has to choose what to read before they can read anything.

The fix is editorial, not visual. Strip the page to one scroll path with no sidebar, no tabs, no choices. Move audit-grade detail (line-item tables, customer comms templates, PSP contact directory, full assumptions) to a PDF artifact the merchant takes away. Treat the on-page experience as the moment of insight; treat the PDF as the persistent toolkit.

Independent constraint: assessment data is deleted from the database after 48 hours. The PDF (sent by email) is the merchant's only persistent record. This is also the brand position — *we don't keep your data; take what you need*.

---

## THE NEW STRUCTURE

Single column, no sidebar, no tabs, no sub-tabs. Mobile is the canonical layout — desktop is the same content with more whitespace.

Sections in scroll order:

1. **Top bar** (sticky, simplified) — logo + situation pill + P&L number + "Result looks off?" feedback link. No accuracy meter (moves to refine card). No "Get help" CTA pill (replaced by the quiet bottom-of-page link). No sidebar items.

2. **Hero** — situation pill, eyebrow ("Estimated annual P&L impact from October 2026"), 44–48px monospace P&L number, one-sentence verdict. Nothing else competes.

3. **Context paragraph** — 2–3 sentences from `CATEGORY_VERDICTS`, plain English, current copy preserved.

4. **Numbers + Why** — uses existing `MetricCards` (3-mode component) directly above existing `ProblemsBlock`. No section title needed; the cards lead the merchant. The two are now one zone, not two.

5. **Action plan** — uses existing `VerticalActionSteps`. **Visual change only**: the wrapper card-style borders go; replace with a vertical hairline + dots pattern. Tier headers (URGENT / PLAN / MONITOR) in coloured small caps. Time anchor + title + script (visible by default) + why (small, beneath). RAO framework remains as the inline 3-tile mini-grid for Cat 3/4 action 1.

6. **Reform timeline** — replaces the multi-tab Overview ReformTimeline. Vertical list of date+label rows on mobile (5 dates: Now / 1 Oct / 30 Oct / 30 Jan / 1 Apr); horizontal at desktop. Compact. No "October 1 callout" component — the date marker carries it.

7. **Refine your estimate** — uses existing `RefinementPanel` data, **but visual restyle**: settings-list rows (no card-per-field), 3 fields visible by default (AVT, credit IC for cost-plus, corporate share), 2 behind a "more options" link (monthly debit txns, minimum monthly fee). Accuracy indicator inline at top-right of the section header (small mono "65%"), not a separate progress bar. `PassThroughSlider` and `EscapeScenarioCard` continue to render for Cat 2/4 inside this section.

8. **Save the full report** — new artifact-handoff card. Email is **pre-filled** from the existing EmailGate capture. One primary button: "Email me the PDF". Small "Change" link if the merchant wants a different address. Privacy + 48h retention note. **No registry checkbox.** **No marketing consent checkbox** — Manu is retaining the upstream EmailGate which carries the marketing consent mechanism.

9. **Quiet upsell + disclaimer** — single line linking to the Reform Ready Report at $149. Single line of disclaimer + 48h expiry note.

That's it. 9 moments, single column, ~6–8 distinct components rendered. Mobile-native by structural choice, not by retrofit.

---

## WHAT GETS CUT

### Files to delete

These are confirmed redundant or replaced:

- `apps/web/components/results/ActionList.tsx` — already dead code (only test imports). Delete the component and its test.
- `apps/web/components/results/ConsultingCTA.tsx` — already commented-out as not rendered. Delete.
- `apps/web/components/results/LCRInsightPanel.tsx` — content moves to PDF action-list as a step.
- `apps/web/components/results/SubTabStrip.tsx` — no more sub-tabs anywhere on the page.
- `apps/web/components/results/CollapsibleSection.tsx` — verify usage; if only used by deleted sections, delete.
- `apps/web/components/results/PSPRateRegistry.tsx` — registry contribution moves to backend; see Section 9.
- `apps/web/components/results/sections/OverviewSection.tsx` — its sub-tabs are gone. Verdict + Metrics + Problems now render directly in `page.tsx`.
- `apps/web/components/results/sections/ActionsSection.tsx` — its sub-tabs are gone. `VerticalActionSteps` renders directly.
- `apps/web/components/results/sections/ValuesSection.tsx` — content moves to PDF.
- `apps/web/components/results/sections/RefineSection.tsx` — `RefinementPanel` (restyled) renders directly.
- `apps/web/components/results/sections/HelpSection.tsx` — replaced by the artifact card and a single `<a>` upsell.
- `apps/web/components/results/sections/IfYouDoNothing.tsx` — content folded into PDF "If you reprice" section.
- `apps/web/components/results/sections/NegotiationBrief.tsx` — content moves to PDF.
- `apps/web/components/results/sections/ReadinessChecklist.tsx` — content moves to PDF.
- `apps/web/components/results/sections/TalkToCustomers.tsx` — content moves to PDF.
- `apps/web/components/results/sections/TensionSection.tsx` — replaced by the simpler 2-card `ProblemsBlock` framing.
- `apps/web/components/results/sections/WhatsChanging.tsx` — folded into `ProblemsBlock` (already says CERTAIN/DEPENDS).
- `apps/web/components/results/sections/WhereIStandToday.tsx` — content moves to PDF.
- `apps/web/components/results/sections/YourOptions.tsx` — content (custom 0–3% repricing slider, scenarios) moves to PDF.
- `apps/web/components/results/sections/PSPRegistrySection.tsx` — registry view becomes Phase 1.5; contribution moves to backend.
- `apps/web/components/results/sections/ReformTimeline.tsx` (sub-tab version) — replaced by new compact reform-timeline component on the main page.
- `apps/web/components/results/shell/ResultsSidebar.tsx` — no sidebar.
- `apps/web/components/results/shell/MobileMiniNav.tsx` — no mini-nav.
- `apps/web/components/results/shell/MobileBottomBar.tsx` — no fixed bottom CTA bar (the upsell link replaces it inline).

### Chrome to remove

- The `$2,500 / $3,500` price chrome (sidebar pill, mobile bottom bar). This was already inconsistent with the actual offer ($149 Reform Ready). Remove all references.
- The "Get help" pill in the top bar.
- The entire `Section` type / routing logic in `ResultsContent` (`activeSection`, `setActiveSection`).
- All `REVEAL_STYLE` staggered animations on results sections — irrelevant for a single-column scroll page.

---

## WHAT GETS KEPT (MODIFIED)

### Visual restyles only — data shape sacred

- **`VerticalActionSteps.tsx`** — keep the data flow from `actions.ts` exactly. Replace the wrapper card borders with a vertical hairline + tier-coloured dots pattern. Tier headers in small-caps coloured by tier. Script callout becomes a left-bordered light-bg block with an "Exact script" label. The `why` line stays as small grey text below. RAO framework's 3-tile inline grid for Cat 3/4 action 1 stays.

- **`RefinementPanel.tsx`** — keep all 5 fields, all logic, all source labels (`Your input` / `Industry default` / `RBA average` / `Not set`), all live calculation. Replace the card-per-field visual with settings-list rows separated by hairlines. Move accuracy indicator inline to the section header (no separate progress bar element).

- **`ResultsTopBar.tsx`** — keep brand + situation pill + signed P&L. Drop accuracy indicator (RefinementPanel owns it now). Drop "Save result" button (PDF email replaces this need). Drop "Get help" CTA pill (quiet upsell at bottom of page). Keep "Result looks off?" trigger to FeedbackModal.

- **`SkeletonLoader.tsx`** — rebuild to match the new linear layout (hero → metrics → action list → timeline → refine → artifact). The current sidebar-aware skeleton is wrong shape.

### Components used as-is (no visual change required)

- **`MetricCards.tsx`** — preserves all 3 modes. The 3-mode logic is the editorial workhorse here; do not consolidate or simplify.
- **`ProblemsBlock.tsx`** — preserves Cat 1 null / Cat 2/4 amber / Cat 3/4/5 red conditional. Becomes the de-facto "Why this is happening" surface.
- **`PassThroughSlider.tsx`** — kept inside the new Refine section for Cat 2/4.
- **`EscapeScenarioCard.tsx`** — kept inside the new Refine section for Cat 2/4.
- **`AssumptionsPanel.tsx`** — kept but **moves to expand-on-demand only** ("Show me exactly how this is calculated" toggle). Default collapsed. Most merchants will get this content via the PDF instead.
- **`StrategicRateExitPage.tsx`** — unchanged. Continues to render when `variant_type === 'strategic_rate'`.
- **`FeedbackModal.tsx`** — unchanged.
- **`ResultsDisclaimer.tsx`** — unchanged content; render position updated.
- **`VerdictSection.tsx`** — keep, but trim. The hero only needs: situation pill, eyebrow, big P&L number, one-sentence verdict, context line. The body paragraph (currently from `CATEGORY_VERDICTS[].body`) renders as a separate Section 3 (Context paragraph) below the hero, not inside the verdict card.

---

## WHAT GETS CREATED

### New components

1. **`apps/web/components/results/sections/ReformTimelineCompact.tsx`** — replaces deleted sub-tab version. Vertical list of date+label rows on mobile (single column); 5 horizontal nodes on desktop. Reads from existing `AU_REFORM_DATES` constant.

2. **`apps/web/components/results/sections/ArtifactCard.tsx`** — the "Save the full report" handoff. Reads the email from the existing email gate session/state (the merchant has already submitted email upstream — this card displays it as confirmation, not an input). Has a "Change" link that swaps to a small input. Single button: "Email me the PDF". On click, calls a new server action that triggers PDF generation + email send (Section 7). Privacy + 48h retention note below the button.

3. **`apps/web/actions/sendReportEmail.ts`** — new server action. Validates session, resolves the assessment (`getAssessment.ts` already exists), calls PDF generation, sends via Resend with PDF attachment. Returns success/error.

4. **PDF generation module** — Section 7 below.

### What `page.tsx` becomes

A single linear render. Roughly:

```tsx
<main className="min-h-screen bg-paper">
  <ResultsTopBar ... />
  <div className="mx-auto max-w-results px-5 py-6 space-y-8">
    <Hero ... />
    <ContextParagraph ... />
    <MetricCards ... />
    <ProblemsBlock ... />
    <VerticalActionSteps ... />
    <ReformTimelineCompact ... />
    <RefinementPanel ... />
    {(category === 2 || category === 4) && <PassThroughSlider ... />}
    {(category === 2 || category === 4) && <EscapeScenarioCard ... />}
    <ArtifactCard ... />
    <QuietUpsell ... />
    <ResultsDisclaimer ... />
  </div>
  {feedbackOpen && <FeedbackModal ... />}
</main>
```

No section routing. No active-section state. No staggered animations. The merchant scrolls. That's the navigation.

⚠️ PUSHBACK TRIGGER: If `RefinementPanel` currently expects to be wrapped in something that injects `onOutputsChange` and similar callbacks, propose how those wire to `page.tsx` directly without re-introducing a section abstraction.

---

## PDF GENERATION

### Recommended path

**Phase 1 ship: React-PDF (`@react-pdf/renderer`)** for server-rendered PDFs. Declarative React components, runs in Node, ~50 MB memory footprint added to the existing Railway service, ~100–500ms generation per PDF. Marginal cost effectively zero. Same emerald design tokens, mono numbers, serif headings as the web — rebuilt as React-PDF primitives, not the same JSX.

**Same-day fallback: print stylesheet on `/results/{id}/print` route**. Hides the email form, navigation, and interactive controls; shows everything else with `@media print` styles. Merchant uses browser "Save as PDF". Ships in days. Useful as a manual escape hatch and as a fallback when the email send fails.

**Skip:** Puppeteer/Playwright (memory-heavy at low volume). Skip third-party APIs (DocRaptor, PDFCrowd) unless React-PDF turns out to be infeasible — they cost $0.01–$0.10 per PDF and scale linearly.

⚠️ PUSHBACK TRIGGER: If you find React-PDF cannot represent a critical visual element (e.g. specific Recharts chart, a particular border treatment), propose either (a) simplifying the visual to fit React-PDF's primitives, or (b) switching to Puppeteer rendering of the print-styled route. Do not silently degrade quality.

### PDF contents (per category)

The PDF has the audit-grade depth that the page doesn't. Sections:

1. **Cover** — verdict (serif), category pill, P&L hero number, "prepared for" line (volume + PSP + plan + surcharge status), date generated.
2. **The situation** — `CATEGORY_VERDICTS[category].body` paragraph. For Cat 3/4/5, include the TensionSection content (3 bullets for Cat 3/4, paragraph for Cat 5). This is the only place that content survives.
3. **The numbers** — full waterfall chart (the current `CostCompositionChart` content) + line-item table (Today / Oct 2026 / Change for each component). This is the audit detail.
4. **Your action plan** — full action list with all scripts and `why` content. RAO framework expanded for Cat 3/4.
5. **If you reprice (Cat 3/4/5 only)** — break-even %, scenarios at 1.0% and 1.5%, RAO restated. Content from the deleted `YourOptions` section.
6. **Talk to {psp}** — PSP contact card (channels + script + alternatives table). Content from the deleted `NegotiationBrief` section. Single PSP only — the merchant's PSP — not all 10.
7. **Talk to your customers** — the 4 templates from `TalkToCustomers` (email / counter sign / social / staff briefing), surcharging or non-surcharging variants depending on category.
8. **Reform timeline + key dates** — 5 dates with their meaning.
9. **How we calculated this** — full assumptions panel content (formula rows, card mix table, source labels, RBA citation).
10. **Footer (every page)** — generated date, "we'll email you on 30 October", disclaimer, nosurcharging.com.au.

The Reform Ready Report at $149 gets a one-line mention on the last page.

### Email flow

- Existing Resend integration handles the email send. The PDF is attached.
- Subject: `Your No Surcharging report — Category {N}: {short verdict}`.
- Body (HTML): hero number, one-sentence verdict, "your full report is attached", 30 October promise, disclaimer.
- Attachment: PDF generated in-memory, never persisted.
- The action also fires a PostHog event (`report_pdf_emailed`) tied to the merchant's hashed identity.

---

## DATA RETENTION

48-hour TTL on assessment data. Specifics for Claude Code to figure out:

- The current `assessments` table has no expiry. Add an `expires_at` column (default `created_at + 48 hours`).
- Implement a deletion mechanism: cron-style scheduled task or check-on-load deletion of expired rows. Check what's available in the current Railway/Supabase setup and propose.
- The `email_signups` table is **not** subject to the 48-hour TTL. That's the audience asset.
- The `consents` table is append-only by RLS and is preserved indefinitely (regulatory).
- Update `getAssessment.ts` to return a clear "expired" state if the assessment is past its TTL, and have `page.tsx` render an "expired" view directing the merchant to retake the assessment.
- Update privacy policy + the disclaimer text to reflect the 48-hour deletion (the merchant must be told this clearly).

⚠️ PUSHBACK TRIGGER: Confirm the Supabase setup has access to scheduled cron functions (pg_cron extension or similar), or propose an alternative (e.g., delete-on-load when stale rows are queried). If no cron is available, the deletion mechanism becomes the gating decision.

---

## DECISIONS MANU NEEDS TO CONFIRM BEFORE WORK STARTS

1. **Registry contribution mechanism (data path).** The PSP rate registry contribution checkbox is removed from the page. Two options for the underlying data flow — Manu to choose:
   - (a) **Auto-contribute**: every assessment submission contributes anonymized rate data to the `psp_rate_registry` table on the backend. Disclosed in the privacy policy + initial disclaimer text.
   - (b) **Disclaimer-text amendment**: the existing initial-disclaimer consent text is updated to include explicit consent for anonymized contribution. Single consent click at the start covers both the assessment and the registry contribution.
   - The brief assumes (b) — flag if (a) is preferred so the consent text + privacy policy can be left as-is.

2. **`/registry` standalone page.** The PSPRateRegistry view component (the table showing benchmarks) — does it survive as a standalone page reachable from the homepage, or is it deferred to Phase 1.5? Brief assumes deferred. If it stays, the route + minimal UI need to be preserved.

3. **`/resources` pages.** The deleted `TalkToCustomers`, `NegotiationBrief`, `ReadinessChecklist` content lives in the PDF. Do you also want them as standalone web pages (`/resources/customer-templates`, `/resources/psp-contacts`, `/resources/checklist`)? Brief assumes no — the PDF carries them. Easy to add later if traffic warrants.

4. **Print stylesheet vs React-PDF priority.** Brief recommends shipping the print stylesheet first (one weekend of work, $0 cost) as a fallback while React-PDF is built (1–2 weeks). Confirm priority.

5. **Action-list scripts default state.** Brief specifies scripts visible by default in `VerticalActionSteps`. Alternative is collapse-by-default. Visible is more substantial; collapse is more scannable. Brief assumes visible — confirm.

---

## BUILD SEQUENCE

Three milestones. Do not collapse them — each is a stable release point.

### Milestone 1 — The cut (no new features)

```
chore(results): remove sidebar shell, sub-tabs, dead components

- Delete all section files except those listed in the Keep list.
- Delete shell sidebar / mini-nav / bottom-bar.
- Remove section-routing state from page.tsx.
- Remove $2,500/$3,500 chrome.
- Update SkeletonLoader to linear shape.
- Verify all calculation tests still pass.
- Verify the page still renders for Cat 1, 2, 3, 4, 5 (no broken imports).
```

Self-audit before committing:
- All 489 tests still pass.
- TypeScript clean (`tsc --noEmit`).
- Cat 1 / 2 / 3 / 4 / 5 results render without console errors.
- `MetricCards` still produces 3 different layouts depending on category.
- `ProblemsBlock` still produces correct Cat-conditional cards.
- Strategic-rate variant still renders.

### Milestone 2 — Visual restyle + reform timeline + artifact card

```
feat(results): single-column layout with settings-list refine and artifact handoff

- VerticalActionSteps: vertical hairline + dots, tier-coloured headers, scripts visible.
- RefinementPanel: settings-list rows, accuracy indicator inline.
- New ReformTimelineCompact component (vertical mobile, horizontal desktop).
- New ArtifactCard component with prefilled email + "Email me the PDF" button.
- New /api/report-email or actions/sendReportEmail.ts (server action).
- ResultsTopBar: simplified (no accuracy, no Get help, no Save result).
- AssumptionsPanel: expand-on-demand only.
- Hero + Context paragraph as separate elements (not nested inside VerdictSection card).
- Quiet $149 upsell as final-line link.
- All E2E tests updated for new layout.
```

Self-audit:
- Click "Email me the PDF" with a stub PDF response — server action fires, email field works, "Change" link works.
- Cat 2 / Cat 4 still see PassThroughSlider and EscapeScenarioCard inside the refine zone.
- Mobile (375px) renders cleanly: cards stack, action list flows, refine rows full-width, timeline vertical.
- Desktop (1024px+) renders cleanly: same content, generous whitespace, timeline horizontal.

### Milestone 3 — PDF generation + retention

```
feat(reports): React-PDF report generation + 48h retention

- New PDF report module (React-PDF components matching design system).
- All 9 PDF sections per Section 7 of brief.
- Cat-aware variants (Cat 1: shorter, no surcharge sections; Cat 5: zero-cost story).
- sendReportEmail.ts wires up: get assessment → generate PDF → send via Resend.
- Schema migration: assessments.expires_at column, default created_at + 48h.
- Deletion mechanism per chosen path (cron or check-on-load).
- /privacy and disclaimer updated to reflect 48h retention.
- Print stylesheet on /results/{id} as parallel fallback (so a merchant can browser-save before email arrives).
```

Self-audit:
- PDF generated for Cat 1 / 2 / 3 / 4 / 5 — visually correct, all data populated.
- Email arrives in test inbox with PDF attached.
- Past-48h assessment ID returns expired view, not 404 or stale data.
- Privacy policy text matches the new retention behaviour.
- Sentry has zero new errors after a soak run.

---

## WHAT THIS BRIEF IS NOT

This brief covers the results page editorial cut and the artifact handoff. It does not cover:

- Any change to the assessment wizard (Steps 1–4) or homepage.
- Any change to the EmailGate (which Manu has chosen to retain in its current position).
- Any change to the calculation engine (`packages/calculations/`).
- Phase 2 invoice parsing or Reform Ready Report ($149) implementation — those remain Phase 2.
- Any change to the strategic-rate exit page beyond preserving its current behaviour.
- Any new database tables beyond `assessments.expires_at` and the `psp_rate_registry` decision (per Section 9.1).

---

## REFERENCE FILES

```
Action source of truth:    packages/calculations/actions.ts
Verdict source of truth:   packages/calculations/categories.ts
Calculation engine:        packages/calculations/calculations.ts
Resolver:                  packages/calculations/rules/resolver.ts
Existing orchestrator:     apps/web/app/results/page.tsx
Existing top bar:          apps/web/components/results/shell/ResultsTopBar.tsx
Existing metric cards:     apps/web/components/results/MetricCards.tsx
Existing problems block:   apps/web/components/results/ProblemsBlock.tsx
Existing action steps:     apps/web/components/results/VerticalActionSteps.tsx
Existing refinement panel: apps/web/components/results/RefinementPanel.tsx
Existing email gate:       apps/web/components/assessment/EmailGate.tsx
Tone of voice:             docs/content/tone-of-voice.md
Disclaimer:                docs/legal/disclaimer-text.md
Existing PDF stub:         apps/web/app/api/excel/route.ts (returns 501, repurpose pattern)
```

---

*Brief produced May 2026. Authoritative for the next results-page revamp sprint.*
*Challenge anything that conflicts with the codebase you read.*
*The end state: a results page that is short, fast, mobile-native, and points to a PDF that does the rest.*
