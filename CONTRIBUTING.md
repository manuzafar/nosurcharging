# Contributing to nosurcharging.com.au

Thank you for your interest in contributing. This project aims to bring radical transparency to merchant payment costs. Every contribution helps merchants make better-informed decisions.

Please read our [Code of Conduct](./CODE_OF_CONDUCT.md) before participating.

## Development Environment

### Prerequisites

- Node.js >= 20
- pnpm 9.1.0 (`corepack enable && corepack prepare pnpm@9.1.0 --activate`)
- Git

### First-Time Setup

```bash
# Clone the repository
git clone https://github.com/manuzafar/nosurcharging.git
cd nosurcharging

# Install dependencies
pnpm install

# Copy environment template
cp .env.example apps/web/.env.local
# Edit apps/web/.env.local with your values (see .env.example for generation instructions)

# Run the test suite
pnpm test:unit

# Start development server
pnpm dev
```

The dev server runs at `http://localhost:3000`.

### Database Setup (Optional for UI Work)

If your contribution touches server actions or database interactions:

1. Create a free Supabase project
2. Apply the schema: copy `docs/architecture/database-schema.sql` into the Supabase SQL editor and run it
3. Update your `.env.local` with the project URL, anon key, and service role key
4. Use the PgBouncer pooler URL (port 6543, not 5432)

## Project Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the quick-reference guide, or dive into the [full architecture docs](./docs/architecture/solution-architecture.md).

Key things to know:
- **Monorepo**: Turborepo with `apps/web` (Next.js) and `packages/calculations` (pure TypeScript)
- **Calculation engine** is framework-independent — no React, no Next.js imports
- **Server Actions** handle all database operations (no separate API in Phase 1)
- **Three config tiers**: code constants, env vars, and time-based automatic switching

## Branching Strategy

```
feature/your-feature  →  staging  →  main
        ↓                   ↓           ↓
    local only        auto-deploy   manual gate
                      to staging    to production
```

1. Create a branch from `staging`: `git checkout -b feature/your-feature staging`
2. Make your changes and push
3. Open a PR targeting `staging`
4. After review and merge, changes auto-deploy to staging
5. Staging-to-main PRs require manual approval

## Making Changes

### Adding a New Configurable Input

The business rules engine is designed for extensibility. Three steps:

1. Add one entry to `RULE_SCHEMA` in `packages/calculations/rules/schema.ts`
2. Add resolution cases in `resolveAssessmentInputs()` in `packages/calculations/rules/resolver.ts`
3. Use the resolved value in `calculateMetrics()` — it's already populated, no nulls

The calculation engine itself does not change.

### Adding a New Country

1. Create `packages/calculations/constants/{cc}.ts` (e.g., `nz.ts`)
2. Export the same interface as `au.ts` with country-specific rates
3. Register it in `packages/calculations/constants/index.ts`
4. Add corresponding `CALC_*` env vars for Tier 2 defaults

### Adding a UI Component

1. Read [docs/design/design-tokens.md](./docs/design/design-tokens.md) and [docs/design/component-specs.md](./docs/design/component-specs.md)
2. Use design tokens (CSS custom properties), not raw colours
3. All financial numbers must use `var(--font-mono)`
4. Single breakpoint at 500px (not 768px)
5. SVG icons, not emoji
6. Font weights 400 and 500 only

## Code Style

- **TypeScript**: Strict mode throughout. No `any` types.
- **Linting**: ESLint with `next/core-web-vitals` config
- **Formatting**: Prettier (runs via ESLint)
- **Imports**: No service-role client imports in files with `'use client'`

Run before committing:

```bash
pnpm lint          # ESLint
pnpm typecheck     # TypeScript strict
pnpm test:unit     # Vitest
```

## Testing Requirements

Tests are non-negotiable. The calculation engine has a hard gate — all tests must pass before any UI changes are accepted.

### Coverage Thresholds

| Package | Lines | Functions | Branches |
|---------|-------|-----------|----------|
| `packages/calculations` | 95% | 95% | 90% |
| `apps/web/actions` | 80% | 85% | 75% |

### Running Tests

```bash
pnpm test:unit             # All unit tests (Vitest)
pnpm test:e2e              # E2E tests (Playwright — requires running app)
```

### Writing Tests

- Unit tests go in `__tests__/` directories alongside the code they test
- Use Vitest (not Jest) — same API, but native ESM and 10-20x faster
- E2E tests use Playwright (not Cypress)
- Inject `now` parameter for time-dependent logic — don't mock the system clock

## Calculation Engine Rules

These invariants are enforced by the test suite and must never be violated:

- `result.todayScheme === result.oct2026Scheme` (scheme fees are unregulated, unchanged by reform)
- `!isNaN(result.plSwing) && isFinite(result.plSwing)` (no NaN or Infinity)
- `debitSaving >= 0` (rate below reform cap = zero saving, not negative)
- Card mix shares must sum to 1.0 (validated by resolver before engine runs)
- Category 2 at `passThrough=0`: `plSwing === 0` (PSP keeps the saving)
- Category 2 at `passThrough=1`: `plSwing` approximates `totalICSaving`

## Security Rules

Any security rule violation results in PR rejection. See [ARCHITECTURE.md](./ARCHITECTURE.md#security-architecture) for the full list. Key rules for contributors:

- **Never** import the Supabase service-role client in client components
- **Never** store raw IPs — use `hashIP()` from `lib/security.ts`
- **Never** use `NEXT_PUBLIC_` prefix for server-only secrets
- **Always** sanitise dynamic HTML content with DOMPurify
- **Always** use exact origin matching for CORS (not substring)

## Pull Request Process

1. Ensure your branch is up to date with `staging`
2. Run the full check suite:
   ```bash
   pnpm lint && pnpm typecheck && pnpm test:unit
   ```
3. Write a clear PR description explaining **what** and **why**
4. Include test coverage for new functionality
5. Reference any related issues

### PR Checklist

- [ ] All tests pass (`pnpm test:unit`)
- [ ] TypeScript compiles with no errors (`pnpm typecheck`)
- [ ] Linting passes (`pnpm lint`)
- [ ] No `any` types introduced
- [ ] No service-role imports in client code
- [ ] Financial numbers use `var(--font-mono)`
- [ ] New calculation logic has corresponding test cases
- [ ] Invariants are maintained (run calculation tests)

## Domain-Specific Contributions

This project involves Australian payments regulation. If you're contributing rate data or reform information:

- All interchange rates must cite the [RBA source document](https://www.rba.gov.au/payments-and-infrastructure/review-of-retail-payments-regulation/)
- Rate changes require corresponding test updates in `calculations.test.ts`
- Use the verification scenarios in [docs/product/calculation-verification.md](./docs/product/calculation-verification.md) as ground truth
- The RBA Statistical Tables [C1](https://www.rba.gov.au/statistics/tables/#payments-system) and [C2](https://www.rba.gov.au/statistics/tables/#payments-system) are the source for card mix defaults

## Reporting Issues

Open an issue on GitHub with:
- Steps to reproduce
- Expected vs actual behaviour
- Browser/OS if it's a UI issue
- Never include PII, API keys, or financial data in issue reports

## Questions?

Open a discussion on the GitHub repository or email hello@nosurcharging.com.au.
