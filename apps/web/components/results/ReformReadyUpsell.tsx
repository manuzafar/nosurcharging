'use client';

// ReformReadyUpsell — $149 statement-analysis upsell. Replaces the
// per-category ConsultingCTA in HelpSection per the Results_V2 redesign.
//
// Strategic role: monetises the gap between the centre-estimate P&L
// and the merchant's actual exposure surfaced in TensionSection. The
// $149 SKU promises to convert market-average inputs into the
// merchant's real numbers from their statement.
//
// The legacy $2,500 / $3,500 ConsultingCTA is no longer rendered
// from HelpSection. The CTA_CONFIG SKU map keeps those entries —
// they may resurface in Phase 2 work — but they are not wired in
// from this redesign PR.

import { Analytics } from '@/lib/analytics';

interface ReformReadyUpsellProps {
  category: 1 | 2 | 3 | 4 | 5;
  pspName: string;
  plSwing?: number;
  volumeTier?: string;
}

export function ReformReadyUpsell({
  category,
  pspName,
  plSwing,
  volumeTier,
}: ReformReadyUpsellProps) {
  // Re-uses the existing Calendly URL slot — Phase 1 does not yet have
  // a $149 product checkout, so the CTA opens the same booking link
  // and the call is used to qualify and take payment manually.
  const ctaUrl = process.env.NEXT_PUBLIC_CALENDLY_URL ?? '#';

  const handleClick = () => {
    Analytics.ctaClicked({
      cta_type: 'reform_ready_report',
      cta_location: 'help_section',
      category,
      pl_swing: plSwing,
      volume_tier: volumeTier,
      psp: pspName,
    });
  };

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: '#1A1409',
        borderRadius: '14px',
        padding: '24px',
      }}
    >
      {/* Decorative gradient — top right corner */}
      <span
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          top: 0,
          right: 0,
          width: '250px',
          height: '250px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(26,107,90,0.3) 0%, transparent 70%)',
          transform: 'translate(30%, -30%)',
        }}
      />

      {/* Top row — badge left, price right. Stacks on mobile so the
          headline below is never squeezed under the floated price. */}
      <div
        className="relative flex flex-col-reverse md:flex-row md:items-start md:justify-between gap-3 md:gap-4"
        style={{ marginBottom: '14px' }}
      >
        <span
          className="self-start uppercase font-bold"
          style={{
            background: 'rgba(114, 196, 176, 0.15)',
            border: '0.5px solid var(--color-accent-border)',
            color: 'var(--color-accent-border)',
            fontSize: '8.5px',
            fontWeight: 700,
            letterSpacing: '1.5px',
            padding: '3px 10px',
            borderRadius: '100px',
          }}
        >
          Your actual number — not a market estimate
        </span>
        <div className="text-left md:text-right shrink-0">
          <p
            style={{
              fontSize: '10px',
              color: 'rgba(255, 255, 255, 0.35)',
              marginBottom: '2px',
            }}
          >
            Reform Ready Report
          </p>
          <p
            className="font-mono font-bold"
            style={{
              fontSize: '28px',
              color: '#FFFFFF',
              lineHeight: 1,
            }}
          >
            $149
          </p>
        </div>
      </div>

      {/* Headline */}
      <h3
        className="font-serif font-bold relative"
        style={{
          fontSize: '18px',
          color: '#FFFFFF',
          lineHeight: 1.3,
          marginBottom: '6px',
          maxWidth: '380px',
          letterSpacing: '-0.2px',
        }}
      >
        Statement analysis that tells you exactly what to say.
      </h3>

      {/* Sub */}
      <p
        className="relative"
        style={{
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.5)',
          marginBottom: '18px',
          lineHeight: 1.7,
          maxWidth: '380px',
        }}
      >
        Upload 3 months of merchant statements. We calculate your real
        effective rate, actual card mix, and build your negotiation script
        with your specific numbers — not industry averages.
      </p>

      {/* Features */}
      <ul
        className="relative flex flex-col list-none p-0"
        style={{ gap: '7px', marginBottom: '20px' }}
      >
        <Feature>
          <strong>Real effective rate</strong> — not the published rate on
          {' '}
          {pspName}&apos;s site
        </Feature>
        <Feature>
          <strong>Actual card mix</strong> — debit vs credit vs corporate, and
          your real interchange saving
        </Feature>
        <Feature>
          <strong>Full action plan</strong> with your specific figures, not
          market averages
        </Feature>
        <Feature>
          <strong>Negotiation script</strong> — word for word, with your
          exact numbers as leverage
        </Feature>
        <Feature>
          <strong>30-minute walkthrough call</strong>
        </Feature>
      </ul>

      {/* CTA */}
      <a
        href={ctaUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="inline-block font-bold relative transition-opacity duration-150 hover:opacity-90"
        style={{
          background: 'var(--color-accent)',
          color: '#FFFFFF',
          fontSize: '13px',
          padding: '11px 24px',
          borderRadius: '100px',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Get my Reform Ready Report — $149 →
      </a>
    </div>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start" style={{ gap: '8px' }}>
      <span
        className="flex items-center justify-center shrink-0"
        aria-hidden
        style={{
          width: '15px',
          height: '15px',
          borderRadius: '50%',
          background: 'rgba(26, 107, 90, 0.3)',
          border: '0.5px solid var(--color-accent)',
          color: 'var(--color-accent-border)',
          fontSize: '7px',
          marginTop: '2px',
        }}
      >
        ✓
      </span>
      <span
        style={{
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.65)',
          lineHeight: 1.5,
        }}
      >
        {children}
      </span>
    </li>
  );
}
