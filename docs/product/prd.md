# Product Requirements Document
## nosurcharging.com.au — Merchant Payments Intelligence Platform

**Version:** 1.0 | **Date:** April 2026 | **Author:** Manu | **Status:** Approved for development | **Scope:** Phase 1 MVP

---

## A. Product Overview

### What we are building

nosurcharging.com.au is a free, independent merchant payments intelligence platform that enables Australian businesses to understand what card acceptance costs them, assess their exposure to the RBA October 2026 surcharge reform, and receive a personalised actionable plan — in under five minutes, with no account required.

The platform serves two audiences simultaneously: the café owner who does not know what "interchange" means, and the CFO who wants to enter exact interchange rates by card type and model three scenarios. Both get the same output quality. The depth adjusts to their knowledge.

### The problem

The RBA's March 2026 Conclusions Paper announced a surcharge ban on Visa, Mastercard, and eftpos cards effective 1 October 2026, paired with interchange fee reductions. The reform creates four distinct merchant outcomes depending on plan type and surcharging status. Most merchants do not know which outcome applies to them, cannot quantify the dollar impact, and have no independent tool telling them what to do.

The information asymmetry is structural. Payment providers have no incentive to explain it clearly. Government resources are generic. No independent, dollar-level, personalised tool exists.

### Why now

Three conditions are simultaneously true for the first time: (1) A hard regulatory deadline creates acute merchant attention that will not recur for years. (2) LLMs make intelligent assessment feasible at the cost of API calls. (3) The RBA's mandatory MSF publication (30 October) and pass-through reporting (30 January 2027) create structured data nosurcharging.com.au can interpret for merchants — creating a recurring reason to return.

### Target users

**Primary — The layman merchant:** A hospitality group CFO, café owner, or online retailer founder who processes cards every day but cannot name the components of their merchant service fee. They need an answer in plain English.

**Secondary — The payment wizard:** A treasury manager or finance director who knows their exact interchange rates by card type. They want precise inputs and will not trust a tool that forces defaults on them.

Both users land on the same URL. The product adapts to their depth of knowledge.

### High-level success metrics

- 1,000 assessment completions in first 30 days
- >60% step completion rate
- >25% email capture rate from results page
- >3% conversion from email to consulting discovery call
- <40% drop-off at Step 2 (the key diagnostic metric)

---

## B. Goals and Non-Goals

### Goals

1. Give every merchant their category and dollar impact in under five minutes
2. Serve both laymen and payment wizards from a single entry point
3. Generate consulting leads for Payments Health Check engagements
4. Build the data foundation for Phase 2 benchmarking
5. Be demonstrably independent and trustworthy

### Non-Goals (Phase 1)

- Invoice upload or automated statement parsing (Phase 2)
- User accounts or saved assessments (Phase 2)
- MSF benchmarking against published acquirer data (Phase 2 — data available 30 October)
- Excel workbook download (Phase 2)
- International markets (Phase 2 and beyond)
- Coverage of Amex, BNPL, or PayPal surcharging (mid-2026 review pending)
- Integration with PSP APIs or accounting software (Phase 3)
- Mobile app (web only, mobile-first responsive)

---

## C. User Stories and Scenarios

### Must-Have

| ID | As a... | I want to... | So that... | Priority |
|----|---------|-------------|------------|----------|
| US-01 | Café owner (layman) | Answer four simple questions and understand whether October 1 helps or hurts my business | I know whether I need to act | Must-Have |
| US-02 | Treasury manager (wizard) | Enter my exact interchange rates rather than defaults | My P&L output reflects my actual situation | Must-Have |
| US-03 | Merchant post-assessment | Read a plain English category explanation | I can explain the situation to my CFO | Must-Have |
| US-04 | Merchant | See my P&L swing in dollars, not percentages | I can assess the materiality relative to my business | Must-Have |
| US-05 | Flat-rate merchant (Cat 2 or 4) | Drag a slider and see how different PSP pass-through rates change my cost | I understand the range of outcomes | Must-Have |
| US-06 | Merchant | Receive an action list with my actual PSP name | It feels like advice for my situation, not generic guidance | Must-Have |
| US-07 | Merchant who surcharges Amex | Be told the October ban does not cover Amex | I am not incorrectly alarmed about revenue I can keep | Must-Have |
| US-08 | Merchant | Leave my email with a specific promise about what I will receive | I feel confident I will not be spammed | Must-Have |
| US-09 | Merchant | Acknowledge a clear disclaimer before acting on any numbers | I understand the context of what I am reading | Must-Have |
| US-10 | Payment wizard | Expand an assumptions panel with sources | I can assess the reliability of the output | Must-Have |

