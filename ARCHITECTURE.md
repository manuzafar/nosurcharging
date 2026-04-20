# Architecture

Quick-reference architecture guide for contributors. For the full 1100-line deep dive, see [docs/architecture/solution-architecture.md](./docs/architecture/solution-architecture.md).

## System Overview

Phase 1 is deliberately minimal: one Railway service, one database, three external services.

```
┌─────────────────────────────────┐
│  Cloudflare (DNS, WAF, SSL)     │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│  Railway — ap-southeast-2       │
│  ┌────────────────────────────┐ │
│  │  Next.js 14 App Router     │ │
│  │  (SSR + Server Actions)    │ │
│  └────────────────────────────┘ │
└──────┬──────────┬───────────────┘
       │          │
┌──────▼───┐  ┌──▼────────────────┐
│ Supabase │  │ External Services  │
│ PostgreSQL│  │  - Plausible Cloud │
│ (SGP)    │  │  - Resend (email)  │
│ Port 6543│  │  - Sentry          │
└──────────┘  └────────────────────┘
```

## Phase 1 Topology

| Service | Provider | Region | Purpose |
|---------|----------|--------|---------|
| Web app | Railway | ap-southeast-2 (Sydney) | Next.js 14 — the only service |
| Database | Supabase | ap-southeast-1 (Singapore) | PostgreSQL via PgBouncer (port 6543) |
| Analytics | Plausible Cloud | EU | Privacy-first analytics ($9/month) |
| Email | Resend | US | Transactional email |
| DNS/WAF | Cloudflare | Global | DNS, WAF, SSL (free tier) |
| Errors | Sentry | US | Error tracking with PII scrubbing |

## Package Dependency Graph

```
apps/web (Next.js 14)
  ├── packages/calculations (pure TypeScript — no framework deps)
  │     ├── constants/au.ts        Tier 1: RBA interchange rates
  │     ├── rules/schema.ts        Rule definitions
  │     ├── rules/resolver.ts      5-priority resolution pipeline
  │     ├── calculations.ts        Pure functions — no side effects
  │     ├── categories.ts          2×2 category assignment
  │     ├── periods.ts             Time-based rate switching
  │     └── actions.ts             Action list builder
  └── packages/db
        ├── migrations/001_initial.sql
        └── types.ts               Supabase-generated types
```

## Data Flow

The complete assessment journey in six steps:

```
1. Landing        GET /                      SSR homepage
2. Session        createSession()            Server action → HttpOnly cookie
3. Consent        recordConsent()            Server action → consents table (append-only)
4. Assessment     Steps 1-4                  Client state → sessionStorage
5. Submit         submitAssessment()         Server action → resolve → calculate → INSERT
6. Results        GET /results               SSR with category, P&L, actions
```

See [docs/architecture/sequence-diagrams.md](./docs/architecture/sequence-diagrams.md) for full Mermaid diagrams of all six flows.

## Calculation Engine

Three tiers of configuration feed into three processing layers:

### Configuration Tiers

| Tier | Storage | Change method | Example |
|------|---------|---------------|---------|
| 1 — Regulatory | TypeScript code | PR + tests + deploy | Interchange rates, reform dates |
| 2 — Operational | Environment variables | Railway dashboard | Card mix defaults, avg transaction values |
| 3 — Temporal | Automatic | Engine checks `new Date()` | Current vs projected rate periods |

### Processing Layers

```
Merchant input + Context
        │
        ▼
┌─────────────────────────────┐
│  Layer 1: Rule Schema       │  What inputs exist, their types and bounds
│  rules/schema.ts            │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  Layer 2: Resolution        │  Builds ResolvedAssessmentInputs
│  rules/resolver.ts          │  Priority: merchant → invoice → industry → env → constant
└─────────────┬───────────────┘
              │  (no nulls, no optionals)
              ▼
┌─────────────────────────────┐
│  Layer 3: Calculation       │  Pure functions only
│  calculations.ts            │  Receives resolved inputs, returns results
└─────────────────────────────┘
```

Detail: [docs/architecture/business-rules-engine.md](./docs/architecture/business-rules-engine.md) and [docs/architecture/calculation-configuration.md](./docs/architecture/calculation-configuration.md)

## Business Rules Engine

The resolver tries each source in priority order and takes the first non-null value:

| Priority | Source | Available |
|----------|--------|-----------|
| 1 | Merchant explicit input | Phase 1 (card mix, expert rates) |
| 2 | Invoice-parsed values | Phase 2 |
| 3 | Industry defaults (PSP Rate Registry) | Phase 2 |
| 4 | Environment variables (Tier 2) | Phase 1 |
| 5 | Regulatory constants (Tier 1) | Phase 1 |

Every resolution produces a `ResolutionTrace` recording which source was used for each field. The Assumptions panel on the results page is driven directly from this trace.

## Database Design

Six tables in Phase 1. Full schema: [docs/architecture/database-schema.sql](./docs/architecture/database-schema.sql)

| Table | Purpose | Key constraint |
|-------|---------|----------------|
| `sessions` | Server-generated session tracking | UUID primary key |
| `consents` | GDPR/APPs consent records | **Append-only** (UPDATE/DELETE denied by RLS) |
| `assessments` | Completed assessment results | Links to session |
| `email_signups` | Post-results email capture | 1 per session |
| `rate_limits` | IP + session rate limiting | TTL-based cleanup |
| `invoice_uploads` | Phase 2 stub | All columns nullable |

