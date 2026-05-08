// packages/calculations/actions.ts
// Builds the personalised action list for each category.
// Each action has:
//   - text   "what" — the instruction (e.g. "Ask [PSP] whether your rate...")
//   - script "verbatim words to say" — interpolated with [PSP], [$X], [rate]
//   - why    "explanation" — short context
// PSP name is embedded inline. Never "your PSP" or "your provider".
// Three urgency tiers: urgent (red), plan (amber), monitor (grey).
// Cat 4 copy is verbatim from docs/design/revamp-ux-spec.md §3.4.

import type { ActionContext, ActionItem } from './types';

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

// RAO framework — Recover / Absorb / Optimise. Cat 3 + Cat 4 share this
// script verbatim because the lever choice is the same; only the upstream
// shortfall differs. The script is intentionally option-presenting, not
// directive: it surfaces conditions on each path so the merchant can match
// their gross margin / competitive position to the right response.
//
// Multi-section script; relies on the ActionList blockquote rendering
// `whiteSpace: pre-wrap` so the section breaks survive.
function buildRaoFrameworkScript(args: {
  breakEvenPct: string;
  shortfall: string;
  psp: string;
}): string {
  const { breakEvenPct, shortfall, psp } = args;
  return `You have three ways to respond to this cost. The right approach depends on your gross margin and business type.

RECOVER through pricing
A ${breakEvenPct} increase across your card-paying revenue fully recovers ${shortfall}. Right if your gross margin is below 20% or your competitors face the same October change. Wrong if your customers are highly price-sensitive or you sell in a commoditised market.

ABSORB from margin
Viable if your gross margin is above 25% and this cost is less than 3-4% of your net profit. No customer communication needed. Confirm this is sustainable before choosing this path.

OPTIMISE the underlying cost
Complete the first action above before committing to anything else. Your actual October cost may be lower than this estimate once ${psp} confirms their post-October rate. Also check whether Least Cost Routing is active on your terminals — activating it costs nothing and may reduce this exposure.

Most businesses use a combination. Start with Action 1 above — ${psp}'s response determines how much of this shortfall actually needs to be recovered.`;
}

// ── Public entry point ───────────────────────────────────────────

export function buildActions(
  category: 1 | 2 | 3 | 4 | 5,
  psp: string,
  industry: string,
  ctx: ActionContext,
  planType?: 'flat' | 'costplus' | 'blended' | 'zero_cost',
): ActionItem[] {
  // industry reserved for Phase 2 industry-specific copy
  void industry;

  const isBlended = planType === 'blended';

  switch (category) {
    case 1:
      return buildCat1Actions(psp);
    case 2:
      return buildCat2Actions(psp, isBlended);
    case 3:
      return buildCat3Actions(psp, ctx);
    case 4:
      return buildCat4Actions(psp, ctx, isBlended);
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
    {
      priority: 'monitor',
      timeAnchor: '30 OCTOBER 2026',
      text: `Check the published merchant service fee benchmarks`,
      script: `From 30 October, ${psp} and other large processors must publish their average merchant service fees. Compare your blended cost directly against the published market average.`,
      why: `For the first time, you'll have independent data to confirm your cost-plus margin is in line with the market.`,
    },
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

function buildCat2Actions(psp: string, isBlended: boolean = false): ActionItem[] {
  const actions: ActionItem[] = [
    {
      priority: 'urgent',
      timeAnchor: 'BEFORE 1 OCTOBER',
      text: `Ask ${psp} whether your rate will change after October`,
      script: `From 1 October, the RBA's new interchange caps take effect — wholesale interchange that ${psp} pays falls. I'd like to understand whether my ${psp} flat rate will be adjusted to reflect that change — and by how much. Can you confirm in writing?`,
      why: `Flat rate adjustments aren't automatic. Written confirmation now means you'll know what to expect — and have time to act if needed.`,
    },
    {
      priority: 'plan',
      timeAnchor: 'BEFORE 1 AUGUST 2026',
      text: `Ask ${psp} for a quote on their itemised pricing plan`,
      script: `Request a quote on ${psp}'s interchange-plus pricing. I'd like to compare it against my current flat rate, with the RBA's October interchange cuts factored in.`,
      why: `On itemised pricing, future cost reductions flow through automatically — no rate review required. August gives you enough lead time to switch cleanly before October.`,
    },
    {
      priority: 'monitor',
      timeAnchor: '30 OCTOBER 2026',
      text: `Check the published rate benchmarks on 30 October`,
      script: `From 30 October, ${psp} and other large processors must publish their average merchant service fees. Compare your rate directly against the published market average.`,
      why: `For the first time, you'll have independent data to see whether your ${psp} rate is in line with the market.`,
    },
  ];

  if (isBlended) {
    actions.push(
      {
        priority: 'plan',
        timeAnchor: 'BEFORE 1 AUGUST 2026',
        text: `Ask ${psp} for your full card mix breakdown — debit vs credit percentage`,
        why: `Your blended rate means the savings depend on your actual card mix. Knowing the split improves accuracy.`,
      },
      {
        priority: 'plan',
        timeAnchor: 'BEFORE 1 AUGUST 2026',
        text: `Ask ${psp} for a quote on itemised (cost-plus) pricing`,
        why: `Blended pricing obscures the actual interchange cost. Itemised pricing makes future savings flow automatically.`,
      },
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
      script: buildRaoFrameworkScript({
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
      why: `Continuing to surcharge a designated network after 1 October exposes you to ACCC penalties. Verification is non-negotiable.`,
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
      script: buildRaoFrameworkScript({
        breakEvenPct,
        shortfall,
        psp,
      }),
      why: `The surcharge ban applies from 1 October regardless of your ${psp} plan. This part of your situation is certain.`,
    },
    {
      priority: 'plan',
      timeAnchor: 'BEFORE 1 AUGUST 2026',
      text: `Ask ${psp} for a quote on their itemised pricing plan`,
      script: `Request a quote on ${psp}'s interchange-plus pricing. At ${volume} annual volume, itemised pricing is typically available — and means future cost reductions flow through automatically.`,
      why: `August gives you enough lead time to switch plans cleanly before October. After that, the timing risk is too high.`,
    },
    {
      priority: 'monitor',
      timeAnchor: '30 OCTOBER 2026',
      text: `Check the published rate benchmarks on 30 October`,
      script: `From 30 October, ${psp} and other large processors must publish their average merchant service fees. Compare your rate directly against the published market average.`,
      why: `For the first time, you'll have independent data to see whether your ${psp} rate is in line with the market.`,
    },
  ];

  if (isBlended) {
    actions.push(
      {
        priority: 'plan',
        timeAnchor: 'BEFORE 1 AUGUST 2026',
        text: `Ask ${psp} for your full card mix breakdown — debit vs credit percentage`,
        why: `Your blended rate means the savings depend on your actual card mix. Knowing the split improves accuracy.`,
      },
      {
        priority: 'plan',
        timeAnchor: 'BEFORE 1 AUGUST 2026',
        text: `Ask ${psp} for a quote on itemised (cost-plus) pricing`,
        why: `Blended pricing obscures the actual interchange cost. Itemised pricing makes future savings flow automatically.`,
      },
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
