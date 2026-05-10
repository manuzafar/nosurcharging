'use client';

// Hero block — Ruthless Cut M2.
//
// Per docs/design/RESULTS_RUTHLESS_CUT_BRIEF.md §2: situation pill,
// eyebrow, 44–48px monospace P&L number, one-sentence verdict.
// Nothing else competes.
//
// Body paragraph + context line + range/daily pills moved out:
//   • Body paragraph → ContextParagraph (sibling component, M2).
//   • Range + daily pills → PDF artifact (M3).
//   • Context line ("$3M card revenue · Stripe flat rate 1.4%") →
//     PDF cover "prepared for" line (M3).
//
// Banned phrasing: never "your PSP" or "your provider" — always
// inline psp.

import { CATEGORY_VERDICTS } from '@nosurcharging/calculations/categories';
import type { AssessmentOutputs } from '@nosurcharging/calculations/types';

interface VerdictSectionProps {
  outputs: AssessmentOutputs;
}

// Situation pill variants — kept here because ResultsTopBar imports
// them. Light bg + saturated text for legibility against white.
export const SITUATION_PILLS: Record<
  1 | 2 | 3 | 4 | 5,
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
  5: {
    background: 'var(--color-background-danger)',
    color: 'var(--color-text-danger)',
  },
};

function formatSignedDollar(value: number): string {
  if (value === 0) return '$0';
  return (
    (value > 0 ? '+' : '−') +
    '$' +
    Math.abs(Math.round(value)).toLocaleString('en-AU')
  );
}

export function VerdictSection({ outputs }: VerdictSectionProps) {
  const { category, plSwing } = outputs;
  const pillStyle = SITUATION_PILLS[category];

  // P&L hero number colour — red for net negative, em (green) for net
  // positive. Centre estimate (plSwing), not a range bound.
  const pnlColor =
    plSwing < 0
      ? 'var(--color-text-danger)'
      : plSwing > 0
        ? 'var(--color-text-success)'
        : 'var(--color-text-secondary)';

  return (
    // No card wrapper — editorial M2 drops the white container so the
    // hero floats against the paper background. Page padding lives on
    // this section directly so the eyebrow, P&L, and headline align
    // with every other editorial section's gutter.
    <section className="px-5 min-[501px]:px-8 pt-7 min-[501px]:pt-9 pb-7 min-[501px]:pb-9">
      {/* Situation pill */}
      <span
        className="inline-block uppercase"
        style={{
          ...pillStyle,
          fontSize: '8.5px',
          fontWeight: 500,
          letterSpacing: '0.5px',
          padding: '3px 9px',
          borderRadius: '4px',
          marginBottom: '28px',
        }}
      >
        Situation {category}
      </span>

      {/* Eyebrow */}
      <p
        className="uppercase"
        style={{
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.08em',
          color: 'var(--color-text-secondary)',
          marginBottom: '6px',
        }}
      >
        Estimated annual P&amp;L impact from October 2026
      </p>

      {/* P&L hero number — 64px desktop / 40px mobile (PB-5).
          Clamped fluidly with vw so it scales smoothly between. */}
      <p
        className="font-mono leading-none"
        style={{
          fontSize: 'clamp(40px, 8vw, 64px)',
          fontWeight: 500,
          color: pnlColor,
          letterSpacing: '-0.03em',
          marginBottom: '22px',
        }}
      >
        {formatSignedDollar(plSwing)}
      </p>

      {/* One-sentence verdict — serif headline.
          24px desktop / 19px mobile per editorial spec. Max-width 520px
          keeps the line measure tight on wide viewports so the verdict
          reads as a single thought rather than a banner. */}
      <h1
        className="font-serif"
        style={{
          fontSize: 'clamp(19px, 3.5vw, 24px)',
          lineHeight: 1.3,
          letterSpacing: '-0.01em',
          color: 'var(--color-text-primary)',
          fontWeight: 500,
          maxWidth: '520px',
          margin: 0,
        }}
      >
        {CATEGORY_VERDICTS[category]}
      </h1>
    </section>
  );
}
