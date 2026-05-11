// "What you'll receive" — simplified dark 2-column layout per
// HOMEPAGE_REDESIGN_BRIEF.md Section 5. Replaces the previous
// auto-cycling 5-panel scrollytelling mock (deleted in M2).
//
// Left column: eyebrow + 36px serif headline with italic emerald accent
// + sample-merchant annotation + four numbered features (existing copy
// preserved) + primary CTA.
//
// Right column: static product-UI mini-preview — `#2D2418` outer frame
// with three browser-style dots, paper-bg inner showing a sample result
// page (brand row + situation pill + big P&L figure + verdict + 4-card
// 2×2 metric grid). Brief Section 5 example: "$3M hospitality,
// CommBank cost-plus, currently surcharging at 2.5%" → Cat 3.

import Link from 'next/link';

const FEATURES = [
  { num: '01', title: 'Your exact P&L impact', desc: 'Dollar figure, not a percentage.' },
  { num: '02', title: 'Prioritised action plan', desc: 'URGENT / PLAN / MONITOR with deadlines.' },
  { num: '03', title: 'Your PSP negotiation script', desc: 'Exact words. Contact details.' },
  { num: '04', title: 'Customer communication', desc: 'Email, counter sign, social.' },
] as const;

export function PreviewSection() {
  return (
    <section
      style={{
        background: '#1A1409',
        padding: 'clamp(48px, 7vw, 64px) clamp(18px, 3vw, 28px)',
      }}
    >
      <div className="mx-auto" style={{ maxWidth: '880px' }}>
        <div
          className="grid grid-cols-1 lg:grid-cols-[380px_1fr]"
          style={{ gap: 'clamp(32px, 4vw, 48px)' }}
        >
          {/* ── Left column: copy + features + CTA ─────────────── */}
          <div>
            <p
              className="font-mono uppercase"
              style={{
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '1.4px',
                color: '#5DCAA5',
              }}
            >
              What you&apos;ll receive
            </p>
            <h2
              className="mt-3 font-serif"
              style={{
                fontSize: 'clamp(28px, 4.5vw, 36px)',
                fontWeight: 500,
                letterSpacing: '-0.015em',
                lineHeight: 1.1,
                color: 'rgba(255,255,255,0.95)',
              }}
            >
              <em className="italic" style={{ color: '#5DCAA5' }}>
                A complete
              </em>{' '}
              reform report. In four questions.
            </h2>
            <p
              className="mt-3"
              style={{
                fontSize: 'clamp(13px, 1.5vw, 14px)',
                lineHeight: 1.6,
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              Sample shown — $3M hospitality, CommBank cost-plus,
              currently surcharging at 2.5%.
            </p>

            <ul className="mt-6 flex flex-col" style={{ gap: '14px' }}>
              {FEATURES.map((f) => (
                <li key={f.num} className="flex items-start" style={{ gap: '14px' }}>
                  <span
                    className="font-mono shrink-0"
                    style={{
                      fontSize: '12px',
                      fontWeight: 500,
                      letterSpacing: '1px',
                      color: '#5DCAA5',
                      paddingTop: '2px',
                    }}
                  >
                    {f.num}
                  </span>
                  <div>
                    <p
                      className="font-medium"
                      style={{
                        fontSize: '14px',
                        lineHeight: 1.4,
                        color: 'rgba(255,255,255,0.95)',
                      }}
                    >
                      {f.title}
                    </p>
                    <p
                      style={{
                        fontSize: '12px',
                        lineHeight: 1.55,
                        color: 'rgba(255,255,255,0.55)',
                        marginTop: '2px',
                      }}
                    >
                      {f.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <Link
              href="/assessment"
              data-cta="what-you-receive"
              className="mt-8 inline-flex items-center bg-accent text-white transition-opacity duration-150 hover:opacity-90"
              style={{
                fontSize: '14px',
                fontWeight: 500,
                padding: '12px 24px',
                borderRadius: '9999px',
                gap: '6px',
              }}
            >
              Start my free report <span aria-hidden>→</span>
            </Link>
          </div>

          {/* ── Right column: product UI mini-preview ──────────── */}
          <ProductPreview />
        </div>
      </div>
    </section>
  );
}

// ── Static product-UI mini-preview ────────────────────────────────
// Sample scenario: $3M hospitality, CommBank cost-plus, currently
// surcharging at 2.5%. Internal Cat 3 outcome — surcharge revenue
// disappears 1 October. Pure presentational SVG/HTML — no live data.

function ProductPreview() {
  return (
    <div
      className="rounded-2xl"
      style={{
        background: '#2D2418',
        padding: '14px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
      }}
    >
      {/* Browser-style chrome dots */}
      <div className="flex items-center" style={{ gap: '6px', marginBottom: '12px' }}>
        {['#5E544A', '#3F3729', '#3F3729'].map((bg, i) => (
          <span
            key={i}
            aria-hidden
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: bg,
            }}
          />
        ))}
      </div>

      {/* Paper-bg inner panel showing a stripped-down result page */}
      <div
        className="rounded-xl"
        style={{
          background: '#FAF7F2',
          padding: '20px',
        }}
      >
        {/* Brand row */}
        <div
          className="flex items-center justify-between"
          style={{ borderBottom: '0.5px solid rgba(26,20,9,0.08)', paddingBottom: '12px' }}
        >
          <span className="font-serif font-medium" style={{ fontSize: '13px', color: '#1A1409' }}>
            no<span className="italic text-accent">surcharging</span>
            <span style={{ color: 'rgba(26,20,9,0.5)', fontSize: '11px' }}>.com.au</span>
          </span>
          <span
            className="font-mono uppercase"
            style={{
              fontSize: '9px',
              fontWeight: 500,
              letterSpacing: '1px',
              padding: '2px 6px',
              borderRadius: '3px',
              background: '#FDF2F2',
              color: 'var(--color-text-danger)',
              border: '0.5px solid rgba(191,53,53,0.35)',
            }}
          >
            Situation 3
          </span>
        </div>

        {/* P&L hero */}
        <p
          className="font-mono uppercase"
          style={{
            fontSize: '9px',
            letterSpacing: '1.2px',
            color: 'rgba(26,20,9,0.5)',
            marginTop: '14px',
          }}
        >
          Estimated annual impact
        </p>
        <p
          className="font-mono"
          style={{
            fontSize: '32px',
            fontWeight: 500,
            letterSpacing: '-0.6px',
            color: 'var(--color-text-danger)',
            marginTop: '2px',
            lineHeight: 1,
          }}
        >
          −$48,750
        </p>
        <p
          className="font-serif"
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: '#1A1409',
            marginTop: '8px',
            lineHeight: 1.35,
          }}
        >
          Your surcharge revenue disappears on 1 October.
        </p>

        {/* 2×2 mini metric grid */}
        <div
          className="mt-4 grid grid-cols-2"
          style={{ gap: '8px' }}
        >
          {[
            { label: 'Surcharge revenue today', value: '$52,500', tone: 'neutral' },
            { label: 'IC saving auto-flows', value: '+$3,750', tone: 'success' },
            { label: 'Net P&L impact', value: '−$48,750', tone: 'danger' },
            { label: 'Action items', value: '6', tone: 'neutral' },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-lg"
              style={{
                background: 'var(--color-background-primary)',
                border: '0.5px solid var(--color-border-tertiary)',
                padding: '10px 12px',
              }}
            >
              <p
                className="font-mono uppercase"
                style={{
                  fontSize: '8px',
                  letterSpacing: '0.8px',
                  color: 'rgba(26,20,9,0.5)',
                }}
              >
                {m.label}
              </p>
              <p
                className="font-mono"
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  marginTop: '2px',
                  color:
                    m.tone === 'success'
                      ? 'var(--color-text-success)'
                      : m.tone === 'danger'
                        ? 'var(--color-text-danger)'
                        : '#1A1409',
                }}
              >
                {m.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
