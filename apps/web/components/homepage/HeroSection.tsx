'use client';

// Homepage hero — radical rework per HOMEPAGE_REDESIGN_BRIEF.md (M1).
// Display-scale serif headline (58px desktop / 36px mobile) with italic
// emerald accent on "Your", pulse-dot eyebrow showing the surcharge-ban
// date + dynamic days-remaining, two-CTA row, mono trust row, and an
// embedded live calculator card with six quick-pick volume chips.
//
// The calculator uses a six-value lookup table — not the full
// calculation engine. Assumption documented in the footer: "typical
// flat-rate merchant surcharging at 1.5%, retail industry."
// $2M → −$24,400 matches the brief example exactly; the other five
// values scale linearly off that anchor (−$12,200 per $1M).

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Target, ShieldCheck, UserX } from 'lucide-react';

const RBA_REFORM_DATE = new Date('2026-10-01T00:00:00+10:00').getTime();

interface VolumeBracket {
  label: string;
  volume: number;
  impact: number; // P&L impact (negative = cost increase)
  volumeDisplay: string;
}

// Linear scaling off the brief's anchor: $2M → −$24,400 = −$12.20 per $1.
// Flat-rate + currently surcharging at 1.5% on designated networks.
const VOLUME_BRACKETS: ReadonlyArray<VolumeBracket> = [
  { label: '$500K',  volume: 500_000,     volumeDisplay: '$500,000',    impact: -6_100 },
  { label: '$1M',    volume: 1_000_000,   volumeDisplay: '$1,000,000',  impact: -12_200 },
  { label: '$2M',    volume: 2_000_000,   volumeDisplay: '$2,000,000',  impact: -24_400 },
  { label: '$5M',    volume: 5_000_000,   volumeDisplay: '$5,000,000',  impact: -61_000 },
  { label: '$10M',   volume: 10_000_000,  volumeDisplay: '$10,000,000', impact: -122_000 },
  { label: '$20M+',  volume: 20_000_000,  volumeDisplay: '$20,000,000', impact: -244_000 },
] as const;

const DEFAULT_BRACKET_INDEX = 2; // $2M

function daysUntil(target: number): number {
  return Math.max(0, Math.floor((target - Date.now()) / (1000 * 60 * 60 * 24)));
}

function formatImpact(impact: number): string {
  const abs = Math.abs(impact).toLocaleString('en-AU');
  return impact < 0 ? `−$${abs}` : `+$${abs}`;
}

