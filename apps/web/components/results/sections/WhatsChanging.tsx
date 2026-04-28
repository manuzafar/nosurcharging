'use client';

import type { AssessmentOutputs } from '@nosurcharging/calculations/types';

interface WhatsChangingProps {
  category: 1 | 2 | 3 | 4 | 5;
  outputs: AssessmentOutputs;
  pspName: string;
}

function formatDollar(value: number): string {
  return '$' + Math.abs(Math.round(value)).toLocaleString('en-AU');
}

function getDependsBody(category: 1 | 2 | 3 | 4 | 5, pspName: string): string {
  switch (category) {
    case 1:
      return `Your cost-plus plan means the IC saving flows automatically. ${pspName} passes through the lower interchange rates — no action needed on your part.`;
    case 2:
      return `Your flat-rate plan means ${pspName} keeps the IC saving unless you negotiate. The saving exists, but whether you receive it depends on your conversation with ${pspName}.`;
    case 3:
      return `Your cost-plus plan means the IC saving flows automatically, which partially offsets your surcharge revenue loss. Contact ${pspName} to discuss your options.`;
    case 4:
      return `Your flat-rate plan means ${pspName} keeps the IC saving unless you negotiate. Combined with losing surcharge revenue, your position depends entirely on what ${pspName} offers.`;
    case 5:
      return `Zero-cost EFTPOS ends. ${pspName} moves you to a flat-rate plan, so the IC saving stays with ${pspName} during the transition. Get the post-October rate in writing this week.`;
  }
}

export function WhatsChanging({ category, outputs, pspName }: WhatsChangingProps) {
  const isSurcharging = category === 3 || category === 4;
  const isZeroCost = category === 5;

  return (
    <div className="mt-4">
      {/* Two-column cards */}
      <div className="grid grid-cols-1 gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {/* CERTAIN card */}
        <div
          className="rounded-lg p-4"
          style={{
            background: 'var(--color-bg-secondary, #F5F3EF)',
            borderLeft: '3px solid var(--color-text-danger, #C53030)',
          }}
        >
          <p
            className="uppercase tracking-widest mb-2"
            style={{ fontSize: '11px', color: 'var(--color-text-danger, #C53030)', fontWeight: 500, letterSpacing: '1px' }}
          >
            Certain
          </p>
          <p style={{ fontSize: '14px', color: 'var(--color-text-primary)', fontWeight: 500, marginBottom: '8px' }}>
            Surcharge ban
          </p>
          {isZeroCost ? (
            <>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                The PSP-mediated surcharge that covers your card costs ends on 1 October 2026 for Visa, Mastercard, and eftpos.
              </p>
              <p className="font-mono" style={{ fontSize: '18px', color: 'var(--color-text-danger, #C53030)', fontWeight: 500 }}>
                −{formatDollar(outputs.octNet)}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                annual cost from October ({pspName} flat rate)
              </p>
            </>
          ) : isSurcharging ? (
            <>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                Your surcharge revenue on Visa, Mastercard, and eftpos disappears on 1 October 2026.
              </p>
              <p className="font-mono" style={{ fontSize: '18px', color: 'var(--color-text-danger, #C53030)', fontWeight: 500 }}>
                −{formatDollar(outputs.surchargeRevenue)}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                annual surcharge revenue lost
              </p>
            </>
          ) : (
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Not applicable — you don&apos;t currently surcharge designated networks.
            </p>
          )}
        </div>

        {/* DEPENDS card */}
        <div
          className="rounded-lg p-4"
          style={{
            background: 'var(--color-bg-secondary, #F5F3EF)',
            borderLeft: '3px solid var(--color-accent)',
          }}
        >
          <p
            className="uppercase tracking-widest mb-2"
            style={{ fontSize: '11px', color: 'var(--color-accent)', fontWeight: 500, letterSpacing: '1px' }}
          >
            Depends
          </p>
          <p style={{ fontSize: '14px', color: 'var(--color-text-primary)', fontWeight: 500, marginBottom: '8px' }}>
            IC pass-through
          </p>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
            {getDependsBody(category, pspName)}
          </p>
          <p className="font-mono" style={{ fontSize: '18px', color: '#4B9E7E', fontWeight: 500 }}>
            {formatDollar(outputs.icSaving)}
          </p>
          <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
            potential annual IC saving
          </p>
        </div>
      </div>

      {/* What's NOT changing strip */}
      <div
        className="mt-4 rounded-lg p-3 flex items-center gap-2"
        style={{
          background: 'var(--color-bg-secondary, #F5F3EF)',
          border: '1px solid var(--color-border-secondary)',
        }}
      >
        <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>
          Not changing:
        </span>
        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
          Amex, BNPL, and PayPal remain surchargeable after the reform.
        </span>
      </div>
    </div>
  );
}
