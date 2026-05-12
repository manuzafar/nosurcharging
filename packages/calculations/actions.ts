// packages/calculations/actions.ts
// Builds the personalised action list for each category.
// Each action has:
//   - text   "what" — the instruction (e.g. "Ask [PSP] whether your rate...")
//   - script "verbatim words to say" — interpolated with [PSP], [$X], [rate]
//   - why    "explanation" — short context
// PSP name is embedded inline. Never "your PSP" or "your provider".
// Three urgency tiers: urgent (red), plan (amber), monitor (grey).
// Cat 4 copy is verbatim from docs/design/revamp-ux-spec.md §3.4.
//
// Per RESULTS_CONTENT_CREDIBILITY_BRIEF.md (May 2026), several actions
// are now PSP-aware. Capability flags come from PSP_PUBLISHED_RATES:
//   - "ask for itemised quote" gates on `offersItemisedPlan` + the
//     volume threshold so Square / Zeller merchants don't see a quote
//     ask that will be rejected, and Stripe merchants below the
//     enterprise threshold don't see one either.
//   - "30 October MSF publication" gates on `publishesMsfFromOct2026`
//     so small acquirers (Stripe AU, Square AU, Zeller, eWAY) get the
//     market-reference variant pointing at the >$10B bank acquirers
//     and Tyro that DO publish.
//   - Cat 3's ACCC penalty `why` is softened to scheme rules + acquirer
//     agreement + consumer-law framing — the RBA's enforcement
//     mechanism is scheme-contractual under the new framework.

import type { ActionContext, ActionItem, RaoFramework } from './types';
import { PSP_PUBLISHED_RATES, type PspPublishedRate } from './constants/psp-rates';
import { AU_NPP_RAIL_BUCKETS } from './constants/au';

// ── Formatting helpers ───────────────────────────────────────────
// Calc layer is i18n-naive — AU formatting only in Phase 1.

function formatCurrency(amount: number): string {
  return `$${Math.round(amount).toLocaleString('en-AU')}`;
}

// surchargeRate is stored as a decimal proportion (0.015 = 1.5%)
// Display as percentage with one decimal: "1.5%"
function formatPct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

// Break-even price increase: the percentage uplift on card-paying revenue
// that fully offsets the merchant's October P&L shortfall. NOT the surcharge
// rate — surcharge rate over-recovers because it's set to cover
// interchange + scheme + margin, while the break-even only needs to
// recover the post-reform shortfall (after IC saving / pass-through).
//   breakEvenPct = abs(plSwing) / volume × 100
// Returned with two decimals (e.g. "1.13%") because rounding to one decimal
// systematically biases towards over-recovery.
function formatBreakEvenPct(plSwing: number, volume: number): string {
  if (volume <= 0) return '0.00%';
  const pct = (Math.abs(plSwing) / volume) * 100;
  return `${pct.toFixed(2)}%`;
}

// ── PSP capability helpers ───────────────────────────────────────

function pspCapabilities(psp: string): PspPublishedRate | undefined {
  return PSP_PUBLISHED_RATES[psp];
}

// True if the merchant qualifies for an "ask for itemised quote"
// action under this PSP's offer at this volume.
function qualifiesForItemisedQuote(psp: string, volume: number): boolean {
  const caps = pspCapabilities(psp);
  if (!caps) return false;
  switch (caps.offersItemisedPlan) {
    case 'yes':
      return true;
    case 'volume_gated': {
      const monthly = caps.itemisedVolumeThresholdMonthly;
      if (!monthly) return false;
      return volume >= monthly * 12;
    }
    case 'no':
    case 'gateway_only':
      return false;
  }
}

