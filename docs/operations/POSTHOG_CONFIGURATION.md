# PostHog configuration — Phase 1 runbook

**Scope:** Manual setup of dashboards, cohorts, and alerts in the PostHog UI. The events these reference are wired in code via [`apps/web/lib/analytics.ts`](../../apps/web/lib/analytics.ts) and the call sites listed in [METRICS_DASHBOARD_BRIEF.md](../design/METRICS_DASHBOARD_BRIEF.md). The runbook complements the code change; both must land before the metrics are usable.

**Audience:** Whoever is logging into PostHog to set up the workspace for the first time — and anyone who needs to re-create state after a workspace migration. Each section names what to build and what to filter on, not how to click. If the PostHog UI labels move, the underlying event names and properties are the load-bearing parts.

**Authority:** [METRICS_DASHBOARD_BRIEF.md §4](../design/METRICS_DASHBOARD_BRIEF.md) (May 2026). This document is the operational mirror; the brief is the source of truth.

---

## Prerequisites

Before applying any of the configurations below, verify:

- [ ] PostHog project exists and the deployment writes events to it. Confirm by visiting **Activity → Live events** and walking the assessment flow on staging; you should see `homepage_viewed` → `step_completed` → `results_viewed` in real time.
- [ ] `assessment_submission_complete`, `section_visited`, `email_captured`, `results_viewed`, `slider_used`, `assumptions_opened`, `result_looks_off_clicked`, `feedback_submitted`, `cta_clicked`, `calculation_accuracy_refined` all appear in **Data Management → Events**.
- [ ] Event properties `category`, `industry`, `psp`, `volume_tier`, `pl_swing_bucket`, `surcharging`, `country` are all present on at least one event each.

If any of those are missing, the wiring PR (METRICS_DASHBOARD_BRIEF §1) hasn't landed yet. Stop and ship that first.

---

## 1. Dashboards

Three dashboards, opened in this order on Monday review. Tile order within each dashboard matters — the first tile is the headline.

### 1.1 Dashboard: **Weekly funnel**

Single screen. Three tiles.

#### Tile 1 — North Star: Qualified completions per week

| Field | Value |
|---|---|
| Insight type | Trends |
| Series | Unique sessions per week |
| Filter A | event = `assessment_submission_complete` |
| Filter B | event = `section_visited` (at least one occurrence) |
| Combine filters | AND across both events within the same session |
| Time range | Last 12 weeks |
| Chart type | Line, weekly aggregation |
| Notes | "Qualified" = the merchant both submitted the assessment AND engaged with at least one results-page section. This is the engagement-after-verdict signal that powers everything else. |

#### Tile 2 — 11-step funnel

| Field | Value |
|---|---|
| Insight type | Funnel |
| Conversion window | 24 hours |
| Trend view | Weekly |
| Breakdown | None |
| Steps (in order) | 1. `homepage_viewed`<br>2. `cta_clicked_homepage`<br>3. `assessment_started`<br>4. `step_completed` where `step = 1`<br>5. `step_completed` where `step = 2`<br>6. `step_completed` where `step = 3`<br>7. `step_completed` where `step = 4`<br>8. `assessment_submission_complete`<br>9. `results_viewed`<br>10. `section_visited` (any section)<br>11. `email_captured` OR `email_gate_skipped` |

#### Tile 3 — Time on results page (median)

| Field | Value |
|---|---|
| Insight type | Trends |
| Series | Median session time between `$pageview` and `$pageleave` |
| URL filter | matches `/results*` |
| Chart type | Line, weekly aggregation |
| Time range | Last 12 weeks |

### 1.2 Dashboard: **Engagement quality**

Six tiles. Each ratio is `X / results_viewed` unless stated otherwise.

| Tile | Numerator | Denominator | Format | Notes |
|---|---|---|---|---|
| 1. Slider used rate | `slider_used` (unique sessions) | `results_viewed` (unique sessions) | Weekly line | |
| 2. Assumptions opened rate | `assumptions_opened` | `results_viewed` | Weekly line | |
| 3. Action expansion by `action_id` | `cta_clicked` where `cta_type = 'action_script'`, broken down by `action_id` | — | Bar chart, last 30 days | Reveals which actions get read most. |
| 4. Result-looks-off rate | `result_looks_off_clicked` | `results_viewed` | Weekly line | **Alert** — see §3.2. |
| 5. Feedback submitted rate | `feedback_submitted` | `results_viewed` | Weekly line | |
| 6. Email capture rate | `email_captured` | `email_gate_shown` | Weekly line | Uses `email_gate_shown` as denominator (not `results_viewed`) because the gate isn't always rendered. |

### 1.3 Dashboard: **Merchant base**

Cohort distributions, not time series. Six tiles.

| Tile | Insight | Event | Breakdown | Format |
|---|---|---|---|---|
| 1. Category distribution | Trends | `assessment_submission_complete`, last 90 days | `category` | Bar chart |
| 2. Industry distribution | Trends | `results_viewed` | `industry` | Bar chart |
| 3. PSP distribution | Trends | `results_viewed` | `psp` | Bar chart |
| 4. Volume tier distribution | Trends | `results_viewed` | `volume_tier` | Bar chart |
| 5. Surcharging-yes rate | Trends | `results_viewed` where `surcharging = true` divided by all `results_viewed` | — | Single-number tile |
| 6. Cat × Industry crosstab | SQL (HogQL) | see query below | — | Heatmap / pivot table |

