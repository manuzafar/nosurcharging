'use client';

import { forwardRef } from 'react';
import type { AssessmentOutputs } from '@nosurcharging/calculations/types';

interface NegotiationBriefProps {
  pspName: string;
  planType: 'flat' | 'costplus' | 'blended' | 'zero_cost';
  volume: number;
  category: 1 | 2 | 3 | 4 | 5;
  outputs: AssessmentOutputs;
}

interface PSPContact {
  channel: string;
  instructions: string;
  hours?: string;
  phone?: string;
}

// TODO: Verify PSP contact details before launch
const PSP_CONTACTS: Record<string, PSPContact> = {
  Stripe: {
    channel: 'Online dashboard + email',
    instructions: 'Log in to dashboard.stripe.com, go to Support, select "Pricing" category',
    hours: '24/7 online support',
  },
  Square: {
    channel: 'Phone + in-app',
    instructions: 'Call the support line or use the Square app help section',
    hours: 'Mon-Fri 9am-5pm AEST',
    phone: '1800 760 137',
  },
  Tyro: {
    channel: 'Phone',
    instructions: 'Call Tyro merchant support directly',
    hours: 'Mon-Fri 8am-10pm, Sat-Sun 9am-6pm AEST',
    phone: '1300 966 639',
  },
  CommBank: {
    channel: 'Phone + branch',
    instructions: 'Call the merchant services line or visit your local branch',
    hours: 'Mon-Fri 8am-6pm AEST',
    phone: '13 2221',
  },
  ANZ: {
    channel: 'Phone',
    instructions: 'Call ANZ merchant services',
    hours: 'Mon-Fri 8am-8pm AEST',
    phone: '1800 039 025',
  },
  Westpac: {
    channel: 'Phone + online',
    instructions: 'Call Westpac merchant services or log in to online banking',
    hours: 'Mon-Fri 8am-8pm AEST',
    phone: '1800 029 749',
  },
  Zeller: {
    channel: 'Online + email',
    instructions: 'Log in to myzeller.com, select Support from the menu',
    hours: 'Mon-Fri 9am-6pm AEST',
  },
  eWAY: {
    channel: 'Phone + email',
    instructions: 'Call eWAY support or email merchant support',
    hours: 'Mon-Fri 9am-5pm AEST',
    phone: '1300 429 292',
  },
  Adyen: {
    channel: 'Online portal',
    instructions: 'Log in to your Adyen Customer Area and create a support ticket',
    hours: '24/7 online support',
  },
};

function getContact(pspName: string): PSPContact {
  return PSP_CONTACTS[pspName] ?? {
    channel: 'Phone or email',
    instructions: 'Contact your payment provider\'s merchant support team directly',
  };
}

function formatDollar(value: number): string {
  return '$' + Math.abs(Math.round(value)).toLocaleString('en-AU');
}

function formatVolume(v: number): string {
  if (v >= 1_000_000) return '$' + (v / 1_000_000).toFixed(1) + 'm';
  if (v >= 1_000) return '$' + Math.round(v / 1_000) + 'k';
  return '$' + v;
}

const ALT_PSPS = [
  { name: 'Stripe', type: 'Online/omnichannel', strength: 'Developer-friendly, transparent pricing' },
  { name: 'Square', type: 'In-person/retail', strength: 'Simple setup, no lock-in contracts' },
  { name: 'Tyro', type: 'Hospitality/retail', strength: 'Australian-owned, competitive IC+ pricing' },
  { name: 'Zeller', type: 'SME/retail', strength: 'No lock-in, fast settlement' },
];

