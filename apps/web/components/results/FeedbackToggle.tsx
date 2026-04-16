'use client';

// FeedbackToggle — small quiet link under the P&L number.
// SPRINT_BRIEF.md Sprint 1 / RESULTS-03.
// Expands inline (not a modal). Email optional. Textarea required.
// No "beta" label anywhere.

import { useId, useState } from 'react';
import { submitFeedback } from '@/actions/submitFeedback';
import { trackEvent } from '@/lib/analytics';

interface FeedbackToggleProps {
  category: 1 | 2 | 3 | 4;
  volume: number;
  assessmentId?: string;
}

type FormState = 'default' | 'loading' | 'success' | 'error';

export function FeedbackToggle({ category, volume, assessmentId }: FeedbackToggleProps) {
  const [expanded, setExpanded] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [state, setState] = useState<FormState>('default');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const emailId = useId();
  const messageId = useId();

  const handleToggle = () => {
    if (!expanded) {
      trackEvent('Feedback opened', { category: String(category) });
    }
    setExpanded((v) => !v);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setState('loading');
    setErrorMsg(null);

    const result = await submitFeedback({
      category,
      volume,
      assessmentId,
      email: email.trim() || undefined,
      message: message.trim(),
    });

    if (result.success) {
      setState('success');
      trackEvent('Feedback submitted', { category: String(category) });
    } else {
      setState('error');
      setErrorMsg(result.error ?? 'Something went wrong. Try again.');
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleToggle}
        className="text-caption cursor-pointer"
        style={{
          color: 'var(--color-text-secondary)',
          background: 'none',
          border: 'none',
          padding: 0,
        }}
      >
        Does your result look off? Tell us {expanded ? '↑' : '→'}
      </button>

      <div
        className={`overflow-hidden transition-all duration-200 ease-out ${
          expanded ? 'mt-3 max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        {state === 'success' ? (
          <div
            className="rounded-lg p-4"
            style={{
              background: 'var(--color-background-success)',
              border: '0.5px solid var(--color-border-success)',
            }}
          >
            <p className="text-body-sm" style={{ color: 'var(--color-text-success)' }}>
              Thanks — we&apos;ll read every word.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="p-4"
            style={{ border: '0.5px solid var(--color-border-secondary)' }}
          >
            <label
              htmlFor={messageId}
              className="text-caption"
              style={{ color: 'var(--color-text-primary)' }}
            >
              What looks off?
            </label>
            <textarea
              id={messageId}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={2000}
              required
              placeholder="e.g. the saving feels too small, or the rate isn't what I pay..."
              className="mt-1 w-full rounded-lg px-3 py-2 text-body-sm outline-none"
              style={{
                border: '0.5px solid var(--color-border-secondary)',
                background: 'var(--color-background-primary)',
                color: 'var(--color-text-primary)',
                resize: 'vertical',
              }}
            />

            <label
              htmlFor={emailId}
              className="mt-3 block text-caption"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Email (optional — only if you&apos;d like a reply)
            </label>
            <input
              id={emailId}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@business.com.au"
              className="mt-1 w-full rounded-lg px-3 text-body-sm outline-none min-h-[44px]"
              style={{
                border: '0.5px solid var(--color-border-secondary)',
                background: 'var(--color-background-primary)',
                color: 'var(--color-text-primary)',
              }}
            />

            <div className="mt-3 flex items-center gap-3">
              <button
                type="submit"
                disabled={state === 'loading' || !message.trim()}
                className="rounded-full px-5 text-body-sm font-medium shrink-0 min-h-[44px]
                  disabled:opacity-50 transition-opacity duration-150"
                style={{ background: '#1A6B5A', color: '#EBF6F3' }}
              >
                {state === 'loading' ? 'Sending...' : 'Send feedback'}
              </button>
              {state === 'error' && errorMsg && (
                <p className="text-caption" style={{ color: 'var(--color-text-danger)' }}>
                  {errorMsg}
                </p>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
