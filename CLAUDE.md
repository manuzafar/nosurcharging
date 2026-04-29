# CLAUDE.md
## nosurcharging.com.au — Complete Project Context

Read this document completely before writing a single line of code.
Then read the referenced documents for the area you are working on.
If anything in this file conflicts with a referenced document, this file wins.

---

## Table of Contents

1.  What this product is
2.  The vision
3.  The five merchant categories
4.  Phase 1 architecture
5.  Phase 2 and 3 — do not build yet
6.  Repository structure
7.  Build sequence
8.  Calculation engine
9.  Business rules engine
10. Database
11. Security
12. Design
13. Testing
14. Environments and deployment
15. Analytics
16. Open questions
17. Document index

---

## 1. What This Product Is

nosurcharging.com.au is a free, independent merchant payments intelligence platform.

Merchants answer four questions about their payments setup. The platform assigns their
category (1-4), calculates their projected P&L impact in dollars, and gives a
personalised action list with specific dates and PSP-name-inline scripts.

The immediate trigger is the RBA October 2026 surcharge reform. The permanent purpose
is enabling merchants everywhere to understand what card acceptance costs them. The
reform is the entry point, not the destination.

It has no commercial relationship with any PSP, acquirer, or card scheme. This
independence is structural — built into the architecture.

---

## 2. The Vision

Enable merchants everywhere to maximise their payment outcomes by driving radical
transparency across the payments value chain.

Australia is the trigger, not the destination. Payment opacity is a global problem.
The architecture is global from day one. Country constants are modular. Launching in
a new market is a configuration exercise, not a rebuild.

Full detail: docs/product/product-vision.md

---

## 3. The Five Merchant Categories

The core framework. Three questions determine every merchant's outcome.

Q0 — Is the plan a zero-cost EFTPOS arrangement?
  Yes: Category 5 — surcharge mechanism ends 1 October, PSP moves merchant to flat rate.
  No:  proceed to Q1 + Q2.

Q1 — Plan type:
  Flat rate:   one blended percentage. IC saving does NOT flow automatically.
  Cost-plus:   actual wholesale cost + margin. IC saving flows automatically.

Q2 — Currently surcharging designated networks?
  Yes: surcharge revenue disappears 1 October 2026 (Visa, Mastercard, eftpos).
  No:  no revenue change from the ban.

                       NOT surcharging    Surcharging
  Cost-plus plan       Category 1         Category 3
  Flat rate plan       Category 2         Category 4
  Zero-cost EFTPOS              Category 5 (both columns)

Assignment logic:
  Cat 5: planType === 'zero_cost'                       (short-circuits Q1/Q2)
  Cat 1: planType === 'costplus' && !surcharging
  Cat 2: planType === 'flat'     && !surcharging
  Cat 3: planType === 'costplus' && surcharging
  Cat 4: planType === 'flat'     && surcharging

Category verdicts:
  Cat 1: "Your costs fall automatically on 1 October."
  Cat 2: "The saving exists — but it won't arrive automatically."
  Cat 3: "Your surcharge revenue disappears on 1 October."
  Cat 4: "You face both challenges simultaneously."
  Cat 5: "Your zero-cost plan ends on 1 October."

Amex/BNPL carve-out: Visa, Mastercard, eftpos are designated (ban applies).
Amex, BNPL, PayPal are exempt (still surchargeable). If a merchant surcharges
ONLY exempt networks, show a note that the reform may not affect them.

For Category 5 (zero-cost), Step 3 is replaced with a simplified Amex-only
question. PayPal/BNPL options are not shown — they are not relevant to
terminal-based zero-cost merchants. Visa/Mastercard/eftpos are pre-set
because the zero-cost surcharge mechanism always covers them.

Full detail: docs/domain/merchant-categories.md

---

## 4. Phase 1 Architecture

ONE Railway service. Not two. Not three. One.

  Railway (Sydney — ap-southeast-2)
    web (Next.js 14 App Router)  THE ONLY RAILWAY SERVICE IN PHASE 1

  Supabase (Singapore — ap-southeast-1)  CONFIRM THIS REGION BEFORE PROJECT CREATION
    PostgreSQL via PgBouncer pooler PORT 6543 (not 5432)

  PostHog Cloud (US or EU host)  NOT self-hosted, NOT on Railway
  Resend (transactional email)
  Cloudflare (DNS, WAF, SSL — free tier)

