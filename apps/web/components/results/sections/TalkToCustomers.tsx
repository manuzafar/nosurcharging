'use client';

import { forwardRef, useState } from 'react';
import { SubTabStrip } from '@/components/results/SubTabStrip';

interface TalkToCustomersProps {
  category: 1 | 2 | 3 | 4;
  pspName: string;
}

const TEMPLATE_TABS = [
  { key: 'email', label: 'Customer email' },
  { key: 'counter', label: 'Counter sign' },
  { key: 'social', label: 'Social media' },
  { key: 'staff', label: 'Staff briefing' },
];

function getTemplates(category: 1 | 2 | 3 | 4, pspName: string): Record<string, string> {
  const isSurcharging = category === 3 || category === 4;

  const surchargeRemoval = isSurcharging
    ? `We're pleased to let you know that from 1 October 2026, we will no longer be adding a surcharge to Visa, Mastercard, and eftpos card payments. This follows new regulations by the Reserve Bank of Australia that ban surcharging on these networks.`
    : `From 1 October 2026, new Reserve Bank of Australia regulations will ban surcharging on Visa, Mastercard, and eftpos card payments across Australia.`;

  return {
    email: `Subject: Changes to card payment surcharging from October 2026

Dear valued customer,

${surchargeRemoval}

What this means for you:
${isSurcharging ? '- No more surcharge on your card payments at [YOUR BUSINESS]' : '- Card payment costs across Australia are changing'}
- Amex and BNPL surcharges are not affected by this change
- No action is required on your part

We remain committed to offering you transparent and fair pricing.

If you have any questions, please don't hesitate to contact us.

Kind regards,
[YOUR BUSINESS]`,

    counter: `NOTICE TO CUSTOMERS

From 1 October 2026${isSurcharging ? ', we will no longer apply a surcharge on' : ', surcharging is banned on'} Visa, Mastercard, and eftpos card payments.

${isSurcharging ? 'Thank you for your patience — this saving is now yours.' : 'This is part of a nationwide reform by the Reserve Bank of Australia.'}

Amex and BNPL surcharges are not affected.

— [YOUR BUSINESS]`,

    social: `${isSurcharging ? 'Great news!' : 'Starting October 2026,'} ${isSurcharging ? 'From 1 October 2026, we\'re dropping surcharges on Visa, Mastercard, and eftpos payments.' : 'surcharges on Visa, Mastercard, and eftpos payments will be banned across Australia.'}

${isSurcharging ? 'Thanks to new RBA regulations, you\'ll pay the price you see — no extra fees on card payments.' : 'This means fairer pricing for everyone paying by card.'}

Amex and BNPL surcharges are not affected by this change.

#nosurcharging #RBA #payments`,

    staff: `STAFF BRIEFING — Surcharge Ban (1 October 2026)

Key facts:
- From 1 October 2026, it is illegal to surcharge Visa, Mastercard, and eftpos
${isSurcharging ? '- Our POS/terminal settings will be updated to remove the surcharge' : '- This does not directly affect our current pricing'}
- Amex and BNPL are exempt — surcharging on these is still allowed
- Our payment provider is ${pspName}

If a customer asks:
${isSurcharging ? '- "Yes, we\'re removing the surcharge on 1 October as required by the RBA"' : '- "We don\'t currently surcharge, so nothing changes for you"'}
- "Amex and BNPL surcharges are not affected"
- "This is a nationwide regulation, not just us"

Please direct any detailed questions to management.`,
  };
}

export const TalkToCustomers = forwardRef<HTMLElement, TalkToCustomersProps>(
  function TalkToCustomers({ category, pspName }, ref) {
    const [activeTab, setActiveTab] = useState('email');
    const [copied, setCopied] = useState(false);

    const templates = getTemplates(category, pspName);
    const currentTemplate = templates[activeTab] ?? '';

    const handleCopy = async () => {
      await navigator.clipboard.writeText(currentTemplate);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <section id="customers" data-section="customers" ref={ref} className="pt-8">
        <p
          className="text-micro uppercase tracking-widest pb-3 mb-6"
          style={{
            color: 'var(--color-text-tertiary)',
            letterSpacing: '1.5px',
            fontSize: '11px',
            borderBottom: '1px solid var(--color-border-secondary)',
          }}
        >
          Talk to customers
        </p>

        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
          Ready-made templates to communicate the surcharge changes to your customers.
        </p>

        <SubTabStrip tabs={TEMPLATE_TABS} activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="bg-white border border-rule rounded-xl p-6 mt-4">
          <div
            className="rounded-lg p-4"
            style={{
              background: 'var(--color-bg-secondary, #F5F3EF)',
              border: '1px solid var(--color-border-secondary)',
              whiteSpace: 'pre-wrap',
              fontSize: '13px',
              lineHeight: '1.6',
              color: 'var(--color-text-primary)',
            }}
          >
            {currentTemplate}
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="mt-3 cursor-pointer rounded-lg"
            style={{
              fontSize: '13px',
              padding: '8px 16px',
              background: copied ? '#4B9E7E' : 'var(--color-accent)',
              color: '#FFFFFF',
              border: 'none',
              transition: 'background 150ms ease',
            }}
          >
            {copied ? 'Copied!' : 'Copy to clipboard'}
          </button>
        </div>
      </section>
    );
  },
);