// Produces the right action to surface in the `plan` slot when the
// PSP cannot service an itemised quote at this volume — or returns
// null to fall back to the standard "ask for itemised" action.
function buildItemisedFallbackAction(
  psp: string,
  volume: number,
): ActionItem | null {
  const caps = pspCapabilities(psp);
  if (!caps) return null;
  if (qualifiesForItemisedQuote(psp, volume)) return null;
  switch (caps.offersItemisedPlan) {
    case 'no':
      return {
        priority: 'plan',
        timeAnchor: 'BEFORE 1 AUGUST 2026',
        text: `${psp} does not offer itemised pricing — consider a provider that does`,
        script: `If you want the interchange saving to flow through automatically, you'll need a provider with cost-plus pricing. At your volume, viable options are Tyro (custom pricing from $20K/month), Adyen (typically $500K+/month), or one of the big-four banks (CommBank, NAB, Westpac, ANZ Worldline) at their tier thresholds. Get one quote before October so you know whether switching is worthwhile.`,
        why: `${psp}'s flat-rate architecture means the interchange saving stays with them, not you. Switching to cost-plus is the structural fix.`,
      };
    case 'gateway_only':
      return {
        priority: 'plan',
        timeAnchor: 'BEFORE 1 AUGUST 2026',
        text: `Ask ${psp} which acquirer settles your funds, then engage that acquirer directly about cost-plus pricing options`,
        script: `${psp} is a payment gateway, not the acquirer that sets your effective rate. The acquirer behind your ${psp} account (a bank or processor) is the entity that can offer cost-plus pricing. Ask ${psp} to confirm which acquirer is on your account, then approach that acquirer for an itemised quote.`,
        why: `Gateway pricing inherits from the underlying acquirer. Talking to the gateway about cost-plus is talking to the wrong party.`,
      };
    case 'volume_gated':
      // Suppress — merchant below threshold; no fallback action surfaced
      // (the brief is explicit about not emitting an unactionable item).
      return null;
    case 'yes':
      return null;
  }
}

// MSF publication monitoring action. Gated on `publishesMsfFromOct2026`:
// large bank acquirers + Tyro + Adyen publish; everyone else gets a
// market-reference variant pointing at the published acquirers.
function buildMsfPublicationAction(psp: string): ActionItem {
  const caps = pspCapabilities(psp);
  if (caps?.publishesMsfFromOct2026) {
    return {
      priority: 'monitor',
      timeAnchor: '30 OCTOBER 2026',
      text: `Check the published rate benchmarks on 30 October`,
      script: `From 30 October, ${psp} and other large acquirers must publish their average merchant service fees. Compare your rate directly against the published market average.`,
      why: `For the first time, you'll have independent data to see whether your ${psp} rate is in line with the market.`,
    };
  }
  return {
    priority: 'monitor',
    timeAnchor: '30 OCTOBER 2026',
    text: `Check the RBA-published acquirer rate benchmarks`,
    script: `From 30 October, acquirers processing more than $10 billion in card payments annually must publish their average merchant service fees. ${psp} likely falls below this threshold, but the data from the large bank acquirers (CommBank, NAB, Westpac, ANZ) and Tyro will give you a market reference point to negotiate against.`,
    why: `For the first time, you'll have independent data to anchor a negotiation — even if ${psp}'s own rates aren't directly published.`,
  };
}

