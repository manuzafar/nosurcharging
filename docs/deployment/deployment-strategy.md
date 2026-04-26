# Deployment Strategy
## nosurcharging.com.au — Path to Production

**Version:** 1.0 | **April 2026**

---

## 1. Environment Overview

Three environments. Complete isolation at every layer.

```
┌─────────────────────────────────────────────────────────┐
│                       LOCAL                             │
│  Developer's machine                                    │
│  Next.js dev server (:3000)                             │
│  Supabase: project-local (or local Docker)              │
│  .env.local (never committed)                           │
└─────────────────────────────────────────────────────────┘
                           │ PR to staging branch
                           ▼
┌─────────────────────────────────────────────────────────┐
│                      STAGING                            │
│  staging.nosurcharging.com.au                           │
│  Railway: staging environment                           │
│  Supabase: nosurcharging-staging project                │
│  Plausible: staging.nosurcharging.com.au site           │
│  Resend: test API key (no real emails)                  │
└─────────────────────────────────────────────────────────┘
                           │ PR to main branch
                           ▼
┌─────────────────────────────────────────────────────────┐
│                     PRODUCTION                          │
│  nosurcharging.com.au                                   │
│  Railway: production environment                        │
│  Supabase: nosurcharging-production project             │
│  Plausible: nosurcharging.com.au site                   │
│  Resend: production API key (real emails)               │
└─────────────────────────────────────────────────────────┘
```

**Why three separate Supabase projects (not schemas):**
A schema-level separation (e.g. `staging` and `production` schemas in one project) shares the same connection limits, the same RLS policies, and — critically — the same admin access. A migration that runs on staging could accidentally be applied to production if scripts are misconfigured. Separate projects provide complete isolation: separate connection strings, separate API keys, separate RLS, separate data. A staging database incident cannot affect production.

---

## 2. Branch Strategy

```
main ─────────────────────────────────────────────► production
  │
  └── staging ──────────────────────────────────────► staging
        │
        ├── feature/calculation-engine ──► PR to staging
        ├── feature/assessment-flow    ──► PR to staging
        └── feature/results-page      ──► PR to staging
```

**Rules:**
- `main` is always production-deployable. Never push directly to `main`.
- `staging` receives PRs from feature branches. It is always the pre-production snapshot.
- Feature branches are created from `staging`, not from `main`.
- PRs from `staging` to `main` require: all CI checks passing + manual approval.

**Branch naming:**
```
feature/[ticket]-[short-description]
fix/[ticket]-[short-description]
chore/[short-description]
```

Examples:
```
feature/calc-engine-pure-functions
feature/step2-visual-cards
fix/slider-realtime-update
chore/update-plausible-script
```

---

## 3. Railway Environment Setup

Railway supports multiple environments per project natively.

### Step 1 — Create Railway project with two environments

```
Railway Project: nosurcharging
├── Environment: production  (auto-deploy from: main)
└── Environment: staging     (auto-deploy from: staging)
```

In each environment, create the `web` service (Next.js). In Phase 1, this is the only service.

### Step 2 — Environment variables per environment

