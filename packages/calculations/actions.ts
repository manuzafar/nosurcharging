// packages/calculations/actions.ts
// Builds the personalised action list for each category.
// PSP name is embedded inline ("Call Stripe and say...").
// Three urgency tiers: urgent (red), plan (amber), monitor (grey).

import type { ActionItem } from './types';

export function buildActions(
  category: 1 | 2 | 3 | 4,
  psp: string,
  industry: string,
): ActionItem[] {
  switch (category) {
    case 1:
      return buildCat1Actions(psp);
    case 2:
      return buildCat2Actions(psp);
    case 3:
      return buildCat3Actions(psp);
    case 4:
      return buildCat4Actions(psp);
  }
}

function buildCat1Actions(psp: string): ActionItem[] {
  return [
    {
      priority: 'plan',
      timeAnchor: 'Before August 2026',
      text: `Call ${psp} and say: "Interchange is falling on 1 October as part of the RBA reform. Can you confirm my cost-plus rate will reflect the new interchange caps automatically?"`,
    },
    {
      priority: 'monitor',
      timeAnchor: '30 October 2026',
      text: `Check the published MSF data when it drops. Compare your ${psp} rate against the market average.`,
    },
    {
      priority: 'monitor',
      timeAnchor: '30 January 2027',
      text: 'Review the RBA pass-through report to confirm the saving reached your account.',
    },
  ];
}

function buildCat2Actions(psp: string): ActionItem[] {
  return [
    {
      priority: 'urgent',
      timeAnchor: 'This week',
      text: `Call ${psp} and say: "Interchange is falling on 1 October as part of the RBA reform. Can you commit to passing that saving through to my rate — in writing? What will my new rate be from October?"`,
    },
    {
      priority: 'plan',
      timeAnchor: 'Before August 2026',
      text: `If ${psp} won't commit to passing through the saving, get quotes from two other providers on a cost-plus plan. The saving flows automatically on cost-plus.`,
    },
    {
      priority: 'monitor',
      timeAnchor: '30 October 2026',
      text: `Check the published MSF data. If ${psp} hasn't reduced your rate, use the benchmark to negotiate.`,
    },
    {
      priority: 'monitor',
      timeAnchor: '30 January 2027',
      text: `Review the RBA pass-through report. If ${psp} absorbed the saving, switch.`,
    },
  ];
}

function buildCat3Actions(psp: string): ActionItem[] {
  return [
    {
      priority: 'urgent',
      timeAnchor: 'This week',
      text: `Call ${psp} and say: "The surcharge ban takes effect 1 October. I need to understand exactly how my pricing changes. Can we schedule a rate review?"`,
    },
    {
      priority: 'urgent',
      timeAnchor: 'This week',
      text: 'Calculate your repricing gap: your lost surcharge revenue minus the IC saving. This is the shortfall you need to absorb or recover through pricing.',
    },
    {
      priority: 'plan',
      timeAnchor: 'Before August 2026',
      text: 'Adjust your product pricing to absorb the surcharge loss. Start communicating the change to customers now — don\'t wait until October.',
    },
    {
      priority: 'monitor',
      timeAnchor: '1 October 2026',
      text: 'Verify that surcharging has stopped on Visa, Mastercard, and eftpos. Amex and BNPL can still be surcharged.',
    },
  ];
}

function buildCat4Actions(psp: string): ActionItem[] {
  return [
    {
      priority: 'urgent',
      timeAnchor: 'This week',
      text: `Call ${psp} and say: "I'm losing surcharge revenue on 1 October AND I'm on a flat rate that may not pass through the IC saving. I need a rate review — can you move me to cost-plus or guarantee a rate reduction?"`,
    },
    {
      priority: 'urgent',
      timeAnchor: 'This week',
      text: 'Get quotes from two other providers on cost-plus plans. You face both the surcharge loss and the pass-through risk — cost-plus eliminates one of them.',
    },
    {
      priority: 'plan',
      timeAnchor: 'Before August 2026',
      text: 'Adjust your product pricing to absorb the surcharge loss. The earlier you communicate the change, the smoother the transition.',
    },
    {
      priority: 'plan',
      timeAnchor: 'Before October 2026',
      text: `If ${psp} won't commit to passing through the saving in writing, switch to a cost-plus provider before the reform date.`,
    },
    {
      priority: 'monitor',
      timeAnchor: '30 October 2026',
      text: 'Check the published MSF data to see where your rate sits against the market.',
    },
  ];
}
