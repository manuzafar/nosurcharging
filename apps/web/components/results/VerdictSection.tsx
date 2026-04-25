'use client';

// Results verdict — the first thing the merchant sees.
// Per ux-spec §3.2:
//   - Pill label is "SITUATION N" — 20px pill radius
//   - Range display: plSwingLow to plSwingHigh at clamp(24px, 7vw, 32px)
//   - Expected line: plSwing at text-financial-standard (22px)
//   - Old records without plSwingLow: single 44px number + "Complete a new assessment" note
//   - Daily anchor sentence: "That's $X more per day..."
//
// Banned phrasing: never "your PSP" or "your provider" — always the
// actual PSP name interpolated inline.

import { CATEGORY_VERDICTS } from '@nosurcharging/calculations/categories';
import type { AssessmentOutputs } from '@nosurcharging/calculations/types';

interface VerdictSectionProps {
  outputs: AssessmentOutputs;
  volume: number;
  pspName: string;
  planType: 'flat' | 'costplus' | 'blended';
  msfRate: number;
  surcharging: boolean;
  surchargeRate: number;
}

// Situation pill variants — 20px pill radius under the Modern Fintech Hierarchy
export const SITUATION_PILLS: Record<
  1 | 2 | 3 | 4,
  { background: string; color: string }
> = {
  1: {
    background: 'var(--color-background-success)',
    color: 'var(--color-text-success)',
  },
  2: {
    background: 'var(--color-background-warning)',
    color: 'var(--color-text-warning)',
  },
  3: {
    background: 'var(--color-background-danger)',
    color: 'var(--color-text-danger)',
  },
  4: {
    background: 'var(--color-background-danger)',
    color: 'var(--color-text-danger)',
  },
};

function formatDollar(value: number): string {
  return '$' + Math.round(Math.abs(value)).toLocaleString('en-AU');
}

function formatSignedDollar(value: number): string {
  if (value === 0) return '$0';
  return (value > 0 ? '+' : '−') + '$' + Math.abs(Math.round(value)).toLocaleString('en-AU');
}

// Format volume in human-readable form: $500K, $1.2M, $5M
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