**Production environment variables:**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[prod-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[prod-anon-key]
SUPABASE_URL=https://[prod-project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[prod-service-role-key]
DATABASE_URL=postgresql://postgres:[pwd]@[prod-project].supabase.co:6543/postgres
# Security — different from staging
IP_HASH_SECRET=[prod-random-64-char-hex]
EMAIL_ENCRYPTION_KEY=[prod-encryption-key]
# Calculation — aggregate card mix
CALC_CARD_MIX_DEBIT=0.60
CALC_CARD_MIX_CREDIT=0.35
CALC_CARD_MIX_FOREIGN=0.05
CALC_CARD_MIX_COMMERCIAL=0.00
# Calculation — granular scheme-level card mix
CALC_CARD_MIX_VISA_DEBIT=0.35
CALC_CARD_MIX_VISA_CREDIT=0.18
CALC_CARD_MIX_MC_DEBIT=0.17
CALC_CARD_MIX_MC_CREDIT=0.12
CALC_CARD_MIX_EFTPOS=0.08
CALC_CARD_MIX_AMEX=0.05
# Calculation — average transaction values
CALC_AVG_TXN_DEFAULT=65
CALC_AVG_TXN_CAFE=35
CALC_AVG_TXN_HOSPITALITY=80
CALC_AVG_TXN_RETAIL=65
CALC_AVG_TXN_ONLINE=95
CALC_AVG_TXN_TICKETING=120
# Analytics and email
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=nosurcharging.com.au
RESEND_API_KEY=[prod-resend-key]
RESEND_FROM=manu@nosurcharging.com.au
NEXT_PUBLIC_SENTRY_DSN=[prod-sentry-dsn]
SERVICE_NAME=web
NODE_ENV=production
```

**Staging environment variables:**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[staging-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[staging-anon-key]
SUPABASE_URL=https://[staging-project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[staging-service-role-key]
DATABASE_URL=postgresql://postgres:[pwd]@[staging-project].supabase.co:6543/postgres
# Security — DIFFERENT from production
IP_HASH_SECRET=[staging-random-64-char-hex]
EMAIL_ENCRYPTION_KEY=[staging-encryption-key]
# Calculation — same defaults as production
CALC_CARD_MIX_DEBIT=0.60
CALC_CARD_MIX_CREDIT=0.35
CALC_CARD_MIX_FOREIGN=0.05
CALC_CARD_MIX_COMMERCIAL=0.00
CALC_CARD_MIX_VISA_DEBIT=0.35
CALC_CARD_MIX_VISA_CREDIT=0.18
CALC_CARD_MIX_MC_DEBIT=0.17
CALC_CARD_MIX_MC_CREDIT=0.12
CALC_CARD_MIX_EFTPOS=0.08
CALC_CARD_MIX_AMEX=0.05
CALC_AVG_TXN_DEFAULT=65
CALC_AVG_TXN_CAFE=35
CALC_AVG_TXN_HOSPITALITY=80
CALC_AVG_TXN_RETAIL=65
CALC_AVG_TXN_ONLINE=95
CALC_AVG_TXN_TICKETING=120
# Analytics and email
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=staging.nosurcharging.com.au
RESEND_API_KEY=[staging-resend-key]  # Test key — does not send real emails
RESEND_FROM=manu@nosurcharging.com.au
NEXT_PUBLIC_SENTRY_DSN=[staging-sentry-dsn]
SERVICE_NAME=web
NODE_ENV=staging
```

**Critical:** IP_HASH_SECRET must be different between staging and production. Staging is less secure than production. If staging is compromised, it must not reveal anything about production data.

### Step 3 — Railway deployment settings

For each environment:
- Build command: `turbo run build --filter=web`
- Start command: `node apps/web/.next/standalone/server.js`
- Health check path: `/api/health`
- Health check timeout: 30 seconds

### Step 4 — Custom domains via Cloudflare

```
nosurcharging.com.au         → CNAME → [prod-railway-domain].railway.app
staging.nosurcharging.com.au → CNAME → [staging-railway-domain].railway.app
```

SSL is handled by Cloudflare. Railway provides the origin connection.

---

## 4. CI/CD Pipeline (GitHub Actions)

### PR jobs (overview)

Every PR targeting `staging` or `main` runs six jobs in `ci.yml`:

| Job | What it does | Adds to PR time |
|---|---|---|
| `lint` | ESLint across the monorepo | ~30s |
| `typecheck` | `tsc --noEmit` across all packages | ~30s |
| `test` | Vitest unit + integration suite | ~1m |
| `build` | Production build of `apps/web` | ~2m |
| `e2e-smoke` | Playwright `e2e/homepage.spec.ts` against locally-built `next start` (closes the copy-drift gap that previously only surfaced on staging-deploy) | ~3m |
| `copy-lint` | Greps `apps/web/` for retired phrases (forbidden CTA text, named PSPs, etc.) | ~5s |

The full E2E suite (assessment + results flows that require a real Supabase) runs after merge in `deploy-staging.yml`, against the deployed staging URL. See [docs/testing/testing-strategy.md §7](../testing/testing-strategy.md) for the split rationale.

### Workflow 1 — PR checks (runs on every PR)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [staging, main]

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx turbo run lint

  type-check:
    name: Type check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npx turbo run type-check

  unit-tests:
    name: Unit tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npx turbo run test:unit
        env:
          IP_HASH_SECRET: ci-test-secret-not-production
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          directory: ./packages/calculations/coverage

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint, type-check, unit-tests]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npx turbo run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.STAGING_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.STAGING_SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_PLAUSIBLE_DOMAIN: staging.nosurcharging.com.au
```

### Workflow 2 — Deploy to staging (on merge to staging)

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy to Staging

on:
  push:
    branches: [staging]

jobs:
  test-and-deploy:
    name: Test then deploy
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci

      # Run full unit test suite
      - run: npx turbo run test:unit
        env:
          IP_HASH_SECRET: ci-test-secret

      # Build
      - run: npx turbo run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.STAGING_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.STAGING_SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_PLAUSIBLE_DOMAIN: staging.nosurcharging.com.au

      # Railway deploys automatically from the staging branch
      # No manual deployment step needed — Railway watches the branch

      # Run E2E tests against staging after deployment
      - name: Wait for staging deployment
        run: sleep 60  # Wait for Railway to deploy

      - name: Run E2E tests against staging
        run: npx playwright test
        env:
          PLAYWRIGHT_BASE_URL: https://staging.nosurcharging.com.au

      - name: Upload E2E report on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

### Workflow 3 — Deploy to production (on PR to main)

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  final-checks-and-deploy:
    name: Final checks then production deploy
    runs-on: ubuntu-latest
    environment: production  # Requires manual approval in GitHub
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci

      # Full test suite one final time
      - run: npx turbo run test:unit
        env:
          IP_HASH_SECRET: ci-test-secret

      # Build
      - run: npx turbo run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.PROD_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.PROD_SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_PLAUSIBLE_DOMAIN: nosurcharging.com.au

      # Railway deploys automatically from main
      # Post-deploy: smoke test production
      - name: Wait for production deployment
        run: sleep 90

      - name: Production smoke test
        run: |
          curl -f https://nosurcharging.com.au/api/health || exit 1
          curl -f https://nosurcharging.com.au/ || exit 1
```

