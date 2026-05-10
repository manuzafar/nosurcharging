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
    <section className="bg-white">
      <div className="px-5 py-7 md:px-8 md:py-9">
        {/* Situation pill */}
        <span
          className="inline-block font-bold uppercase"
          style={{
            ...pillStyle,
            fontSize: '8.5px',
            letterSpacing: '0.5px',
            padding: '3px 9px',
            borderRadius: '4px',
            marginBottom: '14px',
          }}
        >
          Situation {category}
        </span>

        {/* Eyebrow */}
        <p
          style={{
            fontSize: '11px',
            color: 'var(--color-text-tertiary)',
            letterSpacing: '0.3px',
            marginBottom: '6px',
          }}
        >
          Estimated annual P&amp;L impact from October 2026
        </p>

        {/* P&L hero number */}
        <p
          className="font-mono font-bold leading-none"
          style={{
            fontSize: 'clamp(40px, 8vw, 48px)',
            color: pnlColor,
            letterSpacing: '-1.5px',
            marginBottom: '14px',
          }}
        >
          {formatSignedDollar(plSwing)}
        </p>

        {/* One-sentence verdict */}
        <h1
          className="font-serif"
          style={{
            fontSize: '20px',
            lineHeight: 1.4,
            color: 'var(--color-text-primary)',
            fontWeight: 500,
          }}
        >
          {CATEGORY_VERDICTS[category]}
        </h1>
      </div>
    </section>
  );
}