All database operations use Next.js Server Actions. No separate Hono API in Phase 1.

  actions/createSession.ts    — generates session ID, sets HttpOnly cookie
  actions/recordConsent.ts    — INSERT into consents table
  actions/submitAssessment.ts — runs resolution pipeline + calculation + INSERT
  actions/captureEmail.ts     — INSERT into email_signups

Technology stack:
  Frontend:   Next.js 14 App Router
  Language:   TypeScript throughout
  Styling:    Tailwind CSS
  Charts:     Recharts (NOT Chart.js — prototype used Chart.js, production uses Recharts)
  Database:   Supabase PostgreSQL
  Email:      Resend
  Analytics:  PostHog Cloud (NOT self-hosted)
  Monorepo:   Turborepo
  Unit tests: Vitest (NOT Jest — same API, 10-20x faster, native ESM)
  E2E tests:  Playwright (NOT Cypress)

Full detail: docs/architecture/solution-architecture.md

---

## 5. Phase 2 and 3 — Do Not Build These Yet

Phase 2 (Q1 2027):
  Hono API service (invoice complexity justifies separation)
  Invoice upload and parsing via Claude API
  Excel workbook download (ExcelJS, server-side, NOT SheetJS)
  MSF benchmarking tool (30 Oct 2026 data)
  Supabase Auth (magic link + Google OAuth)
  First international market (NZ or UK)

Phase 3 (2027+):
  Enterprise multi-tenancy, business rules engine, ERP integrations, SaaS model

Phase 2 stubs to create in Phase 1 (prevents schema migrations later):
  app/api/excel/route.ts         returns 501 "Coming in Phase 2"
  invoice_uploads table          in schema with nullable columns
  organisation_id, user_id       on all tables, nullable in Phase 1

---

## 6. Repository Structure

  nosurcharging/
  CLAUDE.md
  turbo.json
  package.json
  apps/
    web/                          Next.js 14 (only app in Phase 1)
      app/
        layout.tsx                Root layout — PostHogProvider wraps children
        page.tsx                  Homepage (SSR)
        assessment/page.tsx       Assessment flow (client component)
                                  Phases: disclaimer → step1 → step2 →
                                          step3 → step4 → email_gate → reveal
                                  Strategic-rate path: step2 → reveal direct
                                  (skips email gate)
        results/page.tsx          Results page
        privacy/page.tsx          Privacy policy (required before launch)
        insights/                 SEO content articles (SSR)
        api/
          health/route.ts         GET /api/health — returns 200
          excel/route.ts          POST /api/excel — returns 501 Phase 2 stub
      actions/
        createSession.ts          Server action: session creation
        recordConsent.ts          Server action: consent recording
        submitAssessment.ts       Server action: assessment submit
        captureEmail.ts           Server action: post-INSERT Resend send +
                                  email_report_sent flag (called from
                                  submitAssessment when email is provided)
      components/
        assessment/               Steps 1-4 components
        results/                  Results page components
        charts/                   Recharts wrappers
        homepage/                 Homepage sections
      lib/
        supabase/server.ts        Service-role client (server only — NEVER browser)
        supabase/client.ts        Anon-key client (browser safe)
        analytics.ts              PostHog wrapper — Analytics.* typed API + trackEvent legacy
        security.ts               hashIP(), sanitiseForHTML(), validateConfig()
        rateLimit.ts              Supabase-backed rate limiter
  packages/
    calculations/                 SHARED CALCULATION ENGINE
      constants/
        index.ts                  Country router: getConstants(countryCode)
        au.ts                     Australia — all RBA rates (Tier 1)
        uk.ts                     Phase 2 stub (structure only)
        eu.ts                     Phase 2 stub (structure only)
      rules/
        schema.ts                 Rule definitions — what inputs exist, source priority
        resolver.ts               Resolution pipeline — builds ResolvedAssessmentInputs
      calculations.ts             Pure functions — receives ResolvedAssessmentInputs only
      categories.ts               getCategory(planType, surcharging)
      periods.ts                  Time-based rate switching
      actions.ts                  buildActions(category, inputs, psp, industry)
      types.ts                    TypeScript interfaces
      __tests__/
        calculations.test.ts      PRIMARY — must pass before any UI
        categories.test.ts
        periods.test.ts
        resolver.test.ts          Priority order, normalisation, confidence, trace
        security.test.ts
    db/
      migrations/001_initial.sql  = docs/architecture/database-schema.sql
      types.ts                    Supabase generated types

---

## 7. Build Sequence — Do Not Skip Steps