// RAO framework — Recover / Absorb / Optimise. Cat 3 + Cat 4 share this
// framework verbatim because the lever choice is the same; only the upstream
// shortfall differs. The framework is intentionally option-presenting, not
// directive: each lever surfaces conditions so the merchant can match their
// gross margin / competitive position to the right response.
//
// Returns structured data, not a multi-section script — VerticalActionSteps
// renders this as a card with coloured letter dots, lever names, conditions,
// and a single break-even pill on RECOVER.
function buildRaoFramework(args: {
  breakEvenPct: string;
  shortfall: string;
  psp: string;
}): RaoFramework {
  const { breakEvenPct, shortfall, psp } = args;
  const caps = pspCapabilities(psp);
  // Suppress the "PSP's itemised plan may also reduce the base cost"
  // hint when the PSP doesn't offer one — keeps the OPTIMISE lever
  // factually doable for Square / Zeller / eWAY merchants too.
  const itemisedHint =
    caps && (caps.offersItemisedPlan === 'yes' || caps.offersItemisedPlan === 'volume_gated')
      ? ` ${psp}'s itemised plan may also reduce the base cost before you commit to RECOVER or ABSORB.`
      : '';
  return {
    title: 'Recover · Absorb · Optimise — choose your mix',
    intro: `You have three ways to respond. The right approach depends on your gross margin and business type — two things we don't know from this assessment. ${psp}'s response to the first action may narrow your actual shortfall before you choose.`,
    levers: [
      {
        letter: 'R',
        name: 'RECOVER through pricing',
        condition:
          "Right if your gross margin is below 20% or your competitors face the same October change. Wrong if customers are highly price-sensitive or you're in a commoditised market.",
        pill: {
          label: 'Break-even',
          value: `${breakEvenPct} increase recovers ${shortfall}`,
        },
      },
      {
        letter: 'A',
        name: 'ABSORB from margin',
        condition:
          'Viable if your gross margin is above 25% and this cost is less than 3–4% of net profit. Not viable if you operate near breakeven.',
      },
      {
        letter: 'O',
        name: 'OPTIMISE the cost itself',
        condition: `Check Least Cost Routing is active on your terminals — activating it costs nothing and may reduce this exposure.${itemisedHint}`,
      },
    ],
  };
}

// ── NPP-rail action builders ──────────────────────────────────────
// NPP_RAIL_ACTIONS_BRIEF_V2.md (May 2026). SUPERSEDES the v1
// three-bucket shape. Copy verbatim from the brief. Independence
// preserved — no NPP provider is named anywhere; the generic phrase
// "an NPP-licensed provider" / "NPP-licensed providers" is used
// throughout. Maturity caveat acknowledged honestly in Buckets B
// and C (banking-app handoff conversion impact, qualitative only).
// No specific cents-per-transaction figures (provider-specific,
// volume-tiered, not safely publicly stated).

function buildPayIdAsyncInvoiceAction(): ActionItem {
  return {
    priority: 'plan',
    timeAnchor: 'BEFORE 1 OCTOBER',
    text: `Add PayID to invoices and B2B account statements`,
    script: `Publish your business PayID (ABN, phone, or email tied to your business bank account) on invoices, booking confirmations, and B2B account statements. Customers paying via PayID send the payment directly from their bank account through the New Payments Platform — settlement is instant and there is no card scheme cost on those transactions. Your business bank account fee for receiving PayID payments is typically zero or a few cents. Verification happens via banking app notifications, which works for invoiced or pre-ordered flows where you confirm payment before fulfilment.`,
    why: `For the portion of customers willing to pay via PayID, your card scheme cost on that revenue drops to zero. No provider integration needed — your business bank account already supports PayID.`,
    action_id: 'payid_async_invoice',
  };
}

function buildPayIdOnlineCheckoutAction(industry: string): ActionItem {
  const isRetail = industry === 'retail';
  const scriptOpener = isRetail
    ? `If your business has an online checkout: offer "Pay by PayID" alongside cards. `
    : `Offer "Pay by PayID" alongside cards at online checkout. `;
  const whyBody = isRetail
    ? `If your business has an online checkout, this is a no-card-scheme-cost option that runs alongside cards rather than replacing them. Best evaluated against your conversion sensitivity at checkout.`
    : `For your online flow, this is a no-card-scheme-cost option that runs alongside cards rather than replacing them. Best evaluated against your conversion sensitivity at checkout.`;
  return {
    priority: 'plan',
    timeAnchor: 'BEFORE 1 OCTOBER',
    text: `Offer PayID at online checkout via an NPP-licensed provider`,
    script: `${scriptOpener}The customer enters their PayID alias; your NPP-licensed provider sends a payment request that the customer approves in their banking app; you receive confirmation via webhook within seconds. Per-transaction pricing is typically a flat cents fee rather than a percentage of value, which is materially cheaper on higher-value transactions. Honest caveat: the customer is handed off to their banking app to approve the request — this step affects conversion versus card-on-file today, and the experience varies by which banking app the customer uses. The rail itself is reliable; the customer-side UX is on a maturity curve.`,
    why: whyBody,
    action_id: 'payid_online_checkout',
  };
}

