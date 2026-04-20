'use client';

import type { AssessmentOutputs } from '@nosurcharging/calculations/types';

interface IfYouDoNothingProps {
  category: 1 | 2 | 3 | 4;
  outputs: AssessmentOutputs;
  pspName: string;
}

function formatDollar(value: number): string {
  return '$' + Math.abs(Math.round(value)).toLocaleString('en-AU');
}

interface GridItem {
  label: string;
  value: number;
  bgColor: string;
  borderColor: string;
}

export function IfYouDoNothing({ category, outputs, pspName }: IfYouDoNothingProps) {
  // Cat 1/2: brief reassurance
  if (category === 1 || category === 2) {
    return (
      <div className="mt-4">
        <div
          className="rounded-lg p-4"
          style={{
            background: '#F0FAF6',
            border: '1px solid #C6E7D9',
          }}
        >
          <p style={{ fontSize: '14px', color: '#2D7A5E' }}>
            {category === 1
              ? `Your cost-plus plan means IC savings flow automatically. If you do nothing, ${pspName} still passes through the lower rates.`
              : `The reform creates a saving, but your flat-rate plan means ${pspName} keeps it unless you negotiate. Doing nothing costs you the opportunity — not additional money.`}
          </p>
        </div>
      </div>
    );
  }

  // Cat 3/4: escalating cost grid
  const annual = Math.abs(outputs.plSwing);
  const items: GridItem[] = [
    {
      label: 'Daily',
      value: Math.round(annual / 365),
      bgColor: '#FFFBEB',
      borderColor: '#F59E0B',
    },
    {
      label: 'Weekly',
      value: Math.round(annual / 52),
      bgColor: '#FEF3C7',
      borderColor: '#D97706',
    },
    {
      label: 'Monthly',
      value: Math.round(annual / 12),
      bgColor: '#FEE2E2',
      borderColor: '#EF4444',
    },
    {
      label: 'Annual',
      value: annual,
      bgColor: '#FEE2E2',
      borderColor: '#DC2626',
    },
  ];

  return (
    <div className="mt-4">
      <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
        If you take no action before 1 October 2026, this is what the surcharge ban costs you.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-lg p-4 text-center"
            style={{
              background: item.bgColor,
              border: item.label === 'Annual' ? `2px solid ${item.borderColor}` : 'none',
            }}
          >
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
              {item.label}
            </p>
            <p className="font-mono" style={{ fontSize: item.label === 'Annual' ? '22px' : '18px', color: '#991B1B', fontWeight: 500 }}>
              {formatDollar(item.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Asymmetry callout */}
      <div
        className="mt-4 rounded-lg p-4"
        style={{
          background: 'var(--color-bg-secondary, #F5F3EF)',
          borderLeft: '3px solid var(--color-accent)',
        }}
      >
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          The surcharge ban removes your revenue instantly on 1 October. But {pspName} has no
          obligation to reduce your rates on the same date. The asymmetry works against you
          every day you wait.
        </p>
      </div>
    </div>
  );
}