### Should-Have

| ID | Story | Priority |
|----|-------|----------|
| US-11 | Email myself the results as a PDF to share with my accountant | Should-Have |
| US-12 | See the amber scheme fees bar stay identical height in the before/after chart | Should-Have |
| US-13 | Be told the 1.0% foreign card cap is interchange only (true floor is ~2.58%) | Should-Have |

### Nice-to-Have

| ID | Story | Priority |
|----|-------|----------|
| US-14 | Add key reform dates to my calendar from the action list | Nice-to-Have |
| US-15 | Share my result (anonymised) on LinkedIn | Nice-to-Have |

---

## D. Functional Requirements

### D.1 — Navigation and Global

**FR-01** Navigation bar on every page: logo, "How it works" link, "Start assessment" button.

**FR-02** Site-wide disclaimer visible on every page (not in footer only): "nosurcharging.com.au provides general guidance only. Not financial advice. Verify with your PSP before making business decisions."

**FR-03** All services on Railway. Domain nosurcharging.com.au with Cloudflare for DNS and DDoS.

### D.2 — Homepage

**FR-04** Dark hero section with headline and single primary CTA "Start free assessment →".

**FR-05** Rotating preview of all four category outputs. Rotates every 3.5 seconds. Four labelled category tabs for manual navigation. Each preview shows: category label, verdict headline, three metrics (Today / Oct 2026 / P&L swing), one-sentence action.

**FR-06** Trust signals in hero: "Based on RBA Conclusions Paper March 2026", "No account required", "No PSP affiliation".

**FR-07** Features section explaining the three-step process without jargon.

### D.3 — Assessment Flow

**FR-08 Progress indicator:** Thin horizontal line showing current step with amber step number (01/04 format) prominently displayed.

**FR-09 Step 1 — Volume:**
- Annual card turnover input with Annual/Monthly toggle (auto-conversion shown)
- Sanity check: if annual mode and value < $30,000, show gentle warning
- Validation: non-zero required to advance

**FR-10 Step 2 — Plan type and PSP:**
- Two visual mock statement cards (not radio buttons)
  - Card A: One blended line "Merchant service fee: 1.40%" — labelled "One flat rate"
  - Card B: Four separate lines (debit IC, credit IC, scheme fees, margin) — labelled "Multiple line items"
- Expert toggle link: "Payment wizard? Enter your exact rates →" expands panel with three optional fields: Debit (cents/txn), Consumer credit (%), PSP margin (%)
- Confidence badge: green "Calculated from your exact rates" if any field filled; amber "Will use RBA averages" if all empty
- PSP pill selector: Stripe, Square, Tyro, CommBank, ANZ, Westpac, eWAY, Adyen, Other
- Both plan type AND PSP required to advance

**FR-10b — Optional card mix input (below PSP selector in Step 2):**
- Toggle: "Know your card mix? It improves accuracy." Collapsed by default.
- Seven optional fields (%): Visa debit, Visa credit, Mastercard debit, Mastercard credit, eftpos, Amex, Foreign cards
- All fields optional. Partial input valid. Auto-normalises to 100%.
- Live total display — green at 100%, amber if off. Never blocks progression.
- When any field filled: confidence badge updates to "Calculated from your input"
- Assumptions panel shows per-field source label: "Visa debit 35% — Your input" vs "RBA average"
- The resolution pipeline (rules/resolver.ts) handles all fallbacks.
  The calculation engine receives ResolvedAssessmentInputs — it has no knowledge of
  which fields came from merchant input vs defaults.

**FR-11 Step 3 — Surcharging:**
- Large visual Yes/No buttons with plain English sub-labels
- If Yes: network checkboxes (Visa & Mastercard, eftpos, Amex "still permitted", BNPL/PayPal "still permitted")
- If ONLY Amex/BNPL checked: green note confirming reform does not affect those networks
- Surcharge rate % required if Yes
- If No: advance immediately

**FR-12 Step 4 — Industry:**
- Six visual tiles with SVG icons: Café/Restaurant, Hospitality group, Retail, Online store, Ticketing/Events, Other
- Selection personalises repricing language and action list urgency
- Required to advance

### D.4 — Reveal Moment

**FR-13** On "See my results →" click: full-screen dark reveal screen for 1.1 seconds. Shows pulsing amber dot, "Calculating your position...", category label fading in at 0.6s. Results replace reveal at 1.1s automatically.