Before writing any code:
  [ ] Supabase project in ap-southeast-1 (Singapore) — CANNOT CHANGE AFTER CREATION
  [ ] Apply docs/architecture/database-schema.sql (staging project first)
  [ ] Verify RLS: INSERT to consents works; UPDATE and DELETE are rejected
  [ ] Railway project with staging and production environments
  [ ] All environment variables set in both environments (see Section 14)
  [ ] GitHub: staging and main branches + Actions workflows
  [ ] Empty Next.js deploys live at staging.nosurcharging.com.au
  [ ] GET /api/health returns 200

Week 1 — Foundation:
  Turborepo monorepo scaffold, empty packages, first deploy confirmed

Week 2 — Calculation engine + rules engine (HARD GATE):
  [ ] packages/calculations/constants/au.ts    (all RBA rates — Tier 1)
  [ ] packages/calculations/periods.ts         (time-based rate switching)
  [ ] packages/calculations/rules/schema.ts    (rule definitions)
  [ ] packages/calculations/rules/resolver.ts  (resolution pipeline)
  [ ] packages/calculations/calculations.ts    (receives ResolvedAssessmentInputs)
  [ ] packages/calculations/categories.ts
  [ ] packages/calculations/__tests__/calculations.test.ts
  [ ] packages/calculations/__tests__/periods.test.ts
  [ ] packages/calculations/__tests__/resolver.test.ts
  [ ] turbo run test:unit — ALL TESTS PASS
  NO UI CODE IS WRITTEN UNTIL THIS GATE IS CLEARED

Week 3 — Assessment flow:
  Disclaimer + Steps 1-4 (including optional card mix input in Step 2)
  Consent recording wired to Supabase

Week 4 — Results page:
  Verdict + hero P&L number + slider + Recharts chart + action list + email capture
  PSP Rate Registry contribution form (3-field anonymous form, post email capture)

Week 5 — Infrastructure and legal:
  PostHog Cloud, Resend, security headers, privacy policy, Sentry, legal review

Week 6 — Launch:
  SEO metadata, mobile audit, performance, soft launch, public launch

---

## 8. Calculation Engine

The calculation engine receives a fully resolved ResolvedAssessmentInputs object.
It never decides where values come from. No fallbacks. No optionals. No nulls.
All input resolution happens upstream in the rules engine (see Section 9).

CONSTANTS — Three tiers:

  Tier 1 (TypeScript code — require PR + test run + deployment to change):
    Interchange rates, reform dates, scheme fees, designated networks
    File: packages/calculations/constants/au.ts

  Tier 2 (environment variables — change in Railway dashboard, no deployment):
    Aggregate card mix defaults (used when no scheme-level vars are set):
      CALC_CARD_MIX_DEBIT=0.60        (visa_debit + mastercard_debit + eftpos combined)
      CALC_CARD_MIX_CREDIT=0.35       (visa_credit + mastercard_credit combined)
      CALC_CARD_MIX_FOREIGN=0.05
      CALC_CARD_MIX_COMMERCIAL=0.00
    Granular scheme-level card mix (overrides aggregate values when set):
      CALC_CARD_MIX_VISA_DEBIT=0.35
      CALC_CARD_MIX_VISA_CREDIT=0.18
      CALC_CARD_MIX_MC_DEBIT=0.17
      CALC_CARD_MIX_MC_CREDIT=0.12
      CALC_CARD_MIX_EFTPOS=0.08
      CALC_CARD_MIX_AMEX=0.05
      CALC_CARD_MIX_FOREIGN=0.05
    Average transaction values by industry:
      CALC_AVG_TXN_CAFE=35
      CALC_AVG_TXN_HOSPITALITY=80
      CALC_AVG_TXN_RETAIL=65
      CALC_AVG_TXN_ONLINE=95
      CALC_AVG_TXN_TICKETING=120
      CALC_AVG_TXN_DEFAULT=65

  Tier 3 (automatic — engine checks current date, applies correct rates):
    periods.ts: getCurrentPeriod(now) returns one of:
      'pre_reform'    → today = preSep2026 rates,  projected = postOct2026
      'post_oct_2026' → today = postOct2026 rates, projected = postApr2027
      'post_apr_2027' → today = postApr2027 rates, projected = null

AUSTRALIAN RATES (source: RBA Conclusions Paper, March 2026):

  Pre-Oct 2026:
    debitCentsPerTxn: 0.09,  consumerCreditPct: 0.0052
    commercialCreditPct: 0.008,  foreignPct: 0.028

  Post 1 Oct 2026:
    debitCentsPerTxn: 0.08 (lower of 8c or 0.16%),  consumerCreditPct: 0.003
    commercialCreditPct: 0.008 (unchanged),  foreignPct: 0.028 (unchanged)

  Post 1 Apr 2027:
    foreignPct: 0.01 (IC cap ONLY)
    TRUE FLOOR: 1.0% IC + 1.58% scheme fees = ~2.58%
    NEVER display the cap as 1.0% total cost — it is not

  Scheme fees (unregulated, unchanged by reform):
    domesticPct: 0.00105 (10.5bps),  crossBorderPct: 0.0158 (158bps)