**HogQL for Tile 6:**

```sql
SELECT
  properties.category AS category,
  properties.industry AS industry,
  count() AS sessions
FROM events
WHERE event = 'results_viewed'
GROUP BY category, industry
ORDER BY category, industry
```

---

## 2. Cohorts

Saved cohorts power both the engagement-quality drill-downs and the prioritisation surfaces.

### 2.1 Qualified completers

Used as the audience filter when investigating engagement quality. Re-computes each time it's loaded.

| Field | Value |
|---|---|
| Type | Behavioural |
| Condition A | Performed `assessment_submission_complete` in the last 30 days |
| Condition B | Performed `section_visited` in the last 30 days |
| Combine | AND |

### 2.2 Audience joiners

The opt-in mailing list. Same definition that the Resend audience pull should use.

| Field | Value |
|---|---|
| Type | Behavioural |
| Condition A | Performed `email_captured` with property `marketing_consent = true` |
| Time window | Lifetime |

### 2.3 Result doubters

Used to prioritise calc-engine drift investigations and gather qualitative feedback.

| Field | Value |
|---|---|
| Type | Behavioural |
| Condition A | Performed `result_looks_off_clicked` in the last 30 days |

### 2.4 High-shortfall merchants

The natural consulting funnel for Phase 2 — tracked in Phase 1 so the cohort exists when monetisation lands.

| Field | Value |
|---|---|
| Type | Behavioural |
| Condition A | Performed `results_viewed` with `pl_swing_bucket` in `'25k-50k_loss'` OR `'>50k_loss'` |
| Time window | Last 90 days |

---

## 3. Anomaly alerts

Three alerts on metrics where a sudden change is more interesting than the absolute level. Slack channel routing depends on what's set up in your PostHog → Notifications → Slack integration; suggested routing is in the **Channel** column.

### 3.1 Server-action breakage

| Field | Value |
|---|---|
| Trigger metric | `assessment_submission_complete` events per visitor |
| Condition | Drops by more than 30% week-over-week |
| Severity | Critical |
| Channel | `#eng-alerts` |
| Why it matters | The submit server action is the only network call between consent and results. A 30% WoW drop almost always means the server action is failing silently — Supabase outage, Railway redeploy gone wrong, env var dropped, or a calc-engine throw bubbling up. |
| Suggested response | Check Railway logs + Sentry for `submitAssessment` errors. Test the flow manually on staging. |

### 3.2 Calc engine drift

| Field | Value |
|---|---|
| Trigger metric | `result_looks_off_clicked` rate against `results_viewed` |
| Condition | Rate exceeds 5% in any rolling 24-hour window |
| Severity | High |
| Channel | `#product-alerts` |
| Why it matters | A spike in "result looks off" almost always means the calc engine is producing implausible figures for a new merchant profile — usually a card-mix or industry edge case the RBA constants don't cover well. |
| Suggested response | Pull the last 50 `result_looks_off_clicked` sessions, look at `category` × `industry` × `volume_tier` distribution. Compare against the calc-verification scenarios in [docs/product/calculation-verification.md](../product/calculation-verification.md). |

### 3.3 Email capture drop

| Field | Value |
|---|---|
| Trigger metric | Daily `email_captured` count |
| Condition | Drops more than 50% relative to the trailing 7-day average |
| Severity | Medium |
| Channel | `#product-alerts` |
| Why it matters | Either the email gate isn't rendering (template / styling regression) or Resend is rejecting sends. False-positive risk on weekends. |
| Suggested response | If your PostHog plan supports day-of-week filters, exclude Sat/Sun from the trailing-7-day average. Otherwise just acknowledge weekend dips and respond only on weekday triggers. |

---

## 4. Cadence

| Frequency | Action | Surface |
|---|---|---|
| Monday morning | Open **Weekly funnel** dashboard, screenshot Tile 1 (North Star) into the team's standing notes | Dashboard 1.1 |
| Monday morning | Skim **Engagement quality** — flag any tile that moved >20% WoW | Dashboard 1.2 |
| Monthly | Refresh **Merchant base** distributions; compare against the consulting/distribution thesis | Dashboard 1.3 |
| On alert fire | See §3 individual response notes | Slack |

---

## 5. Verification after a change to the runbook

When you add or modify any dashboard / cohort / alert:

1. Walk the assessment flow on staging end-to-end.
2. Open the dashboard the change touched. Confirm the new tile populates with the live-event session.
3. If a cohort changed, click into it and confirm the staging session appears under "members".
4. If an alert changed, manually trigger the underlying metric in staging (or replay events) and confirm the Slack channel receives the test fire.

If any verification step fails, the underlying event property is likely missing — re-check the wiring in [`apps/web/lib/analytics.ts`](../../apps/web/lib/analytics.ts) and the relevant call site.

---

## Out of scope

- **Cookie consent banner** — Phase 1 ships without one; the privacy policy disclosure is the disclosure mechanism. Do not enable PostHog's `opt_out_capturing_by_default`.
- **Feature flags / A/B tests** — traffic doesn't support meaningful experimentation yet. Phase 2.
- **Revenue / LTV / CAC dashboards** — no monetisation in Phase 1.
- **PostHog Surveys** — not used. Feedback lives inside the assessment flow (`feedback_submitted` event).

---

*Runbook produced May 2026. Authoritative for the Phase 1 PostHog UI configuration.*
*Pairs with the wiring PR that implements METRICS_DASHBOARD_BRIEF.md §1–3.*
