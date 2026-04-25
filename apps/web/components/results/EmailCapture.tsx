'use client';

// CB-11: Email capture — inline on results page. Not a modal.
// "One email on 30 October. Not shared with any payment provider."
// This wording is contractual — do not change.
// States: default, loading, success, rate-limit, error.

import { useId, useState } from 'react';
import Link from 'next/link';
import { captureEmail } from '@/actions/captureEmail';
import { Analytics, identifyUser, getPlSwingBucket } from '@/lib/analytics';
import { hashEmail } from '@/lib/hashEmail';

export type EmailCaptureMoment =
  | 'hero_pnl'
  | 'save_btn'
  | 'neg_brief'
  | 'assessment_start'
  | 'help_section';

interface EmailCaptureProps {
  assessmentId?: string;
  // Analytics context — optional for backward compatibility, but every
  // production callsite passes them so the event has full context.
  captureMoment?: EmailCaptureMoment;
  category?: number;
  plSwing?: number;
  volumeTier?: string;
  psp?: string;
}

export function EmailCapture({
  assessmentId,
  captureMoment = 'help_section',
  category,
  plSwing,
  volumeTier,
  psp,
}: EmailCaptureProps) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'default' | 'loading' | 'success' | 'rate-limit' | 'error'>('default');
  const emailId = useId();
  const emailHelpId = useId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setState('loading');

    const result = await captureEmail(email, assessmentId);

    if (result.success) {
      setState('success');
      Analytics.emailCaptured({
        capture_moment: captureMoment,
        category: category ?? 0,
        pl_swing: plSwing ?? 0,
        volume_tier: volumeTier ?? 'unknown',
        psp: psp ?? 'unknown',
      });
      // Identify the merchant in PostHog using a SHA-256 hash of their
      // email — never the raw value. Async; never throws (analytics
      // failure must not break the success state).
      hashEmail(email)
        .then((hash) =>
          identifyUser(hash, {
            category,
            psp,
            volume_tier: volumeTier,
            pl_swing_bucket: plSwing !== undefined ? getPlSwingBucket(plSwing) : undefined,
          }),
        )
        .catch(() => {
          /* swallowed — analytics must not affect product flow */
        });
    } else if (result.error?.includes('already signed up')) {
      setState('rate-limit');
    } else {
      setState('error');
    }
  };

  // Success state — replace entire form
  if (state === 'success') {
    return (
      <div
        className="rounded-xl p-6 text-center"
        style={{
          background: 'var(--color-background-success)',
          border: '0.5px solid var(--color-border-success)',
        }}
      >
        <p className="text-body font-medium" style={{ color: 'var(--color-text-success)' }}>
          You&apos;re on the list for 30 October.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Prompt paragraph — also serves as the label for the email input
          via aria-describedby. */}
      <p
        id={emailHelpId}
        className="text-body"
        style={{ color: 'var(--color-text-primary)', lineHeight: '1.65' }}
      >
        On 30 October, acquirers publish their average MSF publicly for the first time.
        We&apos;ll tell you whether your rate is above or below market for your size.
      </p>

      {/* Input + button.
          a11y: sr-only <label htmlFor> gives the input an explicit accessible
          name (the visible placeholder alone is not a label). min-h-[44px] on
          both input and submit button meets WCAG 2.5.5 target size. */}
      <label htmlFor={emailId} className="sr-only">
        Email address
      </label>
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2 max-[500px]:flex-col">
        <input
          id={emailId}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@business.com.au"
          required
          aria-describedby={emailHelpId}
          className="flex-1 rounded-lg px-3 text-body-sm outline-none min-h-[44px]"
          style={{
            border: '0.5px solid var(--color-border-secondary)',
            background: 'var(--color-background-primary)',
            color: 'var(--color-text-primary)',
          }}
        />
        {/* Pill primary CTA — Modern Fintech Hierarchy. The "Get notified"
            button is the primary action of this section, so it gets the
            reserved pill shape just like AccentButton and the Step 4 dark CTA. */}
        <button
          type="submit"
          disabled={state === 'loading'}
          className="rounded-full px-6 text-body-sm font-medium shrink-0 min-h-[44px]
            disabled:opacity-50 transition-opacity duration-150"
          style={{ background: '#1A6B5A', color: '#EBF6F3' }}
        >
          {state === 'loading' ? 'Sending...' : 'Get notified →'}
        </button>
      </form>

      {/* Privacy note — contractual, do not change */}
      <p className="mt-2 text-caption" style={{ color: 'var(--color-text-secondary)' }}>
        One email on 30 October. Not shared with any payment provider.{' '}
        <Link href="/privacy" className="underline">
          Privacy policy
        </Link>
      </p>

      {/* Error states */}
      {state === 'rate-limit' && (
        <p className="mt-2 text-caption" style={{ color: 'var(--color-text-warning)' }}>
          You&apos;ve already signed up. One email on 30 October.
        </p>
      )}
      {state === 'error' && (
        <p className="mt-2 text-caption" style={{ color: 'var(--color-text-danger)' }}>
          Something went wrong. Try again.
        </p>
      )}

      {/* Phase 2 teaser */}
      <button
        type="button"
        disabled
        className="mt-3 rounded-lg px-4 py-2 text-caption opacity-40 cursor-not-allowed"
        style={{
          border: '0.5px solid var(--color-border-secondary)',
          color: 'var(--color-text-secondary)',
        }}
      >
        Download P&L model (.xlsx) — Coming in Phase 2
      </button>
    </div>
  );
}