function formatPct(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

function buildContextLine(
  volume: number,
  pspName: string,
  planType: 'flat' | 'costplus' | 'blended',
  msfRate: number,
  surcharging: boolean,
  surchargeRate: number,
): string {
  const parts: string[] = [`${formatVolumeShort(volume)} annual card revenue`];

  if (planType === 'flat') {
    parts.push(`${pspName} flat rate ${formatPct(msfRate)}`);
  } else if (planType === 'blended') {
    parts.push(`${pspName} blended rate`);
  } else {
    parts.push(`${pspName} cost-plus`);
  }

  if (surcharging) {
    parts.push(`surcharging ${formatPct(surchargeRate)}`);
  }

  return parts.join(' · ');
}

function getCategoryBody(category: 1 | 2 | 3 | 4, psp: string): string {
  const bodies: Record<1 | 2 | 3 | 4, string> = {
    1: `Your cost-plus plan means interchange savings flow to you automatically on 1 October. No action is needed to capture the saving — it will appear on your next ${psp} statement after the reform date. You should still verify this with ${psp} in writing before October.`,
    2: `The interchange saving exists, but whether you see it depends on ${psp}. On a flat rate, ${psp} could absorb the full saving and keep your rate unchanged. You need to ask them directly — and get it in writing — whether they will pass through the saving.`,
    3: `Your surcharge revenue on Visa, Mastercard, and eftpos disappears on 1 October. The interchange saving offsets only a fraction of that lost revenue. You need to reprice your products or services to absorb the shortfall, and renegotiate with ${psp}.`,
    4: `You face two challenges simultaneously: your surcharge revenue disappears, and your flat rate may not pass through the interchange saving. You need to act on both fronts — reprice to absorb the surcharge loss, and negotiate with ${psp} for rate transparency.`,
  };
  return bodies[category];
}

export function VerdictSection({
  outputs,
  volume,
  pspName,
  planType,
  msfRate,
  surcharging,
  surchargeRate,
}: VerdictSectionProps) {
  const { category, plSwing, plSwingLow, plSwingHigh, rangeDriver, rangeNote } = outputs;
  const isNegative = plSwing < 0;
  const isPositiveOrZero = plSwing >= 0;
  const pillStyle = SITUATION_PILLS[category];

  const contextLine = buildContextLine(
    volume,
    pspName,
    planType,
    msfRate,
    surcharging,
    surchargeRate,
  );

  // Daily anchor: spec §3.2 — Math.round(Math.abs(plSwing) / 365)
  const dailyAnchor = Math.round(Math.abs(plSwing) / 365);
  const dailyAnchorStrong = `$${dailyAnchor.toLocaleString('en-AU')} more per day`;
  const dailyAnchorTail = isPositiveOrZero
    ? ' in your pocket.'
    : ' in net payments cost.';

  // Range colour — uses the sign of plSwingLow to determine colour
  const rangeColour = (plSwingLow ?? plSwing) >= 0
    ? 'var(--color-text-success)'
    : 'var(--color-text-danger)';

  return (
    <div
      className="pt-8 pb-6"
      style={{ borderBottom: '1px solid var(--color-border-secondary)' }}
    >
      {/* Row 1: Situation pill + confidence note */}
      <div className="flex items-center">
        <span
          className="font-medium uppercase"
          style={{
            ...pillStyle,
            fontSize: '10px',
            letterSpacing: '1.5px',
            padding: '4px 10px',
            borderRadius: '20px',
          }}
        >
          Situation {category}
        </span>
        <span
          style={{
            fontSize: '11px',
            marginLeft: '8px',
            color: 'var(--color-text-tertiary)',
          }}
        >
          Estimated · RBA averages
        </span>
      </div>

      {/* Row 2: Category headline */}
      <h2
        className="mt-4 font-serif font-medium"
        style={{
          fontSize: '18px',
          lineHeight: '1.3',
          color: 'var(--color-text-primary)',
        }}
      >
        {CATEGORY_VERDICTS[category]}
      </h2>

      {/* Row 3: Range display or fallback single number */}
      {plSwingLow === undefined ? (
        // Old records without range — single 44px hero number
        <div>
          <p
            className="mt-3 font-mono text-financial-hero"
            style={{
              color: isNegative
                ? 'var(--color-text-danger)'
                : 'var(--color-text-success)',
              marginBottom: '6px',
              fontSize: 'clamp(26px, 7vw, 44px)',
            }}
          >
            {plSwing > 0 && '+'}
            {plSwing < 0 && '−'}
            {formatDollar(plSwing)}
          </p>
          <p
            style={{
              fontSize: '13px',
              color: 'var(--color-text-tertiary)',
              marginBottom: '8px',
            }}
          >
            per year, from 1 October 2026
          </p>
          <p className="mt-1 text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
            Complete a new assessment to see the full range.
          </p>
        </div>
      ) : (
        // Range display — overrides CLAUDE.md Rule 2 (44px) for the pair
        <div>
          <div className="mt-3">
            <p className="font-mono text-financial-hero" style={{ color: rangeColour, fontSize: 'clamp(26px, 7vw, 44px)' }}>
              {formatSignedDollar(plSwingLow)}
              <span className="font-sans mx-2" style={{ fontSize: '14px', color: 'var(--color-text-tertiary)' }}>
                to
              </span>
              {formatSignedDollar(plSwingHigh)}
            </p>
            <p className="mt-1 text-caption" style={{ color: 'var(--color-text-secondary)' }}>
              per year from 1 October 2026
            </p>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-2">
            <span className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>Expected:</span>
            <span
              className="font-mono text-body-sm font-medium"
              style={{ color: plSwing >= 0 ? 'var(--color-text-success)' : 'var(--color-text-danger)' }}
            >
              {formatSignedDollar(plSwing)}
            </span>
            <span className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
              {rangeDriver === 'pass_through'
                ? '— at 45% PSP pass-through (RBA market estimate)'
                : '— at estimated card mix'}
            </span>
          </div>

          <p className="mt-2 text-caption" style={{ color: 'var(--color-text-tertiary)', lineHeight: '1.55' }}>
            {rangeNote}
          </p>
        </div>
      )}

      {/* Daily anchor — §3.2 */}
      <p
        style={{
          fontSize: '15px',
          color: 'var(--color-text-secondary)',
          lineHeight: '1.6',
          marginTop: '8px',
          marginBottom: '8px',
        }}
      >
        That&apos;s{' '}
        <strong style={{ color: '#1A6B5A', fontWeight: 500 }}>
          {dailyAnchorStrong}
        </strong>
        {dailyAnchorTail}
      </p>

      {/* Context line — what inputs drove the number */}
      <p
        style={{
          fontSize: '11px',
          color: 'var(--color-text-tertiary)',
        }}
      >
        {contextLine}
      </p>

      {/* Body paragraph — category-specific narrative */}
      <p
        className="mt-4 text-body"
        style={{
          color: 'var(--color-text-secondary)',
          lineHeight: '1.65',
        }}
      >
        {getCategoryBody(category, pspName)}
      </p>

    </div>
  );
}
