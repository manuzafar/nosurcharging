# Consulting Products
## nosurcharging.com.au — Payments Consulting Services

**Version:** 1.0 | **April 2026**

This document defines the consulting products offered by Manu via nosurcharging.com.au.
It is used to:
1. Write the CTA copy on the results page
2. Build the consulting landing page (/consulting)
3. Brief Claude Code on what happens after a merchant clicks "Book a free discovery call"
4. Define the email follow-up sequences

---

## The Consulting Funnel

```
nosurcharging.com.au assessment
  ↓
Results page CTA: "Book a free discovery call"
  ↓
30-minute discovery call (Calendly — free)
  ↓
Product proposal — one of the five products below
  ↓
Paid engagement
```

The discovery call is free and has no commitment. Its purpose is to understand the
merchant's situation, confirm which product is right for them, and propose scope.

---

## Product 1 — Payments Health Check

**Price:** $2,500  
**Format:** One-off  
**Delivery:** 5–7 business days  
**Target:** Any merchant wanting to understand their payments cost position

**What it is:**
A structured review of the merchant's last three months of PSP statements. Manu
reviews every line item, benchmarks the rate against market data, and delivers a
one-page written report with three specific recommendations.

**What the merchant gets:**
- Breakdown of what they actually paid (interchange, scheme fees, margin — separated)
- Whether their rate is above or below market for their size and PSP
- The top three highest-leverage changes they can make
- Exact scripts for the PSP renegotiation conversation
- A written report they can share with their CFO or accountant

**Why $2,500:**
A merchant processing $5M in cards at 1.4% instead of their fair rate of 1.0% is
overpaying $20,000 per year. The Health Check pays for itself if it finds even a 0.1%
improvement.

**CTA copy (results page):**
"Want someone to review your actual statements? A Payments Health Check gives you a
complete cost breakdown, a market comparison, and a written action plan. $2,500.
Turnaround in 5–7 days."

---

## Product 2 — Reform Ready

**Price:** $3,500  
**Format:** One-off (time-limited — April to September 2026)  
**Delivery:** 5–7 business days  
**Target:** Merchants in Category 3 or 4 who need to act before October 2026

**What it is:**
An accelerated version of the Payments Health Check specifically designed for the
October 2026 reform. Includes repricing analysis, PSP negotiation strategy, and
a follow-up benchmarking report when the 30 October MSF data drops.

**What the merchant gets:**
Everything in the Payments Health Check, plus:
- Exact calculation of the repricing gap — the dollar amount to embed in prices
- Industry-specific repricing strategy (menu repricing for hospitality, pricing
  system updates for online, etc.)
- A written PSP renegotiation script and expected outcome range
- A follow-up benchmarking report when 30 October MSF data is published —
  confirming whether the PSP passed through the saving

**Why $3,500:**
The additional $1,000 covers the October 30 follow-up report and the repricing
analysis, which is more complex than the standard Health Check.

**Availability:** This product is only offered April–September 2026. After October,
it becomes the standard Payments Health Check.

**CTA copy (Category 3/4 results page):**
"You're in one of the hardest positions affected by the October reform. A Reform Ready
engagement calculates your exact repricing gap, gives you the PSP script, and follows
up when the benchmark data drops. $3,500. Limited slots."

---

## Product 3 — Checkout Conversion Audit

**Price:** $6,000  
**Format:** One-off  
**Delivery:** 7–10 business days  
**Target:** E-commerce merchants with a conversion problem or suspicious acceptance rates

**What it is:**
A review of the merchant's checkout flow, payment method mix, acceptance rates,
fraud rule aggressiveness, and 3DS configuration. The output is a specific set of
changes a developer can implement.

**What the merchant gets:**
- Acceptance rate analysis by card type and issuing bank
- Fraud rule review — identifying rules that are declining legitimate transactions
- 3DS configuration assessment (frictionless vs challenge rate)
- Payment method mix analysis — are they offering the right options?
- Checkout UX review — friction points that cause abandonment before payment
- A written implementation list a developer can execute without needing Manu

**Why $6,000:**
E-commerce merchants with a 1% improvement in acceptance rate on $10M volume recover
$100K in revenue. The Checkout Conversion Audit typically identifies 2–5 specific
changes that drive measurable improvement.

---

## Product 4 — Fraud and Acceptance Optimisation

**Price:** $7,500  
**Format:** One-off  
**Delivery:** 10–14 business days  
**Target:** Merchants with a fraud problem, high chargeback ratio, or unexplained
           acceptance rate decline

