'use client';

// ArtifactCard — Section 8 of the new linear results page.
//
// Per docs/design/RESULTS_RUTHLESS_CUT_BRIEF.md §8: pre-fill the email
// captured at the upstream EmailGate, single primary button "Email me
// the PDF", small "Change" link to swap to a different address.
// Privacy + 48h retention note below the button.
//
// No registry checkbox. No marketing-consent checkbox. The EmailGate
// upstream owns marketing consent.
//
// State machine:
//   idle    → "Email me the PDF" button (or "Add your email" if none)
//   sending → button spinner / disabled
//   sent    → green confirmation row, replace button with "Sent ✓ — resend?"
//   error   → red row + retry button
//
// The merchant can also click "Change" at any time to swap to a
// different address. The component never throws.

import { useState } from 'react';
import { Mail, Pencil, ShieldCheck } from 'lucide-react';
import { sendReportEmail } from '@/actions/sendReportEmail';

interface ArtifactCardProps {
  assessmentId: string;
  initialEmail: string | null;
}

const EMAIL_PATTERN = /^[^\s@.]+(\.[^\s@.]+)*@[^\s@.]+(\.[^\s@.]+)+$/;

type SendState =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'sent' }
  | { kind: 'error'; message: string };

export function ArtifactCard({
  assessmentId,
  initialEmail,
}: ArtifactCardProps) {
  const [email, setEmail] = useState<string>(initialEmail ?? '');
  // Editing means the input is visible. If no email was pre-filled,
  // we start in editing mode so the merchant has somewhere to type.
  const [editing, setEditing] = useState<boolean>(!initialEmail);
  const [state, setState] = useState<SendState>({ kind: 'idle' });

  const trimmed = email.toLowerCase().trim();
  const valid = EMAIL_PATTERN.test(trimmed);

  const handleSend = async () => {
    if (!valid) return;
    setState({ kind: 'sending' });
    const result = await sendReportEmail({
      assessmentId,
      email: trimmed,
    });
    if (result.success) {
      setState({ kind: 'sent' });
      setEditing(false);
    } else {
      setState({
        kind: 'error',
        message:
          result.error === 'invalid_email'
            ? 'That email address looks off. Check for typos.'
            : 'Send failed. Try again in a moment.',
      });
    }
  };

  return (
    <section className="px-5 md:px-8" aria-labelledby="artifact-card-eyebrow">
      <p
        id="artifact-card-eyebrow"
        className="font-bold uppercase"
        style={{
          fontSize: '12px',
          letterSpacing: '0.8px',
          color: 'var(--color-text-primary)',
          marginBottom: '8px',
        }}
      >
        Save the full report
      </p>

      <p
        style={{
          fontSize: '13px',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.6,
          marginBottom: '16px',
          maxWidth: '560px',
        }}
      >
        We&apos;ll email you a PDF with the full action plan, scripts, and
        reform calendar. Save it, print it, share it with your accountant.
      </p>

      <div
        className="flex flex-col"
        style={{
          gap: '10px',
          background: 'var(--color-background-primary)',
          border: '0.5px solid var(--color-border-secondary)',
          borderRadius: '12px',
          padding: '14px 16px',
          maxWidth: '480px',
        }}
      >
        {/* Email row */}
        {editing ? (
          <div className="flex flex-col" style={{ gap: '6px' }}>
            <label
              htmlFor="artifact-email"
              className="font-medium uppercase"
              style={{
                fontSize: '9px',
                letterSpacing: '0.5px',
                color: 'var(--color-text-tertiary)',
              }}
            >
              Send to
            </label>
            <input
              id="artifact-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@business.com.au"
              style={{
                fontSize: '14px',
                padding: '8px 10px',
                border: '0.5px solid var(--color-border-secondary)',
                borderRadius: '8px',
                background: '#FFFFFF',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
        ) : (
          <div
            className="flex items-center justify-between"
            style={{ gap: '12px' }}
          >
            <span
              className="inline-flex items-center"
              style={{
                gap: '8px',
                fontSize: '13px',
                color: 'var(--color-text-primary)',
              }}
            >
              <Mail size={14} aria-hidden style={{ color: 'var(--color-text-tertiary)' }} />
              {trimmed || 'No email on file'}
            </span>
            <button
              type="button"
              onClick={() => {
                setEditing(true);
                setState({ kind: 'idle' });
              }}
              className="inline-flex items-center cursor-pointer hover:underline"
              style={{
                gap: '4px',
                fontSize: '11px',
                color: 'var(--color-text-tertiary)',
                background: 'none',
                border: 'none',
                padding: 0,
              }}
            >
              <Pencil size={11} aria-hidden />
              Change
            </button>
          </div>
        )}

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!valid || state.kind === 'sending'}
          className="font-bold cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 hover:opacity-90"
          style={{
            fontSize: '13px',
            padding: '10px 16px',
            background:
              state.kind === 'sent'
                ? 'var(--color-text-success)'
                : 'var(--color-accent)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '100px',
            transition: 'opacity 150ms ease',
          }}
        >
          {state.kind === 'sending'
            ? 'Sending…'
            : state.kind === 'sent'
              ? 'Sent ✓ — resend?'
              : 'Email me the PDF'}
        </button>

        {/* Error row */}
        {state.kind === 'error' && (
          <p
            style={{
              fontSize: '12px',
              color: 'var(--color-text-danger)',
              lineHeight: 1.5,
            }}
          >
            {state.message}
          </p>
        )}
      </div>

      {/* Privacy + 48h retention */}
      <p
        className="inline-flex items-start"
        style={{
          gap: '6px',
          fontSize: '11px',
          color: 'var(--color-text-tertiary)',
          lineHeight: 1.55,
          marginTop: '12px',
          maxWidth: '560px',
        }}
      >
        <ShieldCheck
          size={12}
          aria-hidden
          style={{ marginTop: '2px', flexShrink: 0 }}
        />
        <span>
          Your assessment is deleted from our database within 48 hours. The
          PDF is your only persistent record. We don&apos;t share your email
          with any payment provider.
        </span>
      </p>
    </section>
  );
}
