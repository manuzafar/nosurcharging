// PDF-only data — content that used to live in deleted on-page sections
// (NegotiationBrief, TalkToCustomers, IfYouDoNothing, YourOptions) and
// now appears only in the generated report.

export interface PSPContact {
  channel: string;
  instructions: string;
  hours?: string;
  phone?: string;
}

export const PSP_CONTACTS: Record<string, PSPContact> = {
  Stripe: {
    channel: 'Online dashboard + email',
    instructions:
      'Log in to dashboard.stripe.com, go to Support, select "Pricing" category.',
    hours: '24/7 online support',
  },
  Square: {
    channel: 'Phone + in-app',
    instructions: 'Call the support line or use the Square app help section.',
    hours: 'Mon-Fri 9am-5pm AEST',
    phone: '1800 760 137',
  },
  Tyro: {
    channel: 'Phone',
    instructions: 'Call Tyro merchant support directly.',
    hours: 'Mon-Fri 8am-10pm, Sat-Sun 9am-6pm AEST',
    phone: '1300 966 639',
  },
  CommBank: {
    channel: 'Phone + branch',
    instructions:
      'Call the merchant services line or visit your local branch.',
    hours: 'Mon-Fri 8am-6pm AEST',
    phone: '13 2221',
  },
  ANZ: {
    channel: 'Phone',
    instructions: 'Call ANZ merchant services.',
    hours: 'Mon-Fri 8am-8pm AEST',
    phone: '1800 039 025',
  },
  Westpac: {
    channel: 'Phone + online',
    instructions:
      'Call Westpac merchant services or log in to online banking.',
    hours: 'Mon-Fri 8am-8pm AEST',
    phone: '1800 029 749',
  },
  Zeller: {
    channel: 'Online + email',
    instructions: 'Log in to myzeller.com, select Support from the menu.',
    hours: '7am-9pm AEST, 7 days',
  },
  NAB: {
    channel: 'Phone',
    instructions: 'Call NAB merchant services.',
    hours: 'Mon-Fri 8am-8pm AEST',
    phone: '13 10 12',
  },
};

const GENERIC_CONTACT: PSPContact = {
  channel: 'Phone or email',
  instructions:
    'Contact your payment provider through whichever channel you usually use.',
};

export function getPspContact(pspName: string): PSPContact {
  return PSP_CONTACTS[pspName] ?? GENERIC_CONTACT;
}

// Customer-comms templates — Cat 3/4/5 use the surcharging-removal copy
// (the merchant is dropping a customer-facing surcharge); Cat 1/2 use
// the general reform-information copy.
export interface CustomerTemplate {
  title: string;
  body: string;
}

export function getCustomerTemplates(
  category: 1 | 2 | 3 | 4 | 5,
): CustomerTemplate[] {
  const isSurcharging = category === 3 || category === 4 || category === 5;

  const surchargeRemoval = isSurcharging
    ? `We're pleased to let you know that from 1 October 2026, we will no longer be adding a surcharge to Visa, Mastercard, and eftpos card payments. This follows new regulations by the Reserve Bank of Australia that ban surcharging on these networks.`
    : `From 1 October 2026, new Reserve Bank of Australia regulations will ban surcharging on Visa, Mastercard, and eftpos card payments across Australia.`;

  return [
    {
      title: 'Customer email',
      body: `Subject: Changes to card payment surcharging from October 2026

Dear valued customer,

${surchargeRemoval}

What this means for you:
${isSurcharging ? '- No more surcharge on your card payments at [YOUR BUSINESS]' : '- Card payment costs across Australia are changing'}
- Amex and BNPL surcharges are not affected by this change
- No action is required on your part

We remain committed to offering you transparent and fair pricing.

Kind regards,
[YOUR BUSINESS]`,
    },
    {
      title: 'Counter sign',
      body: `NOTICE TO CUSTOMERS

From 1 October 2026${isSurcharging ? ', we will no longer apply a surcharge on' : ', surcharging is banned on'} Visa, Mastercard, and eftpos card payments.

${isSurcharging ? 'Thank you for your patience — this saving is now yours.' : 'This is part of a nationwide reform by the Reserve Bank of Australia.'}

Amex and BNPL surcharges are not affected.

— [YOUR BUSINESS]`,
    },
    {
      title: 'Social media post',
      body: `${isSurcharging ? 'Great news!' : 'Starting October 2026,'} ${isSurcharging ? "From 1 October 2026, we're dropping surcharges on Visa, Mastercard, and eftpos payments." : 'surcharges on Visa, Mastercard, and eftpos payments will be banned across Australia.'}

${isSurcharging ? "Thanks to new RBA regulations, you'll pay the price you see — no extra fees on card payments." : 'This means fairer pricing for everyone paying by card.'}

Amex and BNPL surcharges are not affected by this change.

#nosurcharging #RBA #payments`,
    },
    {
      title: 'Staff briefing',
      body: `STAFF BRIEFING — Surcharge Ban (1 October 2026)

Key facts:
- From 1 October 2026, it is illegal to surcharge Visa, Mastercard, and eftpos
${isSurcharging ? '- Our POS/terminal settings will be updated to remove the surcharge' : '- This does not directly affect our current pricing'}
- Amex and BNPL are exempt — surcharging on these is still allowed

If a customer asks:
${isSurcharging ? '- "Yes, we\'re removing the surcharge on 1 October as required by the RBA"' : '- "We don\'t currently surcharge, so nothing changes for you"'}
- "Amex and BNPL surcharges are not affected"
- "This is a nationwide regulation, not just us"

Please direct any detailed questions to management.`,
    },
  ];
}

// Tension callouts — Cat 3/4 only. The on-page TensionSection was
// deleted in M1; the content moves here. Cat 5 has its own paragraph.
export interface TensionItem {
  direction: 'bad' | 'good';
  lead: string;
  body: string;
}

export function getTensionItems(
  category: 3 | 4,
  pspName: string,
): TensionItem[] {
  return [
    {
      direction: 'bad',
      lead: `If ${pspName} passes through less than 45% of their interchange saving,`,
      body: 'your actual October cost is higher than shown. The 45% is a market assumption — your contract may differ.',
    },
    {
      direction: 'bad',
      lead: 'If your card mix skews toward credit or corporate cards,',
      body: "your interchange saving is smaller. We've used a retail average — yours may be materially different.",
    },
    {
      direction: 'good',
      lead: 'There is still a negotiation window.',
      body: `${pspName} is fielding calls now. Merchants who call before August are getting better transition rates than those who wait.`,
    },
  ];
}

export function getCat5TensionBody(pspName: string, plSwingAbs: string): string {
  return `−${plSwingAbs} is estimated using a 1.4% market rate. Your actual post-reform rate depends entirely on what ${pspName} moves you to. We cannot calculate your real exposure without seeing your new plan in writing.`;
}
