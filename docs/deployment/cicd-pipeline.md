# CI/CD pipeline — steady state

**Scope:** at-a-glance view of how code moves from a developer's machine to production, post-rollout. For the broader strategy (env vars, migration order, rollback specifics, branch naming), see [deployment-strategy.md](./deployment-strategy.md). This document is the **operational picture** of the running pipeline.

**Maintain:** when a workflow file in `.github/workflows/` changes shape, or when a service mapping changes (Supabase project rename, PostHog project split, Sentry rotation), update the relevant box below.

---

## Three isolated stacks

Local / staging / production each have their own backing services. A staging incident cannot reach production by construction.

| Environment | URL | Railway env | Supabase project | PostHog project | Sentry project |
|---|---|---|---|---|---|
| Local | `localhost:3000` | — | dev (or local Docker) | — (autocapture off by default in dev) | — |
| Staging | `staging.nosurcharging.com.au` | `staging` | `nosurcharging-staging` | `nosurcharging-staging` | `nosurcharging-staging` |
| Production | `nosurcharging.com.au` | `production` | `nosurcharging-production` | `nosurcharging-production` | `nosurcharging-production` |

---

## The pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│  LOCAL                                                          │
│  ─────────────────────────────────────────────────────────      │
│  feature/* branch                                               │
│  └── pnpm dev → localhost:3000                                  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ open PR → base: staging
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  PR-TIME CHECKS  (.github/workflows/ci.yml — every PR)          │
│  ─────────────────────────────────────────────────────────      │
│  ✓ lint                                                         │
│  ✓ typecheck                                                    │
│  ✓ test         (Vitest, all packages)                          │
│  ✓ build        (Next.js prod build, placeholder Supabase)      │
│  ✓ e2e-smoke    (Playwright homepage suite, against localhost)  │
│  ✓ copy-lint    (forbidden-phrase grep on apps/web/**)          │
│                                                                 │
│  All six gates must pass before merge.                          │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ merge to staging
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  RAILWAY STAGING (auto-deploy from staging branch)              │
│  ─────────────────────────────────────────────────────────      │
│  staging.nosurcharging.com.au                                   │
│  ←─ Supabase: nosurcharging-staging                             │
│  ←─ PostHog:  nosurcharging-staging                             │
│  ←─ Sentry:   nosurcharging-staging                             │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ deploy-staging.yml runs in parallel:
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  POST-DEPLOY STAGING VALIDATION (.github/workflows/             │
│  deploy-staging.yml)                                            │
│  ─────────────────────────────────────────────────────────      │
│  ✓ test-and-build  (unit + build w/ real-shape env vars)        │
│  ✓ e2e             (full Playwright suite vs. live staging URL) │
│                                                                 │
│  Red runs DO NOT roll back the deploy — Railway already         │
│  shipped. Treat red runs as production-blocking signal: fix     │
│  on staging before opening the staging → main PR.               │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ when ready, open PR staging → main
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  STAGING → MAIN PR  (ci.yml — same six checks rerun)            │
│  ─────────────────────────────────────────────────────────      │
│  ✓ All six PR-time gates again                                  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ merge to main
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌────────────────────────────┐    ┌────────────────────────────────┐
│  RAILWAY PRODUCTION        │    │  GITHUB ACTIONS PRODUCTION     │
│  (auto-deploy on push      │    │  (.github/workflows/           │
│   to main; no approval)    │    │   deploy-production.yml)       │
│                            │    │                                │
│  Railway builds + ships    │    │  ⏸  PAUSED on the GitHub       │
│  the new code immediately. │    │     `environment: production`  │
│                            │    │     gate — requires reviewer   │
│                            │    │     approval to proceed.       │
│                            │    │                                │
│                            │    │  Once approved:                │
│                            │    │  ✓ test (unit suite reruns)    │
│                            │    │  ✓ build (real prod secrets)   │
└────────────────────────────┘    └────────────────────────────────┘
        │                                       │
        └───────────────────┬───────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  PRODUCTION                                                     │
│  ─────────────────────────────────────────────────────────      │
│  nosurcharging.com.au                                           │
│  ←─ Supabase: nosurcharging-production                          │
│  ←─ PostHog:  nosurcharging-production                          │
│  ←─ Sentry:   nosurcharging-production                          │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ deploy-production.yml smoke-test job:
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  POST-DEPLOY PRODUCTION VALIDATION                              │
│  ─────────────────────────────────────────────────────────      │
│  ✓ /api/health returns 200 within 5 min                         │
│  ✓ Homepage renders                                             │
│  ✓ Privacy page renders                                         │
│                                                                 │
│  No full E2E suite against production — running synthetic       │
│  assessments against the live URL would pollute production      │
│  analytics + create orphan database rows. Intentional gap.      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key invariants

1. **Migrations are manual.** Every schema change applies to staging Supabase first (via the SQL editor), gets verified with the migration's bottom-of-file verification queries, *then* to production Supabase. No CI workflow touches DB schema. See [packages/db/migrations/](../../packages/db/migrations/) for the migration order; never apply out of sequence.

2. **Three isolated stacks.** Local / staging / production each have their own Supabase project, Railway environment, PostHog project, Sentry project. A staging incident cannot affect production.

3. **PR-time `e2e-smoke` is the rename-drift catcher.** Catches the class of bug where a component aria-label changes but the matching e2e spec doesn't update — historically only surfaced post-deploy. The full E2E suite still runs post-deploy against staging to catch flows that need a real Supabase.

4. **Promotion to production requires two gates:**
   - The staging → main PR (auto-CI, all six gates).
   - The GitHub Actions `environment: production` approval (manual click in the Actions UI).
   Both must pass / be approved before the production Railway build is permitted to ship in any meaningful sense. Railway *technically* deploys on the merge to `main`, but the GitHub Actions workflow is the human-in-the-loop layer that catches "we merged accidentally" cases — if you don't approve, the workflow stays red and you have a clear signal to rollback.

5. **No CI smoke test against the production URL.** The post-deploy production validation only hits `/api/health` + homepage + privacy. Running the full assessment flow against production would create synthetic rows + analytics events. Deliberate.

6. **The forbidden-phrase grep in `copy-lint` is the layer that catches retired copy.** Add entries to `.github/workflows/ci.yml` `copy-lint.forbidden` array when copy is decisively retired site-wide. CLAUDE.md §13 documents the e2e selector rule that pairs with this — when renaming user-facing text, also update the e2e specs in the same PR.

---

## Rollback paths

| Failure mode | Action | Time-to-recover |
|---|---|---|
| Production renders but is broken | Railway dashboard → production env → Deployments → previous deploy → **Redeploy** | ~30 sec |
| Migration corrupted production schema | Supabase dashboard → production → Database → Backups → restore the on-demand backup taken pre-rollout | ~5 min |
| Code is wrong on `main` | `git revert -m 1 [merge-commit-sha] && git push origin main` — re-triggers the deploy with prior code | ~5 min (build + deploy + approval) |

For destructive operations (schema-destructive migrations, force-push to `main`), always pause and confirm before acting. The rollback paths above assume the issue was caught early — once you've had a few minutes of real production traffic, a database restore may lose user data created in the window.

---

## When to update this document

- When a workflow file in [.github/workflows/](../../.github/workflows/) is added, renamed, or has a job added/removed.
- When a service mapping in the three-stacks table changes (e.g. PostHog project split, Sentry rotation).
- When a new pre-merge gate or post-deploy validation step is introduced.
- When the GitHub Actions environment-protection rules change.

Don't update for cosmetic CI tweaks (cache changes, runner image bumps) — those belong in the workflow file's own comments.

---

*Companion reading:*
- [deployment-strategy.md](./deployment-strategy.md) — broader context: env var inventory, migration order, branch naming.
- [CLAUDE.md §14](../../CLAUDE.md) — environments + deployment from the project-context root.
- [docs/operations/POSTHOG_CONFIGURATION.md](../operations/POSTHOG_CONFIGURATION.md) — PostHog dashboards, cohorts, and alerts that depend on the steady-state event flow above.