export function HeroSection() {
  const [bracketIndex, setBracketIndex] = useState(DEFAULT_BRACKET_INDEX);
  // Compute once on render — no live tick needed (TrustBar handles the
  // second-by-second countdown below the hero).
  const daysRemaining = useMemo(() => daysUntil(RBA_REFORM_DATE), []);
  // Non-null assertion is safe: bracketIndex is a controlled internal
  // state value that only ever moves between valid VOLUME_BRACKETS
  // indices via the chip click handler below.
  const bracket = VOLUME_BRACKETS[bracketIndex]!;

  return (
    <section className="border-b border-rule bg-paper">
      <div
        className="mx-auto px-5"
        style={{ maxWidth: '880px', padding: 'clamp(40px, 7vw, 64px) clamp(18px, 3vw, 28px)' }}
      >
        {/* ── Eyebrow row ──────────────────────────────────────── */}
        <div className="flex flex-wrap items-center" style={{ gap: '12px' }}>
          <span
            className="inline-flex items-center"
            style={{
              gap: '8px',
              padding: '4px 12px',
              borderRadius: '999px',
              border: '0.5px solid #72C4B0',
              background: 'var(--color-background-primary)',
            }}
          >
            <span
              aria-hidden
              className="pulse-soft"
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#1A6B5A',
              }}
            />
            <span
              className="font-mono uppercase"
              style={{
                fontSize: '10px',
                fontWeight: 500,
                letterSpacing: '1.4px',
                color: '#1A6B5A',
              }}
            >
              Surcharge ban · 1 October 2026
            </span>
          </span>
          <span
            className="font-mono"
            style={{
              fontSize: '11px',
              letterSpacing: '0.4px',
              color: 'var(--color-text-secondary)',
            }}
          >
            {daysRemaining} days remaining
          </span>
        </div>

        {/* ── Headline ────────────────────────────────────────── */}
        <h1
          className="mt-7 font-serif text-ink"
          style={{
            fontSize: 'clamp(36px, 7.5vw, 58px)',
            fontWeight: 500,
            letterSpacing: '-0.025em',
            lineHeight: 0.98,
          }}
        >
          <em className="italic text-accent" style={{ fontStyle: 'italic' }}>
            Your
          </em>{' '}
          payments report.
          <br />
          Free. In five minutes.
        </h1>

        {/* ── Subhead ─────────────────────────────────────────── */}
        <p
          className="mt-6 text-ink-secondary"
          style={{
            fontSize: 'clamp(14px, 1.6vw, 16px)',
            lineHeight: 1.6,
            maxWidth: '520px',
          }}
        >
          Find out what the October ban costs your business — with your
          payment provider named directly. Personalised P&amp;L impact,
          negotiation script, and week-by-week action plan.
        </p>

        {/* ── Actions row ─────────────────────────────────────── */}
        <div className="mt-8 flex flex-wrap items-center" style={{ gap: '14px' }}>
          <Link
            href="/assessment"
            data-cta="hero"
            className="inline-flex items-center bg-accent text-white transition-opacity duration-150 hover:opacity-90 focus-visible:opacity-90"
            style={{
              fontSize: '15px',
              fontWeight: 500,
              padding: '14px 28px',
              borderRadius: '9999px',
              gap: '6px',
            }}
          >
            Start my free report <span aria-hidden>→</span>
          </Link>
          <a
            href="#samples"
            data-cta="hero-secondary"
            className="inline-flex items-center text-ink transition-opacity duration-150 hover:opacity-70"
            style={{
              fontSize: '14px',
              fontWeight: 500,
              gap: '4px',
            }}
          >
            See sample report <span aria-hidden>↓</span>
          </a>
        </div>

        {/* ── Trust row ───────────────────────────────────────── */}
        <div className="mt-8 flex flex-wrap items-center" style={{ gap: '18px' }}>
          {[
            { icon: Target, label: 'Personalised to your PSP' },
            { icon: ShieldCheck, label: 'Independent' },
            { icon: UserX, label: 'No account required' },
          ].map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="font-mono inline-flex items-center"
              style={{
                fontSize: '11px',
                gap: '6px',
                color: 'var(--color-text-secondary)',
                letterSpacing: '0.4px',
              }}
            >
              <Icon size={14} strokeWidth={1.6} aria-hidden />
              {label}
            </span>
          ))}
        </div>

        {/* ── Live calculator card ────────────────────────────── */}
        <div
          className="mt-10 rounded-2xl"
          style={{
            border: '0.5px solid var(--color-border-tertiary)',
            background: 'var(--color-background-primary)',
            padding: 'clamp(20px, 2.5vw, 24px)',
            boxShadow: '0 1px 2px rgba(26,20,9,0.04)',
          }}
        >
          {/* Card eyebrow */}
          <div className="flex items-center justify-between" style={{ gap: '12px' }}>
            <span
              className="font-mono uppercase"
              style={{
                fontSize: '10px',
                fontWeight: 500,
                letterSpacing: '1.4px',
                color: '#1A6B5A',
              }}
            >
              Quick estimate · tap a band
            </span>
            <span
              className="inline-flex items-center font-mono uppercase"
              style={{
                fontSize: '10px',
                fontWeight: 500,
                letterSpacing: '1.2px',
                padding: '3px 8px',
                gap: '6px',
                borderRadius: '4px',
                background: 'var(--color-background-success)',
                color: 'var(--color-text-success)',
              }}
            >
              <span
                aria-hidden
                className="pulse-soft"
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: 'var(--color-text-success)',
                }}
              />
              Live
            </span>
          </div>

          {/* Calculator row */}
          <div
            className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between"
          >
            <div>
              <p
                className="font-mono uppercase"
                style={{
                  fontSize: '10px',
                  letterSpacing: '1.2px',
                  color: 'var(--color-text-tertiary)',
                }}
              >
                Annual card revenue
              </p>
              <p
                className="font-mono"
                style={{
                  fontSize: 'clamp(22px, 3vw, 28px)',
                  fontWeight: 500,
                  letterSpacing: '-0.5px',
                  color: 'var(--color-text-primary)',
                  marginTop: '2px',
                }}
              >
                {bracket.volumeDisplay}
              </p>
            </div>
            <div className="sm:text-right">
              <p
                className="font-mono uppercase"
                style={{
                  fontSize: '10px',
                  letterSpacing: '1.2px',
                  color: 'var(--color-text-tertiary)',
                }}
              >
                Estimated annual impact
              </p>
              <p
                className="font-mono"
                style={{
                  fontSize: 'clamp(28px, 4vw, 38px)',
                  fontWeight: 500,
                  letterSpacing: '-0.8px',
                  color: 'var(--color-text-danger)',
                  marginTop: '2px',
                }}
                aria-live="polite"
              >
                {formatImpact(bracket.impact)}
              </p>
            </div>
          </div>

          {/* Quick-pick chip row */}
          <div className="mt-5 flex flex-wrap" style={{ gap: '6px' }} role="radiogroup" aria-label="Annual card revenue">
            {VOLUME_BRACKETS.map((b, i) => {
              const active = i === bracketIndex;
              return (
                <button
                  key={b.label}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setBracketIndex(i)}
                  className="font-mono cursor-pointer transition-all duration-100"
                  style={{
                    padding: '8px 12px',
                    fontSize: '12px',
                    borderRadius: '8px',
                    border: active
                      ? '1px solid #1A6B5A'
                      : '1px solid var(--color-border-tertiary)',
                    background: active ? '#EBF6F3' : 'var(--color-background-primary)',
                    color: active ? '#1A6B5A' : 'var(--color-text-secondary)',
                  }}
                >
                  {b.label}
                </button>
              );
            })}
          </div>

          {/* Card footer */}
          <div
            className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            style={{
              paddingTop: '16px',
              borderTop: '0.5px solid var(--color-border-tertiary)',
            }}
          >
            <p
              className="text-ink-secondary"
              style={{ fontSize: '11px', lineHeight: 1.5, maxWidth: '420px' }}
            >
              Indicative figure for a typical merchant your size —
              flat rate, surcharging at 1.5%, retail industry.{' '}
              <em className="italic">
                Your actual number depends on plan, surcharging, and industry.
              </em>
            </p>
            <Link
              href="/assessment"
              data-cta="hero-calculator"
              className="font-mono inline-flex items-center transition-opacity duration-150 hover:opacity-70 whitespace-nowrap"
              style={{
                fontSize: '11px',
                fontWeight: 500,
                color: '#1A6B5A',
                gap: '4px',
              }}
            >
              Get my actual number <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