CORE FORMULAS:

  IC saving:
    debitTxns    = (volume * debitShare) / avgTxnValue
    debitSaving  = debitTxns * (currentDebitCents - projectedDebitCents)
    creditSaving = volume * creditShare * (currentCreditPct - projectedCreditPct)
    totalICSaving = debitSaving + creditSaving

  Cost-plus P&L swing:
    netToday = grossCOA - surchargeRevenue
    octNet   = grossCOA - totalICSaving
    plSwing  = netToday - octNet

  Flat rate P&L swing (passThrough: 0.0 to 1.0):
    netToday = annualMSF - surchargeRevenue
    octNet   = annualMSF - (totalICSaving * passThrough)
    plSwing  = netToday - octNet
    (passThrough=0: plSwing=0, PSP keeps saving)
    (passThrough=1: plSwing=totalICSaving, full saving reaches merchant)

INVARIANTS — never violated:
  result.todayScheme === result.oct2026Scheme  (scheme fees are unchanged)
  !isNaN(result.plSwing) && isFinite(result.plSwing)
  debitSaving >= 0  (rate below reform cap = zero saving, not negative)
  card mix shares sum to 1.0  (validated by resolver before engine runs)

The `now` parameter is injected (default: new Date()) — makes time-based
logic fully testable without mocking the system clock.

Full rates detail: docs/domain/interchange-rates.md
Full config detail: docs/architecture/calculation-configuration.md

---

## 9. Business Rules Engine

The calculation engine receives a fully resolved object. The business rules engine
is what builds that object. They are separate. The calculation engine never changes
when new inputs or sources are added.

THREE LAYERS:

  Layer 1 — Rule Schema (packages/calculations/rules/schema.ts)
    Defines every configurable input: key, label, data type, validation bounds,
    which sources can provide this value, and in what priority order.

  Layer 2 — Resolution Pipeline (packages/calculations/rules/resolver.ts)
    resolveAssessmentInputs(raw, context) builds ResolvedAssessmentInputs by
    trying each source in priority order and taking the first non-null value:
      Priority 1: Merchant explicit input (Phase 1 — card mix splits, expert rates)
      Priority 2: Invoice-parsed values   (Phase 2 — from PSP statement)
      Priority 3: Industry defaults       (Phase 2 — from PSP Rate Registry)
      Priority 4: Env var parameters      (Tier 2 operational — CALC_* vars)
      Priority 5: Regulatory constants    (Tier 1 — hardcoded TypeScript)
    Returns ResolutionTrace: records which source was used for every field.

  Layer 3 — Calculation Engine (packages/calculations/calculations.ts)
    Receives ResolvedAssessmentInputs — no optionals, no nulls, no fallbacks.
    Knows nothing about where values came from.

PHASE 1 — Merchant card mix input:
  Optional section in Step 2: "Know your card mix? It improves accuracy."
  Seven fields (all optional): Visa debit, Visa credit, Mastercard debit,
    Mastercard credit, eftpos, Amex, Foreign cards
  Partial input valid — missing fields filled from Tier 2 env vars or Tier 1 defaults.
  Auto-normalises to 1.0. Live total display. Never blocks progression.
  Confidence badge updates live as fields are filled.
  Assumptions panel shows per-field source: "Visa debit 35% — Your input"

ADDING A NEW CONFIGURABLE INPUT:
  1. Add one entry to RULE_SCHEMA in rules/schema.ts
  2. Add resolution cases in resolveAssessmentInputs() in rules/resolver.ts
  3. Use resolved value in calculateMetrics() — already populated, no nulls
  The calculation engine itself does not change.

ADDING A NEW SOURCE (e.g. Phase 2 invoice parsing):
  1. Add field to ResolutionContext interface in resolver.ts
  2. Add source cases at correct priority position in resolver.ts
  3. Schema and calculation engine do not change.

Full detail: docs/architecture/business-rules-engine.md

---

## 10. Database

CONNECTION — always use PgBouncer pooler:
  CORRECT: postgresql://postgres:[pwd]@[project].supabase.co:6543/postgres
  WRONG:   postgresql://postgres:[pwd]@[project].supabase.co:5432/postgres
  Port 6543 = pooler. Port 5432 = direct. Always use 6543.

