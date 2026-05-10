'use client';

// QuietUpsell — Section 9 of the new linear results page.
//
// Per docs/design/RESULTS_RUTHLESS_CUT_BRIEF.md §9: a single-line link
// to the Reform Ready Report at $149. Replaces the dark $149 card from
// PR #38 — the brief calls out that the centre-page upsell has done its
// work in the TensionSection / ProblemsBlock framing already, and this
// final-line mention is the appropriate close.

import { Analytics } from '@/lib/analytics';

interface QuietUpsellProps {
  category: 1 | 2 | 3 | 4 | 5;
  pspName: string;
  plSwing?: number;
  volumeTier?: string;
}

export function QuietUpsell({
  category,
  pspName,
  plSwing,
  volumeTier,
}: QuietUpsellProps) {
  const ctaUrl = process.env.NEXT_PUBLIC_CALENDLY_URL ?? '#';

  const handleClick = () => {
    Analytics.ctaClicked({
      cta_type: 'reform_ready_report',
      cta_location: 'quiet_upsell',
      category,
      pl_swing: plSwing,
      volume_tier: volumeTier,
      psp: pspName,
    });
  };

  return (
    <p
      className="px-5 md:px-8"
      style={{
        fontSize: '12px',
        color: 'var(--color-text-tertiary)',
        lineHeight: 1.7,
      }}
    >
      Want your real numbers, not market averages? The{' '}
      <a
        href={ctaUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="hover:opacity-80 underline"
        style={{
          color: 'var(--color-accent)',
          fontWeight: 600,
          textUnderlineOffset: '2px',
        }}
      >
        Reform Ready Report
      </a>{' '}
      analyses your statements and builds the negotiation script with your
      figures —{' '}
      <span className="font-mono" style={{ fontWeight: 600 }}>
        $149
      </span>
      .
    </p>
  );
}
