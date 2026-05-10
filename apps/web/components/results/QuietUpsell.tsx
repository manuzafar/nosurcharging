'use client';

// QuietUpsell — final-line invitation at the bottom of the results page.
//
// Per editorial M3 polish: the $149 Reform Ready Report mention is gone
// (the brand isn't ready to sell that SKU yet, and centre-page wedge
// upsells are handled in the ProblemsBlock framing already). What stays
// is a single quiet line offering a 30-minute call. The merchant has
// already absorbed the page; this is the soft close.

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
      cta_type: 'consulting_call',
      cta_location: 'quiet_upsell',
      category,
      pl_swing: plSwing,
      volume_tier: volumeTier,
      psp: pspName,
    });
  };

  return (
    <p
      className="px-5 min-[501px]:px-8"
      style={{
        fontSize: '13px',
        color: 'var(--color-text-tertiary)',
        lineHeight: 1.7,
      }}
    >
      Want a second opinion on your specific numbers?{' '}
      <a
        href={ctaUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="hover:opacity-80"
        style={{
          color: 'var(--color-accent)',
          fontWeight: 500,
          textDecoration: 'underline',
          textUnderlineOffset: '3px',
        }}
      >
        Book a 30-min call →
      </a>
    </p>
  );
}