Key design decisions:
- Every table has `organisation_id`, `user_id`, `country_code` from day one (nullable in Phase 1)
- Consents are append-only at the database level — application code cannot bypass this
- Connection always via PgBouncer pooler on port 6543

## Security Architecture

Twelve non-negotiable security rules. Any violation is a bug, not a trade-off.

| Rule | Requirement |
|------|-------------|
| SR-01 | Session IDs are server-generated UUIDs (HttpOnly, Secure, SameSite=Strict) |
| SR-02 | IP hashing uses HMAC-SHA256 with secret salt; raw IPs never stored |
| SR-03 | Service role key never in browser code (no `NEXT_PUBLIC_` prefix) |
| SR-04 | Database connections via PgBouncer pooler only (port 6543) |
| SR-05 | Consents are append-only enforced at database level (RLS policies) |
| SR-06 | Security headers: HSTS, X-Frame-Options, CSP, nosniff, Referrer-Policy |
| SR-07 | CORS uses exact origin matching (not substring) |
| SR-08 | DOMPurify on all dynamic HTML content |
| SR-09 | Rate limiting: 100 assessments/IP/24h, 1 email/session |
| SR-10 | Privacy policy at `/privacy` before any data collection |
| SR-11 | Sentry with PII scrubbing before any event is sent |
| SR-12 | Never log PII (email, raw IP, full session ID, financial inputs) |

Detail: [docs/security/security-requirements.md](./docs/security/security-requirements.md)

## Deployment Pipeline

```
feature/* ──PR──► staging ──PR + approval──► main
                    │                          │
                    ▼                          ▼
              staging.nosurcharging       nosurcharging
              .com.au                     .com.au
              (auto-deploy)               (manual gate)
```

Three completely isolated environments with separate Supabase projects:

| Environment | Branch | URL | Deploy |
|-------------|--------|-----|--------|
| Local | `feature/*` | `localhost:3000` | `pnpm dev` |
| Staging | `staging` | `staging.nosurcharging.com.au` | Auto on merge |
| Production | `main` | `nosurcharging.com.au` | Manual approval |

CI runs lint, typecheck, unit tests, and build on every PR. E2E tests run on staging deploy.

Detail: [docs/deployment/deployment-strategy.md](./docs/deployment/deployment-strategy.md)

## Key Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Single service in Phase 1 | Next.js Server Actions | Invoice complexity in Phase 2 justifies API separation later, not now |
| Plausible Cloud (not self-hosted) | $9/month managed | No Railway service to maintain; privacy-first; no cookie banner needed |
| Turborepo monorepo | Shared `packages/calculations` | Calculation engine is framework-independent; future API service imports it directly |
| Supabase (not raw Postgres) | Auth + RLS + generated types | Phase 2 needs magic link auth; RLS enforces append-only consents at DB level |
| Vitest (not Jest) | 10-20x faster, native ESM | Same API; no migration cost; monorepo benefits from speed |
| Recharts (not Chart.js) | React-native composability | Prototype used Chart.js; production needs component-level control for scheme-fees invariant |

## Deep-Dive References

| Document | Description |
|----------|-------------|
| [solution-architecture.md](./docs/architecture/solution-architecture.md) | Full architecture with all technology decisions |
| [database-schema.sql](./docs/architecture/database-schema.sql) | Executable SQL schema |
| [sequence-diagrams.md](./docs/architecture/sequence-diagrams.md) | Six user flows as Mermaid diagrams |
| [calculation-configuration.md](./docs/architecture/calculation-configuration.md) | Three-tier config model and periods |
| [business-rules-engine.md](./docs/architecture/business-rules-engine.md) | Resolution pipeline and rule schema |
| [security-requirements.md](./docs/security/security-requirements.md) | 12 security rules with implementations |
| [testing-strategy.md](./docs/testing/testing-strategy.md) | Test framework, hard gates, coverage |
| [deployment-strategy.md](./docs/deployment/deployment-strategy.md) | Environments, CI/CD, rollback |
| [ux-design.md](./docs/design/ux-design.md) | Design vision and screen specifications |
| [design-tokens.md](./docs/design/design-tokens.md) | Tailwind config and CSS custom properties |
| [component-specs.md](./docs/design/component-specs.md) | 14 components with behaviour and states |
| [product-vision.md](./docs/product/product-vision.md) | Global vision and revenue model |
| [prd.md](./docs/product/prd.md) | 39 functional requirements and user stories |
| [rba-reform.md](./docs/domain/rba-reform.md) | RBA facts, reform dates, mechanism |
| [merchant-categories.md](./docs/domain/merchant-categories.md) | Four-category framework and assignment logic |
| [interchange-rates.md](./docs/domain/interchange-rates.md) | Rate constants for au.ts |
| [calculation-verification.md](./docs/product/calculation-verification.md) | 6 verified scenarios with manual arithmetic |
| [tone-of-voice.md](./docs/content/tone-of-voice.md) | Plain English rules and copy patterns |
| [disclaimer-text.md](./docs/legal/disclaimer-text.md) | Exact disclaimer wording (use verbatim) |
