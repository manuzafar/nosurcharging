# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Modern Fintech Hierarchy design system with unified corner radius
- Phase 6 accessibility improvements across all components

### Fixed
- CI: pass `PLAYWRIGHT_BASE_URL` through Turbo to E2E tests
- CI: use `pnpm --filter` for Playwright install in staging E2E
- Mobile: header collision at 375px breakpoint
- Mobile: bare `$0` display in verdict hero
- Results: isolate actions state so slider doesn't blank ActionList

## [0.6.0] - 2026-04-09

UX Revamp: homepage redesign, results page overhaul, design system migration.

### Added
- ProofBar component (social proof indicators)
- TrustBar component (independence messaging)
- Homepage hero refresh with paper canvas and italic styling
- Situations grid replacing PreviewSection
- 4-question step list replacing FeaturesSection
- New page composition with footer copy
- Disclaimer with four commitments and wrapper
- ActionItem gains `script` and `why` fields
- VerdictSection daily anchor and situation copy
- ProblemsBlock with CERTAIN/DEPENDS variants
- DepthToggle progressive disclosure
- CostCompositionChart in depth zone
- PassThroughSlider and EscapeScenarioCard copy refresh
- ConsultingCTA copy refresh
- SkeletonLoader for loading states

### Changed
- Migrated amber accent to design-token-driven `accent` palette (28 files)
- Renamed AmberButton to AccentButton (6 files)
- Zone-based section order on results page
- AssumptionsPanel drops embedded chart and formula rows

### Removed
- Legacy amber palette from Tailwind config
- Unused amber CSS variables from globals.css

## [0.5.0] - 2026-04-08

Week 5: Infrastructure, security hardening, and third-party integrations.

### Added
- Security headers (SR-06): HSTS, CSP, X-Frame-Options, Referrer-Policy
- Privacy policy page at `/privacy` (SR-10)
- Sentry integration with PII scrubbing (SR-11)
- Plausible Cloud analytics integration
- Calendly webhook for consulting CTA
- CORS exact-origin matching (SR-07)
- Lazy-init pattern for Supabase admin and Resend clients

### Fixed
- `resolutionTrace` correctly attached to calculation outputs
- `sanitiseForHTML` applied to PSP name in action list
- Build failures from eager Supabase/Resend initialisation in CI

## [0.4.0] - 2026-04-07

Week 4: Results page with 14 components and full calculation visualisation.

### Added
- Results page with verdict, hero P&L number, and confidence badge
- PassThroughSlider for flat-rate category scenarios
- Recharts cost composition chart with scheme-fees invariant
- Action list with PSP-name-inline scripts and specific dates
- Assumptions panel driven by ResolutionTrace
- Email capture with single-send messaging
- PSP Rate Registry anonymous contribution form
- Consulting CTA with category-specific copy
- 1.1-second reveal animation with pulsing amber dot
- 195 tests passing (86 calculation + 109 component)

### Fixed
- Missing `todayInterchange`/`todayMargin`/`surchargeRevenue` in test mocks
- `@keyframes fadeUp` added to globals.css for staggered reveal
- Email input dark mode text colour
- `NEXT_PUBLIC_CALENDLY_URL` env var support

## [0.3.0] - 2026-04-06

Week 3: Assessment flow with four-step wizard and server actions.

### Added
- Disclaimer screen with consent recording (Supabase-backed)
- Step 1: Annual card revenue input
- Step 2: Plan type selection (visual mock statement cards) + optional card mix input
- Step 3: PSP selection with search
- Step 4: Surcharging status + industry selection
- Server actions: `createSession`, `recordConsent`, `submitAssessment`, `captureEmail`
- Idempotent assessment submissions with `assessmentId`
- Session-based consent guard preventing duplicate consent records
- Client-side sessionStorage for assessment state persistence
- Plausible event instrumentation for all assessment steps
- 155 tests passing

### Fixed
- `vi.stubEnv` for `NODE_ENV` in createSession test
- Typecheck error on `mockInsert` args tuple type
- `.env.example` template for local development

## [0.2.0] - 2026-04-05

Weeks 1-2: Turborepo monorepo scaffold and calculation engine.

### Added
- Turborepo monorepo with `apps/web` and `packages/calculations`
- Australian interchange rate constants from RBA Conclusions Paper (March 2026)
- Time-based rate switching: pre-reform, post-Oct 2026, post-Apr 2027
- Business rules engine with 5-priority resolution pipeline
- Rule schema definitions for all configurable inputs
- Category assignment: `getCategory(planType, surcharging)` returns 1-4
- Cost-plus and flat-rate P&L swing calculations
- Card mix normalisation with partial input support
- Confidence scoring based on input source distribution
- ResolutionTrace for full auditability
- Next.js 14 App Router with health check endpoint
- Phase 2 stub at `/api/excel` (returns 501)
- 67 tests passing across 6 test files
- GitHub Actions CI pipeline (lint, typecheck, test, build)
- Staging and production deployment workflows

[Unreleased]: https://github.com/manuzafar/nosurcharging/compare/v0.6.0...HEAD
[0.6.0]: https://github.com/manuzafar/nosurcharging/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/manuzafar/nosurcharging/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/manuzafar/nosurcharging/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/manuzafar/nosurcharging/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/manuzafar/nosurcharging/releases/tag/v0.2.0