function buildPayToMandateAction(industry: string): ActionItem {
  const isRetail = industry === 'retail';
  const scriptOpener = isRetail
    ? `If your business has an online checkout: PayTo is the New Payments Platform's authorisation framework. `
    : `PayTo is the New Payments Platform's authorisation framework. `;
  const whyBody = isRetail
    ? `If your business has an online checkout, this gives you a structurally cheaper rail for returning or recurring customers — once a mandate is in place, subsequent charges are merchant-initiated without further customer involvement.`
    : `Once a mandate is in place, subsequent charges are merchant-initiated without further customer involvement — the cost structure (flat cents per transaction instead of percentage of value) is structurally cheaper than card scheme rails on your recurring or returning-customer revenue.`;
  return {
    priority: 'plan',
    timeAnchor: 'BEFORE 1 OCTOBER',
    text: `Evaluate PayTo for returning, recurring, or tokenised customer payments`,
    script: `${scriptOpener}The customer establishes a mandate once at checkout or signup; after that, you can charge their bank account directly — either one-off (like card-on-file tokenised payments) or on a recurring schedule (like subscription billing). Per-transaction pricing is typically a flat cents fee rather than a percentage of value, which is materially cheaper on higher-value or recurring transactions. Provider integration is required — request a quote from an NPP-licensed provider. Honest caveat: setting up the mandate involves the customer being handed off to their banking app to approve it — this affects conversion versus card-on-file today, and the experience varies by which banking app the customer uses. The rail itself is reliable; the customer-side UX is on a maturity curve.`,
    why: whyBody,
    action_id: 'payto_mandate',
  };
}

function buildCafeLongTailAction(): ActionItem {
  return {
    priority: 'monitor',
    timeAnchor: 'OPTIONAL',
    text: `Long-tail option: PayID for large in-person transactions`,
    script: `For occasional large transactions (function deposits, corporate group bills, $200+ orders), publishing your business PayID at the counter saves the card scheme cost on that single transaction. Your staff verifies inbound payment in their banking app before fulfilment — this is not a queue-friendly rail for routine $5 coffees, but it's a viable option for large one-off transactions where the verification overhead is proportionate to the saving.`,
    why: `Not a primary lever for café flow. Worth offering for the long tail of high-value transactions where the per-transaction saving is material enough to justify the manual verification step.`,
    action_id: 'payid_cafe_longtail',
  };
}

// Returns 0-4 NPP rail actions based on the industry's bucket
// mapping. Defaults to the `other` bucket configuration when the
// industry isn't recognised. Bucket B and Bucket C helpers receive
// `industry` so they can emit the retail conditional-copy variant
// without a separate branch here.
function buildNppRailActions(industry: string): ActionItem[] {
  const buckets = AU_NPP_RAIL_BUCKETS[industry] ?? AU_NPP_RAIL_BUCKETS.other!;
  const actions: ActionItem[] = [];
  if (buckets.payIdAsyncInvoice)   actions.push(buildPayIdAsyncInvoiceAction());
  if (buckets.payIdOnlineCheckout) actions.push(buildPayIdOnlineCheckoutAction(industry));
  if (buckets.payToMandate)        actions.push(buildPayToMandateAction(industry));
  if (buckets.cafeLongTail)        actions.push(buildCafeLongTailAction());
  return actions;
}

// Splits an injected array of NPP actions into plan-tier and
// monitor-tier items: plan items go BEFORE the first monitor in
// the existing list; monitor items go AFTER all existing monitors.
// This preserves the visual ordering required by V2 — the cafe
// long-tail option (monitor) lands at the bottom of the list,
// below the existing 30 October MSF publication action.
function injectBeforeMonitor(actions: ActionItem[], items: ActionItem[]): ActionItem[] {
  if (items.length === 0) return actions;
  const planNpp = items.filter((a) => a.priority === 'plan');
  const monitorNpp = items.filter((a) => a.priority === 'monitor');
  const firstMonitor = actions.findIndex((a) => a.priority === 'monitor');
  if (firstMonitor === -1) {
    return [...actions, ...planNpp, ...monitorNpp];
  }
  return [
    ...actions.slice(0, firstMonitor),
    ...planNpp,
    ...actions.slice(firstMonitor),
    ...monitorNpp,
  ];
}