SUPABASE CLIENT SEPARATION:
  lib/supabase/server.ts — imports service role key
    May ONLY be imported from: server components, server actions, API routes
    NEVER from client components or any file with 'use client'

  lib/supabase/client.ts — imports anon key
    Browser safe. RLS enforces all access control.

KEY SCHEMA PRINCIPLES:
  Every table has these columns from day one (nullable in Phase 1):
    organisation_id uuid  — Phase 3 enterprise multi-tenancy
    user_id uuid          — Phase 2 Supabase Auth
    country_code text     — 'AU' default, populated from day one

  Consents table is APPEND-ONLY enforced at the database:
    CREATE POLICY "deny_update" ON consents FOR UPDATE USING (false);
    CREATE POLICY "deny_delete" ON consents FOR DELETE USING (false);
    Never remove these. Application-layer enforcement is bypassable. DB-level is not.

Apply docs/architecture/database-schema.sql before writing any application code.

---

## 11. Security — Non-Negotiable

Violating any of these is a bug, not a trade-off.

SR-01: Session IDs are server-generated.
  randomUUID() in actions/createSession.ts only. Set HttpOnly, Secure, SameSite=Strict.

SR-02: IP hashing uses HMAC-SHA256 with secret salt.
  Always use lib/security.ts hashIP(). Throws if IP_HASH_SECRET not set.
  Raw IPs never stored anywhere — not DB, not logs, not Sentry.

SR-03: Service role key never in browser code.
  Only lib/supabase/server.ts imports it. No NEXT_PUBLIC_ prefix.
  Add ESLint rule to catch accidental imports in client files.

SR-04: PgBouncer pooler only. Port 6543. See Section 10.

SR-05: RLS append-only consents enforced at database level. See Section 10.

SR-06: Security headers in next.config.ts before first deploy.
  HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff,
  Referrer-Policy, Permissions-Policy, Content-Security-Policy.
  CSP must whitelist app.posthog.com and *.posthog.com.

SR-07: CORS exact origin matching.
  allowed.includes(origin) not origin.includes('nosurcharging.com.au')
  Substring matching is vulnerable to nosurcharging.com.au.attacker.com.

SR-08: DOMPurify on all dynamic HTML content.
  PSP name and card mix labels appear inline in results HTML. Sanitise before rendering.

SR-09: Rate limiting is layered (IP + session).
  Assessment: 100 per IP per 24 hours.
  Email capture: 1 per session, 10 per IP per hour.
  Supabase rate_limits table — no Redis needed in Phase 1.

SR-10: Privacy Policy at /privacy before any data collection.

SR-11: Sentry with PII scrubbing before any event is sent.

SR-12: Never log PII.
  Never: email, raw IP, full session ID, financial inputs, API keys.
  Acceptable: hashed IP, category, PSP name, industry, country, last 8 chars session ID.
  Logging: Railway native logs (JSON to stdout). No external log tool in Phase 1.

Full detail: docs/security/security-requirements.md

---

## 12. Design

Read docs/design/ux-design.md, docs/design/design-tokens.md, and
docs/design/component-specs.md before building any UI component.

TEN RULES — never violated:

1. All financial numbers use var(--font-mono). No exceptions.
   P&L swing, metric cards, slider value, action dates, step counter — all mono.

2. P&L swing hero number is 44px monospace.
   It is the first thing the merchant sees. Everything else is secondary.

3. Font weights 400 and 500 only. Never 600 or 700.

4. Single accent colour: amber #BA7517. Used sparingly but boldly.

5. Scheme fees bar must be EXACTLY equal height in both chart columns.
   Use Math.round() and verify equality. isAnimationActive={false} on chart.
   This is intentional design — it shows scheme fees are unregulated without words.

6. The reveal moment is 1.1 seconds. Never shorten or skip it.
   Dark screen, pulsing amber dot, category label fades in at 0.6s.
   Server action fires IMMEDIATELY when reveal appears — not after it ends.

7. SVG icons, not emoji. Emoji break in dark mode.

8. Single breakpoint at 500px. Not 768px.

9. Expert toggle is a text link, not a button.
   "Payment wizard? Enter your exact rates →"
   The wizard self-selects. The layman never sees it prominently.

10. PSP name inline in action list.
    "Call Stripe and say..." — never "call your PSP".

