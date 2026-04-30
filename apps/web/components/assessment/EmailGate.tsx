'use client';

// EmailGate — sits between Step 4 and the reveal screen.
// Captures email + (optional) marketing consent before the merchant sees
// their results. Pure form component: no async submission, no server
// call. Email + consent flow up to the parent and into formData; the
// reveal screen's submitAssessment() call carries them to the server in
// a single atomic INSERT (D2-A architecture).
//
// Spam Act 2003: marketing checkbox is OPT-IN, never pre-checked.
// Transactional report email is sent regardless of the marketing box —
// the merchant asked for their results by completing the assessment.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Analytics } from '@/lib/analytics';

// Stricter than the canonical [^\s@]+@[^\s@]+\.[^\s@]+ pattern: each segment
// must contain at least one non-dot, non-whitespace, non-@ character. Catches
// pathological inputs like `manu@......` that pass the looser pattern via
// regex backtracking.
const EMAIL_REGEX =
  /^[^\s@.]+(\.[^\s@.]+)*@[^\s@.]+(\.[^\s@.]+)+$/;

interface EmailGateProps {
  // Category derived at the parent from getCategory(planType, surcharging).
  // Optional only because Cat 5 / strategic flows don't reach this gate.
  category: 1 | 2 | 3 | 4 | 5;
  onContinue: (email: string, marketingConsent: boolean) => void;
  onSkip: () => void;
}

export function EmailGate({ category, onContinue, onSkip }: EmailGateProps) {
  const [email, setEmail] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [error, setError] = useState<'invalid_email' | null>(null);

  // Fire email_gate_shown once on mount. assessment_id is not yet known
  // (D2-A: row is INSERTed at reveal); the funnel joins on session_id.
  useEffect(() => {
    Analytics.emailGateShown({ category });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = () => {
    const trimmed = email.trim().toLowerCase();

    // Empty → treat as skip (no error, no validation)
    if (!trimmed) {
      Analytics.emailGateSkipped({});
      onSkip();
      return;
    }

    if (!EMAIL_REGEX.test(trimmed)) {
      setError('invalid_email');
      return;
    }

    setError(null);
    Analytics.emailCaptured({ marketing_consent: marketingConsent });
    onContinue(trimmed, marketingConsent);
  };

  const handleSkip = () => {
    Analytics.emailGateSkipped({});
    onSkip();
  };

  // Clear the invalid-email error once the user starts typing again.
  const handleEmailChange = (next: string) => {
    setEmail(next);
    if (error) setError(null);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: '#1A1409' }}
    >
      <div
        className="w-full"
        style={{
          maxWidth: '440px',
          margin: '0 20px',
          padding: '40px',
          background: 'rgba(255,255,255,0.03)',
          border: '0.5px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
        }}
      >
        {/* Progress row */}
        <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
          <div className="flex gap-1.5 flex-1">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: '3px',
                  borderRadius: '2px',
                  background: '#1A6B5A',
                }}
              />
            ))}
          </div>
          <span
            className="font-mono"
            style={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.45)',
              marginLeft: '12px',
            }}
          >
            04 / 04 ✓
          </span>
        </div>

        {/* Eyebrow pill */}
        <span
          className="inline-block font-medium uppercase"
          style={{
            background: '#1A6B5A',
            color: '#FFFFFF',
            fontSize: '10px',
            letterSpacing: '1.5px',
            padding: '4px 10px',
            borderRadius: '20px',
          }}
        >
          Your report is ready
        </span>

        {/* Heading */}
        <h2
          className="font-serif"
          style={{
            fontSize: '26px',
            color: '#FFFFFF',
            lineHeight: 1.25,
            marginTop: '16px',
            fontWeight: 500,
          }}
        >
          Where should we send it?
        </h2>

        {/* Subheading */}
        <p
          style={{
            fontSize: '13px',
            color: 'rgba(255,255,255,0.45)',
            lineHeight: 1.6,
            marginTop: '10px',
          }}
        >
          Your results are ready. Enter your email to view them and receive the
          October 2026 merchant benchmark when live.
        </p>

        {/* Email input */}
        <label htmlFor="email-gate-input" className="sr-only">
          Email address
        </label>
        <input
          id="email-gate-input"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => handleEmailChange(e.target.value)}
          placeholder="your@business.com.au"
          aria-invalid={error === 'invalid_email'}
          aria-describedby={error ? 'email-gate-error' : undefined}
          className="w-full outline-none"
          style={{
            marginTop: '20px',
            minHeight: '44px',
            padding: '0 14px',
            background: 'rgba(255,255,255,0.07)',
            color: '#FFFFFF',
            border: error
              ? '1px solid var(--color-text-danger, #C53030)'
              : '1px solid rgba(255,255,255,0.14)',
            borderRadius: '10px',
            fontSize: '14px',
            transition: 'border 120ms ease',
          }}
          onFocus={(e) => {
            if (!error) e.currentTarget.style.borderColor = '#1A6B5A';
          }}
          onBlur={(e) => {
            if (!error) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)';
          }}
        />

        {/* Error message */}
        {error === 'invalid_email' && (
          <p
            id="email-gate-error"
            style={{
              fontSize: '12px',
              color: 'var(--color-text-danger, #E57373)',
              marginTop: '8px',
            }}
          >
            Please enter a valid email address
          </p>
        )}

        {/* Consent checkbox */}
        <label
          className="flex items-start gap-2.5 cursor-pointer"
          style={{
            marginTop: '16px',
            background: 'rgba(255,255,255,0.04)',
            border: '0.5px solid rgba(255,255,255,0.10)',
            borderRadius: '10px',
            padding: '12px',
          }}
        >
          <input
            type="checkbox"
            checked={marketingConsent}
            onChange={(e) => setMarketingConsent(e.target.checked)}
            style={{
              width: '16px',
              height: '16px',
              marginTop: '2px',
              accentColor: '#1A6B5A',
              flexShrink: 0,
              cursor: 'pointer',
            }}
          />
          <span
            style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.55)',
              lineHeight: 1.55,
            }}
          >
            Send me practical payment insights — reform updates, cost-reduction
            tips, and how other merchants are preparing. A few times a month.
            Unsubscribe anytime.
          </span>
        </label>

        {/* Primary CTA */}
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full font-medium cursor-pointer"
          style={{
            marginTop: '20px',
            minHeight: '48px',
            background: '#1A6B5A',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '10px',
            fontSize: '14px',
            transition: 'opacity 120ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.92';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          See my results →
        </button>

        {/* Skip link */}
        <div className="text-center" style={{ marginTop: '12px' }}>
          <button
            type="button"
            onClick={handleSkip}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              fontSize: '12px',
              color: 'rgba(255,255,255,0.30)',
              cursor: 'pointer',
            }}
          >
            Or skip and view now →
          </button>
        </div>

        {/* Footer note */}
        <p
          className="text-center"
          style={{
            marginTop: '20px',
            fontSize: '11px',
            color: 'rgba(255,255,255,0.22)',
            lineHeight: 1.5,
          }}
        >
          Your email is used to send your report. Insights are only sent with
          your consent above. Governed by our{' '}
          <Link
            href="/privacy"
            className="underline"
            style={{ color: 'rgba(255,255,255,0.30)' }}
          >
            Privacy policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