### D.5 — Results Page

**FR-14 Verdict section:**
- Category badge (colour-coded pill): green Cat 1, amber Cat 2, red Cat 3 and 4
- Confidence indicator pill: "High confidence" or "Estimated — RBA averages"
- Category headline (one plain English sentence)
- P&L swing as hero number: large monospace, green (positive) or red (negative)
- Direction label: "annual saving" or "annual increase in payments cost"
- Context: "across $[volume] in annual card revenue"
- Category body: 3–4 plain English sentences

**FR-15 Metrics:** Three cards — Today (net payments cost), October 2026 (projected), Interchange saving (green).

**FR-16 Pass-through slider (Categories 2 and 4 only):**
- Range 0–100% with real-time updates to all metrics and chart
- Saving amount in large green monospace
- Note: "90% of Australian merchants did not switch PSP last year" at 0%

**FR-17 Before/after chart:**
- Stacked vertical bars: Today and October 2026
- Components: Interchange (red), Scheme fees (amber), Acquirer margin (grey), Surcharge offset (green)
- Amber scheme fees bar identical height in both periods — deliberate design choice
- Chart updates in real time with slider
- Custom HTML legend (not Chart.js default)

**FR-18 Assumptions panel:** Collapsed by default. Shows: card mix, IC saving rates, scheme fees, source citation. All values read-only in Phase 1.

**FR-19 Action list:** Dynamically generated from category + PSP name + industry + P&L swing.
- PSP name inline (e.g. "Call Stripe and say..." not "call your PSP")
- Time anchors: This week / By August / 30 Oct 2026 / 30 Jan 2027 / April 2027
- Industry-specific language: per cover (café/hospitality), per transaction (retail), per ticket (ticketing)
- Amex/BNPL surchargers: mid-2026 review watchpoint included
- Foreign card caveat if foreign share > 5%

**FR-20 Consulting CTA:** "Book a free discovery call" → Calendly link. Byline: "Manu · Payments practitioner · Paid It".

**FR-21 Email capture:**
- Prompt: "On 30 October, acquirers publish their average MSF publicly for the first time. We'll tell you whether your rate is above or below market for your size."
- Privacy note: "One email on 30 October. Not shared with any payment provider."
- Phase 2 teaser: "Download P&L model (.xlsx)" — greyed out, labelled "Coming in Phase 2"

**FR-22 Results disclaimer:** Inline at page bottom. Not a footer.

### D.6 — Consent and Legal

**FR-23** Affirmative checkbox consent required before Step 1. Exact text recorded in Supabase with version number.

**FR-24** Every consent stored with: session_id, consent_type, consent_text, consent_version, consented (bool), timestamp, IP hash, user agent. Append-only — no updates or deletes.

**FR-25** Separate consent record for email capture (type: "email_marketing").

### D.7 — Calculation Engine

**FR-26** All rate constants in `packages/calculations/constants/au.ts` exclusively.

**FR-27** Calculation engine: pure TypeScript functions in `calculations.ts`. No side effects, no DB calls.

**FR-28** Full Vitest test suite must pass before any UI component is built.

**FR-29** Core calculation logic:

```
debit_transactions = (volume × debit_share) / avg_transaction_value
debit_saving = debit_transactions × $0.01
credit_saving = volume × credit_share × 0.0022
total_ic_saving = debit_saving + credit_saving

Cost-plus P&L swing:
  oct_coa = gross_coa - total_ic_saving
  pl_swing = net_today - oct_coa

Flat rate P&L swing (at pass-through %):
  oct_msf = annual_msf - (total_ic_saving × pass_through_pct)
  pl_swing = net_today - oct_msf
```

**FR-30** Card mix defaults (source: RBA Statistical Tables C1 and C2): Debit 60%, Credit 35%, Foreign 5%, Commercial 0%.

**FR-31** Current interchange rates (RBA weighted averages): Debit 9c/txn, Consumer credit 0.52%, Commercial 0.80%, Foreign 2.80%.

**FR-32** New rates from 1 October 2026: Debit 8c (or 0.16% lower of), Consumer credit 0.30%, Commercial unchanged, Foreign unchanged.

**FR-33** New rates from 1 April 2027: Foreign 1.0% interchange cap. True floor ~2.58% after scheme fees.

**FR-34** Scheme fees (unregulated, unchanged): Domestic 0.105% (10.5bps), Cross-border 1.58% (158bps).

### D.8 — Category Assignment