// ── Public entry point ───────────────────────────────────────────

export function buildActions(
  category: 1 | 2 | 3 | 4 | 5,
  psp: string,
  industry: string,
  ctx: ActionContext,
  planType?: 'flat' | 'costplus' | 'blended' | 'zero_cost',
): ActionItem[] {
  const isBlended = planType === 'blended';
  // NPP-rail injection: 0-3 actions per industry. Cat 5 excluded
  // (higher-priority cash-flow problems shouldn't share the action
  // list with payment-rail evaluation).
  const nppActions = category === 5 ? [] : buildNppRailActions(industry);

  switch (category) {
    case 1:
      return injectBeforeMonitor(buildCat1Actions(psp), nppActions);
    case 2:
      return injectBeforeMonitor(buildCat2Actions(psp, ctx, isBlended), nppActions);
    case 3:
      return injectBeforeMonitor(buildCat3Actions(psp, ctx), nppActions);
    case 4:
      return injectBeforeMonitor(buildCat4Actions(psp, ctx, isBlended), nppActions);
    case 5:
      return buildCat5Actions(psp);
  }
}

// ── Category 1: cost-plus, not surcharging ───────────────────────
// Best case — IC saving flows automatically. Just confirm and monitor.

function buildCat1Actions(psp: string): ActionItem[] {
  return [
    {
      priority: 'plan',
      timeAnchor: 'BEFORE 1 AUGUST 2026',
      text: `Confirm with ${psp} that your cost-plus rate will reflect the new interchange caps`,
      script: `From 1 October, the RBA's new interchange caps take effect — wholesale interchange that ${psp} pays falls. Can you confirm in writing that my cost-plus pricing will pass those new caps through to me automatically, with no rate review required?`,
      why: `On a cost-plus plan the saving is structural — but written confirmation is the cheapest insurance you'll ever buy.`,
    },
    buildMsfPublicationAction(psp),
    {
      priority: 'monitor',
      timeAnchor: '30 JANUARY 2027',
      text: `Review the RBA pass-through report`,
      script: `The RBA publishes a pass-through report on 30 January 2027 showing how much of the interchange saving actually reached merchants. Confirm your reduction matches.`,
      why: `Even on cost-plus, periodic verification ensures the saving has flowed through as expected.`,
    },
  ];
}

// ── Category 2: flat rate, not surcharging ───────────────────────
// Most common. Saving exists but won't arrive automatically.

