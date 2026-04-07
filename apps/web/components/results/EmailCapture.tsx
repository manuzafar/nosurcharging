'use client';

// CB-11: Email capture — inline on results page. Not a modal.
// "One email on 30 October. Not shared with any payment provider."
// This wording is contractual — do not change.
// States: default, loading, success, rate-limit, error.

import { useState } from 'react';
import Link from 'next/link';
import { captureEmail } from '@/actions/captureEmail';
import { trackEvent } from '@/lib/analytics';

interface EmailCaptureProps {
  assessmentId?: string;
}

export function EmailCapture({ assessmentId }: EmailCaptureProps) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'default' | 'loading' | 'success' | 'rate-limit' | 'error'>('default');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setState('loading');

    const result = await captureEmail(email, assessmentId);

    if (result.success) {
      setState('success');
      trackEvent('Email captured');
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
      {/* Prompt paragraph */}
      <p className="text-body" style={{ color: 'var(--color-text-primary)', lineHeight: '1.65' }}>
        On 30 October, acquirers publish their average MSF publicly for the first time.
        We&apos;ll tell you whether your rate is above or below market for your size.
      </p>

      {/* Input + button */}
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2 max-[500px]:flex-col">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@business.com.au"
          required
          className="flex-1 rounded-lg px-3 py-2 text-body-sm outline-none"
          style={{
            border: '0.5px solid var(--color-border-secondary)',
            background: 'var(--color-background-primary)',
            color: 'var(--color-text-primary)',
          }}
        />
        <button
          type="submit"
          disabled={state === 'loading'}
          className="rounded-lg px-4 py-2 text-body-sm font-medium shrink-0
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
