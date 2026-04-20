'use client';

// 2x2 semantic metric grid — IC saving, P&L impact, Surcharge, Cost today.
// Values at 22px mono (text-financial-standard). Labels at 11px uppercase.

import type { AssessmentOutputs } from '@nosurcharging/calculations/types';

interface MetricCardsProps {
  outputs: AssessmentOutputs;
  planType?: 'flat' | 'costplus' | 'blended';
}

function formatDollar(v: number): string {
  return '$' + Math.abs(Math.round(v)).toLocaleString('en-AU');
}

function formatSignedDollar(v: number): string {
  if (v === 0) return '$0';
  return (v > 0 ? '+' : '−') + formatDollar(v);
}

export function MetricCards({ outputs, planType = 'flat' }: MetricCardsProps) {
  const hasSurcharge = outputs.surchargeRevenue > 0;
  const costLabel = planType === 'costplus' ? 'annual cost-plus' : 'annual flat rate';
  const costValue = planType === 'costplus' ? outputs.grossCOA : outputs.annualMSF;

  const cells: {
    label: string;
    value: string;
    sub: string;
    colour: string;
  }[] = [
    {
      label: 'Interchange saving',
      value: formatDollar(outputs.icSaving),
      sub: 'debit + credit',
      colour: 'var(--color-text-success)',
    },
    {
      label: 'Net P&L impact',
      value: formatSignedDollar(outputs.plSwing),
      sub: 'annual saving/shortfall',
      colour: outputs.plSwing >= 0 ? 'var(--color-text-success)' : 'var(--color-text-danger)',
    },
    {
      label: 'Surcharge revenue',
      value: hasSurcharge ? formatDollar(outputs.surchargeRevenue) : '—',
      sub: hasSurcharge ? 'lost from 1 Oct' : 'not applicable',
      colour: hasSurcharge ? 'var(--color-text-danger)' : 'var(--color-text-tertiary)',
    },
    {
      label: 'Your cost today',
      value: formatDollar(costValue),
      sub: costLabel,
      colour: 'var(--color-text-secondary)',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {cells.map((cell) => (
        <div
          key={cell.label}
          className="rounded-xl p-4 bg-white border border-rule"
        >
          <p
            className="uppercase"
            style={{
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '1.2px',
              color: 'var(--color-text-tertiary)',
            }}
          >
            {cell.label}
          </p>
          <p
            className="mt-1.5 font-mono font-medium text-financial-standard"
            style={{ color: cell.colour }}
          >
            {cell.value}
          </p>
          <p
            className="mt-0.5"
            style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}
          >
            {cell.sub}
          </p>
        </div>
      ))}
    </div>
  );
}