**FR-35** Category assignment:
```
Cat 1: cost_plus AND NOT surcharging
Cat 2: flat_rate AND NOT surcharging
Cat 3: cost_plus AND surcharging
Cat 4: flat_rate AND surcharging
```

**FR-36** Category copy per D.4 — Reveal section above.

### D.9 — Analytics

**FR-37** Plausible Analytics self-hosted on Railway. Script in Next.js root layout.

**FR-38** Custom events instrumented before launch: Assessment started, Step completed {step}, Plan type selected {type}, Expert mode activated, PSP selected {psp}, Surcharging selected {value}, Industry selected {industry}, Results viewed {category}, Slider used, Assumptions opened, Email captured, CTA clicked, Assessment abandoned {at_step}.

**FR-39** Every event includes `country: 'AU'` property.

---

## E. Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-01 | Time to First Contentful Paint | <1.5s on Australian 4G |
| NFR-02 | Assessment step transitions | <100ms (client-side only) |
| NFR-03 | Results page render including chart | <500ms |
| NFR-04 | Slider update latency | <16ms (one frame) |
| NFR-05 | Keyboard navigation | All interactive elements |
| NFR-06 | Colour contrast | WCAG AA minimum |
| NFR-07 | Minimum viewport | 375px fully functional |
| NFR-08 | Minimum tap target | 44×44px |
| NFR-09 | IP storage | Hashed SHA-256 only, never raw |
| NFR-10 | Cookie consent banner | Not required (Plausible is cookieless) |
| NFR-11 | Rate limiting | Assessment: 100/IP/24hr, Email: 1/session + 10/IP/hr |
| NFR-12 | First Contentful Paint | < 1.5s on Australian 4G |
| NFR-13 | Largest Contentful Paint | < 2.5s |
| NFR-14 | Cumulative Layout Shift | < 0.1 — financial numbers must not jump |
| NFR-15 | JS bundle (assessment page) | < 150KB gzipped — client component must be lean |
| NFR-16 | JS bundle (homepage) | < 80KB gzipped — SSR page, minimal client JS |
| NFR-17 | Lighthouse performance score | > 85 — measured at staging before launch |
| NFR-12 | Service role key | Never in frontend code |
| NFR-13 | Uptime target | 99.5% (Railway SLA) |
| NFR-14 | NaN/Infinity/undefined | Never returned by calculation engine |

---

## F. Success Metrics

### Leading indicators (weekly)

| Metric | Definition | 30-day target |
|--------|------------|---------------|
| Assessment starts | Users beginning Step 1 | 2,000 |
| Step completion rate | Starts to results viewed | >65% |
| Step 2 drop-off | % abandoning at plan type | <35% |
| Email capture rate | % of results viewers | >25% |
| Slider usage (Cat 2) | % using pass-through slider | >30% |

### Lagging indicators (monthly)

| Metric | Definition | 3-month target |
|--------|------------|----------------|
| Total assessments | Cumulative completions | 5,000 |
| Consulting enquiries | Discovery calls booked | 30 |
| Consulting conversions | Paid engagements | 5 |
| Return visits | Post-October return rate | >10% of email list |

### Diagnostic signals

| Signal | Diagnosis | Response |
|--------|-----------|----------|
| Step 2 drop-off >40% | Plan type question too complex | Add "I don't know" option defaulting to flat rate |
| Email capture <15% | October promise not compelling | Rewrite capture copy |
| CTA clicks <1% | Results not credible or CTA not visible | Review result page hierarchy |
| Slider unused >70% | Slider not discoverable | Increase prominence |

---

## G. Technical Considerations

### G.1 — Architecture overview

```
nosurcharging.com.au     → web service (Next.js 14, App Router)
api.nosurcharging.com.au → api service (Hono, TypeScript)
[internal Railway]       → plausible (self-hosted analytics)
[external Supabase]      → PostgreSQL + Auth + Storage
[external Resend]        → transactional email
[external Cloudflare]    → DNS, DDoS protection, SSL
```

### G.2 — Core database schema

