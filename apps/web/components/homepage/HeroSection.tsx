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

// Computed dynamically per the hero revision brief (May 2026). Uses
// Math.ceil so a merchant viewing the page on 30 September 2026 sees
// "1 day until the surcharge ban" rather than zero.
function daysUntil(target: number): number {
  return Math.max(0, Math.ceil((target - Date.now()) / (1000 * 60 * 60 * 24)));
}

function eyebrowCountdownText(daysRemaining: number): string {
  if (daysRemaining <= 0) return 'The surcharge ban is in effect';
  return `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} until the surcharge ban`;
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
        {/* ── Eyebrow pill ─────────────────────────────────────────
            Single consolidated pill (was eyebrow + adjacent
            countdown text on the previous revision). Day count is
            recomputed on every render so the headline stays accurate
            across deploys; flips to the in-effect message on/after
            1 October 2026 automatically. */}
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
            {eyebrowCountdownText(daysRemaining)}
          </span>
        </span>

        {/* ── Headline ──────────────────────────────────────────
            Direct statement of what the tool answers — single
            declarative sentence. The italic-emerald "Your" accent
            lives in the subhead's three-Your anaphora; the headline
            stays plain ink #1A1409 so the typographic colour shift
            between the two surfaces lands harder.

            Type spec (May 2026 revision):
              DM Serif Display, weight 400, letter-spacing −0.025em.
              clamp scales between ~30px mobile and ~52px desktop.
              line-height 1.05 — looser than the old 0.98 because
              the sentence now wraps to 3–5 lines and tighter would
              cause ascenders/descenders to touch. */}
        <h1
          className="mt-7 font-serif text-ink"
          style={{
            fontSize: 'clamp(30px, 6vw, 52px)',
            fontWeight: 400,
            letterSpacing: '-0.025em',
            lineHeight: 1.05,
          }}
        >
          Find out what October&apos;s surcharge ban costs your business.
        </h1>

        {/* ── Subhead ─────────────────────────────────────────────
            Three short sentences in anaphora — italic emerald
            "Your" repeats three times. No em-dash. DM Sans,
            17px desktop / 14px mobile, weight 400. */}
        <p
          className="mt-6 font-sans text-ink-secondary"
          style={{
            fontSize: 'clamp(14px, 1.6vw, 17px)',
            lineHeight: 1.55,
            maxWidth: '620px',
            color: 'rgba(26, 20, 9, 0.72)',
          }}
        >
          <em
            className="italic text-accent"
            style={{ fontStyle: 'italic', fontWeight: 400 }}
          >
            Your
          </em>{' '}
          provider named.{' '}
          <em
            className="italic text-accent"
            style={{ fontStyle: 'italic', fontWeight: 400 }}
          >
            Your
          </em>{' '}
          P&amp;L impact in dollars.{' '}
          <em
            className="italic text-accent"
            style={{ fontStyle: 'italic', fontWeight: 400 }}
          >
            Your
          </em>{' '}
          week-by-week action plan.
        </p>

        {/* ── Primary CTA ─────────────────────────────────────────
            Sole CTA. Left-aligned inline-width on desktop;
            full-width on mobile via the responsive utility classes.
            The previous secondary "See sample report" link and the
            three-icon trust row are deleted per the revision brief. */}
        <Link
          href="/assessment"
          data-cta="hero"
          className="mt-8 inline-flex w-full items-center justify-center bg-accent text-white transition-opacity duration-150 hover:opacity-90 focus-visible:opacity-90 sm:w-auto sm:justify-start"
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

        {/* ── Reassurance line ────────────────────────────────────
            Replaces the deleted three-icon trust signals row.
            Centred on mobile under the full-width button,
            left-aligned on desktop matching the CTA. */}
        <p
          className="mt-4 italic text-center sm:text-left"
          style={{
            fontSize: 'clamp(12px, 1.3vw, 13px)',
            color: 'rgba(26, 20, 9, 0.55)',
          }}
        >
          No sign-up, no account. Five minutes.
        </p>

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
