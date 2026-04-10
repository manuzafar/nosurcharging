// Homepage hero — light paper canvas (was dark in legacy version).
// Eyebrow badge with pulsing accent dot, italic "Your" headline,
// solid accent CTA with offset outline, three-tick proof row.
// ux-spec §1.3.

import Link from 'next/link';

const PROOF_ROW = [
  'No account required',
  'No Stripe or Square affiliation',
  'Under five minutes',
] as const;

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
        className="mt-5 max-w-[420px] text-ink-secondary"
        style={{ fontSize: '15px', lineHeight: '1.6' }}
      >
        The RBA is banning surcharges in October. Find out exactly what it
        costs your business — in dollars, with Stripe named directly.
      </p>

      {/* Primary CTA — pill shape under the Modern Fintech Hierarchy. The
          offset outline still works: the `outline` property respects
          `border-radius` in modern browsers (Chrome 94+, Firefox 88+,
          Safari 16.4+), so the amber double-ring traces the pill shape. */}
      <Link
        href="/assessment"
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
        Generate my free report →
      </Link>

      {/* Proof row */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        {PROOF_ROW.map((item) => (
          <span
            key={item}
            className="flex items-center gap-1.5 text-[12px] text-ink-faint"
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 11 11"
              fill="none"
              aria-hidden
              className="shrink-0"
            >
              <path
                d="M2.5 5.5L4.5 7.5L8.5 3.5"
                stroke="#166534"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}
