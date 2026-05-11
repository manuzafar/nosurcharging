'use client';

// EmailGate — paper-aesthetic Phase 1 redesign per
// EMAIL_GATE_REDESIGN_BRIEF.md. Replaces the dark ink-glass modal with a
// paper card that visually reads as the last step of the assessment.
// The audience-capture copy ("Stay across the reform") replaces the
// previous "Your report is ready" / "send it" framing — Phase 1 ships
// no PDF and no scheduled benchmark email.
//
// LOCKED INVARIANTS (do not regress):
//   - props contract (category / onContinue / onSkip)
//   - email regex
//   - empty submit → onSkip (treated as skip, not error)
//   - analytics events: emailGateShown / emailCaptured / emailGateSkipped
//   - Spam Act 2003: marketing checkbox is opt-in, never pre-checked
//   - EmailGateSkeleton stays exactly as-is

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, Check, Lock } from 'lucide-react';
import { Analytics } from '@/lib/analytics';
import { EmailGateSkeleton } from './EmailGateSkeleton';

// Stricter than the canonical [^\s@]+@[^\s@]+\.[^\s@]+ pattern: each segment
// must contain at least one non-dot, non-whitespace, non-@ character. Catches
// pathological inputs like `manu@......` that pass the looser pattern via
// regex backtracking.
const EMAIL_REGEX = /^[^\s@.]+(\.[^\s@.]+)*@[^\s@.]+(\.[^\s@.]+)+$/;

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
  const [focused, setFocused] = useState(false);

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

  const handleEmailChange = (next: string) => {
    setEmail(next);
    if (error) setError(null);
  };

  const inputBorder = error
    ? '1px solid var(--color-text-danger, #C53030)'
    : focused
      ? '1px solid #1A6B5A'
      : '0.5px solid rgba(26, 20, 9, 0.18)';

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
    >
      {/* Blurred paper-toned skeleton — same component, unchanged */}
      <EmailGateSkeleton />

      {/* Paper-tinted overlay — visitor sees a faint outline of the
          results page right behind the modal. Replaces the previous
          rgba(26,20,9,0.25) ink wash. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: 'rgba(250, 247, 242, 0.78)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
      />

      {/* Paper card modal */}
      <div
        className="relative w-full"
        style={{
          maxWidth: '440px',
          margin: '0 20px',
          padding: 'clamp(28px, 4vw, 40px) clamp(20px, 3vw, 40px)',
          background: '#FAF7F2',
          border: '0.5px solid rgba(26, 20, 9, 0.08)',
          borderRadius: '12px',
          boxShadow: '0 20px 40px rgba(26, 20, 9, 0.08)',
        }}
      >
        {/* Progress row — 4 filled emerald segments + emerald check circle */}
        <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
          <div className="flex flex-1" style={{ gap: '6px' }}>
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
            aria-hidden
            className="flex items-center justify-center"
            style={{
              width: '22px',
              height: '22px',
              marginLeft: '12px',
              borderRadius: '50%',
              background: '#1A6B5A',
              color: '#FAF7F2',
              flexShrink: 0,
            }}
          >
            <Check size={11} strokeWidth={2.2} />
          </span>
        </div>

        {/* Eyebrow pill */}
        <span
          className="inline-flex items-center font-medium uppercase"
          style={{
            gap: '6px',
            padding: '5px 10px',
            borderRadius: '999px',
            background: '#EBF6F3',
            border: '0.5px solid #72C4B0',
            color: '#1A6B5A',
            fontSize: '11px',
            letterSpacing: '0.06em',
          }}
        >
          <Mail size={12} strokeWidth={1.8} aria-hidden />
          Almost there
        </span>

        {/* Headline */}
        <h2
          id="email-gate-heading"
          className="font-serif"
          style={{
            fontSize: 'clamp(26px, 3vw, 28px)',
            color: '#1A1409',
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
            marginTop: '16px',
            fontWeight: 400,
          }}
        >
          Stay across the reform.
        </h2>

        {/* Subhead */}
        <p
          style={{
            fontSize: '14px',
            color: 'rgba(26, 20, 9, 0.72)',
            lineHeight: 1.55,
            marginTop: '10px',
          }}
        >
          Get practical payments updates — reform changes, cost-reduction
          tips, and how other businesses are preparing. Roughly monthly.
          Unsubscribe anytime.
        </p>

        {/* Email field with visible uppercase label */}
        <div style={{ marginTop: '20px' }}>
          <label
            htmlFor="email-gate-input"
            className="block font-medium uppercase"
            style={{
              fontSize: '11px',
              letterSpacing: '0.06em',
              color: 'rgba(26, 20, 9, 0.6)',
              marginBottom: '8px',
            }}
          >
            Email
          </label>
          <input
            id="email-gate-input"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="you@yourbusiness.com.au"
            aria-invalid={error === 'invalid_email'}
            aria-describedby={error ? 'email-gate-error' : undefined}
            className="w-full outline-none"
            style={{
              minHeight: '46px',
              padding: '0 14px',
              background: '#FFFFFF',
              color: '#1A1409',
              border: inputBorder,
              borderRadius: '8px',
              fontSize: '14px',
              transition: 'border 120ms ease',
            }}
          />
          {error === 'invalid_email' && (
            <p
              id="email-gate-error"
              style={{
                fontSize: '12px',
                color: 'var(--color-text-danger, #C53030)',
                marginTop: '8px',
              }}
            >
              Please enter a valid email address
            </p>
          )}
        </div>

        {/* Marketing consent — soft emerald-tinted opt-in row */}
        <label
          className="flex cursor-pointer items-start"
          style={{
            gap: '10px',
            marginTop: '16px',
            background: 'rgba(235, 246, 243, 0.5)',
            border: '0.5px solid rgba(114, 196, 176, 0.4)',
            borderRadius: '8px',
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
              color: 'rgba(26, 20, 9, 0.7)',
              lineHeight: 1.5,
            }}
          >
            Email me practical payments updates — reform changes,
            cost-reduction tips, and how other businesses are preparing.
          </span>
        </label>

        {/* Primary CTA — emerald pill, full-width */}
        <button
          type="button"
          onClick={handleSubmit}
          className="flex w-full items-center justify-center bg-accent font-medium text-white transition-opacity duration-150 hover:opacity-90"
          style={{
            marginTop: '20px',
            minHeight: '50px',
            padding: '0 20px',
            border: 'none',
            borderRadius: '9999px',
            fontSize: '14px',
            gap: '8px',
            cursor: 'pointer',
          }}
        >
          Send me insights &amp; view my results
          <ArrowRight size={16} strokeWidth={1.8} aria-hidden />
        </button>

        {/* Skip link — equal visual weight, underlined */}
        <div className="text-center" style={{ marginTop: '14px' }}>
          <button
            type="button"
            onClick={handleSkip}
            className="cursor-pointer transition-opacity duration-150 hover:opacity-100"
            style={{
              background: 'none',
              border: 'none',
              padding: '8px 0',
              fontSize: '13px',
              color: 'rgba(26, 20, 9, 0.7)',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
            }}
          >
            View my results without insights →
          </button>
        </div>

        {/* Footer privacy note */}
        <p
          className="flex items-center justify-center text-center"
          style={{
            marginTop: '18px',
            paddingTop: '16px',
            gap: '6px',
            borderTop: '0.5px solid rgba(26, 20, 9, 0.08)',
            fontSize: '11px',
            color: 'rgba(26, 20, 9, 0.5)',
            lineHeight: 1.5,
          }}
        >
          <Lock size={12} strokeWidth={1.6} aria-hidden style={{ flexShrink: 0 }} />
          <span>
            Not shared with any payment provider. Read our{' '}
            <Link
              href="/privacy"
              className="underline"
              style={{ color: '#1A6B5A', textUnderlineOffset: '2px' }}
            >
              privacy policy
            </Link>
            .
          </span>
        </p>
      </div>
    </div>
  );
}
