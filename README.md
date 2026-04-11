# nosurcharging.com.au

**Free, independent merchant payments intelligence. No PSP affiliation. No commercial relationships. Just transparency.**

[![CI](https://github.com/manuzafar/nosurcharging/actions/workflows/ci.yml/badge.svg)](https://github.com/manuzafar/nosurcharging/actions/workflows/ci.yml)
[![Deploy Staging](https://github.com/manuzafar/nosurcharging/actions/workflows/deploy-staging.yml/badge.svg)](https://github.com/manuzafar/nosurcharging/actions/workflows/deploy-staging.yml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20-green.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-9.1.0-orange.svg)](https://pnpm.io/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-325%20passing-brightgreen.svg)](#testing)

---

## Table of Contents

- [What This Is](#what-this-is)
- [The October 2026 Problem](#the-october-2026-problem)
- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
- [The Calculation Engine](#the-calculation-engine)
- [Testing](#testing)
- [Security](#security)
- [Documentation](#documentation)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

---

## What This Is

nosurcharging.com.au is a free, independent platform that helps merchants understand what card acceptance actually costs them.

Merchants answer four questions. The platform assigns their category (1-4), calculates their projected P&L impact in dollars, and delivers a personalised action list with specific dates and PSP-name-inline scripts.

The immediate trigger is the RBA's October 2026 surcharge reform. The permanent purpose is enabling merchants everywhere to understand their payment costs. The reform is the entry point, not the destination.

**Independence is structural** — built into the architecture, not just a policy. There is no commercial relationship with any PSP, acquirer, or card scheme.

## The October 2026 Problem

On **1 October 2026**, the Reserve Bank of Australia bans surcharging on designated card networks (Visa, Mastercard, eftpos). This affects every Australian merchant differently depending on two factors:

1. **Plan type**: flat-rate (one blended %) vs cost-plus (wholesale + margin)
2. **Currently surcharging?** Yes (revenue disappears) vs No (no direct impact)

Interchange rates are also being cut, creating savings that may or may not reach merchants depending on their plan type. Amex, BNPL, and PayPal are exempt from the ban.

See [docs/domain/rba-reform.md](./docs/domain/rba-reform.md) for the full regulatory context.

## How It Works

Two questions determine every merchant's outcome:

|  | **Not Surcharging** | **Surcharging** |
|--|---|---|
| **Cost-plus plan** | **Category 1** — Costs fall automatically | **Category 3** — Surcharge revenue disappears |
| **Flat-rate plan** | **Category 2** — Saving exists but won't arrive automatically | **Category 4** — Both challenges simultaneously |

Each category gets a tailored verdict, dollar-impact calculation, timeline, and specific action list. The action list includes the merchant's PSP by name: *"Call Stripe and say..."* — never *"call your PSP"*.

See [docs/domain/merchant-categories.md](./docs/domain/merchant-categories.md) for the full framework.

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 14 (App Router) | SSR + Server Actions |
| Language | TypeScript (strict) | Type safety throughout |
| Styling | Tailwind CSS | Design token system |
| Charts | Recharts | React-native chart composability |
| Database | Supabase PostgreSQL | RLS, generated types, PgBouncer pooler |
| Email | Resend | Transactional email |
| Analytics | Plausible Cloud | Privacy-first, no cookie banner |
| Monorepo | Turborepo | Shared calculation engine |
| Unit Tests | Vitest | 10-20x faster than Jest, native ESM |
| E2E Tests | Playwright | Cross-browser testing |
| DNS/WAF | Cloudflare | Free tier — DNS, WAF, SSL |
| Errors | Sentry | Error tracking with PII scrubbing |

## Repository Structure

```
nosurcharging/
├── CLAUDE.md                    # Complete project context (start here for deep work)
├── ARCHITECTURE.md              # Quick-reference architecture guide
├── CONTRIBUTING.md              # Development setup and contribution guide
├── CHANGELOG.md                 # Development history
├── turbo.json                   # Turborepo configuration
├── apps/
│   └── web/                     # Next.js 14 (only app in Phase 1)
│       ├── app/
│       │   ├── layout.tsx       # Root layout (Plausible script)
│       │   ├── page.tsx         # Homepage (SSR)
│       │   ├── assessment/      # Four-step assessment wizard
│       │   ├── results/         # Results page with verdict + actions
│       │   ├── privacy/         # Privacy policy
│       │   └── api/             # Health check + Phase 2 stubs
│       ├── actions/             # Server actions (session, consent, assessment, email)
│       ├── components/          # React components by domain
│       └── lib/                 # Utilities (Supabase clients, analytics, security)
├── packages/
│   ├── calculations/            # Shared calculation engine (pure TypeScript)
│   │   ├── constants/au.ts      # Australian RBA interchange rates
│   │   ├── rules/schema.ts      # Rule definitions
│   │   ├── rules/resolver.ts    # 5-priority resolution pipeline
│   │   ├── calculations.ts      # Pure calculation functions
│   │   ├── categories.ts        # 2x2 category assignment
│   │   ├── periods.ts           # Time-based rate switching
│   │   └── __tests__/           # 86 calculation tests
│   └── db/
│       ├── migrations/          # SQL migrations
│       └── types.ts             # Supabase-generated types
├── docs/                        # Deep reference documentation (19 files)
└── .github/workflows/           # CI, staging deploy, production deploy
```

## Getting Started

### Prerequisites

- **Node.js** >= 20
- **pnpm** 9.1.0: `corepack enable && corepack prepare pnpm@9.1.0 --activate`

### Install and Run

```bash
# Clone
git clone https://github.com/manuzafar/nosurcharging.git
cd nosurcharging

# Install dependencies
pnpm install

# Set up environment
cp .env.example apps/web/.env.local
```

Edit `apps/web/.env.local` — generate secrets with:

```bash
# IP hash secret (64 hex chars)
openssl rand -hex 32

# Email encryption key (32 hex chars)
openssl rand -hex 16
```

```bash
# Run tests (no database needed)
pnpm test:unit

# Start dev server
pnpm dev
# → http://localhost:3000
```

### Database Setup (Optional)

For server action development, create a free [Supabase](https://supabase.com) project and apply the schema:

1. Copy [docs/architecture/database-schema.sql](./docs/architecture/database-schema.sql) into the Supabase SQL editor
2. Update `.env.local` with your project credentials
3. Use the PgBouncer pooler URL (port **6543**, not 5432)

## The Calculation Engine

The engine is in `packages/calculations/` — pure TypeScript with zero framework dependencies.

### Three Configuration Tiers

| Tier | What | Where | How to change |
|------|------|-------|---------------|
| 1 — Regulatory | Interchange rates, reform dates | `constants/au.ts` | PR + tests + deploy |
| 2 — Operational | Card mix defaults, avg transaction values | Environment variables | Railway dashboard |
| 3 — Temporal | Current vs projected rate periods | `periods.ts` | Automatic (checks date) |

### Three Processing Layers

1. **Rule Schema** (`rules/schema.ts`) — defines every configurable input, its type, bounds, and valid sources
2. **Resolution Pipeline** (`rules/resolver.ts`) — builds `ResolvedAssessmentInputs` by trying sources in priority order: merchant input > invoice > industry > env var > constant
3. **Calculation Engine** (`calculations.ts`) — pure functions that receive fully-resolved inputs. No fallbacks, no optionals, no nulls.

### Key Invariants

These are enforced by the test suite and must never be violated:

- Scheme fees are identical in both chart columns (unregulated, unchanged by reform)
- No NaN or Infinity from any valid input combination
- Debit saving is never negative (rate below reform cap = zero saving)
- Card mix shares always sum to 1.0

See [ARCHITECTURE.md](./ARCHITECTURE.md#calculation-engine) for diagrams, or [docs/architecture/calculation-configuration.md](./docs/architecture/calculation-configuration.md) for the full specification.

## Testing

**325 tests** across 38 test files. Two frameworks:

| Framework | Scope | Count | Command |
|-----------|-------|-------|---------|
| Vitest | Unit + integration | 325 | `pnpm test:unit` |
| Playwright | End-to-end | 6 flows | `pnpm test:e2e` |

### Coverage Requirements

| Package | Lines | Functions | Branches |
|---------|-------|-----------|----------|
| `packages/calculations` | 95% | 95% | 90% |
| `apps/web/actions` | 80% | 85% | 75% |

### Hard Gate

All calculation engine tests must pass before any UI changes are accepted. This is enforced in CI.

See [docs/testing/testing-strategy.md](./docs/testing/testing-strategy.md) for the full testing strategy.

## Security

Twelve non-negotiable security rules enforced across the codebase. Highlights:

| Rule | Summary |
|------|---------|
| SR-01 | Server-generated session IDs (HttpOnly, Secure, SameSite=Strict) |
| SR-02 | IP hashing with HMAC-SHA256 — raw IPs never stored |
| SR-03 | Service role key never exposed to browser |
| SR-05 | Append-only consents enforced at database level |
| SR-06 | Full security headers (HSTS, CSP, X-Frame-Options) |
| SR-07 | CORS exact origin matching |
| SR-08 | DOMPurify on all dynamic HTML |
| SR-09 | Layered rate limiting (IP + session) |
| SR-12 | Never log PII |

See [ARCHITECTURE.md](./ARCHITECTURE.md#security-architecture) for all 12 rules, or [docs/security/security-requirements.md](./docs/security/security-requirements.md) for implementations.

## Documentation

This repo has two documentation layers:

**Entry layer** (you are here):

| File | Purpose |
|------|---------|
| [README.md](./README.md) | Project overview and getting started |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Quick-reference architecture |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Development setup and PR process |
| [CHANGELOG.md](./CHANGELOG.md) | Development history |
| [CLAUDE.md](./CLAUDE.md) | Complete project context for AI-assisted development |

**Deep layer** (`docs/` — 19 reference documents):

| Category | Documents |
|----------|-----------|
| Architecture | [solution-architecture](./docs/architecture/solution-architecture.md), [database-schema](./docs/architecture/database-schema.sql), [sequence-diagrams](./docs/architecture/sequence-diagrams.md), [calculation-configuration](./docs/architecture/calculation-configuration.md), [business-rules-engine](./docs/architecture/business-rules-engine.md) |
| Domain | [rba-reform](./docs/domain/rba-reform.md), [merchant-categories](./docs/domain/merchant-categories.md), [interchange-rates](./docs/domain/interchange-rates.md) |
| Design | [ux-design](./docs/design/ux-design.md), [design-tokens](./docs/design/design-tokens.md), [component-specs](./docs/design/component-specs.md) |
| Product | [product-vision](./docs/product/product-vision.md), [prd](./docs/product/prd.md), [calculation-verification](./docs/product/calculation-verification.md), [consulting-products](./docs/product/consulting-products.md), [pre-launch-checklist](./docs/product/pre-launch-checklist.md) |
| Other | [testing-strategy](./docs/testing/testing-strategy.md), [deployment-strategy](./docs/deployment/deployment-strategy.md), [security-requirements](./docs/security/security-requirements.md), [tone-of-voice](./docs/content/tone-of-voice.md), [disclaimer-text](./docs/legal/disclaimer-text.md) |

## Deployment

Three fully isolated environments, each with its own Supabase project:

| Environment | Branch | URL | Deploy trigger |
|-------------|--------|-----|----------------|
| Local | `feature/*` | `localhost:3000` | `pnpm dev` |
| Staging | `staging` | staging.nosurcharging.com.au | Auto on merge to `staging` |
| Production | `main` | nosurcharging.com.au | Manual approval on merge to `main` |

CI pipeline (every PR): lint, typecheck, unit tests, build.
Staging deploy adds E2E tests. Production deploy requires manual GitHub approval.

See [docs/deployment/deployment-strategy.md](./docs/deployment/deployment-strategy.md) for the full strategy.

## Roadmap

### Phase 1 (Current) — Merchant Intelligence Platform

- Four-question assessment with category assignment
- Dollar-impact P&L calculation with reform timeline
- Personalised action list with PSP-name-inline scripts
- Australian market (RBA October 2026 reform)

### Phase 2 (Q1 2027) — Invoice Intelligence

- Invoice upload and parsing via Claude API
- MSF benchmarking tool (30 Oct 2026 data)
- Excel workbook download
- Supabase Auth (magic link + Google OAuth)
- First international market (NZ or UK)

### Phase 3 (2027+) — Enterprise Platform

- Multi-tenancy and organisation management
- ERP integrations
- Business rules engine for enterprise
- SaaS model

The architecture is global from day one. Country constants are modular. Launching in a new market is a configuration exercise, not a rebuild.

## Contributing

We welcome contributions. See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup, coding standards, and the PR process.

Key things to know before contributing:
- The calculation engine has a **hard test gate** — all tests must pass
- **12 security rules** are non-negotiable
- Domain data (interchange rates) must cite RBA sources

## License

This project is licensed under the Apache License, Version 2.0. See [LICENSE](./LICENSE) for the full text.

**Why Apache-2.0**: The express patent grant protects calculation methods. Attribution preservation maintains the "independent, no PSP affiliation" identity on forks. Compatible with all project dependencies.

## Acknowledgements

- **Reserve Bank of Australia** — Reform framework, interchange rate data, and statistical tables
- **Open-source community** — Built on Next.js, Supabase, Tailwind CSS, Recharts, Vitest, Playwright, Turborepo, and many other excellent projects
- **Plausible Analytics** — Privacy-first analytics without cookie banners