### GitHub Secrets to configure

**Repository secrets (shared across environments):**
None — use environment-scoped secrets only.

**Staging environment secrets:**
```
STAGING_SUPABASE_URL
STAGING_SUPABASE_ANON_KEY
STAGING_SUPABASE_SERVICE_ROLE_KEY
```

**Production environment secrets:**
```
PROD_SUPABASE_URL
PROD_SUPABASE_ANON_KEY
PROD_SUPABASE_SERVICE_ROLE_KEY
```

The `production` GitHub environment requires manual approval before any workflow step runs against it. Set this in GitHub → Settings → Environments → production → Required reviewers.

---

## 5. Database Migration Strategy

Migrations run manually — not in the CI pipeline. This is intentional.

**Why manual migrations:**
An automated migration that runs in CI against production is one typo away from a data loss incident. For a solo founder at this scale, manual migrations reviewed before application are safer and sufficient.

**Migration process:**

1. Write migration SQL in `packages/db/migrations/[NNN]_[description].sql`
2. Apply to staging first: paste into Supabase SQL editor for the staging project
3. Verify staging works correctly with the new schema
4. Apply to production: paste into Supabase SQL editor for the production project
5. Verify production health check: `GET /api/health`

**Migration naming:**
```
001_initial_schema.sql
002_add_rate_registry.sql
003_add_consulting_leads.sql
004_phase2_invoice_uploads.sql
```

**The initial migration (`001_initial_schema.sql`) is `docs/architecture/database-schema.sql`.**

---

## 6. The Deployment Pipeline — Visualised

```
Developer writes code on feature branch
          │
          ▼
         PR to staging branch
          │
          ▼
    CI checks run (lint + types + unit tests + build)
          │
    ┌─────┴──────┐
  fail          pass
    │             │
    ▼             ▼
  Fix code    Merge to staging
                  │
                  ▼
         Railway auto-deploys to staging
                  │
                  ▼
         E2E tests run against staging
                  │
          ┌───────┴────────┐
        fail              pass
          │                │
          ▼                ▼
        Fix code      Manual smoke test
                       on staging.nosurcharging.com.au
                           │
                           ▼
                      PR to main
                           │
                           ▼
              GitHub: requires manual approval
                           │
                           ▼
                      CI checks run again
                           │
                      Merge to main
                           │
                           ▼
                   Railway auto-deploys to production
                           │
                           ▼
                   Production smoke test
                   curl /api/health
                   curl /
```