function buildCat2Actions(
  psp: string,
  ctx: ActionContext,
  isBlended: boolean = false,
): ActionItem[] {
  const actions: ActionItem[] = [
    {
      priority: 'urgent',
      timeAnchor: 'BEFORE 1 OCTOBER',
      text: `Ask ${psp} whether your rate will change after October`,
      script: `From 1 October, the RBA's new interchange caps take effect — wholesale interchange that ${psp} pays falls. I'd like to understand whether my ${psp} flat rate will be adjusted to reflect that change — and by how much. Can you confirm in writing?`,
      why: `Flat rate adjustments aren't automatic. Written confirmation now means you'll know what to expect — and have time to act if needed.`,
    },
  ];

  // PSP-aware "plan" slot: ask for itemised quote when the PSP can
  // actually service it, otherwise fall back to the brief's three
  // alternative actions (no / gateway_only) or suppress (volume_gated
  // below threshold).
  if (qualifiesForItemisedQuote(psp, ctx.volume)) {
    actions.push({
      priority: 'plan',
      timeAnchor: 'BEFORE 1 AUGUST 2026',
      text: `Ask ${psp} for a quote on their itemised pricing plan`,
      script: `Request a quote on ${psp}'s interchange-plus pricing. I'd like to compare it against my current flat rate, with the RBA's October interchange cuts factored in.`,
      why: `On itemised pricing, future cost reductions flow through automatically — no rate review required. August gives you enough lead time to switch cleanly before October.`,
    });
  } else {
    const fallback = buildItemisedFallbackAction(psp, ctx.volume);
    if (fallback) actions.push(fallback);
  }

  actions.push(buildMsfPublicationAction(psp));

  if (isBlended) {
    actions.push(
      {
        priority: 'plan',
        timeAnchor: 'BEFORE 1 AUGUST 2026',
        text: `Ask ${psp} for your full card mix breakdown — debit vs credit percentage`,
        why: `Your blended rate means the savings depend on your actual card mix. Knowing the split improves accuracy.`,
      },
      ...(qualifiesForItemisedQuote(psp, ctx.volume)
        ? [
            {
              priority: 'plan' as const,
              timeAnchor: 'BEFORE 1 AUGUST 2026',
              text: `Ask ${psp} for a quote on itemised (cost-plus) pricing`,
              why: `Blended pricing obscures the actual interchange cost. Itemised pricing makes future savings flow automatically.`,
            },
          ]
        : []),
    );
  }

  return actions;
}

// ── Category 3: cost-plus, surcharging ───────────────────────────
// Surcharge revenue disappears 1 October. IC saving flows automatically.

function buildCat3Actions(psp: string, ctx: ActionContext): ActionItem[] {
  const shortfall = formatCurrency(Math.abs(ctx.plSwing));
  const breakEvenPct = formatBreakEvenPct(ctx.plSwing, ctx.volume);
  // Surcharge rate is suppressed in this script — using it as the
  // recommended price increase systematically over-recovers.
  void formatPct;
  void ctx.surchargeRate;

  return [
    {
      priority: 'urgent',
      timeAnchor: 'BEFORE 1 OCTOBER',
      text: `Decide how you will respond to the ${shortfall} shortfall`,
      framework: buildRaoFramework({
        breakEvenPct,
        shortfall,
        psp,
      }),
      why: `The surcharge ban applies from 1 October regardless of your ${psp} plan. This part of your situation is certain.`,
    },
    {
      priority: 'plan',
      timeAnchor: 'BEFORE 1 AUGUST 2026',
      text: `Communicate the pricing change to customers now`,
      script: `Draft customer-facing communication explaining that, from 1 October, surcharges on Visa, Mastercard, and eftpos are no longer permitted. Be transparent about how your pricing will change.`,
      why: `Early communication smooths the transition. Customers respond far better to four months of notice than four days.`,
    },
    {
      priority: 'monitor',
      timeAnchor: '1 OCTOBER 2026',
      text: `Verify surcharging has stopped on the designated networks`,
      script: `Confirm with ${psp} that surcharging has been disabled on Visa, Mastercard, and eftpos at the terminal level. Amex and BNPL can still be surcharged.`,
      why: `Continuing to surcharge a designated network after 1 October breaches scheme rules and your acquirer agreement — exposing you to acquirer chargebacks, terminal disconnection, and potential ACCC action under existing consumer law. Verification is non-negotiable.`,
    },
  ];
}

// ── Category 4: flat rate, surcharging ───────────────────────────
// Worst case — both problems. Copy is verbatim from ux-spec §3.4.

