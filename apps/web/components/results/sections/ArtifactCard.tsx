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
    // The button stays visually active even when the email is empty
    // / invalid; validation surfaces inline below so the merchant sees
    // why nothing happened. If we just `return` silently the click
    // looks broken.
    if (!valid) {
      setEditing(true);
      setState({
        kind: 'error',
        message: trimmed
          ? 'That email address looks off. Check for typos.'
          : 'Add your email so we know where to send it.',
      });
      return;
    }
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

  // Eyebrow ("Save the full report") moved out to page-level SectionHeader.
  return (
    <section className="px-5 min-[501px]:px-8" aria-label="Save the full report">
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
        // Width parity with other editorial sections — the card now
        // spans the full content column instead of capping at 480px.
        style={{
          gap: '12px',
          background: 'var(--color-background-primary)',
          border: '0.5px solid var(--color-border-secondary)',
          borderRadius: '12px',
          padding: '16px 18px',
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

        {/* Send button — always renders at full accent. Validation
            still gates the actual send (handleSend exits early if the
            email is invalid + the error row surfaces a message), but
            the button visual stays confidently clickable so the
            section reads as a primary action even when the prefill is
            empty. */}
        <button
          type="button"
          onClick={handleSend}
          aria-disabled={state.kind === 'sending'}
          className="font-bold cursor-pointer self-start hover:opacity-90"
          style={{
            fontSize: '14px',
            padding: '11px 22px',
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
