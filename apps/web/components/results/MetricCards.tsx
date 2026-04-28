'use client';

// 2x2 semantic metric grid — IC saving, P&L impact, Surcharge, Cost today.
// Values at 22px mono (text-financial-standard). Labels at 11px uppercase.
//
// Category 5 (zero_cost) renders a different cell set:
//   Cost today ($0) · Annual cost from October · Estimated card rate · Card volume
// icSaving is hidden for Cat 5 (the saving is kept by the PSP, not the
// merchant — showing it would create false-positive framing). It is still
// computed in outputs and rendered in AssumptionsPanel for transparency.

import type { AssessmentOutputs } from '@nosurcharging/calculations/types';

interface MetricCardsProps {
  outputs: AssessmentOutputs;
  planType?: 'flat' | 'costplus' | 'blended' | 'zero_cost';
  // Cat 5 only — sourced from the assessment inputs by the parent.
  volume?: number;
  // Cat 5 only — "Your input" | "Market estimate" — read from resolutionTrace by parent.
  estimatedMSFRateLabel?: string;
}

function formatDollar(v: number): string {
  return '$' + Math.abs(Math.round(v)).toLocaleString('en-AU');
}

function formatSignedDollar(v: number): string {
  if (v === 0) return '$0';
  return (v > 0 ? '+' : '−') + formatDollar(v);
}

function formatVolumeShort(volume: number): string {
  if (volume >= 1_000_000) {
    const m = volume / 1_000_000;
    const formatted = m >= 10 ? m.toFixed(0) : m.toFixed(1);
    return `$${formatted}M`;
  }
  if (volume >= 1_000) {
    return `$${Math.round(volume / 1_000)}K`;
  }
  return formatDollar(volume);
}

function formatPct(rate: number, digits = 1): string {
  return `${(rate * 100).toFixed(digits)}%`;
}

export function MetricCards({
  outputs,
  planType = 'flat',
  volume,
  estimatedMSFRateLabel,
}: MetricCardsProps) {
  const isZeroCost = outputs.category === 5 || planType === 'zero_cost';

  const cells: {
    label: string;
    value: string;
    sub: string;
    colour: string;
  }[] = isZeroCost
    ? (() => {
        const rate = outputs.estimatedMSFRate ?? 0.014;
        return [
          {
            label: 'Your cost today',
            value: '$0',
            sub: 'fully covered by PSP surcharge',
            colour: 'var(--color-text-success)',
          },
          {
            label: 'Annual cost from October',
            value: formatDollar(outputs.octNet),
            sub: `estimated at ${formatPct(rate)}`,
            colour: 'var(--color-text-danger)',
          },
          {
            label: 'Estimated card rate',
            value: formatPct(rate),
            sub: estimatedMSFRateLabel ?? 'market estimate',
            colour: 'var(--color-text-secondary)',
          },
          {
            label: 'Card volume',
            value: formatVolumeShort(volume ?? 0),
            sub: 'annual card turnover',
            colour: 'var(--color-text-secondary)',
          },
        ];
      })()
    : (() => {
        const hasSurcharge = outputs.surchargeRevenue > 0;
        const costLabel = planType === 'costplus' ? 'annual cost-plus' : 'annual flat rate';
        const costValue = planType === 'costplus' ? outputs.grossCOA : outputs.annualMSF;
        return [
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
      })();

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
            style={{ color: cell.colour, fontSize: 'clamp(14px, 4.5vw, 22px)' }}
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