```sql
CREATE TABLE assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid,        -- Phase 3 enterprise
  user_id uuid,                -- Phase 2 auth
  session_id uuid NOT NULL,
  country_code text NOT NULL DEFAULT 'AU',
  category integer NOT NULL CHECK (category IN (1,2,3,4)),
  inputs jsonb NOT NULL,
  outputs jsonb NOT NULL,
  ip_hash text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  consent_type text NOT NULL,
  consent_text text NOT NULL,     -- exact text shown
  consent_version text NOT NULL,  -- e.g. 'v1.0'
  consented boolean NOT NULL,
  ip_hash text,
  user_agent text,
  created_at timestamptz DEFAULT now()
  -- APPEND-ONLY via RLS policy
);

CREATE TABLE email_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  country_code text DEFAULT 'AU',
  signup_source text,
  assessment_id uuid REFERENCES assessments(id),
  consent_id uuid REFERENCES consents(id),
  created_at timestamptz DEFAULT now()
);
```

### G.3 — Country-aware constants (international expansion readiness)

```
packages/calculations/constants/
├── index.ts   — country router
├── au.ts      — Australia (Phase 1)
├── uk.ts      — United Kingdom (Phase 2)
└── eu.ts      — European Union (Phase 2)
```

The calculation engine accepts a country code. This is the single architectural decision that makes international expansion a configuration exercise rather than a rebuild.

### G.4 — Phase 2 stubs to create in Phase 1

- `POST /api/excel` → returns 501 with "Coming in Phase 2". Reserves the endpoint for server-side openpyxl generation.
- Supabase Storage bucket `invoice-uploads` with 24-hour lifecycle deletion policy
- `invoice_uploads` table in schema (user_id, status, extraction_result, created_at)

### G.5 — Technology decisions

| Layer | Choice | Reason |
|-------|--------|--------|
| Frontend | Next.js 14 App Router | SEO-critical for content strategy |
| Language | TypeScript | Type safety for calculation engine |
| Styling | Tailwind CSS | Design token consistency |
| Charts | Recharts | React-native, prototyped |
| API | Hono | TypeScript-first, faster than Express |
| Database | Supabase (PostgreSQL) | RLS, Auth, Storage in one platform |
| Job queue | pg-boss (Phase 2) | Uses existing Postgres, no Redis |
| Email | Resend | Clean API, free tier adequate |
| Analytics | Plausible self-hosted | Cookieless, no consent banner needed |
| Excel generation | openpyxl via Railway API | Full formatting — SheetJS insufficient |

---

## H. Open Questions and Risks

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Step 2 drop-off too high | Medium | High | Add "I don't know" option; monitor first two weeks |
| Calculation accuracy issue | Low | Critical | Full test suite; three-layer disclaimer; manual verification |
| PSPs proactively lower rates before October | Low | Positive | Update messaging; good problem to have |
| October window closes without Phase 2 bridge | Medium | High | 30 Oct benchmarking tool must be ready same week |
| Solo founder execution with hard deadline | High | High | Minimal Phase 1 scope; consider contract developer |

### Open questions

| ID | Question | Blocking? | Owner |
|----|----------|-----------|-------|
| OQ-01 | ✅ RESOLVED — RBA Statistical Tables C1 and C2, 12 months to Jan 2026 | Resolved | April 2026 |
| OQ-02 | Australian legal review of disclaimer text | Before launch | Solicitor |
| OQ-03 | Calendly URL for discovery call booking | Before results CTA is wired | Manu |
| OQ-04 | Global brand beyond nosurcharging.com.au | Before Phase 2 | Manu |
| OQ-05 | PSP Rate Registry as Phase 1 post-assessment flow vs Phase 2 feature | Before Week 4 | Manu |

---

## Appendix: Build Sequence

### Pre-code checklist
- [ ] Supabase schema migrations applied, RLS policies configured
- [ ] Railway services provisioned: web, api, plausible
- [ ] Environment variables set across all services
- [ ] Cloudflare DNS configured for nosurcharging.com.au
- [ ] Empty deploy confirms pipeline

### Six-week schedule

| Week | Focus | Exit criteria |
|------|-------|---------------|
| 1 | Foundation — schema, Railway, Next.js scaffold, Hono, first deploy | nosurcharging.com.au returns 200 |
| 2 | Calculation engine — constants, pure functions, full test suite | All tests pass against verified scenarios |
| 3 | Assessment flow — 4 steps, layman + expert paths, consent recording | Complete assessment stores to Supabase |
| 4 | Results page — verdict, slider, chart, action list, email capture | Full results flow end-to-end working |
| 5 | Infrastructure — Plausible, Resend, legal review, Phase 2 stubs | All events fire in Plausible dashboard |
| 6 | Launch — SEO, mobile audit, performance, soft launch, public launch | 100 assessments in first 48 hours |

---

*PRD v1.0 · nosurcharging.com.au · April 2026*
*Source: RBA Conclusions Paper, 31 March 2026*
