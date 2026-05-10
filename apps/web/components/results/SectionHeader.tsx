'use client';

// SectionHeader — the editorial-treatment rhythm of the results page.
//
// Per docs/design/RESULTS_EDITORIAL_TREATMENT_BRIEF.md §"THE SECTION
// HEADER PATTERN": every editorial section opens with a 0.5px hairline
// rule + an eyebrow row (eyebrow on the left, optional meta on the
// right). Generous top padding above the rule + a measured 24px (18px
// mobile) bottom margin from the row to the first body element.
//
// Visual change is subtle on its own — the value compounds when the
// pattern repeats above every editorial section, giving the page a
// consistent vertical cadence the previous build lacked.

import type { ReactNode } from 'react';

interface SectionHeaderProps {
  eyebrow: string;
  meta?: ReactNode;
  // Override the meta colour token. Default is --color-text-tertiary.
  // Used by the Refine meta to reflect the live accuracy threshold.
  metaColor?: string;
}

export function SectionHeader({
  eyebrow,
  meta,
  metaColor,
}: SectionHeaderProps) {
  return (
    <div
      // 28px / 36px top padding sits above the hairline. Tailwind's
      // arbitrary `min-[501px]:` matches CLAUDE.md's "single breakpoint
      // at 500px" convention rather than the default `md:` (768px).
      className="px-5 min-[501px]:px-8 pt-7 min-[501px]:pt-9 mb-[18px] min-[501px]:mb-6"
    >
      <div
        style={{
          borderTopWidth: '0.5px',
          borderTopStyle: 'solid',
          borderTopColor: 'var(--color-border-secondary)',
          paddingTop: '14px',
        }}
        className="flex items-baseline justify-between gap-3"
      >
        <p
          className="uppercase"
          style={{
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.14em',
            color: 'var(--color-text-secondary)',
            margin: 0,
          }}
        >
          {eyebrow}
        </p>
        {meta && (
          <p
            className="font-mono shrink-0"
            style={{
              fontSize: '11px',
              fontWeight: 400,
              letterSpacing: '0.04em',
              color: metaColor ?? 'var(--color-text-tertiary)',
              margin: 0,
            }}
          >
            {meta}
          </p>
        )}
      </div>
    </div>
  );
}
