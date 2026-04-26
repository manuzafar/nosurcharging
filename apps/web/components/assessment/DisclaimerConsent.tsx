'use client';

// FR-23: Assessment entry consent. Affirmative checkbox, not pre-checked.
// consent_type: "disclaimer", consent_version: "v1.1"
// Exact wording from docs/legal/disclaimer-text.md — do not change without
// bumping the version and re-running the legal review.
// v1.1 (Apr 2026): "verify with my PSP" → "seek independent advice from a
// qualified professional"; "RBA published data" removed from the consent text
// and the first commitment body (the consent screen no longer cites a single
// data source); named PSPs removed from independence statement; Terms &
// conditions link added alongside Privacy policy.
//
// Visual treatment per docs/design/revamp-ux-spec.md §2 — paper canvas,
// four commitment items, white checkbox area, centred natural-width CTA.
//
// IMPORTANT: The <input type="checkbox">, createSession() call, and
// recordConsent() call are intentionally untouched. This commit changes
// only copy + wrapper markup.

import { useState } from 'react';
import Link from 'next/link';
import { createSession } from '@/actions/createSession';
import { recordConsent } from '@/actions/recordConsent';

const DISCLAIMER_TEXT =
  'I understand that this assessment provides illustrative estimates only. It is not financial advice. Figures are based on the information I provide. I should seek independent advice from a qualified professional before making business decisions.';
const DISCLAIMER_VERSION = 'v1.1';

interface CommitmentItem {
  title: string;
  body: string;
}

const COMMITMENTS: CommitmentItem[] = [
  {
    title: 'This is an estimate, not a guarantee.',
    body: 'We use your inputs to calculate your likely impact. Your actual result depends on what your payment provider does after October.',
  },
  {
    title: 'We explain everything.',
    body: 'Every technical term in your report has a plain English explanation. You should be able to understand every number we show you.',
  },
  {
    title: 'We are independent.',
    body: "We have no commercial relationship with any payment service provider, bank, or acquirer. We're not trying to sell you a new provider.",
  },
  {
    title: 'This is not financial advice.',
    body: 'Talk to your accountant before making changes to your pricing or payment setup.',
  },
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
    <div
      className="mx-auto bg-paper"
      style={{ maxWidth: '420px', padding: '40px 24px' }}
    >
      {/* Eyebrow tag */}
      <p
        className="font-medium uppercase text-accent"
        style={{ fontSize: '10px', letterSpacing: '2px' }}
      >
        Before we start
      </p>

      {/* Headline */}
      <h1
        className="mt-3 font-serif text-ink"
        style={{
          fontSize: '26px',
          fontWeight: 500,
          letterSpacing: '-0.8px',
          lineHeight: '1.25',
        }}
      >
        A few things to know about this report
      </h1>

      {/* Sub */}
      <p
        className="mt-3 text-ink-secondary"
        style={{ fontSize: '14px', lineHeight: '1.65', marginBottom: '20px' }}
      >
        We want to be completely upfront about what this tool does — and
        doesn&apos;t do.
      </p>

      {/* Four commitment items */}
      <div
        className="bg-paper-white border border-rule"
        style={{ marginBottom: '16px' }}
      >
        {COMMITMENTS.map((item, i) => (
          <div
            key={item.title}
            className="flex items-start"
            style={{
              gap: '12px',
              padding: '14px 16px',
              borderBottom:
                i < COMMITMENTS.length - 1
                  ? '1px solid rgba(221, 213, 200, 0.6)'
                  : undefined,
            }}
          >
            {/* Tick icon — 20px circle */}
            <span
              aria-hidden
              className="shrink-0 flex items-center justify-center bg-accent-light text-accent rounded-full"
              style={{
                width: '20px',
                height: '20px',
                marginTop: '1px',
              }}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                aria-hidden
              >
                <path
                  d="M2 5.2L4 7.2L8 2.8"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>

            <p
              className="text-ink-secondary"
              style={{ fontSize: '13px', lineHeight: '1.65' }}
            >
              <strong
                className="text-ink"
                style={{ fontWeight: 500 }}
              >
                {item.title}
              </strong>{' '}
              {item.body}
            </p>
          </div>
        ))}
      </div>

      {/* Bridge line above the consent checkbox */}
      <p
        className="text-ink-faint"
        style={{ fontSize: '11px', marginBottom: '8px' }}
      >
        By starting this assessment you confirm:
      </p>

      {/* Checkbox area — white background, accent tick only */}
      <label
        className="flex cursor-pointer items-start bg-paper-white border border-rule"
        style={{ gap: '12px', padding: '14px', marginBottom: '16px' }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="shrink-0 accent-accent"
          style={{ width: '16px', height: '16px', marginTop: '2px' }}
        />
        <span
          className="text-ink-secondary"
          style={{ fontSize: '12px', lineHeight: '1.6' }}
        >
          {DISCLAIMER_TEXT}{' '}
          By continuing I agree to the{' '}
          <Link
            href="/terms"
            className="text-accent underline"
            style={{ textUnderlineOffset: '2px' }}
          >
            Terms &amp; conditions
          </Link>
          {' '}and have read the{' '}
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
          className="text-red-700 bg-red-50"
          style={{
            fontSize: '13px',
            padding: '12px 16px',
            marginBottom: '16px',
            lineHeight: '1.5',
          }}
        >
          We could not record your consent. Please try again or contact us.
        </p>
      )}

      {/* CTA — centred, natural width on desktop, full-width on mobile */}
      <div className="text-center">
        <button
          type="button"
          onClick={handleStart}
          disabled={!checked || loading}
          className="w-full bg-accent text-white transition-opacity duration-150 hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed min-[640px]:w-auto min-[640px]:inline-block"
          style={{
            fontSize: '14px',
            fontWeight: 500,
            padding: '14px 40px',
          }}
        >
          {loading ? 'Starting...' : 'Start my assessment →'}
        </button>
      </div>
    </div>
  );
}