export const NegotiationBrief = forwardRef<HTMLElement, NegotiationBriefProps>(
  function NegotiationBrief({ pspName, planType, volume, category, outputs }, ref) {
    const contact = getContact(pspName);
    const planLabel =
      planType === 'costplus' ? 'cost-plus (IC+)'
      : planType === 'blended' ? 'blended'
      : planType === 'zero_cost' ? 'zero-cost EFTPOS'
      : 'flat rate';

    const scriptText = category === 5
      ? `"I process ${formatVolume(volume)} annually on ${pspName}'s zero-cost EFTPOS plan. The surcharge mechanism that covers my card costs ends on 1 October when the RBA's surcharge ban takes effect. Which plan will I be transferred to, and what will my effective rate be? I need a written quote before October so I can plan cash flow and compare alternatives."`
      : `"I process ${formatVolume(volume)} annually on a ${planLabel} plan with ${pspName}. With the RBA's interchange cuts taking effect on 1 October, I'd like to understand how my rates will change. Can you confirm whether the IC reduction will be passed through to me, and what my new effective rate will be?"`;

    return (
      <section id="negotiate" data-section="negotiate" ref={ref} className="pt-8">
        <p
          className="text-micro uppercase tracking-widest pb-3 mb-6"
          style={{
            color: 'var(--color-text-tertiary)',
            letterSpacing: '1.5px',
            fontSize: '11px',
            borderBottom: '1px solid var(--color-border-secondary)',
          }}
        >
          Negotiation brief
        </p>

        <div className="bg-white border border-rule rounded-xl p-6">
          {/* PSP contact card */}
          <div
            className="rounded-lg p-4 mb-5"
            style={{
              background: '#F0FAF6',
              border: '1px solid #C6E7D9',
            }}
          >
            <p style={{ fontSize: '14px', color: '#2D7A5E', fontWeight: 500, marginBottom: '8px' }}>
              {pspName} contact
            </p>
            <div className="flex flex-col gap-1" style={{ fontSize: '13px', color: '#2D7A5E' }}>
              <span><strong>Channel:</strong> {contact.channel}</span>
              <span><strong>How:</strong> {contact.instructions}</span>
              {contact.hours && <span><strong>Hours:</strong> {contact.hours}</span>}
              {contact.phone && (
                <span><strong>Phone:</strong> <span className="font-mono">{contact.phone}</span></span>
              )}
            </div>
          </div>

          {/* 5 steps */}
          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              <span className="font-mono shrink-0" style={{ fontSize: '13px', color: 'var(--color-accent)', fontWeight: 500 }}>1.</span>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Gather your current statement showing your effective rate and monthly volume.
              </p>
            </div>

            <div className="flex gap-3">
              <span className="font-mono shrink-0" style={{ fontSize: '13px', color: 'var(--color-accent)', fontWeight: 500 }}>2.</span>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Call {pspName} using the contact details above. Ask to speak with the pricing or retention team.
              </p>
            </div>

            <div className="flex gap-3">
              <span className="font-mono shrink-0" style={{ fontSize: '13px', color: 'var(--color-accent)', fontWeight: 500 }}>3.</span>
              <div>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                  Use this script:
                </p>
                <blockquote
                  className="rounded-lg p-4"
                  style={{
                    borderLeft: '3px solid var(--color-accent)',
                    background: 'var(--color-bg-secondary, #F5F3EF)',
                    fontSize: '13px',
                    color: 'var(--color-text-primary)',
                    lineHeight: '1.6',
                    margin: 0,
                  }}
                >
                  {scriptText}
                </blockquote>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="font-mono shrink-0" style={{ fontSize: '13px', color: 'var(--color-accent)', fontWeight: 500 }}>4.</span>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Ask for the new rate in writing. Compare it against the RBA benchmark data (available from 30 October 2026).
              </p>
            </div>

            <div className="flex gap-3">
              <span className="font-mono shrink-0" style={{ fontSize: '13px', color: 'var(--color-accent)', fontWeight: 500 }}>5.</span>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                If the offer isn&apos;t competitive, mention you&apos;re comparing alternatives. Most PSPs have retention offers.
              </p>
            </div>
          </div>

          {/* If PSP says no */}
          <div className="mt-6">
            <p style={{ fontSize: '14px', color: 'var(--color-text-primary)', fontWeight: 500, marginBottom: '12px' }}>
              If {pspName} says no
            </p>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
              Consider switching to a cost-plus (IC+) provider. These alternatives pass through interchange savings automatically:
            </p>

            <div className="overflow-x-auto">
              <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border-secondary)' }}>
                    <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--color-text-tertiary)', fontWeight: 500, fontSize: '12px' }}>Provider</th>
                    <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--color-text-tertiary)', fontWeight: 500, fontSize: '12px' }}>Best for</th>
                    <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--color-text-tertiary)', fontWeight: 500, fontSize: '12px' }}>Strength</th>
                  </tr>
                </thead>
                <tbody>
                  {ALT_PSPS
                    .filter((p) => p.name !== pspName)
                    .map((p) => (
                      <tr key={p.name} style={{ borderBottom: '1px solid var(--color-border-secondary)' }}>
                        <td style={{ padding: '8px 12px', color: 'var(--color-text-primary)', fontWeight: 500 }}>{p.name}</td>
                        <td style={{ padding: '8px 12px', color: 'var(--color-text-secondary)' }}>{p.type}</td>
                        <td style={{ padding: '8px 12px', color: 'var(--color-text-secondary)' }}>{p.strength}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    );
  },
);