---

## 7. Smoke Test Checklist (Manual — run after every staging deploy)

Run this manually on staging before creating a PR to main.

```
[ ] Homepage loads at staging.nosurcharging.com.au
[ ] "Start assessment" button works
[ ] Disclaimer checkbox appears and must be checked
[ ] Step 1: Volume input accepts numbers and toggles work
[ ] Step 2: Both plan type cards are selectable
[ ] Step 2: Expert toggle expands the panel
[ ] Step 2: PSP pills are selectable
[ ] Step 3: Yes/No buttons work
[ ] Step 3: Network checkboxes appear on Yes
[ ] Step 3: Amex-only shows the carve-out note
[ ] Step 4: Industry tiles are selectable
[ ] Reveal screen appears for ~1 second on submit
[ ] Results page shows a category badge
[ ] P&L swing hero number is visible and coloured correctly
[ ] Category 2/4: Slider is visible and updates values in real time
[ ] Chart renders with four stacked bars per column
[ ] Scheme fees bars appear equal height in both columns (visual check)
[ ] Assumptions panel expands on toggle
[ ] Action list shows PSP name inline
[ ] Email capture field accepts input and shows confirmation
[ ] "Book a free discovery call" button opens Calendly
[ ] Privacy policy page loads at /privacy
[ ] Health check returns 200: /api/health
[ ] Plausible events appear in Plausible dashboard (check live view)
[ ] Mobile: complete on iPhone-sized viewport (375px)
```

---

## 8. Rollback Strategy

**Railway rollback (fastest — under 2 minutes):**
Railway maintains deployment history. In the Railway dashboard → web service → Deployments → select previous deployment → Redeploy.

**Git rollback:**
```bash
# Identify the last good commit on main
git log main --oneline

# Revert to it
git revert HEAD  # Creates a revert commit, safer than reset
git push origin main  # Triggers Railway redeploy
```

**Database rollback:**
If a migration caused a problem, write a compensating migration (inverse of the change) and apply it manually via Supabase SQL editor. For Phase 1, the database schema is simple enough that compensating migrations are straightforward.

**The rule:** Never skip a failing unit test to ship faster. If the test is wrong, fix the test. If the code is wrong, fix the code. A broken test is a signal, not an obstacle.

---

## 9. Environment Variable Checklist

Before first deploy to each environment, verify every variable is set:

**Staging:**
```
[ ] NEXT_PUBLIC_SUPABASE_URL
[ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
[ ] SUPABASE_SERVICE_ROLE_KEY
[ ] DATABASE_URL (port 6543 pooler)
[ ] IP_HASH_SECRET (different from production)
[ ] NEXT_PUBLIC_PLAUSIBLE_DOMAIN=staging.nosurcharging.com.au
[ ] RESEND_API_KEY (staging/test key)
[ ] RESEND_FROM=manu@nosurcharging.com.au
[ ] NODE_ENV=staging
```

**Production:**
```
[ ] NEXT_PUBLIC_SUPABASE_URL
[ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
[ ] SUPABASE_SERVICE_ROLE_KEY
[ ] DATABASE_URL (port 6543 pooler)
[ ] IP_HASH_SECRET (different from staging)
[ ] NEXT_PUBLIC_PLAUSIBLE_DOMAIN=nosurcharging.com.au
[ ] RESEND_API_KEY (production key)
[ ] RESEND_FROM=manu@nosurcharging.com.au
[ ] NODE_ENV=production
[ ] NEXT_PUBLIC_SENTRY_DSN=[prod-sentry-dsn]
[ ] CALENDLY_URL=https://calendly.com/[username]/payments-discovery-call
[ ] CALENDLY_WEBHOOK_SECRET=[from Calendly webhook settings]
```

---

*Deployment Strategy v1.0 · nosurcharging.com.au · April 2026*
