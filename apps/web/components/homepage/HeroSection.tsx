// Homepage hero — full-bleed dark section.
// Not in a card. Background: var(--color-text-primary).
// Amber kicker, serif headline, amber CTA, trust bar.

import Link from 'next/link';

export function HeroSection() {
  return (
    <section
      className="flex flex-col items-center text-center"
      style={{
        background: 'var(--color-text-primary)',
        padding: '56px 28px',
      }}
    >
      {/* Kicker */}
      <p
        className="font-medium"
        style={{
          fontSize: '11px',
          letterSpacing: '2.5px',
          color: '#EF9F27',
        }}
      >
        RBA OCTOBER 2026 REFORM
      </p>

      {/* Headline */}
      <h1
        className="mt-4 font-serif font-medium"
        style={{
          fontSize: '32px',
          lineHeight: '1.22',
          color: 'var(--color-background-primary)',
          maxWidth: '520px',
        }}
      >
        The RBA banned surcharges.
        <br />
        Find out what it means for your P&L.
      </h1>

      {/* Sub */}
      <p
        className="mt-4"
        style={{
          fontSize: '14px',
          lineHeight: '1.65',
          color: 'var(--color-background-secondary)',
          maxWidth: '360px',
        }}
      >
        Four questions. Under five minutes. A personalised action plan
        with your PSP name, exact dates, and dollar impact.
      </p>

      {/* CTA button */}
      <Link
        href="/assessment"
        className="mt-6 inline-block rounded-lg font-medium transition-opacity duration-150 hover:opacity-90"
        style={{
          background: '#BA7517',
          color: '#FAEEDA',
          padding: '13px 34px',
          fontSize: '13px',
        }}
      >
        Start free assessment
      </Link>

      {/* Trust bar */}
      <div
        className="mt-6 flex flex-wrap items-center justify-center gap-3 pt-5"
        style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)' }}
      >
        {[
          'Based on RBA Conclusions Paper, March 2026',
          'No account required',
          'No PSP affiliation',
        ].map((text, i) => (
          <span
            key={i}
            className="flex items-center gap-3"
            style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}
          >
            {i > 0 && <span>·</span>}
            {text}
          </span>
        ))}
      </div>
    </section>
  );
}
