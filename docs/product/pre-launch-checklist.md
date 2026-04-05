# Pre-Launch Checklist
## nosurcharging.com.au — Open Questions Resolved

**Version:** 1.0 | **April 2026**

All open questions from the architecture review are resolved here. Complete every
item before the Claude Code build begins.

---

## OQ-01 — Card mix citation ✅ RESOLVED

**Question:** What is the source citation for the 60/35/5/0 card mix defaults?

**Resolution:** RBA Statistical Tables C1 and C2, not C5/C6.
- C1 = Credit and Charge Cards (not C5, which is Cheques)
- C2 = Debit Cards (not C6, which is Direct Entry/NPP)

**Correct citation for code comments and assumptions panel:**
```
Source: RBA Statistical Tables C1 (Credit and Charge Cards) and
        C2 (Debit Cards), 12 months to January 2026
URL: https://www.rba.gov.au/statistics/tables/#payments-system
```

**Approximate splits from C1+C2 data (rolling 12 months to Jan 2026):**
- Debit cards (C2): ~63% of card transactions → rounded to 60% (conservative)
- Consumer credit (C1.2 personal): ~32-35% → rounded to 35%
- Commercial credit (C1.2 commercial): ~2-3% → rounded to 0% for defaults
- Foreign-issued: ~5% (per RBA Conclusions Paper cross-border data, March 2026)

**In au.ts — update the comment:**
```typescript
export const AU_CARD_MIX_DEFAULTS = {
  // Source: RBA Statistical Tables C1 and C2, 12 months to January 2026
  // URL: https://www.rba.gov.au/statistics/tables/#payments-system
  // These are national averages. Industry-specific splits vary significantly.
  // Use the card mix input (FR-10b) to override with merchant-specific data.
  debitShare:          0.60,
  consumerCreditShare: 0.35,
  foreignShare:        0.05,
  commercialShare:     0.00,
  avgTransactionValue: 65,
} as const;
```

**Full verified scenarios:** docs/product/calculation-verification.md

---

## OQ-02 — Supabase region ✅ RESOLVED

**Question:** Which Supabase region to use? Cannot change after project creation.

**Resolution:** Use **ap-southeast-1 (Singapore)**.

This is the closest available Supabase region to Railway's Sydney (ap-southeast-2)
deployment. The latency from Singapore to Sydney is approximately 80ms — acceptable
for a consumer web tool but not ideal. No Australian Supabase region currently exists.

**Action required before any code is written:**

When creating the Supabase project:
1. Go to https://supabase.com/dashboard/new/project
2. Set Organisation
3. Set Name: `nosurcharging-staging` (staging first) / `nosurcharging-production`
4. Set Database Password (save this securely — it goes in DATABASE_URL)
5. **Region: Southeast Asia (Singapore) — ap-southeast-1**
6. Confirm: there is no Australian region option

Create **two separate projects** — one for staging, one for production.
They must be completely separate — not schemas within the same project.

**Connection strings to use (PgBouncer pooler — port 6543):**
```
# Staging
DATABASE_URL=postgresql://postgres.[staging-project-ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres

# Production  
DATABASE_URL=postgresql://postgres.[prod-project-ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

Note the format has changed: the newer Supabase pooler URL format uses
`aws-0-ap-southeast-1.pooler.supabase.com` rather than `[project].supabase.co`.
Copy the exact connection string from the Supabase dashboard → Settings → Database
→ Connection string → Transaction mode.

**After creating each project:**
Apply docs/architecture/database-schema.sql via Supabase → SQL Editor.
Apply to staging first. Verify RLS is working. Then apply to production.

---

## OQ-03 — Calendly setup ✅ RESOLVED (action required)

**Question:** What is the Calendly URL for the discovery call booking?

**Resolution:** Manu needs to create this. Steps:

1. Go to https://calendly.com and sign up or log in
2. Create a new Event Type:
   - Name: "Payments Discovery Call"
   - Duration: 30 minutes
   - Location: Video call (Google Meet, Zoom, or your preferred platform)
   - Description: "A free 30-minute conversation to understand your payments situation.
     No commitment. We'll figure out whether I can help and what that would look like."
3. Set availability: business hours AEST, 3–5 slots per week (scarcity is real)
4. Add intake questions:
   - "What's your approximate monthly card volume?" (dropdown: <$50K, $50K–$500K, $500K–$5M, $5M+)
   - "Which PSP do you use?" (dropdown: Stripe, Square, Tyro, CommBank, ANZ, Westpac, eWAY, Adyen, Other)
   - "What brings you to this call?" (short text)
5. Set up confirmation email: auto-send the prep email (see docs/product/consulting-products.md)
6. Copy the booking URL: https://calendly.com/[your-username]/payments-discovery-call

**Once created:**
Update CLAUDE.md with: `CALENDLY_URL=https://calendly.com/[your-username]/payments-discovery-call`
This URL goes into the results page CTA button and the /consulting page.