function buildCat4Actions(psp: string, ctx: ActionContext, isBlended: boolean = false): ActionItem[] {
  const shortfall = formatCurrency(Math.abs(ctx.plSwing));
  const breakEvenPct = formatBreakEvenPct(ctx.plSwing, ctx.volume);
  const volume = formatCurrency(ctx.volume);
  // Surcharge rate is suppressed in this script — see Cat 3 note.
  void formatPct;
  void ctx.surchargeRate;
  void ctx.surchargeRevenue;

  const actions: ActionItem[] = [
    {
      priority: 'urgent',
      timeAnchor: 'BEFORE 1 OCTOBER',
      text: `Ask ${psp} whether your rate will change after October`,
      script: `From 1 October, the RBA's new interchange caps take effect — wholesale interchange that ${psp} pays falls. I'd like to understand whether my ${psp} flat rate will be adjusted to reflect that change — and by how much. Can you confirm in writing?`,
      why: `Flat rate adjustments aren't automatic. Written confirmation now means you'll know what to expect — and have time to act if needed.`,
    },
    {
      priority: 'urgent',
      timeAnchor: 'BEFORE 1 OCTOBER',
      text: `Decide how you will respond to the ${shortfall} shortfall`,
      framework: buildRaoFramework({
        breakEvenPct,
        shortfall,
        psp,
      }),
      why: `The surcharge ban applies from 1 October regardless of your ${psp} plan. This part of your situation is certain.`,
    },
  ];

  if (qualifiesForItemisedQuote(psp, ctx.volume)) {
    actions.push({
      priority: 'plan',
      timeAnchor: 'BEFORE 1 AUGUST 2026',
      text: `Ask ${psp} for a quote on their itemised pricing plan`,
      script: `Request a quote on ${psp}'s interchange-plus pricing. At ${volume} annual volume, itemised pricing is typically available — and means future cost reductions flow through automatically.`,
      why: `August gives you enough lead time to switch plans cleanly before October. After that, the timing risk is too high.`,
    });
  } else {
    const fallback = buildItemisedFallbackAction(psp, ctx.volume);
    if (fallback) actions.push(fallback);
  }

  actions.push(buildMsfPublicationAction(psp));

  if (isBlended) {
    actions.push(
      {
        priority: 'plan',
        timeAnchor: 'BEFORE 1 AUGUST 2026',
        text: `Ask ${psp} for your full card mix breakdown — debit vs credit percentage`,
        why: `Your blended rate means the savings depend on your actual card mix. Knowing the split improves accuracy.`,
      },
      ...(qualifiesForItemisedQuote(psp, ctx.volume)
        ? [
            {
              priority: 'plan' as const,
              timeAnchor: 'BEFORE 1 AUGUST 2026',
              text: `Ask ${psp} for a quote on itemised (cost-plus) pricing`,
              why: `Blended pricing obscures the actual interchange cost. Itemised pricing makes future savings flow automatically.`,
            },
          ]
        : []),
    );
  }

  return actions;
}

// ── Category 5: zero-cost EFTPOS ────────────────────────────────
// Plan ends 1 October. Merchant moves from $0 net to flat-rate cost.

function buildCat5Actions(psp: string): ActionItem[] {
  return [
    {
      priority: 'urgent',
      timeAnchor: 'THIS WEEK',
      text: `Call ${psp} and ask what plan you will be transferred to`,
      script: `My zero-cost plan is built on the surcharge mechanism. When the surcharge ban takes effect on 1 October 2026, that mechanism ends. What plan will I be transferred to, and at what rate? I need a written quote before October.`,
      why: `Your zero-cost model cannot survive the surcharge ban. You need to know your post-reform rate now to plan cash flow.`,
    },
    {
      priority: 'urgent',
      timeAnchor: 'THIS WEEK',
      text: `Calculate your new monthly payment cost`,
      script: `Multiply your monthly card turnover by your expected post-reform rate (use 1.4% if you don't have a confirmed rate). This is your new monthly payment cost from 1 October. Build it into your cash flow now.`,
      why: `Going from $0 to a percentage-based fee is a material change. Cash flow planning needs to start immediately.`,
    },
    {
      priority: 'urgent',
      timeAnchor: 'BEFORE 1 AUGUST 2026',
      text: `Get quotes from at least two other payment providers`,
      script: `I am currently on zero-cost EFTPOS. What is your best rate for a merchant switching off that model?`,
      why: `Use ${psp}'s quote as your benchmark. Competition drives better rates.`,
    },
  ];
}
