'use client';

// Results verdict — the first thing the merchant sees.
// P&L swing hero number: 44px monospace, green/red.
// Category pill + confidence chip + headline + body.

import { PillBadge } from '@/components/ui/PillBadge';
import { CATEGORY_VERDICTS } from '@nosurcharging/calculations/categories';
import type { AssessmentOutputs } from '@nosurcharging/calculations/types';

interface VerdictSectionProps {
  outputs: AssessmentOutputs;
  volume: number;
  pspName: string;
}

const CATEGORY_PILLS: Record<1 | 2 | 3 | 4, { variant: 'green' | 'accent' | 'red'; label: string }> = {
  1: { variant: 'green', label: 'Category 1' },
  2: { variant: 'accent', label: 'Category 2' },
  3: { variant: 'red', label: 'Category 3' },
  4: { variant: 'red', label: 'Category 4' },
};

const CONFIDENCE_LABELS: Record<string, string> = {
  high: 'High confidence — your rates used',
  medium: 'Estimated — partial RBA averages',
  low: 'Estimated — RBA averages used',
};

function getCategoryBody(category: 1 | 2 | 3 | 4, psp: string): string {
  const bodies: Record<1 | 2 | 3 | 4, string> = {
    1: `Your cost-plus plan means interchange savings flow to you automatically on 1 October. No action is needed to capture the saving — it will appear on your next ${psp} statement after the reform date. You should still verify this with ${psp} in writing before October.`,
    2: `The interchange saving exists, but whether you see it depends on ${psp}. On a flat rate, ${psp} could absorb the full saving and keep your rate unchanged. You need to ask them directly — and get it in writing — whether they will pass through the saving.`,
    3: `Your surcharge revenue on Visa, Mastercard, and eftpos disappears on 1 October. The interchange saving offsets only a fraction of that lost revenue. You need to reprice your products or services to absorb the shortfall, and renegotiate with ${psp}.`,
    4: `You face two challenges simultaneously: your surcharge revenue disappears, and your flat rate may not pass through the interchange saving. You need to act on both fronts — reprice to absorb the surcharge loss, and negotiate with ${psp} for rate transparency.`,
  };
  return bodies[category];
}

export function VerdictSection({ outputs, volume, pspName }: VerdictSectionProps) {
  const { category, plSwing, confidence } = outputs;
  const isPositive = plSwing >= 0;
  const pill = CATEGORY_PILLS[category];
  const volumeInMillions = (volume / 1_000_000).toFixed(1);

  const formattedSwing = '$' + Math.abs(plSwing).toLocaleString('en-AU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return (
    <div className="py-7">
      {/* Row 1: Category pill + confidence chip */}
      <div className="flex items-center justify-between">
        <PillBadge variant={pill.variant}>{pill.label}</PillBadge>
        <span
          className="text-label"
          style={{
            background: 'var(--color-background-secondary)',
            color: 'var(--color-text-secondary)',
            padding: '3px 10px',
            borderRadius: '12px',
            fontSize: '11px',
          }}
        >
          {CONFIDENCE_LABELS[confidence] ?? CONFIDENCE_LABELS.low}
        </span>
      </div>

      {/* Row 2: Category headline */}
      <h2
        className="mt-4 font-serif font-medium"
        style={{ fontSize: '18px', lineHeight: '1.3', color: 'var(--color-text-primary)' }}
      >
        {CATEGORY_VERDICTS[category]}
      </h2>

      {/* Row 3: P&L swing hero number — 44px mono */}
      <p
        className="mt-3 font-mono text-financial-hero"
        style={{ color: isPositive ? 'var(--color-text-success)' : 'var(--color-text-danger)' }}
      >
        {isPositive ? '+' : '-'}{formattedSwing}
      </p>

      {/* Row 4: Direction label */}
      <p className="mt-1 text-body-sm" style={{ color: 'var(--color-text-secondary)' }}>
        {isPositive ? 'annual saving' : 'annual increase in payments cost'}
      </p>

      {/* Row 5: Context line */}
      <p className="mt-1 text-caption" style={{ color: 'var(--color-text-secondary)' }}>
        across ${volumeInMillions}m in annual card revenue
      </p>

      {/* Row 6: Body paragraph */}
      <p
        className="mt-4 text-body-sm"
        style={{ color: 'var(--color-text-secondary)', lineHeight: '1.65' }}
      >
        {getCategoryBody(category, pspName)}
      </p>
    </div>
  );
}