**Webhook setup (for automated lead recording):**
1. In Calendly → Integrations → Webhooks → Create webhook
2. Payload URL: https://nosurcharging.com.au/api/webhooks/calendly
3. Events: invitee.created
4. Copy the signing key → store as CALENDLY_WEBHOOK_SECRET in Railway

---

## OQ-04 — Legal review ✅ RESOLVED (action required)

**Question:** Disclaimer text needs review by an Australian solicitor before launch.

**Resolution:** Book one-hour review with an Australian solicitor with fintech/payments
experience. Estimated cost: $300–$500.

**Brief for the solicitor (ready to send):**

---
Subject: Request for one-hour review — fintech tool disclaimer and privacy notice

I am building a free web tool for Australian merchants called nosurcharging.com.au.
The tool helps merchants understand the P&L impact of the RBA's October 2026
surcharge reform on their business.

I need a one-hour review of the following:

**1. Assessment disclaimer (checkbox consent before use)**
Text: "I understand that this assessment provides illustrative estimates only. It is
not financial advice. Figures are based on RBA published data and the information I
provide. I should verify any figures with my PSP before making business decisions."

Questions:
- Is this disclaimer adequate to prevent liability for acting on inaccurate outputs?
- Does the tool constitute "financial product advice" under the Corporations Act 2001?
  (I believe it does not — it is general information, not advice on a financial product.)
- Any specific wording changes recommended?

**2. Email capture consent**
Text: "One email on 30 October when the published MSF data drops. Not shared with any
payment provider. Unsubscribe from the email itself."

Questions:
- Is this compliant with the Spam Act 2003 and the Australian Privacy Principles?
- The email is specifically triggered by an RBA publication event — does this constitute
  a "commercial electronic message" requiring specific opt-in language?

**3. Privacy Policy**
I am collecting: anonymous session data, assessment inputs (volume, PSP, plan type),
and optionally an email address with explicit consent. I am not collecting names or
business names at the assessment stage.

Questions:
- Does the Privacy Act 1988 apply? (I believe it applies once I have 3+ staff or
  annual revenue exceeds $3M — I may be below threshold initially.)
- What minimum disclosures are required in the Privacy Policy?
- Under what circumstances would the Notifiable Data Breaches scheme require me to
  notify the OAIC?

**4. General business conduct**
The tool has no commercial relationship with any PSP. The output is general guidance.
Any concerns about ASIC's guidance on financial services, the ACCC, or the RBA's
own published positions on consumer/merchant information tools?

Please provide:
- A brief written summary of your recommendations (1–2 pages)
- Any required amendments to the disclaimer text
- Confirmation of whether a Privacy Policy is required before launch
- Whether any ASIC relief or AFS licence exemption considerations are relevant

---

**Solicitor search:**
Search for: "Australian fintech lawyer", "payments law Australia", "ASIC compliance lawyer"
Firms to consider: Gilbert + Tobin, Herbert Smith Freehills (for larger query), or a
boutique fintech practice for cost-effectiveness.

**Timeline:** Book before Week 5 of the build. The legal review is a hard gate
before public launch.

---

## OQ-05 — PSP Rate Registry ✅ RESOLVED

**Question:** Should the PSP Rate Registry be a Phase 1 or Phase 2 feature?

**Decision: Phase 1 — simple contribution only. Trust scoring and public display deferred to Phase 2.**