**What it is:**
A deep review of the merchant's fraud rules engine, chargeback ratio by card type,
authorisation decline analysis, and 3DS strategy. Manu produces a specific rules
framework to implement.

**What the merchant gets:**
- Chargeback ratio analysis by card type, issuing bank, and transaction type
- Rules engine review — which rules are blocking legitimate spend
- Authorisation decline analysis — what's being declined and why
- 3DS optimisation — reducing friction for good customers while stopping fraud
- A new rules framework with specific parameters to implement
- Expected impact range (fraud rate improvement, acceptance rate improvement)

---

## Product 5 — Payments Architecture Review

**Price:** $12,000–$20,000  
**Format:** Two-week engagement  
**Delivery:** 10–15 business days  
**Target:** Businesses setting up or scaling their payments infrastructure; businesses
           considering PSP migration

**What it is:**
A comprehensive review of the merchant's payments stack. PSP and gateway selection,
routing strategy, redundancy, PCI scope, and a technical roadmap. This is the
highest-value product and requires the most time.

**What the merchant gets:**
- Complete payments stack assessment (PSP, gateway, fraud tools, reporting)
- PSP comparison for their volume and business type
- Routing strategy (if applicable)
- PCI scope analysis — are they in the right scope?
- Redundancy and failover assessment
- A written technical roadmap with prioritised recommendations
- Optional: Manu can be available for implementation questions during build

**Scope note:** The $12K–$20K range reflects scope variation. A single PSP review
is $12K. A full stack review with multiple PSPs and a migration roadmap is $20K.

---

## Discovery Call — Purpose and Script

**Duration:** 30 minutes  
**Platform:** Video call (Calendly link)  
**Cost:** Free, no commitment

**Purpose:** Understand the merchant's situation in enough detail to propose the
right product and confirm scope. Not a sales call — a diagnostic.

**What to ask:**
1. "Tell me a bit about your business — what do you sell, how do you take payment?"
2. "What's your approximate monthly card volume?"
3. "Are you on a flat rate or do you see separate interchange on your statement?"
4. "What problem brought you to nosurcharging.com.au?"
5. "Have you had any conversations with your PSP about the reform yet?"

**What to listen for:**
- Volume and industry → determines which product is most valuable
- Plan type → determines complexity of the Health Check
- Their specific pain → determines which product to lead with
- Urgency (October deadline) → determines whether Reform Ready is relevant

**At the end of the call:**
"Based on what you've described, I think [Product X] is the right starting point.
That's [price], turnaround in [time]. I'll send you a one-page scope document by
end of day. If it looks right, you can reply with a yes and I'll invoice you."

**Do not:**
- Propose more than one product at the end of the call
- Leave the call without a clear next action
- Commit to a start date before receiving payment

---

## Prep Email to Merchant (sent automatically via Resend after Calendly booking)

Subject: Your discovery call — a few things to have ready

Body:
```
Hi [Name],

Looking forward to speaking on [date] at [time].

To make the most of our 30 minutes, it would help to have these to hand:

1. Your last 3 months of PSP statements (PDFs are fine)
2. Your approximate monthly card volume
3. Your current PSP and plan type (flat rate or interchange-plus)

If you don't have these handy, no worries — we can work with what you know.

See you then.

Manu
nosurcharging.com.au
```

---

## Results Page CTA Hierarchy

The results page shows one primary CTA, not a product menu. The CTA varies by category:

**Category 1:**
"Verified your rate is below market? A Payments Health Check confirms it — and finds
any hidden fees you're paying above your contracted rate. $2,500."

**Category 2:**
"Want someone to negotiate with [PSP] on your behalf? A Payments Health Check reviews
your statements, benchmarks your rate, and gives you the exact script. $2,500."

**Category 3 and 4 (before October 2026):**
"You need to act before October. A Reform Ready engagement calculates your exact
repricing gap, gives you the PSP script, and follows up when the benchmark data drops.
$3,500. Limited availability."

**Category 3 and 4 (after October 2026):**
"The reform is live. A Payments Health Check will tell you whether your costs actually
fell — and what to do if they didn't. $2,500."

---

## Consulting Page (/consulting)

The site should have a /consulting page with:
- Brief intro (2 sentences): who Manu is, what the consulting is
- Five product cards (one per product): name, price, format, one-line description
- One CTA: "Book a free 30-minute discovery call" → Calendly
- A note: "Not sure which product is right? The discovery call will tell us both."

The consulting page should NOT be a sales pitch. It should feel like a professional's
service listing — confident, specific, no superlatives.

---

*Consulting Products v1.0 · nosurcharging.com.au · April 2026*
