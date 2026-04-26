// Homepage hero — light paper canvas (was dark in legacy version).
// Eyebrow badge with pulsing accent dot, italic "Your" headline,
// solid accent CTA with offset outline, three-tick proof row.
// ux-spec §1.3.

import Link from 'next/link';

type ProofIcon = 'target' | 'shield' | 'zap';

const PROOF_ROW: ReadonlyArray<{ text: string; icon: ProofIcon }> = [
  { text: 'Personalised to your PSP and plan', icon: 'target' },
  { text: 'Independent — no PSP affiliation', icon: 'shield' },
  { text: 'No account required', icon: 'zap' },
] as const;

// Lucide-style outlines, 14px, currentColor stroke so they inherit the text colour.
function ProofIcon({ name }: { name: ProofIcon }) {
  const common = {
    width: 14,
    height: 14,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    className: 'shrink-0',
  };
  if (name === 'target') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    );
  }
  if (name === 'shield') {
    return (
      <svg {...common}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    );
  }
  // zap
  return (
    <svg {...common}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

export function HeroSection() {
  return (
    <section
      className="flex flex-col items-center border-b border-rule bg-paper px-5 text-center"
      style={{ paddingTop: '72px', paddingBottom: '60px' }}
    >
      {/* Eyebrow badge */}
      <span className="inline-flex items-center gap-2 rounded-full border border-accent-border bg-accent-light px-3 py-1">
        <span
          aria-hidden
          className="h-1.5 w-1.5 animate-pulse rounded-full"
          style={{ background: '#1A6B5A' }}
        />
        <span className="text-[10px] font-medium uppercase tracking-[1.8px] text-accent">
          RBA Surcharge Ban · 1 October 2026
        </span>
      </span>

      {/* Headline — italic "Your" is the signature element */}
      <h1
        className="mt-7 max-w-[540px] font-serif text-ink"
        style={{
          fontSize: '40px',
          lineHeight: '1.08',
          letterSpacing: '-1.5px',
          fontWeight: 500,
        }}
      >
        <span className="italic text-accent">Your</span> payments report.
        <br />
        Free. In five minutes.
      </h1>

      {/* Subheadline */}
      <p
        className="mt-5 max-w-[420px] text-left text-ink-secondary"
        style={{ fontSize: '15px', lineHeight: '1.6' }}
      >
        Find out what the October ban costs your business, with your payment
        provider named directly. Personalised P&amp;L impact, negotiation
        script, and week-by-week action plan.
      </p>

      {/* Primary CTA — pill shape under the Modern Fintech Hierarchy. The
          offset outline still works: the `outline` property respects
          `border-radius` in modern browsers (Chrome 94+, Firefox 88+,
          Safari 16.4+), so the amber double-ring traces the pill shape. */}
      <Link
        href="/assessment"
        data-cta="hero"
        className="mt-9 inline-block bg-accent text-white transition-opacity duration-150 hover:opacity-90 focus-visible:opacity-90"
        style={{
          fontSize: '14px',
          fontWeight: 500,
          padding: '14px 32px',
          outline: '3px solid #1A6B5A',
          outlineOffset: '2px',
          borderRadius: '9999px',
        }}
      >
        Get my free report →
      </Link>

      {/* Proof row — per-item icons in stronger ink-secondary, 13px medium */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        {PROOF_ROW.map((item) => (
          <span
            key={item.text}
            className="flex items-center gap-2 text-[13px] font-medium text-ink-secondary"
          >
            <ProofIcon name={item.icon} />
            {item.text}
          </span>
        ))}
      </div>
    </section>
  );
}
