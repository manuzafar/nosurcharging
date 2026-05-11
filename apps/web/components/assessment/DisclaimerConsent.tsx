'use client';

// Disclaimer / consent screen — editorial layout per
// CONSENT_SCREEN_REDESIGN_BRIEF.md. Wide 720px column with:
//   - Hero (eyebrow + 38px serif headline + subhead + meta row)
//   - 2×2 commitments grid with emerald-tinted icon squares
//   - Hairline divider + bordered consent card with full legal paragraph
//   - Full-width emerald Start button
//
// FR-23: Assessment entry consent. Affirmative checkbox, not pre-checked.
// consent_type: "disclaimer", consent_version: "v1.1".
// Legal text and all four commitment titles/bodies preserved VERBATIM
// per the brief — do not paraphrase without bumping the version and
// re-running the legal review.
//
// v1.1 (Apr 2026): "verify with my PSP" → "seek independent advice from
// a qualified professional"; "RBA published data" removed from consent
// text and commitment 1; named PSPs removed from independence statement;
// Terms & conditions link added alongside Privacy policy.

import { useState } from 'react';
import Link from 'next/link';
import {
  Clock,
  ListOrdered,
  UserX,
  Percent,
  MessageCircle,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import { createSession } from '@/actions/createSession';
import { recordConsent } from '@/actions/recordConsent';

const DISCLAIMER_TEXT =
  'I understand that this assessment provides illustrative estimates only. It is not financial advice. Figures are based on the information I provide. I should seek independent advice from a qualified professional before making business decisions.';
const DISCLAIMER_VERSION = 'v1.1';

type LucideIcon = typeof Clock;

interface CommitmentItem {
  title: string;
  body: string;
  icon: LucideIcon;
}

const COMMITMENTS: CommitmentItem[] = [
  {
    title: 'This is an estimate, not a guarantee.',
    body: 'We use your inputs to calculate your likely impact. Your actual result depends on what your payment provider does after October.',
    icon: Percent,
  },
  {
    title: 'We explain everything.',
    body: 'Every technical term in your report has a plain English explanation. You should be able to understand every number we show you.',
    icon: MessageCircle,
  },
  {
    title: 'We are independent.',
    body: "We have no commercial relationship with any payment service provider, bank, or acquirer. We're not trying to sell you a new provider.",
    icon: ShieldCheck,
  },
  {
    title: 'This is not financial advice.',
    body: 'Talk to your accountant before making changes to your pricing or payment setup.',
    icon: Stethoscope,
  },
];

const META_ITEMS: { label: string; icon: LucideIcon }[] = [
  { label: '5 minutes', icon: Clock },
  { label: '4 questions', icon: ListOrdered },
  { label: 'No account required', icon: UserX },
];

interface DisclaimerConsentProps {
  onAccept: () => void;
}

export function DisclaimerConsent({ onAccept }: DisclaimerConsentProps) {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [consentError, setConsentError] = useState(false);

  const handleStart = async () => {
    if (!checked) return;
    setLoading(true);
    setConsentError(false);

    try {
      const sessionId = await createSession();
      const result = await recordConsent({
        consentType: 'disclaimer',
        consentText: DISCLAIMER_TEXT,
        consentVersion: DISCLAIMER_VERSION,
        consented: true,
        sessionId,
      });

      if (!result.success) {
        setConsentError(true);
        setLoading(false);
        return;
      }

      onAccept();
    } catch (err) {
      console.error('[disclaimer] Failed:', err);
      setConsentError(true);
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full px-[18px] sm:px-7" style={{ maxWidth: '720px' }}>
      {/* ── Hero ───────────────────────────────────────────────── */}
      <p
        className="font-medium uppercase text-accent"
        style={{ fontSize: '11px', letterSpacing: '1.54px' }}
      >
        Before we start
      </p>

      <h1
        className="mt-3 font-serif text-ink"
        style={{
          fontSize: 'clamp(26px, 5vw, 38px)',
          fontWeight: 500,
          letterSpacing: '-0.57px',
          lineHeight: 1.12,
        }}
      >
        A few things to know about how we work.
      </h1>

      <p
        className="mt-4 text-ink-secondary"
        style={{
          fontSize: 'clamp(14px, 1.6vw, 16px)',
          lineHeight: 1.55,
          maxWidth: '580px',
        }}
      >
        We want to be completely upfront about what this tool does — and
        doesn&apos;t do.
      </p>

      {/* Meta row — 3 items separated by small dots, wraps naturally */}
      <div
        className="mt-5 flex flex-wrap items-center"
        style={{ rowGap: '8px' }}
      >
        {META_ITEMS.map((item, i) => (
          <span key={item.label} className="flex items-center">
            {i > 0 && (
              <span
                aria-hidden
                style={{
                  display: 'inline-block',
                  width: '3px',
                  height: '3px',
                  margin: '0 12px',
                  borderRadius: '999px',
                  background: 'var(--color-border-secondary)',
                }}
              />
            )}
            <span
              className="font-mono inline-flex items-center"
              style={{
                fontSize: '12px',
                gap: '6px',
                color: 'var(--color-text-secondary)',
                letterSpacing: '0.4px',
              }}
            >
              <item.icon size={14} strokeWidth={1.6} aria-hidden />
              {item.label}
            </span>
          </span>
        ))}
      </div>

      {/* ── Commitments section ───────────────────────────────── */}
      <p
        className="font-medium uppercase"
        style={{
          fontSize: '11px',
          letterSpacing: '1.54px',
          color: 'var(--color-text-secondary)',
          marginTop: '40px',
          marginBottom: '20px',
        }}
      >
        Our commitments
      </p>

      <div
        className="grid grid-cols-1 sm:grid-cols-2"
        style={{ columnGap: '36px', rowGap: '24px' }}
      >
        {COMMITMENTS.map((item) => (
          <div key={item.title} className="flex items-start" style={{ gap: '12px' }}>
            <span
              aria-hidden
              className="flex shrink-0 items-center justify-center"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#EBF6F3',
                color: '#1A6B5A',
              }}
            >
              <item.icon size={16} strokeWidth={1.6} />
            </span>
            <div className="min-w-0">
              <p
                className="font-medium text-ink"
                style={{ fontSize: '14px', lineHeight: 1.35 }}
              >
                {item.title}
              </p>
              <p
                className="mt-1 text-ink-secondary"
                style={{ fontSize: '13px', lineHeight: 1.6 }}
              >
                {item.body}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Hairline divider with consent label ──────────────── */}
      <div
        className="flex items-center"
        style={{ gap: '12px', marginTop: '40px', marginBottom: '16px' }}
      >
        <div style={{ flex: 1, borderTop: '0.5px solid var(--color-border-tertiary)' }} />
        <span
          className="font-mono uppercase"
          style={{
            fontSize: '10px',
            letterSpacing: '1.4px',
            color: 'var(--color-text-tertiary)',
            whiteSpace: 'nowrap',
          }}
        >
          By starting this assessment you confirm
        </span>
        <div style={{ flex: 1, borderTop: '0.5px solid var(--color-border-tertiary)' }} />
      </div>

      {/* ── Consent card ─────────────────────────────────────── */}
      <label
        className="flex cursor-pointer items-start rounded-xl"
        style={{
          gap: '12px',
          padding: '16px',
          border: '0.5px solid var(--color-border-tertiary)',
          background: 'var(--color-background-primary)',
        }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="shrink-0 accent-accent"
          style={{ width: '20px', height: '20px', marginTop: '1px' }}
        />
        <span
          className="text-ink-secondary"
          style={{ fontSize: '13px', lineHeight: 1.6 }}
        >
          {DISCLAIMER_TEXT} By continuing I agree to the{' '}
          <Link
            href="/terms"
            className="text-accent underline"
            style={{ textUnderlineOffset: '2px' }}
          >
            Terms &amp; conditions
          </Link>{' '}
          and have read the{' '}
          <Link
            href="/privacy"
            className="text-accent underline"
            style={{ textUnderlineOffset: '2px' }}
          >
            Privacy policy
          </Link>
          .
        </span>
      </label>

      {consentError && (
        <p
          className="mt-3 rounded-lg bg-red-50 text-red-700"
          style={{ fontSize: '13px', padding: '12px 16px', lineHeight: 1.5 }}
        >
          We could not record your consent. Please try again or contact us.
        </p>
      )}

      {/* ── Start button — full-width visual climax ─────────── */}
      <button
        type="button"
        onClick={handleStart}
        disabled={!checked || loading}
        className="mt-6 flex w-full items-center justify-center rounded-full bg-accent text-white transition-opacity duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
        style={{
          padding: '16px 24px',
          fontSize: '15px',
          fontWeight: 500,
          gap: '8px',
        }}
      >
        <span>{loading ? 'Starting…' : 'Start my assessment'}</span>
        {!loading && <span aria-hidden>→</span>}
      </button>
    </div>
  );
}