KEY SCREEN DECISIONS:

  Step 2 — Plan type: Two visual mock statement cards. Not radio buttons.
    Card A: one blended line "Merchant service fee: 1.40%"
    Card B: four separate lines (debit IC, credit IC, scheme fees, PSP margin in green)
    Card mix input below: optional toggle, seven scheme fields, live total, auto-normalise

  Reveal screen: full-height dark, pulsing amber dot, auto-advances at 1.1s.

  Results verdict:
    [Category pill]  [Confidence chip]
    [18px serif headline]
    [44px mono P&L swing]  [direction label]
    ["across $Xm in annual card revenue"]
    [3-4 sentence body]

  Assumptions panel: driven by ResolutionTrace — shows "Your input" vs "RBA average"
    per field. Do not manually construct this. Read from resolutionTrace in outputs.

  Email capture (exact wording — do not change):
    "One email on 30 October. Not shared with any payment provider."

Full detail: docs/design/ux-design.md, docs/design/component-specs.md,
             docs/design/design-tokens.md

---

## 13. Testing

Framework:
  Unit + integration: Vitest (NOT Jest)
  Component tests:    React Testing Library
  E2E:                Playwright (NOT Cypress)

HARD GATE: All Week 2 tests must pass before any UI is written.
  turbo run test:unit — must return green before Week 3 starts.

CRITICAL TESTS — all must exist:

  categories.test.ts:
    getCategory('zero_cost', false) === 5
    getCategory('zero_cost', true)  === 5  (surcharging ignored — Cat 5 short-circuits)
    getCategory('costplus', false)  === 1
    getCategory('flat', false)      === 2
    getCategory('costplus', true)   === 3
    getCategory('flat', true)       === 4

  calculations.test.ts:
    result.todayScheme === result.oct2026Scheme  (scheme fees invariant)
    No NaN or Infinity from any valid input
    Cat 2 at passThrough=0: plSwing === 0
    Cat 2 at passThrough=1: plSwing ≈ totalICSaving
    Expert rate below reform cap: debitSaving >= 0
    Cat 5 (zero_cost): netToday === 0
    Cat 5 (zero_cost): plSwing === -volume × estimatedMSFRate
    Cat 5 (zero_cost): rangeDriver === 'post_reform_rate'
    Cat 5 (zero_cost): icSaving still computed (transparency invariant)

  periods.test.ts:
    getCurrentPeriod(new Date('2026-09-30')) === 'pre_reform'
    getCurrentPeriod(new Date('2026-10-01')) === 'post_oct_2026'
    getCurrentPeriod(new Date('2027-04-01')) === 'post_apr_2027'

  resolver.test.ts:
    Merchant input beats env var beats regulatory constant (priority order)
    Partial merchant input normalises to 1.0
    Input summing to >100% normalises correctly
    Low confidence when all fields use defaults
    High confidence when majority from merchant input
    ResolutionTrace contains correct source and label per field

  security.test.ts:
    hashIP throws when IP_HASH_SECRET is not set
    Same IP + same secret = same hash (deterministic)
    Same IP + different secret = different hash (rainbow table resistance)

  E2E (Playwright):
    Full layman journey → Category 2 results
    Full wizard journey with expert rates → Category 1 results
    Card mix input → improves confidence badge
    Amex carve-out: only Amex → note appears; Visa added → note disappears
    Mobile 375px: plan cards single column, metrics single column
    Chart invariant: scheme fees bars same pixel height (within 1px)

Coverage requirements:
  packages/calculations:  95% lines, 95% functions, 90% branches
  apps/web/actions:       80% lines, 85% functions, 75% branches

Full detail: docs/testing/testing-strategy.md

---

## 14. Environments and Deployment

THREE ENVIRONMENTS — complete isolation at every layer:
  local      → .env.local, developer machine
  staging    → staging.nosurcharging.com.au (Railway staging environment)
  production → nosurcharging.com.au (Railway production environment)

THREE SEPARATE SUPABASE PROJECTS — not schemas in one project.
A staging database incident cannot affect production.