**Rationale:**
The table is already in the schema. The assessment already captures PSP, plan type,
and volume. A post-assessment contribution takes under a minute of additional build
time. Starting data collection from day one compounds the data moat faster.

**Phase 1 scope (build in Week 4):**
A simple optional three-field form appears on the results page after the email capture.

```
"Help other merchants benchmark — takes 20 seconds."

Your PSP:           [Stripe]          ← pre-populated from assessment
Your plan type:     [Flat rate]       ← pre-populated from assessment
Your effective rate: [____] %         ← merchant enters their MSF rate
                    [Submit anonymously →]

"Anonymous. Never shared with your PSP."
```

The submission is stored in the `psp_rate_registry` table with:
- `assessment_id` (links to the assessment — validates the submission is real)
- `psp_name`, `plan_type` (from assessment)
- `effective_rate_pct` (merchant input)
- `trust_score = 1` (all Phase 1 submissions get score 1 — no quarantine logic yet)
- `quarantined = false`

**Phase 2 scope:**
- Trust scoring (IP-based, statistical outlier detection, verification email)
- Quarantine pipeline for suspicious submissions
- Public benchmarking display: "Your rate vs. similar [PSP] merchants"
- Industry segmentation

**New analytics event to add:**
```typescript
trackEvent('Rate contributed', { psp: string, plan_type: 'flat'|'costplus', country: 'AU' })
```

**Implementation note:** The PSP rate is entered in the UI as a percentage
(e.g. "1.4") and stored as a decimal (e.g. 0.014) in the database.

---

## Performance Budget ✅ RESOLVED

**Added to NFR requirements:**

| Metric | Target | Why |
|---|---|---|
| First Contentful Paint (FCP) | < 1.5s on Australian 4G | Primary target audience is phone-first merchants on mobile networks |
| Largest Contentful Paint (LCP) | < 2.5s | Google Core Web Vitals threshold for "good" |
| Cumulative Layout Shift (CLS) | < 0.1 | Financial numbers must not jump as page loads |
| Total Blocking Time (TBT) | < 200ms | Assessment steps must feel instant |
| JavaScript bundle (assessment page) | < 150KB gzipped | Client component — must be lean |
| JavaScript bundle (homepage) | < 80KB gzipped | SSR page — minimal client JS |
| Time to Interactive (TTI) | < 3.5s on 4G | Slider must be interactive quickly |
| Lighthouse performance score | > 85 | Measured at staging before launch |

**Measurement tool:** Lighthouse in Chrome DevTools or `npx lighthouse` in CI.
Run against staging.nosurcharging.com.au before public launch.

**Code-splitting strategy:**
- The assessment flow (`assessment/page.tsx`) is a client component.
  Use `next/dynamic` to lazy-load the chart library (Recharts) on the results page.
  Do not include Recharts in the assessment step bundle.
- The homepage is server-rendered. Ship zero Recharts JavaScript on the homepage.

**Font loading:**
- Use `next/font` for system fonts to avoid layout shift.
- If Playfair Display or a custom serif is used: `font-display: swap` is mandatory.

---

## Summary — all items resolved

| Item | Status | Action |
|---|---|---|
| OQ-01 Card mix citation | ✅ Resolved | Update au.ts comment with C1/C2 citation |
| OQ-02 Supabase region | ✅ Resolved | Create projects in ap-southeast-1 (Singapore) |
| OQ-03 Calendly URL | ✅ Action needed | Create Calendly event type, update CLAUDE.md |
| OQ-04 Legal review | ✅ Brief ready | Send brief, book appointment, before Week 5 |
| OQ-05 PSP Rate Registry | ✅ Decided | Phase 1 — simple contribution form in Week 4 |
| Calculation verification | ✅ Created | docs/product/calculation-verification.md |
| Consulting products | ✅ Created | docs/product/consulting-products.md |
| Performance budget | ✅ Specified | Above + in NFR section |

**OQ-06 Global brand domain** — not blocking Phase 1. Defer decision to before Phase 2.

---

*Pre-Launch Checklist v1.0 · nosurcharging.com.au · April 2026*