BRANCHES:
  feature/* → local only, PR to staging
  staging   → auto-deploys to staging.nosurcharging.com.au
  main      → auto-deploys to production (requires manual GitHub approval gate)

CI/CD (GitHub Actions):
  ci.yml               — every PR: lint + types + unit tests + build
  deploy-staging.yml   — on merge to staging: tests + E2E on staging
  deploy-production.yml — on merge to main: manual approval + tests + production

MIGRATIONS — manual only. Never automated in CI.
  Apply via Supabase SQL editor: staging first → verify → production.
  001_initial.sql = docs/architecture/database-schema.sql

ENVIRONMENT VARIABLES (Phase 1, both environments):

  # Supabase — browser safe (RLS enforces access)
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=

  # Supabase — server only (NO NEXT_PUBLIC_ prefix)
  SUPABASE_URL=
  SUPABASE_SERVICE_ROLE_KEY=

  # Database — MUST be pooler URL, port 6543
  DATABASE_URL=postgresql://postgres:[pwd]@[project].supabase.co:6543/postgres

  # Security — DIFFERENT value in staging vs production
  IP_HASH_SECRET=
  EMAIL_ENCRYPTION_KEY=

  # Calculation — Tier 2 operational parameters
  # Aggregate card mix (fallback when granular not set)
  CALC_CARD_MIX_DEBIT=0.60
  CALC_CARD_MIX_CREDIT=0.35
  CALC_CARD_MIX_FOREIGN=0.05
  CALC_CARD_MIX_COMMERCIAL=0.00
  # Granular scheme-level card mix (overrides aggregate when set)
  CALC_CARD_MIX_VISA_DEBIT=0.35
  CALC_CARD_MIX_VISA_CREDIT=0.18
  CALC_CARD_MIX_MC_DEBIT=0.17
  CALC_CARD_MIX_MC_CREDIT=0.12
  CALC_CARD_MIX_EFTPOS=0.08
  CALC_CARD_MIX_AMEX=0.05
  # Average transaction values
  CALC_AVG_TXN_DEFAULT=65
  CALC_AVG_TXN_CAFE=35
  CALC_AVG_TXN_HOSPITALITY=80
  CALC_AVG_TXN_RETAIL=65
  CALC_AVG_TXN_ONLINE=95
  CALC_AVG_TXN_TICKETING=120

  # Analytics — PostHog (same key value for both — NEXT_PUBLIC_ exposes to browser)
  NEXT_PUBLIC_POSTHOG_KEY=phc_...
  NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
  POSTHOG_NODE_KEY=phc_...

  # Email
  RESEND_API_KEY=
  RESEND_FROM=manu@nosurcharging.com.au

  # Consulting CTA
  CALENDLY_URL=https://calendly.com/[your-username]/payments-discovery-call
  CALENDLY_WEBHOOK_SECRET=

  # Monitoring
  NEXT_PUBLIC_SENTRY_DSN=
  SERVICE_NAME=web

ROLLBACK:
  Railway: dashboard → web service → Deployments → select previous → Redeploy
  Git: git revert HEAD && git push origin main

Full detail: docs/deployment/deployment-strategy.md

---

## 15. Analytics — PostHog

Use PostHog Cloud (US or EU host). The previous decision was Plausible — it
was migrated out in April 2026 because PostHog gives us funnels, identified
users, and feature flags in a single tool. DO NOT self-host. DO NOT create a
Railway service.

Privacy posture (ships before consent banner is in place):
  - autocapture: false        — only explicit Analytics.* calls send events
  - session_recording: off    — no DOM snapshots, no rendered text capture
  - persistence: localStorage+cookie
  - identify(): SHA-256 hash of email — never raw

Provider initialisation (apps/web/lib/analytics.ts):
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host:        process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com',
    capture_pageview: false,   // App Router — manual via PostHogProvider
    autocapture:      false,
    persistence:     'localStorage+cookie',
  });

Two surfaces:
  - Analytics.* — typed API for new events. Snake_case names, defined props.
    Example: Analytics.resultsViewed({ category, pl_swing, volume_tier, ... })
  - trackEvent(name, props) — legacy wrapper kept for first-interaction events
    (Expert mode activated, Card mix entered) that don't fit funnel boundaries.
    Auto-converts the name to snake_case. Prefer Analytics.* for new code.

Server-side (apps/web/lib/posthog-node.ts):
  trackServerEvent(distinctId, eventName, props) — used by the Calendly
  webhook to fire consulting_booked. distinctId is SHA-256(email) so it
  joins the same merchant identity as the client-side identifyUser.

Every event includes { country: 'AU' } — required for multi-market analytics.

Funnel events (snake_case, current as of April 2026):
  homepage_viewed                { referrer, utm_*, is_mobile }
  cta_clicked_homepage           { cta_location: 'nav'|'hero'|'bottom' }
  assessment_started
  step_completed                 { step, ...step-specific props }
  zero_cost_rate_selected        { mode }
  blended_rates_entered          { debit_provided, credit_provided }
  strategic_rate_exit_viewed     { trigger: 'self_select'|'result_page' }
  assessment_abandoned           { at_step, time_spent_seconds }
  assessment_submission_complete { category }
  results_viewed                 { category, pl_swing, pl_swing_bucket, volume_tier, psp, plan_type, industry, surcharging, accuracy_pct, is_mobile }
  section_visited                { section, category, time_since_results_viewed_seconds }
  cta_clicked                    { cta_type, cta_location, category, pl_swing?, volume_tier?, psp? }
  result_looks_off_clicked       { category, accuracy_pct }
  feedback_opened                { category }
  feedback_submitted             { category, rating? }
  slider_used                    { category, pass_through_pct }
  assumptions_opened             { category }
  registry_form_started          { category, psp }
  registry_contributed           { psp, plan_type, volume_tier, industry }
  email_gate_shown               { assessment_id?, category }
  email_captured                 { assessment_id?, marketing_consent }
  email_gate_skipped             { assessment_id? }
  consulting_booked              { source, has_intake_answers, event_time }  (server-side)

Required env vars:
  NEXT_PUBLIC_POSTHOG_KEY=phc_...        # public — ships in browser bundle
  NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
  POSTHOG_NODE_KEY=phc_...               # server-side; same value as the public key

CSP: app.posthog.com and *.posthog.com are whitelisted in script-src and
connect-src in next.config.mjs.

---

## 16. Open Questions — Resolve Before Launch

OQ-01: ✅ RESOLVED — RBA Statistical Tables C1 (Credit and Charge Cards) and C2 (Debit Cards)
         URL: https://www.rba.gov.au/statistics/tables/#payments-system
         Defaults: 60% debit, 35% consumer credit, 5% foreign. Updated in au.ts.
OQ-02: ✅ RESOLVED — ap-southeast-1 (Singapore). Two separate projects: staging + production.
         Connection string uses pooler format: aws-0-ap-southeast-1.pooler.supabase.com:6543
         Full setup steps: docs/product/pre-launch-checklist.md
OQ-03: ACTION NEEDED — Create Calendly event type, copy URL, add to Railway as CALENDLY_URL.
         Full setup steps: docs/product/pre-launch-checklist.md
OQ-04: ACTION NEEDED — Brief ready in docs/product/pre-launch-checklist.md.
         Book one-hour review before Week 5. ~$300-500.
OQ-05: ✅ RESOLVED — Phase 1. Simple 3-field anonymous contribution form on results page.
         Trust scoring and public display deferred to Phase 2. Build in Week 4.
OQ-06: Not blocking Phase 1. Defer to before Phase 2 international launch.

---

## 17. Document Index

  CLAUDE.md (this file)
    Complete project context — always read first, every session

  docs/product/product-vision.md
    Global vision, revenue model, geographic expansion arc

  docs/product/prd.md
    39 functional requirements, all user stories, success metrics

  docs/domain/rba-reform.md
    All verified RBA facts, reform dates, mechanism, market context

  docs/domain/merchant-categories.md
    Four-category framework, assignment logic, Amex carve-out

  docs/domain/interchange-rates.md
    Rate constants in TypeScript — copy directly into au.ts

  docs/architecture/solution-architecture.md
    Full architecture, every technology decision with rationale

  docs/architecture/database-schema.sql
    Executable SQL — apply to Supabase before any application code

  docs/architecture/sequence-diagrams.md
    All six user flows as Mermaid diagrams

  docs/architecture/calculation-configuration.md
    Three-tier config model, time-based rate switching, periods.ts

  docs/architecture/business-rules-engine.md
    Resolution pipeline, rule schema, card mix input, adding new sources

  docs/security/security-requirements.md
    12 security rules with TypeScript implementations

  docs/design/ux-design.md
    Design vision, every screen specified in full detail

  docs/design/design-tokens.md
    Tailwind config, CSS custom properties — paste into codebase

  docs/design/component-specs.md
    14 components with complete behaviour, states, edge cases

  docs/testing/testing-strategy.md
    Vitest + Playwright, full test suite examples, coverage requirements

  docs/deployment/deployment-strategy.md
    3 environments, GitHub Actions workflows, Railway setup, rollback

  docs/content/tone-of-voice.md
    Plain English rules, action list format, copy patterns

  docs/product/calculation-verification.md
    6 verified scenarios with manual arithmetic — ground truth for test suite

  docs/product/consulting-products.md
    5 service products, pricing, discovery call script, CTA copy by category

  docs/product/pre-launch-checklist.md
    All open questions resolved, Supabase setup, Calendly setup, legal brief

  docs/legal/disclaimer-text.md
    Exact disclaimer wording — use verbatim, versioned

---

nosurcharging.com.au — Complete project context as of April 2026
